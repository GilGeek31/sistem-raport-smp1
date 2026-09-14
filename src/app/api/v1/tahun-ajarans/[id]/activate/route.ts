import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

// PATCH /api/v1/tahun-ajarans/:id/activate — hanya Admin
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);
  if (session.user.role !== 'ADMIN') {
    return apiError('Hanya Admin yang boleh mengaktifkan tahun ajaran', 403);
  }

  const { id } = await params;

  const target = await prisma.tahunAjaran.findUnique({
    where: { id: Number(id) },
  });
  if (!target) return apiError('Tahun ajaran tidak ditemukan', 404);

  // Dalam satu transaction: matikan SEMUA tahun ajaran lain,
  // baru nyalakan yang dipilih. Ini yang menjamin "cuma 1 yang aktif".
  const updated = await prisma.$transaction(async (tx) => {
    await tx.tahunAjaran.updateMany({
      where: { NOT: { id: Number(id) } },
      data: { isActive: false },
    });

    return tx.tahunAjaran.update({
      where: { id: Number(id) },
      data: { isActive: true },
    });
  });

  return apiSuccess(updated, `Tahun ajaran ${updated.tahun} semester ${updated.semester} berhasil diaktifkan`);
}