import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

const updateNilaiSchema = z.object({
  nilaiAkhir: z.number().min(0).max(100).optional(),
  deskripsi: z.string().optional(),
});

async function pastikanPemilikNilai(userId: number, role: string, nilaiId: number) {
  const nilai = await prisma.nilai.findUnique({
    where: { id: nilaiId },
    include: { guruMapel: { include: { guru: true } } },
  });

  if (!nilai) return { nilai: null, boleh: false };
  if (role === 'ADMIN') return { nilai, boleh: true };

  const boleh = nilai.guruMapel.guru.userId === userId;
  return { nilai, boleh };
}

// PUT /api/v1/nilai/:id — edit manual (biasanya buat ubah deskripsi otomatis)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);

  const { id } = await params;
  const body = await req.json();
  const parsed = updateNilaiSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

  const { nilai, boleh } = await pastikanPemilikNilai(
    Number(session.user.id),
    session.user.role,
    Number(id)
  );
  if (!nilai) return apiError('Nilai tidak ditemukan', 404);
  if (!boleh) return apiError('Anda tidak punya akses untuk mengedit nilai ini', 403);

  if (nilai.isFinal) {
    return apiError('Nilai ini sudah final, tidak bisa diedit lagi', 409);
  }

  const updated = await prisma.nilai.update({
    where: { id: Number(id) },
    data: parsed.data,
  });

  return apiSuccess(updated, 'Nilai berhasil diperbarui');
}