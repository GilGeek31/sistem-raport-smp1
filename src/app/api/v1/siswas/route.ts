import { NextRequest } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

const createSiswaSchema = z.object({
  email: z.string().email('Email tidak valid').optional().or(z.literal('')),
  nisn: z.string().min(1, 'NISN wajib diisi'),
  nis: z.string().optional(),
  nama: z.string().min(1, 'Nama wajib diisi'),
  password: z.string().min(6).optional(),

  // Data kelahiran & identitas
  tempatLahir: z.string().optional(),
  tanggalLahir: z.string().optional(), // format "YYYY-MM-DD", dikonversi ke Date di bawah
  agama: z.enum(['ISLAM', 'KRISTEN', 'KATOLIK', 'HINDU', 'BUDDHA', 'KONGHUCU', 'LAINNYA']).optional(),
  jenisKelamin: z.enum(['LAKI_LAKI', 'PEREMPUAN']).optional(),
  nik: z.string().optional(),
  statusDalamKeluarga: z.enum(['ANAK_KANDUNG', 'ANAK_ANGKAT', 'ANAK_TIRI']).optional(),
  anakKe: z.number().int().optional(),

  // Alamat & kontak siswa
  alamatSiswa: z.string().optional(),
  noTeleponRumah: z.string().optional(),

  // Riwayat penerimaan
  sekolahAsal: z.string().optional(),
  diterimaKelas: z.string().optional(),
  diterimaTanggal: z.string().optional(),

  // Data orang tua
  namaAyah: z.string().optional(),
  namaIbu: z.string().optional(),
  alamatOrtu: z.string().optional(),
  noHpOrtu: z.string().optional(),
  pekerjaanAyah: z.string().optional(),
  pekerjaanIbu: z.string().optional(),

  // Data wali
  namaWali: z.string().optional(),
  alamatWali: z.string().optional(),
  noHpWali: z.string().optional(),
  pekerjaanWali: z.string().optional(),

  // Kelas tempat siswa ini ditempatkan SEKARANG (di tahun ajaran aktif).
  // Beda dengan `diterimaKelas` yang cuma catatan teks riwayat penerimaan.
  kelasId: z.number().int().optional(),
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
    include: {
      user: { select: { email: true, fotoProfil: true } },
      // Cukup ambil kelas di tahun ajaran yang sedang aktif, itu yang
      // relevan ditampilkan sebagai "kelas saat ini" di daftar siswa.
      riwayatKelas: {
        where: { tahunAjaran: { isActive: true } },
        include: { kelas: { select: { id: true, nama: true, tingkat: true, rombel: true } } },
      },
    },
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

  const {
    email: _emailMentah, nisn, nis, nama, password,
    tanggalLahir, diterimaTanggal, kelasId,
    ...biodataLain
  } = parsed.data;

  // Kalau email dikirim string kosong "", anggap sama dengan tidak diisi.
  // Siswa boleh login pakai NISN saja, jadi email memang opsional.
  const email = parsed.data.email && parsed.data.email !== '' ? parsed.data.email : undefined;

  if (email) {
    const emailDipakai = await prisma.user.findUnique({ where: { email } });
    if (emailDipakai) return apiError(`Email "${email}" sudah digunakan`, 409);
  }

  const nisnDipakai = await prisma.siswa.findUnique({ where: { nisn } });
  if (nisnDipakai) return apiError(`NISN "${nisn}" sudah digunakan`, 409);

  if (biodataLain.nik) {
    const nikDipakai = await prisma.siswa.findUnique({ where: { nik: biodataLain.nik } });
    if (nikDipakai) return apiError(`NIK "${biodataLain.nik}" sudah digunakan`, 409);
  }

  let tahunAjaranAktif = null;
  if (kelasId) {
    const kelas = await prisma.kelas.findUnique({ where: { id: kelasId } });
    if (!kelas) return apiError('Kelas yang dipilih tidak ditemukan', 404);

    tahunAjaranAktif = await prisma.tahunAjaran.findFirst({ where: { isActive: true } });
    if (!tahunAjaranAktif) {
      return apiError('Belum ada tahun ajaran aktif, tidak bisa menempatkan siswa ke kelas', 422);
    }
  }

  const hashedPassword = await bcrypt.hash(password ?? nisn, 10);

  // $transaction memastikan SEMUA operasi ini berhasil bersamaan,
  // atau GAGAL bersamaan (tidak ada User tanpa Siswa, atau sebaliknya).
  const siswa = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email, password: hashedPassword, role: 'SISWA' },
    });

    const siswaBaru = await tx.siswa.create({
      data: {
        userId: user.id,
        nisn,
        nis,
        nama,
        ...biodataLain,
        tanggalLahir: tanggalLahir ? new Date(tanggalLahir) : undefined,
        diterimaTanggal: diterimaTanggal ? new Date(diterimaTanggal) : undefined,
      },
    });

    if (kelasId && tahunAjaranAktif) {
      await tx.riwayatKelas.create({
        data: { siswaId: siswaBaru.id, kelasId, tahunAjaranId: tahunAjaranAktif.id },
      });
      await tx.kehadiranSiswa.create({
        data: { siswaId: siswaBaru.id, tahunAjaranId: tahunAjaranAktif.id },
      });
    }

    return siswaBaru;
  });

  return apiSuccess(siswa, 'Siswa berhasil ditambahkan', 201);
}