import { NextRequest } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

const createSiswaSchema = z.object({
  email: z.string().email('Email tidak valid'),
  nisn: z.string().min(1, 'NISN wajib diisi'),
  nis: z.string().optional(),
  nama: z.string().min(1, 'Nama wajib diisi'),
  // Kalau admin tidak isi password, kita pakai NISN sebagai password default
  // (siswa disarankan ganti setelah login pertama kali).
  password: z.string().min(6).optional(),
});

// GET /api/v1/siswas?kelas_id=... — list siswa, bisa difilter per kelas
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);

  const kelasId = req.nextUrl.searchParams.get('kelas_id');

  const siswas = await prisma.siswa.findMany({
    where: kelasId
      ? { riwayatKelas: { some: { kelasId: Number(kelasId) } } }
      : undefined,
    include: { user: { select: { email: true, fotoProfil: true } } },
    orderBy: { nama: 'asc' },
  });

  return apiSuccess(siswas, 'Daftar siswa berhasil diambil');
}

// POST /api/v1/siswas — tambah siswa baru, otomatis buat akun User terkait
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);
  if (session.user.role !== 'ADMIN') {
    return apiError('Hanya Admin yang boleh menambah siswa', 403);
  }

  const body = await req.json();
  const parsed = createSiswaSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 422);
  }

  const { email, nisn, nis, nama, password } = parsed.data;

  // Cek duplikat sebelum mulai transaction, supaya pesan errornya jelas
  const emailDipakai = await prisma.user.findUnique({ where: { email } });
  if (emailDipakai) return apiError(`Email "${email}" sudah digunakan`, 409);

  const nisnDipakai = await prisma.siswa.findUnique({ where: { nisn } });
  if (nisnDipakai) return apiError(`NISN "${nisn}" sudah digunakan`, 409);

  const hashedPassword = await bcrypt.hash(password ?? nisn, 10);

  // $transaction memastikan KEDUA operasi ini berhasil bersamaan,
  // atau GAGAL bersamaan (tidak ada User tanpa Siswa, atau sebaliknya).
  const siswa = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email, password: hashedPassword, role: 'SISWA' },
    });

    return tx.siswa.create({
      data: { userId: user.id, nisn, nis, nama },
    });
  });

  return apiSuccess(siswa, 'Siswa berhasil ditambahkan', 201);
}