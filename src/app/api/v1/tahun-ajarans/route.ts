import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

const createTahunAjaranSchema = z.object({
  tahun: z.string().min(1, 'Tahun wajib diisi (contoh: 2025/2026)'),
  semester: z.number().int().min(1).max(2),
});

// GET /api/v1/tahun-ajarans — semua role yang login boleh lihat
export async function GET() {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);

  const tahunAjarans = await prisma.tahunAjaran.findMany({
    orderBy: [{ tahun: 'desc' }, { semester: 'desc' }],
  });

  return apiSuccess(tahunAjarans, 'Daftar tahun ajaran berhasil diambil');
}

// POST /api/v1/tahun-ajarans — hanya Admin
// Catatan: tahun ajaran baru dibuat dengan isActive = false secara default.
// Admin perlu panggil endpoint /activate terpisah untuk mengaktifkannya.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);
  if (session.user.role !== 'ADMIN') {
    return apiError('Hanya Admin yang boleh menambah tahun ajaran', 403);
  }

  const body = await req.json();
  const parsed = createTahunAjaranSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

  const existing = await prisma.tahunAjaran.findUnique({
    where: {
      tahun_semester: {
        tahun: parsed.data.tahun,
        semester: parsed.data.semester,
      },
    },
  });
  if (existing) {
    return apiError(
      `Tahun ajaran ${parsed.data.tahun} semester ${parsed.data.semester} sudah ada`,
      409
    );
  }

  const tahunAjaran = await prisma.tahunAjaran.create({
    data: { ...parsed.data, isActive: false },
  });

  return apiSuccess(tahunAjaran, 'Tahun ajaran berhasil ditambahkan', 201);
}