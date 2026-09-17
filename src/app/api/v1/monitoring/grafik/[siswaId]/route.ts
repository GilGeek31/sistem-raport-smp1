import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { bolehLihatRaport } from '@/lib/raport-data';

// GET /api/v1/monitoring/grafik/:siswaId
// Menampilkan riwayat nilai siswa ini, dikelompokkan per mapel,
// diurutkan dari semester paling lama ke paling baru — siap dipakai
// frontend untuk digambar sebagai grafik garis.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ siswaId: string }> }
) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);

  const { siswaId } = await params;

  // Pakai ulang fungsi cek akses yang sama dengan fitur cetak raport —
  // aturannya memang sama: siapa boleh lihat raport, boleh juga lihat grafik nilainya.
  const boleh = await bolehLihatRaport(
    Number(session.user.id),
    session.user.role,
    Number(siswaId)
  );
  if (!boleh) return apiError('Anda tidak punya akses ke data siswa ini', 403);

  const semuaNilai = await prisma.nilai.findMany({
    where: { siswaId: Number(siswaId) },
    include: {
      guruMapel: {
        include: {
          mapel: { select: { nama: true } },
          kelas: { include: { tahunAjaran: true } },
        },
      },
    },
  });

  // Kelompokkan per mapel, urutkan tiap kelompok dari semester lama ke baru
  const perMapel = new Map<
    string,
    { tahun: string; semester: number; nilaiAkhir: number | null }[]
  >();

  for (const n of semuaNilai) {
    const namaMapel = n.guruMapel.mapel.nama;
    const ta = n.guruMapel.kelas.tahunAjaran;

    if (!perMapel.has(namaMapel)) perMapel.set(namaMapel, []);
    perMapel.get(namaMapel)!.push({
      tahun: ta.tahun,
      semester: ta.semester,
      nilaiAkhir: n.nilaiAkhir,
    });
  }

  const grafik = Array.from(perMapel.entries()).map(([mapel, riwayat]) => ({
    mapel,
    riwayat: riwayat.sort((a, b) => {
      if (a.tahun !== b.tahun) return a.tahun.localeCompare(b.tahun);
      return a.semester - b.semester;
    }),
  }));

  return apiSuccess(grafik, 'Data grafik perkembangan nilai berhasil diambil');
}