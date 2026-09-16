import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

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

// PATCH /api/v1/nilai/:id/finalize
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);

  const { id } = await params;

  const { nilai, boleh } = await pastikanPemilikNilai(
    Number(session.user.id),
    session.user.role,
    Number(id)
  );
  if (!nilai) return apiError('Nilai tidak ditemukan', 404);
  if (!boleh) return apiError('Anda tidak punya akses untuk finalisasi nilai ini', 403);

  if (nilai.nilaiAkhir === null) {
    return apiError('Nilai akhir belum diisi, tidak bisa difinalisasi', 422);
  }

  const updated = await prisma.nilai.update({
    where: { id: Number(id) },
    data: { isFinal: true },
  });

  return apiSuccess(updated, 'Nilai berhasil difinalisasi dan terkunci');
}