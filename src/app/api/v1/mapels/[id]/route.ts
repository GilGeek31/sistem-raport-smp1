import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

const updateMapelSchema = z.object({
  kode: z.string().min(1).optional(),
  nama: z.string().min(1).optional(),
  kategori: z.enum(['UMUM', 'MULOK', 'PEMINATAN']).optional(),
});

// PUT /api/v1/mapels/:id — hanya Admin
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session) {
    return apiError('Anda harus login terlebih dahulu', 401);
  }

  if (session.user.role !== 'ADMIN') {
    return apiError('Hanya Admin yang boleh mengedit mapel', 403);
  }

  const { id } = await params;
  const body = await req.json();

  const parsed = updateMapelSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 422);
  }

  const mapel = await prisma.mapel.findUnique({ where: { id: Number(id) } });
  if (!mapel) {
    return apiError('Mapel tidak ditemukan', 404);
  }

  const updated = await prisma.mapel.update({
    where: { id: Number(id) },
    data: parsed.data,
  });

  return apiSuccess(updated, 'Mapel berhasil diperbarui');
}

// DELETE /api/v1/mapels/:id — hanya Admin
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session) {
    return apiError('Anda harus login terlebih dahulu', 401);
  }

  if (session.user.role !== 'ADMIN') {
    return apiError('Hanya Admin yang boleh menghapus mapel', 403);
  }

  const { id } = await params;

  const mapel = await prisma.mapel.findUnique({ where: { id: Number(id) } });
  if (!mapel) {
    return apiError('Mapel tidak ditemukan', 404);
  }

  await prisma.mapel.delete({ where: { id: Number(id) } });

  return apiSuccess(null, 'Mapel berhasil dihapus');
}