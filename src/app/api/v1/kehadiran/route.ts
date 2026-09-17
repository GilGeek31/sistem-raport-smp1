import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

// GET /api/v1/kehadiran?kelas_id=...
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);

  const kelasId = req.nextUrl.searchParams.get('kelas_id');
  if (!kelasId) return apiError('Parameter kelas_id wajib diisi', 422);

  const kelas = await prisma.kelas.findUnique({ where: { id: Number(kelasId) } });
  if (!kelas) return apiError('Kelas tidak ditemukan', 404);

  // Wali kelas cuma boleh lihat kelas yang dia wali-i sendiri
  if (session.user.role === 'WALI_KELAS') {
    const guru = await prisma.guru.findUnique({
      where: { userId: Number(session.user.id) },
    });
    if (!guru || kelas.waliKelasId !== guru.id) {
      return apiError('Anda hanya boleh melihat kehadiran kelas yang Anda wali-i', 403);
    }
  }

  const riwayatKelas = await prisma.riwayatKelas.findMany({
    where: { kelasId: Number(kelasId) },
    include: {
      siswa: {
        include: {
          kehadiranSiswas: {
            where: { tahunAjaranId: kelas.tahunAjaranId },
          },
        },
      },
    },
  });

  const hasil = riwayatKelas.map((rk) => ({
    siswaId: rk.siswa.id,
    nama: rk.siswa.nama,
    kehadiranId: rk.siswa.kehadiranSiswas[0]?.id ?? null,
    sakit: rk.siswa.kehadiranSiswas[0]?.sakit ?? 0,
    izin: rk.siswa.kehadiranSiswas[0]?.izin ?? 0,
    tanpaKeterangan: rk.siswa.kehadiranSiswas[0]?.tanpaKeterangan ?? 0,
  }));

  return apiSuccess(hasil, 'Rekap kehadiran berhasil diambil');
}