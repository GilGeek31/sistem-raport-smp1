import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

const pengaturanRaportSchema = z.object({
  tahunAjaranId: z.number().int(),
  tanggal: z.string().min(1, 'Tanggal wajib diisi'), // format: "2025-12-20"
  tempat: z.string().min(1, 'Tempat wajib diisi'),
});

// GET /api/v1/pengaturan-raport?tahun_ajaran_id=...
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);

  const tahunAjaranId = req.nextUrl.searchParams.get('tahun_ajaran_id');
  if (!tahunAjaranId) return apiError('Parameter tahun_ajaran_id wajib diisi', 422);

  const pengaturan = await prisma.pengaturanRaport.findUnique({
    where: { tahunAjaranId: Number(tahunAjaranId) },
  });

  if (!pengaturan) {
    return apiError('Pengaturan raport untuk tahun ajaran ini belum diatur', 404);
  }

  return apiSuccess(pengaturan, 'Pengaturan raport berhasil diambil');
}

// PUT /api/v1/pengaturan-raport — hanya Admin (upsert: buat kalau belum ada, update kalau sudah)
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);
  if (session.user.role !== 'ADMIN') {
    return apiError('Hanya Admin yang boleh mengatur tanggal & tempat raport', 403);
  }

  const body = await req.json();
  const parsed = pengaturanRaportSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

  const { tahunAjaranId, tanggal, tempat } = parsed.data;

  const tahunAjaran = await prisma.tahunAjaran.findUnique({
    where: { id: tahunAjaranId },
  });
  if (!tahunAjaran) return apiError('Tahun ajaran tidak ditemukan', 404);

  const pengaturan = await prisma.pengaturanRaport.upsert({
    where: { tahunAjaranId },
    create: { tahunAjaranId, tanggal: new Date(tanggal), tempat },
    update: { tanggal: new Date(tanggal), tempat },
  });

  return apiSuccess(pengaturan, 'Pengaturan raport berhasil disimpan');
}