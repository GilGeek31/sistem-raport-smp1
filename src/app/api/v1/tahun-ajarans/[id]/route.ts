import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

const updateTahunAjaranSchema = z.object({
  tahun: z.string().min(1).optional(),
  semester: z.number().int().min(1).max(2).optional(),
});

// PUT /api/v1/tahun-ajarans/:id — hanya Admin
// Catatan: mengubah isActive TIDAK lewat sini, tapi lewat
// PATCH /api/v1/tahun-ajarans/:id/activate (biar logika "cuma 1 aktif" tetap terjaga).
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);
  if (session.user.role !== 'ADMIN') {
    return apiError('Hanya Admin yang boleh mengedit tahun ajaran', 403);
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateTahunAjaranSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

  const tahunAjaran = await prisma.tahunAjaran.findUnique({
    where: { id: Number(id) },
  });
  if (!tahunAjaran) return apiError('Tahun ajaran tidak ditemukan', 404);

  // Kalau tahun/semester diubah, cek dulu supaya tidak bentrok
  // dengan tahun ajaran lain yang sudah ada.
  const tahunBaru = parsed.data.tahun ?? tahunAjaran.tahun;
  const semesterBaru = parsed.data.semester ?? tahunAjaran.semester;

  const bentrok = await prisma.tahunAjaran.findFirst({
    where: {
      tahun: tahunBaru,
      semester: semesterBaru,
      NOT: { id: Number(id) },
    },
  });
  if (bentrok) {
    return apiError(`Tahun ajaran ${tahunBaru} semester ${semesterBaru} sudah ada`, 409);
  }

  const updated = await prisma.tahunAjaran.update({
    where: { id: Number(id) },
    data: parsed.data,
  });

  return apiSuccess(updated, 'Tahun ajaran berhasil diperbarui');
}