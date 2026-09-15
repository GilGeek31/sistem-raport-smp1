import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

const updateEkskulSchema = z.object({
  nama: z.string().min(1),
});

// PUT /api/v1/ekskuls/:id — hanya Admin
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);
  if (session.user.role !== 'ADMIN') {
    return apiError('Hanya Admin yang boleh mengedit ekskul', 403);
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateEkskulSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

  const ekskul = await prisma.ekskul.findUnique({ where: { id: Number(id) } });
  if (!ekskul) return apiError('Ekskul tidak ditemukan', 404);

  const updated = await prisma.ekskul.update({
    where: { id: Number(id) },
    data: parsed.data,
  });

  return apiSuccess(updated, 'Ekskul berhasil diperbarui');
}

// DELETE /api/v1/ekskuls/:id — hanya Admin
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);
  if (session.user.role !== 'ADMIN') {
    return apiError('Hanya Admin yang boleh menghapus ekskul', 403);
  }

  const { id } = await params;
  const ekskul = await prisma.ekskul.findUnique({ where: { id: Number(id) } });
  if (!ekskul) return apiError('Ekskul tidak ditemukan', 404);

  await prisma.ekskul.delete({ where: { id: Number(id) } });
  return apiSuccess(null, 'Ekskul berhasil dihapus');
}