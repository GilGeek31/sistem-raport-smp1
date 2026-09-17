import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

// Catatan: untuk sekarang, `fileTtd` diisi berupa URL/path string
// (misal hasil upload manual ke folder public, atau nanti ke Cloudflare R2).
// Proses upload file sesungguhnya (multipart/form-data) belum kita buat —
// itu bagian terpisah yang bisa ditambahkan nanti.
const tandaTanganSchema = z.object({
  userId: z.number().int(),
  tahunAjaranId: z.number().int(),
  fileTtd: z.string().min(1, 'File TTD wajib diisi'),
});

// GET /api/v1/tanda-tangan?tahun_ajaran_id=...
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);

  const tahunAjaranId = req.nextUrl.searchParams.get('tahun_ajaran_id');

  const tandaTangans = await prisma.tandaTangan.findMany({
    where: { tahunAjaranId: tahunAjaranId ? Number(tahunAjaranId) : undefined },
    include: { user: { select: { email: true, role: true } } },
  });

  return apiSuccess(tandaTangans, 'Daftar TTD berhasil diambil');
}

// POST /api/v1/tanda-tangan — hanya Admin
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);
  if (session.user.role !== 'ADMIN') {
    return apiError('Hanya Admin yang boleh mengunggah TTD', 403);
  }

  const body = await req.json();
  const parsed = tandaTanganSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

  const user = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!user) return apiError('User tidak ditemukan', 404);

  // Cuma wali kelas & kepala sekolah yang logis punya TTD di raport
  if (!['WALI_KELAS', 'KEPALA_SEKOLAH'].includes(user.role)) {
    return apiError('TTD hanya berlaku untuk akun Wali Kelas atau Kepala Sekolah', 422);
  }

  const tandaTangan = await prisma.tandaTangan.upsert({
    where: {
      userId_tahunAjaranId: {
        userId: parsed.data.userId,
        tahunAjaranId: parsed.data.tahunAjaranId,
      },
    },
    create: parsed.data,
    update: { fileTtd: parsed.data.fileTtd },
  });

  return apiSuccess(tandaTangan, 'TTD berhasil disimpan', 201);
}