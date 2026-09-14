import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

const updateGuruSchema = z.object({
  nip: z.string().optional(),
  nuptk: z.string().optional(),
  nama: z.string().min(1).optional(),
});

// PUT /api/v1/gurus/:id
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);
  if (session.user.role !== 'ADMIN') {
    return apiError('Hanya Admin yang boleh mengedit guru', 403);
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateGuruSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

  const guru = await prisma.guru.findUnique({ where: { id: Number(id) } });
  if (!guru) return apiError('Guru tidak ditemukan', 404);

  const updated = await prisma.guru.update({
    where: { id: Number(id) },
    data: parsed.data,
  });

  return apiSuccess(updated, 'Data guru berhasil diperbarui');
}

// DELETE /api/v1/gurus/:id — sekaligus menghapus akun User-nya (cascade)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);
  if (session.user.role !== 'ADMIN') {
    return apiError('Hanya Admin yang boleh menghapus guru', 403);
  }

  const { id } = await params;

  const guru = await prisma.guru.findUnique({ where: { id: Number(id) } });
  if (!guru) return apiError('Guru tidak ditemukan', 404);

  // Cek dulu apakah guru ini masih jadi wali kelas aktif —
  // kalau iya, sebaiknya tolak dulu supaya tidak ada kelas tanpa wali
  // secara tiba-tiba (bisa disesuaikan nanti sesuai kebutuhan).
  const masihWaliKelas = await prisma.kelas.findFirst({
    where: { waliKelasId: Number(id) },
  });
  if (masihWaliKelas) {
    return apiError(
      `Guru ini masih menjadi wali kelas "${masihWaliKelas.nama}". Ganti wali kelasnya dulu sebelum menghapus.`,
      409
    );
  }

  await prisma.user.delete({ where: { id: guru.userId } });

  return apiSuccess(null, 'Guru berhasil dihapus');
}