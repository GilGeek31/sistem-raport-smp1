import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { pastikanPemilikGuruMapel } from '@/lib/nilai-helpers';

// GET /api/v1/nilai?guru_mapel_id=...
// Mengembalikan tabel: semua siswa di kelas ini, lengkap dengan nilai (kalau
// sudah pernah diinput) dan status checklist TP masing-masing.
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);

  const guruMapelId = req.nextUrl.searchParams.get('guru_mapel_id');
  if (!guruMapelId) return apiError('Parameter guru_mapel_id wajib diisi', 422);

  const { guruMapel, boleh } = await pastikanPemilikGuruMapel(
    Number(session.user.id),
    session.user.role,
    Number(guruMapelId)
  );
  if (!guruMapel) return apiError('Penugasan tidak ditemukan', 404);
  if (!boleh) return apiError('Anda tidak punya akses ke data ini', 403);

  // Daftar TP untuk mapel ini (dipakai frontend untuk bikin kolom checklist)
  const tps = await prisma.tujuanPembelajaran.findMany({
    where: { guruMapelId: Number(guruMapelId) },
    orderBy: { urutan: 'asc' },
  });

  // Semua siswa yang terdaftar di kelas ini
  const riwayatKelas = await prisma.riwayatKelas.findMany({
    where: { kelasId: guruMapel.kelasId },
    include: { siswa: true },
  });

  // Nilai yang sudah pernah diinput untuk guru_mapel ini
  const nilaiExisting = await prisma.nilai.findMany({
    where: { guruMapelId: Number(guruMapelId) },
    include: { nilaiTps: true },
  });
  const nilaiMap = new Map(nilaiExisting.map((n) => [n.siswaId, n]));

  // Cari nilai semester SEBELUMNYA untuk mapel yang sama, sebagai referensi readonly.
  // Caranya: cari tahun ajaran yang urutannya tepat sebelum tahun ajaran kelas ini.
  const tahunAjaranSekarang = await prisma.tahunAjaran.findUnique({
    where: { id: guruMapel.kelas.tahunAjaranId },
  });

  let nilaiSemesterLaluMap = new Map<number, number | null>();
  if (tahunAjaranSekarang) {
    const tahunAjaranSebelumnya = await prisma.tahunAjaran.findFirst({
      where: {
        OR: [
          { tahun: tahunAjaranSekarang.tahun, semester: { lt: tahunAjaranSekarang.semester } },
          { tahun: { lt: tahunAjaranSekarang.tahun } },
        ],
      },
      orderBy: [{ tahun: 'desc' }, { semester: 'desc' }],
    });

    if (tahunAjaranSebelumnya) {
      const nilaiLalu = await prisma.nilai.findMany({
        where: {
          guruMapel: {
            mapelId: guruMapel.mapelId,
            kelas: { tahunAjaranId: tahunAjaranSebelumnya.id },
          },
        },
      });
      nilaiSemesterLaluMap = new Map(nilaiLalu.map((n) => [n.siswaId, n.nilaiAkhir]));
    }
  }

  // Susun jadi 1 tabel gabungan, siap dipakai frontend
  const tabel = riwayatKelas.map((rk) => {
    const nilai = nilaiMap.get(rk.siswaId);
    return {
      siswaId: rk.siswa.id,
      namaSiswa: rk.siswa.nama,
      nisn: rk.siswa.nisn,
      nilaiSemesterLalu: nilaiSemesterLaluMap.get(rk.siswaId) ?? null,
      nilaiId: nilai?.id ?? null,
      nilaiAkhir: nilai?.nilaiAkhir ?? null,
      deskripsi: nilai?.deskripsi ?? null,
      isFinal: nilai?.isFinal ?? false,
      tpStatus: tps.map((tp) => ({
        tpId: tp.id,
        deskripsi: tp.deskripsi,
        status: nilai?.nilaiTps.find((nt) => nt.tpId === tp.id)?.status ?? null,
      })),
    };
  });

  return apiSuccess({ tps, siswa: tabel }, 'Tabel nilai berhasil diambil');
}