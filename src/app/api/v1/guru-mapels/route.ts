import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

const createGuruMapelSchema = z.object({
  guruId: z.number().int(),
  mapelId: z.number().int(),
  kelasId: z.number().int(),
});

// GET /api/v1/guru-mapels — hanya Admin (untuk lihat semua penugasan)
export async function GET() {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);
  if (session.user.role !== 'ADMIN') {
    return apiError('Hanya Admin yang boleh melihat semua penugasan', 403);
  }

  const guruMapels = await prisma.guruMapel.findMany({
    include: {
      guru: { select: { id: true, nama: true } },
      mapel: { select: { id: true, nama: true, kode: true } },
      kelas: { select: { id: true, nama: true } },
    },
    orderBy: { id: 'desc' },
  });

  return apiSuccess(guruMapels, 'Daftar penugasan berhasil diambil');
}

// POST /api/v1/guru-mapels — hanya Admin, tugaskan guru mengajar mapel di kelas
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);
  if (session.user.role !== 'ADMIN') {
    return apiError('Hanya Admin yang boleh membuat penugasan mengajar', 403);
  }

  const body = await req.json();
  const parsed = createGuruMapelSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

  const { guruId, mapelId, kelasId } = parsed.data;

  // Pastikan ketiganya benar-benar ada di database sebelum dihubungkan
  const [guru, mapel, kelas] = await Promise.all([
    prisma.guru.findUnique({ where: { id: guruId } }),
    prisma.mapel.findUnique({ where: { id: mapelId } }),
    prisma.kelas.findUnique({ where: { id: kelasId } }),
  ]);

  if (!guru) return apiError('Guru tidak ditemukan', 404);
  if (!mapel) return apiError('Mapel tidak ditemukan', 404);
  if (!kelas) return apiError('Kelas tidak ditemukan', 404);

  const existing = await prisma.guruMapel.findUnique({
    where: { guruId_mapelId_kelasId: { guruId, mapelId, kelasId } },
  });
  if (existing) {
    return apiError(
      `${guru.nama} sudah ditugaskan mengajar ${mapel.nama} di kelas ${kelas.nama}`,
      409
    );
  }

  const guruMapel = await prisma.guruMapel.create({
    data: { guruId, mapelId, kelasId },
    include: {
      guru: { select: { nama: true } },
      mapel: { select: { nama: true } },
      kelas: { select: { nama: true } },
    },
  });

  return apiSuccess(guruMapel, 'Penugasan mengajar berhasil ditambahkan', 201);
}