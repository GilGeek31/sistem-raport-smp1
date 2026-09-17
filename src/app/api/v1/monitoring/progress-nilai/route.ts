import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

// GET /api/v1/monitoring/progress-nilai?kelas_id=...
// Menampilkan: untuk setiap mapel di kelas ini, berapa siswa yang nilainya
// sudah diisi, dan berapa yang sudah final.
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
      return apiError('Anda hanya boleh melihat progres kelas yang Anda wali-i', 403);
    }
  }

  const totalSiswa = await prisma.riwayatKelas.count({ where: { kelasId: kelas.id } });

  const guruMapels = await prisma.guruMapel.findMany({
    where: { kelasId: kelas.id },
    include: {
      mapel: { select: { nama: true } },
      guru: { select: { nama: true } },
      nilais: { select: { isFinal: true } },
    },
  });

  const progress = guruMapels.map((gm) => {
    const sudahDiisi = gm.nilais.length;
    const sudahFinal = gm.nilais.filter((n) => n.isFinal).length;

    return {
      mapel: gm.mapel.nama,
      guru: gm.guru.nama,
      totalSiswa,
      sudahDiisi,
      sudahFinal,
      persenSelesai: totalSiswa > 0 ? Math.round((sudahDiisi / totalSiswa) * 100) : 0,
    };
  });

  return apiSuccess(
    { kelas: kelas.nama, totalSiswa, progress },
    'Progress input nilai berhasil diambil'
  );
}