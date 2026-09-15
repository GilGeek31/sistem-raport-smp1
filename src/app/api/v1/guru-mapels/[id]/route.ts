import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

// DELETE /api/v1/guru-mapels/:id — hanya Admin
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);
  if (session.user.role !== 'ADMIN') {
    return apiError('Hanya Admin yang boleh membatalkan penugasan', 403);
  }

  const { id } = await params;

  const guruMapel = await prisma.guruMapel.findUnique({ where: { id: Number(id) } });
  if (!guruMapel) return apiError('Penugasan tidak ditemukan', 404);

  // Cek dulu apakah sudah ada TP atau nilai yang nempel ke penugasan ini —
  // kalau ada, sebaiknya tolak dulu supaya tidak kehilangan data secara tidak sengaja.
  const punyaTp = await prisma.tujuanPembelajaran.findFirst({
    where: { guruMapelId: Number(id) },
  });
  if (punyaTp) {
    return apiError(
      'Penugasan ini sudah punya data Tujuan Pembelajaran. Hapus dulu TP-nya sebelum membatalkan penugasan.',
      409
    );
  }

  await prisma.guruMapel.delete({ where: { id: Number(id) } });
  return apiSuccess(null, 'Penugasan mengajar berhasil dibatalkan');
}