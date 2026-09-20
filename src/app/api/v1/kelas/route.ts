import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { buatNamaKelas, TINGKAT_VALID, ROMBEL_VALID } from '@/lib/kelas-helper';

const createKelasSchema = z.object({
  tahunAjaranId: z.number().int(),
  waliKelasId: z.number().int().optional(),
  tingkat: z.number().int().refine((v) => (TINGKAT_VALID as readonly number[]).includes(v), {
    message: 'Tingkat harus 7, 8, atau 9',
  }),
  rombel: z.enum(ROMBEL_VALID, { message: 'Rombel harus A, B, C, atau D' }),
});

// GET /api/v1/kelas?tahun_ajaran_id=...
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);

  const tahunAjaranId = req.nextUrl.searchParams.get('tahun_ajaran_id');

  const kelas = await prisma.kelas.findMany({
    where: tahunAjaranId ? { tahunAjaranId: Number(tahunAjaranId) } : undefined,
    include: {
      waliKelas: { select: { id: true, nama: true } },
      tahunAjaran: { select: { tahun: true, semester: true } },
    },
    orderBy: [{ tingkat: 'asc' }, { rombel: 'asc' }],
  });

  return apiSuccess(kelas, 'Daftar kelas berhasil diambil');
}

// POST /api/v1/kelas — hanya Admin
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);
  if (session.user.role !== 'ADMIN') {
    return apiError('Hanya Admin yang boleh menambah kelas', 403);
  }

  const body = await req.json();
  const parsed = createKelasSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

  const { tahunAjaranId, waliKelasId, tingkat, rombel } = parsed.data;
  const nama = buatNamaKelas(tingkat, rombel);

  const tahunAjaran = await prisma.tahunAjaran.findUnique({
    where: { id: tahunAjaranId },
  });
  if (!tahunAjaran) return apiError('Tahun ajaran tidak ditemukan', 404);

  if (waliKelasId) {
    const guru = await prisma.guru.findUnique({ where: { id: waliKelasId } });
    if (!guru) return apiError('Guru (calon wali kelas) tidak ditemukan', 404);
  }

  const existing = await prisma.kelas.findUnique({
    where: { tahunAjaranId_tingkat_rombel: { tahunAjaranId, tingkat, rombel } },
  });
  if (existing) {
    return apiError(`Kelas "${nama}" sudah ada di tahun ajaran ini`, 409);
  }

  const kelas = await prisma.kelas.create({
    data: { tahunAjaranId, waliKelasId, tingkat, rombel, nama },
  });

  return apiSuccess(kelas, 'Kelas berhasil ditambahkan', 201);
}