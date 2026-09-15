import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

const createEkskulSchema = z.object({
  nama: z.string().min(1, 'Nama ekskul wajib diisi'),
});

// GET /api/v1/ekskuls
export async function GET() {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);

  const ekskuls = await prisma.ekskul.findMany({ orderBy: { nama: 'asc' } });
  return apiSuccess(ekskuls, 'Daftar ekskul berhasil diambil');
}

// POST /api/v1/ekskuls — hanya Admin
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);
  if (session.user.role !== 'ADMIN') {
    return apiError('Hanya Admin yang boleh menambah ekskul', 403);
  }

  const body = await req.json();
  const parsed = createEkskulSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

  const existing = await prisma.ekskul.findUnique({
    where: { nama: parsed.data.nama },
  });
  if (existing) return apiError(`Ekskul "${parsed.data.nama}" sudah ada`, 409);

  const ekskul = await prisma.ekskul.create({ data: parsed.data });
  return apiSuccess(ekskul, 'Ekskul berhasil ditambahkan', 201);
}