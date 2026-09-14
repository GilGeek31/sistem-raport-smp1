import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

const createKelasSchema = z.object({
  tahunAjaranId: z.number().int(),
  waliKelasId: z.number().int().optional(),
  nama: z.string().min(1, 'Nama kelas wajib diisi (contoh: VII-A)'),
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
    orderBy: { nama: 'asc' },
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

  const { tahunAjaranId, waliKelasId, nama } = parsed.data;

  const tahunAjaran = await prisma.tahunAjaran.findUnique({
    where: { id: tahunAjaranId },
  });
  if (!tahunAjaran) return apiError('Tahun ajaran tidak ditemukan', 404);

  if (waliKelasId) {
    const guru = await prisma.guru.findUnique({ where: { id: waliKelasId } });
    if (!guru) return apiError('Guru (calon wali kelas) tidak ditemukan', 404);
  }

  const existing = await prisma.kelas.findUnique({
    where: { tahunAjaranId_nama: { tahunAjaranId, nama } },
  });
  if (existing) {
    return apiError(`Kelas "${nama}" sudah ada di tahun ajaran ini`, 409);
  }

  const kelas = await prisma.kelas.create({
    data: { tahunAjaranId, waliKelasId, nama },
  });

  return apiSuccess(kelas, 'Kelas berhasil ditambahkan', 201);
}