import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

const nilaiEkskulSchema = z.object({
  siswaId: z.number().int(),
  ekskulId: z.number().int(),
  tahunAjaranId: z.number().int(),
  nilai: z.number().min(0).max(100).optional(),
  deskripsi: z.string().optional(),
});

// Cek apakah siswa ini ada di kelas yang wali-kelasnya adalah user yang login,
// untuk tahun ajaran yang dimaksud.
async function siswaAdaDiKelasWali(
  userId: number,
  siswaId: number,
  tahunAjaranId: number
) {
  const guru = await prisma.guru.findUnique({ where: { userId } });
  if (!guru) return false;

  const riwayat = await prisma.riwayatKelas.findFirst({
    where: {
      siswaId,
      tahunAjaranId,
      kelas: { waliKelasId: guru.id },
    },
  });

  return !!riwayat;
}

// GET /api/v1/nilai-ekskuls?siswa_id=&tahun_ajaran_id=&kelas_id=
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);

  const siswaId = req.nextUrl.searchParams.get('siswa_id');
  const tahunAjaranId = req.nextUrl.searchParams.get('tahun_ajaran_id');
  const kelasId = req.nextUrl.searchParams.get('kelas_id');

  // Siswa cuma boleh lihat data dirinya sendiri
  if (session.user.role === 'SISWA') {
    const siswa = await prisma.siswa.findUnique({
      where: { userId: Number(session.user.id) },
    });
    if (!siswa || String(siswa.id) !== siswaId) {
      return apiError('Anda hanya boleh melihat data ekskul milik sendiri', 403);
    }
  }

  // Wali kelas: kalau minta pakai kelas_id, pastikan itu kelas yang dia wali-i sendiri
  if (session.user.role === 'WALI_KELAS' && kelasId) {
    const guru = await prisma.guru.findUnique({
      where: { userId: Number(session.user.id) },
    });
    const kelas = await prisma.kelas.findUnique({ where: { id: Number(kelasId) } });
    if (!kelas || kelas.waliKelasId !== guru?.id) {
      return apiError('Anda hanya boleh melihat data kelas yang Anda wali-i', 403);
    }
  }

  const nilaiEkskuls = await prisma.nilaiEkskul.findMany({
    where: {
      siswaId: siswaId ? Number(siswaId) : undefined,
      tahunAjaranId: tahunAjaranId ? Number(tahunAjaranId) : undefined,
      // Filter lewat relasi: siswa yang punya riwayat di kelas_id tertentu
      siswa: kelasId
        ? { riwayatKelas: { some: { kelasId: Number(kelasId) } } }
        : undefined,
    },
    include: {
      ekskul: { select: { nama: true } },
      siswa: { select: { nama: true, nisn: true } },
    },
  });

  return apiSuccess(nilaiEkskuls, 'Data nilai ekskul berhasil diambil');
}

// POST /api/v1/nilai-ekskuls — Admin atau Wali Kelas (kelas sendiri)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);

  if (!['ADMIN', 'WALI_KELAS'].includes(session.user.role)) {
    return apiError('Hanya Admin atau Wali Kelas yang boleh input nilai ekskul', 403);
  }
  
  const body = await req.json();
  const parsed = nilaiEkskulSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

  const { siswaId, tahunAjaranId } = parsed.data;

  if (session.user.role === 'WALI_KELAS') {
    const boleh = await siswaAdaDiKelasWali(
      Number(session.user.id),
      siswaId,
      tahunAjaranId
    );
    if (!boleh) {
      return apiError('Siswa ini bukan bagian dari kelas yang Anda wali-i', 403);
    }
  }

  const nilaiEkskul = await prisma.nilaiEkskul.upsert({
    where: {
      siswaId_ekskulId_tahunAjaranId: {
        siswaId,
        ekskulId: parsed.data.ekskulId,
        tahunAjaranId,
      },
    },
    create: parsed.data,
    update: { nilai: parsed.data.nilai, deskripsi: parsed.data.deskripsi },
  });

  return apiSuccess(nilaiEkskul, 'Nilai ekskul berhasil disimpan', 201);
}