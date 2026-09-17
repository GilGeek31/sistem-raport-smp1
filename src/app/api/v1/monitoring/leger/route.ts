import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

// GET /api/v1/monitoring/leger?kelas_id=...
// Menampilkan tabel gabungan: semua siswa (baris) x semua mapel (kolom),
// isinya nilai akhir masing-masing.
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);

  if (!['ADMIN', 'KEPALA_SEKOLAH', 'WALI_KELAS'].includes(session.user.role)) {
    return apiError('Anda tidak punya akses ke data ini', 403);
  }

  const kelasId = req.nextUrl.searchParams.get('kelas_id');
  if (!kelasId) return apiError('Parameter kelas_id wajib diisi', 422);

  const kelas = await prisma.kelas.findUnique({ where: { id: Number(kelasId) } });
  if (!kelas) return apiError('Kelas tidak ditemukan', 404);

  if (session.user.role === 'WALI_KELAS') {
    const guru = await prisma.guru.findUnique({
      where: { userId: Number(session.user.id) },
    });
    if (!guru || kelas.waliKelasId !== guru.id) {
      return apiError('Anda hanya boleh melihat leger kelas yang Anda wali-i', 403);
    }
  }

  // Semua mapel yang diajarkan di kelas ini (jadi kolom leger)
  const guruMapels = await prisma.guruMapel.findMany({
    where: { kelasId: kelas.id },
    include: { mapel: { select: { id: true, nama: true } } },
  });

  // Semua siswa di kelas ini (jadi baris leger)
  const riwayatKelas = await prisma.riwayatKelas.findMany({
    where: { kelasId: kelas.id },
    include: { siswa: true },
    orderBy: { siswa: { nama: 'asc' } },
  });

  // Semua nilai yang relevan, diambil sekaligus di awal (lebih efisien daripada query berulang)
  const semuaNilai = await prisma.nilai.findMany({
    where: { guruMapelId: { in: guruMapels.map((gm) => gm.id) } },
  });

  const leger = riwayatKelas.map((rk) => {
    const nilaiPerMapel = guruMapels.map((gm) => {
      const nilai = semuaNilai.find(
        (n) => n.siswaId === rk.siswaId && n.guruMapelId === gm.id
      );
      return {
        mapel: gm.mapel.nama,
        nilaiAkhir: nilai?.nilaiAkhir ?? null,
      };
    });

    const nilaiTerisi = nilaiPerMapel.filter((n) => n.nilaiAkhir !== null);
    const rataRata =
      nilaiTerisi.length > 0
        ? Math.round(
            (nilaiTerisi.reduce((sum, n) => sum + (n.nilaiAkhir ?? 0), 0) /
              nilaiTerisi.length) *
              100
          ) / 100
        : null;

    return {
      siswaId: rk.siswa.id,
      nama: rk.siswa.nama,
      nisn: rk.siswa.nisn,
      nilaiPerMapel,
      rataRata,
    };
  });

  return apiSuccess(
    { kelas: kelas.nama, mapelList: guruMapels.map((gm) => gm.mapel.nama), leger },
    'Leger nilai berhasil diambil'
  );
}