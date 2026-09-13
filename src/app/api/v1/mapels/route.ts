import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

// Skema validasi: aturan data seperti apa yang boleh masuk saat bikin mapel baru.
const createMapelSchema = z.object({
  kode: z.string().min(1, 'Kode mapel wajib diisi'),
  nama: z.string().min(1, 'Nama mapel wajib diisi'),
  kategori: z.enum(['UMUM', 'MULOK', 'PEMINATAN']).default('UMUM'),
});

// GET /api/v1/mapels — semua role yang sudah login boleh lihat daftar mapel
export async function GET() {
  const session = await auth();

  if (!session) {
    return apiError('Anda harus login terlebih dahulu', 401);
  }

  const mapels = await prisma.mapel.findMany({
    orderBy: { nama: 'asc' },
  });

  return apiSuccess(mapels, 'Daftar mapel berhasil diambil');
}

// POST /api/v1/mapels — hanya Admin yang boleh menambah mapel baru
export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session) {
    return apiError('Anda harus login terlebih dahulu', 401);
  }

  if (session.user.role !== 'ADMIN') {
    return apiError('Hanya Admin yang boleh menambah mapel', 403);
  }

  const body = await req.json();

  // Validasi input pakai Zod. Kalau tidak sesuai skema, otomatis ditolak
  // dengan pesan error yang jelas.
  const parsed = createMapelSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 422);
  }

  // Cek dulu apakah kode mapel sudah dipakai (karena kolom `kode` bersifat unique)
  const existing = await prisma.mapel.findUnique({
    where: { kode: parsed.data.kode },
  });
  if (existing) {
    return apiError(`Kode mapel "${parsed.data.kode}" sudah digunakan`, 409);
  }

  const mapel = await prisma.mapel.create({
    data: parsed.data,
  });

  return apiSuccess(mapel, 'Mapel berhasil ditambahkan', 201);
}