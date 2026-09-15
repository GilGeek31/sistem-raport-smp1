import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

const updateKokurikulerSchema = z.object({
  nama: z.string().min(1),
});

// PUT /api/v1/kokurikulers/:id — hanya Admin
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);
  if (session.user.role !== 'ADMIN') {
    return apiError('Hanya Admin yang boleh mengedit kokurikuler', 403);
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateKokurikulerSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

  const kokurikuler = await prisma.kokurikuler.findUnique({ where: { id: Number(id) } });
  if (!kokurikuler) return apiError('Kokurikuler tidak ditemukan', 404);

  const updated = await prisma.kokurikuler.update({
    where: { id: Number(id) },
    data: parsed.data,
  });

  return apiSuccess(updated, 'Kokurikuler berhasil diperbarui');
}

// DELETE /api/v1/kokurikulers/:id — hanya Admin
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);
  if (session.user.role !== 'ADMIN') {
    return apiError('Hanya Admin yang boleh menghapus kokurikuler', 403);
  }

  const { id } = await params;
  const kokurikuler = await prisma.kokurikuler.findUnique({ where: { id: Number(id) } });
  if (!kokurikuler) return apiError('Kokurikuler tidak ditemukan', 404);

  await prisma.kokurikuler.delete({ where: { id: Number(id) } });
  return apiSuccess(null, 'Kokurikuler berhasil dihapus');
}