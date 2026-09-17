import { prisma } from './prisma';

export async function ambilDataRaport(siswaId: number, tahunAjaranId?: number) {
  // Kalau tahunAjaranId tidak diisi, pakai tahun ajaran yang sedang aktif
  const tahunAjaran = tahunAjaranId
    ? await prisma.tahunAjaran.findUnique({ where: { id: tahunAjaranId } })
    : await prisma.tahunAjaran.findFirst({ where: { isActive: true } });

  if (!tahunAjaran) return null;

  const siswa = await prisma.siswa.findUnique({ where: { id: siswaId } });
  if (!siswa) return null;

  // Kelas siswa ini di tahun ajaran tersebut
  const riwayatKelas = await prisma.riwayatKelas.findFirst({
    where: { siswaId, tahunAjaranId: tahunAjaran.id },
    include: { kelas: { include: { waliKelas: true } } },
  });
  if (!riwayatKelas) return null;

  const kelas = riwayatKelas.kelas;

  // Semua nilai mapel siswa ini, khusus untuk guru_mapel yang mengajar di kelas ini
  const nilais = await prisma.nilai.findMany({
    where: {
      siswaId,
      guruMapel: { kelasId: kelas.id },
    },
    include: { guruMapel: { include: { mapel: true } } },
    orderBy: { guruMapel: { mapel: { nama: 'asc' } } },
  });

  const nilaiEkskuls = await prisma.nilaiEkskul.findMany({
    where: { siswaId, tahunAjaranId: tahunAjaran.id },
    include: { ekskul: true },
  });

  const nilaiKokurikulers = await prisma.nilaiKokurikuler.findMany({
    where: { siswaId, tahunAjaranId: tahunAjaran.id },
    include: { kokurikuler: true },
  });

  const kehadiran = await prisma.kehadiranSiswa.findUnique({
    where: { siswaId_tahunAjaranId: { siswaId, tahunAjaranId: tahunAjaran.id } },
  });

  const pengaturanRaport = await prisma.pengaturanRaport.findUnique({
    where: { tahunAjaranId: tahunAjaran.id },
  });

  const ttdWaliKelas = kelas.waliKelas
    ? await prisma.tandaTangan.findUnique({
        where: {
          userId_tahunAjaranId: {
            userId: kelas.waliKelas.userId,
            tahunAjaranId: tahunAjaran.id,
          },
        },
      })
    : null;

  const kepalaSekolah = await prisma.user.findFirst({
    where: { role: 'KEPALA_SEKOLAH' },
  });
  const ttdKepsek = kepalaSekolah
    ? await prisma.tandaTangan.findUnique({
        where: {
          userId_tahunAjaranId: { userId: kepalaSekolah.id, tahunAjaranId: tahunAjaran.id },
        },
      })
    : null;

  return {
    siswa,
    kelas,
    tahunAjaran,
    nilais: nilais.map((n) => ({
      mapel: n.guruMapel.mapel.nama,
      nilaiAkhir: n.nilaiAkhir,
      deskripsi: n.deskripsi,
    })),
    ekskuls: nilaiEkskuls.map((e) => ({
      nama: e.ekskul.nama,
      nilai: e.nilai,
      deskripsi: e.deskripsi,
    })),
    kokurikulers: nilaiKokurikulers.map((k) => ({
      nama: k.kokurikuler.nama,
      deskripsi: k.deskripsi,
    })),
    kehadiran: {
      sakit: kehadiran?.sakit ?? 0,
      izin: kehadiran?.izin ?? 0,
      tanpaKeterangan: kehadiran?.tanpaKeterangan ?? 0,
    },
    pengaturanRaport,
    ttdWaliKelas: ttdWaliKelas?.fileTtd ?? null,
    ttdKepsek: ttdKepsek?.fileTtd ?? null,
    namaWaliKelas: kelas.waliKelas?.nama ?? null,
    namaKepsek: null as string | null, // Kepala Sekolah tidak punya tabel biodata terpisah
  };
}

export type DataRaport = NonNullable<Awaited<ReturnType<typeof ambilDataRaport>>>;

// Cek hak akses: siapa saja yang boleh lihat raport siswa ini
export async function bolehLihatRaport(
  userId: number,
  role: string,
  siswaId: number
): Promise<boolean> {
  if (role === 'ADMIN' || role === 'KEPALA_SEKOLAH') return true;

  if (role === 'SISWA') {
    const siswa = await prisma.siswa.findUnique({ where: { userId } });
    return siswa?.id === siswaId;
  }

  if (role === 'WALI_KELAS') {
    const guru = await prisma.guru.findUnique({ where: { userId } });
    if (!guru) return false;
    const riwayat = await prisma.riwayatKelas.findFirst({
      where: { siswaId, kelas: { waliKelasId: guru.id } },
    });
    return !!riwayat;
  }

  return false;
}