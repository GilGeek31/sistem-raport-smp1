import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

const updateTpSchema = z.object({
  deskripsi: z.string().min(1, 'Deskripsi tidak boleh kosong'),
});

// Helper yang sama seperti di route.ts sebelumnya, tapi berdasarkan TP id
async function pastikanPemilikTp(userId: number, role: string, tpId: number) {
  const tp = await prisma.tujuanPembelajaran.findUnique({
    where: { id: tpId },
    include: { guruMapel: { include: { guru: true } } },
  });

  if (!tp) return { tp: null, boleh: false };
  if (role === 'ADMIN') return { tp, boleh: true };

  const boleh = tp.guruMapel.guru.userId === userId;
  return { tp, boleh };
}

// PUT /api/v1/tujuan-pembelajaran/:id
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);

  const { id } = await params;
  const body = await req.json();
  const parsed = updateTpSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

  const { tp, boleh } = await pastikanPemilikTp(
    Number(session.user.id),
    session.user.role,
    Number(id)
  );

  if (!tp) return apiError('Tujuan pembelajaran tidak ditemukan', 404);
  if (!boleh) return apiError('Anda tidak punya akses untuk mengedit TP ini', 403);

  const updated = await prisma.tujuanPembelajaran.update({
    where: { id: Number(id) },
    data: parsed.data,
  });

  return apiSuccess(updated, 'Tujuan pembelajaran berhasil diperbarui');
}

// DELETE /api/v1/tujuan-pembelajaran/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);

  const { id } = await params;

  const { tp, boleh } = await pastikanPemilikTp(
    Number(session.user.id),
    session.user.role,
    Number(id)
  );

  if (!tp) return apiError('Tujuan pembelajaran tidak ditemukan', 404);
  if (!boleh) return apiError('Anda tidak punya akses untuk menghapus TP ini', 403);

  // Catatan: kalau TP ini sudah pernah dicentang di nilai_tps siswa manapun,
  // relasi onDelete: Cascade di schema akan otomatis hapus juga catatan
  // centangan itu. Ini konsekuensi yang wajar (TP-nya memang dihapus).
  await prisma.tujuanPembelajaran.delete({ where: { id: Number(id) } });

  return apiSuccess(null, 'Tujuan pembelajaran berhasil dihapus');
}