import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

const createKokurikulerSchema = z.object({
  nama: z.string().min(1, 'Nama kokurikuler wajib diisi'),
});

// GET /api/v1/kokurikulers
export async function GET() {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);

  const kokurikulers = await prisma.kokurikuler.findMany({ orderBy: { nama: 'asc' } });
  return apiSuccess(kokurikulers, 'Daftar kokurikuler berhasil diambil');
}

// POST /api/v1/kokurikulers — hanya Admin
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);
  if (session.user.role !== 'ADMIN') {
    return apiError('Hanya Admin yang boleh menambah kokurikuler', 403);
  }

  const body = await req.json();
  const parsed = createKokurikulerSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

  const existing = await prisma.kokurikuler.findUnique({
    where: { nama: parsed.data.nama },
  });
  if (existing) return apiError(`Kokurikuler "${parsed.data.nama}" sudah ada`, 409);

  const kokurikuler = await prisma.kokurikuler.create({ data: parsed.data });
  return apiSuccess(kokurikuler, 'Kokurikuler berhasil ditambahkan', 201);
}