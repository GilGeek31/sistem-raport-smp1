import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

const nilaiKokurikulerSchema = z.object({
  siswaId: z.number().int(),
  kokurikulerId: z.number().int(),
  tahunAjaranId: z.number().int(),
  deskripsi: z.string().optional(),
});

// GET /api/v1/nilai-kokurikulers?siswa_id=
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);

  if (!['ADMIN', 'KOORDINATOR_KOKURIKULER'].includes(session.user.role)) {
    // Siswa boleh lihat, tapi cuma data dirinya sendiri
    if (session.user.role !== 'SISWA') {
      return apiError('Anda tidak punya akses ke data ini', 403);
    }
  }

  const siswaId = req.nextUrl.searchParams.get('siswa_id');

  if (session.user.role === 'SISWA') {
    const siswa = await prisma.siswa.findUnique({
      where: { userId: Number(session.user.id) },
    });
    if (!siswa || String(siswa.id) !== siswaId) {
      return apiError('Anda hanya boleh melihat data kokurikuler milik sendiri', 403);
    }
  }

  const nilaiKokurikulers = await prisma.nilaiKokurikuler.findMany({
    where: { siswaId: siswaId ? Number(siswaId) : undefined },
    include: { kokurikuler: { select: { nama: true } } },
  });

  return apiSuccess(nilaiKokurikulers, 'Data kokurikuler berhasil diambil');
}

// POST /api/v1/nilai-kokurikulers — hanya Koordinator Kokurikuler & Admin
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);

  if (!['ADMIN', 'KOORDINATOR_KOKURIKULER'].includes(session.user.role)) {
    return apiError('Hanya Koordinator Kokurikuler yang boleh input data ini', 403);
  }

  const body = await req.json();
  const parsed = nilaiKokurikulerSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

  const nilaiKokurikuler = await prisma.nilaiKokurikuler.upsert({
    where: {
      siswaId_kokurikulerId_tahunAjaranId: {
        siswaId: parsed.data.siswaId,
        kokurikulerId: parsed.data.kokurikulerId,
        tahunAjaranId: parsed.data.tahunAjaranId,
      },
    },
    create: parsed.data,
    update: { deskripsi: parsed.data.deskripsi },
  });

  return apiSuccess(nilaiKokurikuler, 'Data kokurikuler berhasil disimpan', 201);
}