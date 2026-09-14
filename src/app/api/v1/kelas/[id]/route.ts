import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

const updateKelasSchema = z.object({
  nama: z.string().min(1).optional(),
  waliKelasId: z.number().int().nullable().optional(),
});

// PUT /api/v1/kelas/:id — hanya Admin
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);
  if (session.user.role !== 'ADMIN') {
    return apiError('Hanya Admin yang boleh mengedit kelas', 403);
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateKelasSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

  const kelas = await prisma.kelas.findUnique({ where: { id: Number(id) } });
  if (!kelas) return apiError('Kelas tidak ditemukan', 404);

  if (parsed.data.waliKelasId) {
    const guru = await prisma.guru.findUnique({
      where: { id: parsed.data.waliKelasId },
    });
    if (!guru) return apiError('Guru (calon wali kelas) tidak ditemukan', 404);
  }

  const updated = await prisma.kelas.update({
    where: { id: Number(id) },
    data: parsed.data,
  });

  return apiSuccess(updated, 'Kelas berhasil diperbarui');
}