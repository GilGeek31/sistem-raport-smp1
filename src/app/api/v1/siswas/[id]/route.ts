import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

const updateSiswaSchema = z.object({
  nisn: z.string().min(1).optional(),
  nis: z.string().optional(),
  nama: z.string().min(1).optional(),
});

// PUT /api/v1/siswas/:id
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);
  if (session.user.role !== 'ADMIN') {
    return apiError('Hanya Admin yang boleh mengedit siswa', 403);
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSiswaSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

  const siswa = await prisma.siswa.findUnique({ where: { id: Number(id) } });
  if (!siswa) return apiError('Siswa tidak ditemukan', 404);

  const updated = await prisma.siswa.update({
    where: { id: Number(id) },
    data: parsed.data,
  });

  return apiSuccess(updated, 'Data siswa berhasil diperbarui');
}

// DELETE /api/v1/siswas/:id — menghapus siswa SEKALIGUS akun User-nya
// (karena relasi Guru/Siswa -> User pakai onDelete: Cascade di schema,
// cukup hapus User-nya, Siswa ikut terhapus otomatis)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);
  if (session.user.role !== 'ADMIN') {
    return apiError('Hanya Admin yang boleh menghapus siswa', 403);
  }

  const { id } = await params;

  const siswa = await prisma.siswa.findUnique({ where: { id: Number(id) } });
  if (!siswa) return apiError('Siswa tidak ditemukan', 404);

  await prisma.user.delete({ where: { id: siswa.userId } });

  return apiSuccess(null, 'Siswa berhasil dihapus');
}