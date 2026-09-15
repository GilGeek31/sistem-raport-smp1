import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

// GET /api/v1/guru-mapels/saya — guru lihat mapel & kelas yang dia ampu sendiri
export async function GET() {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);

  // Cari data Guru yang terhubung ke User yang sedang login
  const guru = await prisma.guru.findUnique({
    where: { userId: Number(session.user.id) },
  });

  if (!guru) {
    return apiError('Akun ini bukan akun guru', 403);
  }

  const guruMapels = await prisma.guruMapel.findMany({
    where: { guruId: guru.id },
    include: {
      mapel: { select: { id: true, nama: true, kode: true } },
      kelas: { select: { id: true, nama: true } },
    },
  });

  return apiSuccess(guruMapels, 'Daftar penugasan Anda berhasil diambil');
}