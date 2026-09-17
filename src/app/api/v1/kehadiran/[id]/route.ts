import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

const updateKehadiranSchema = z.object({
  sakit: z.number().int().min(0).optional(),
  izin: z.number().int().min(0).optional(),
  tanpaKeterangan: z.number().int().min(0).optional(),
});

// PUT /api/v1/kehadiran/:id
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);

  const { id } = await params;
  const body = await req.json();
  const parsed = updateKehadiranSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

  const kehadiran = await prisma.kehadiranSiswa.findUnique({
    where: { id: Number(id) },
    include: { siswa: true },
  });
  if (!kehadiran) return apiError('Data kehadiran tidak ditemukan', 404);

  if (session.user.role === 'WALI_KELAS') {
    const guru = await prisma.guru.findUnique({
      where: { userId: Number(session.user.id) },
    });

    const riwayat = await prisma.riwayatKelas.findFirst({
      where: {
        siswaId: kehadiran.siswaId,
        tahunAjaranId: kehadiran.tahunAjaranId,
        kelas: { waliKelasId: guru?.id },
      },
    });

    if (!riwayat) {
      return apiError('Anda hanya boleh mengubah kehadiran siswa di kelas Anda', 403);
    }
  } else if (session.user.role !== 'ADMIN') {
    return apiError('Anda tidak punya akses untuk mengubah kehadiran', 403);
  }

  const updated = await prisma.kehadiranSiswa.update({
    where: { id: Number(id) },
    data: parsed.data,
  });

  return apiSuccess(updated, 'Kehadiran berhasil diperbarui');
}