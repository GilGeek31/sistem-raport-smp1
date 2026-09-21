import { NextRequest } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

const createGuruSchema = z.object({
  email: z.string().email('Email tidak valid'),
  nip: z.string().optional(),
  nuptk: z.string().optional(),
  nama: z.string().min(1, 'Nama wajib diisi'),
  password: z.string().min(6).optional(),
  // Guru bisa berperan sebagai pengajar mapel biasa, wali kelas,
  // atau koordinator kokurikuler — admin yang menentukan saat input data.
  role: z.enum(['GURU_MAPEL', 'WALI_KELAS', 'KOORDINATOR_KOKURIKULER']).default('GURU_MAPEL'),
});

// GET /api/v1/gurus
export async function GET() {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);

  if (!['ADMIN', 'KEPALA_SEKOLAH'].includes(session.user.role)) {
    return apiError('Anda tidak punya akses ke data ini', 403);
  }

  const gurus = await prisma.guru.findMany({
    include: { user: { select: { email: true, fotoProfil: true, role: true } } },
    orderBy: { nama: 'asc' },
  });

  return apiSuccess(gurus, 'Daftar guru berhasil diambil');
}

// POST /api/v1/gurus — tambah guru baru, otomatis buat akun User terkait
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);
  if (session.user.role !== 'ADMIN') {
    return apiError('Hanya Admin yang boleh menambah guru', 403);
  }

  const body = await req.json();
  const parsed = createGuruSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

  const { email, nip, nuptk, nama, password, role } = parsed.data;

  const emailDipakai = await prisma.user.findUnique({ where: { email } });
  if (emailDipakai) return apiError(`Email "${email}" sudah digunakan`, 409);

  if (nip) {
    const nipDipakai = await prisma.guru.findUnique({ where: { nip } });
    if (nipDipakai) return apiError(`NIP "${nip}" sudah digunakan`, 409);
  }

  // Kalau password tidak diisi admin, pakai NIP sebagai default.
  // Kalau NIP juga tidak ada, terpaksa tolak (butuh salah satu).
  const defaultPassword = password ?? nip;
  if (!defaultPassword) {
    return apiError('Isi password atau NIP untuk dijadikan password default', 422);
  }
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  const guru = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email, password: hashedPassword, role },
    });

    return tx.guru.create({
      data: { userId: user.id, nip, nuptk, nama },
    });
  });

  return apiSuccess(guru, 'Guru berhasil ditambahkan', 201);
}