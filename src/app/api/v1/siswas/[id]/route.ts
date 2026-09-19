import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

const updateSiswaSchema = z.object({
  nisn: z.string().min(1).optional(),
  nis: z.string().optional(),
  nama: z.string().min(1).optional(),

  tempatLahir: z.string().optional(),
  tanggalLahir: z.string().optional(),
  agama: z.enum(['ISLAM', 'KRISTEN', 'KATOLIK', 'HINDU', 'BUDDHA', 'KONGHUCU', 'LAINNYA']).optional(),
  jenisKelamin: z.enum(['LAKI_LAKI', 'PEREMPUAN']).optional(),
  nik: z.string().optional(),
  statusDalamKeluarga: z.enum(['ANAK_KANDUNG', 'ANAK_ANGKAT', 'ANAK_TIRI']).optional(),
  anakKe: z.number().int().optional(),

  alamatSiswa: z.string().optional(),
  noTeleponRumah: z.string().optional(),

  sekolahAsal: z.string().optional(),
  diterimaKelas: z.string().optional(),
  diterimaTanggal: z.string().optional(),

  namaAyah: z.string().optional(),
  namaIbu: z.string().optional(),
  alamatOrtu: z.string().optional(),
  noHpOrtu: z.string().optional(),
  pekerjaanAyah: z.string().optional(),
  pekerjaanIbu: z.string().optional(),

  namaWali: z.string().optional(),
  alamatWali: z.string().optional(),
  noHpWali: z.string().optional(),
  pekerjaanWali: z.string().optional(),
});

// PUT /api/v1/siswas/:id
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);
  if (session.user.role !== 'ADMIN') {
    return apiError('Hanya Admin yang boleh mengedit siswa', 403);
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSiswaSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

  const siswa = await prisma.siswa.findUnique({ where: { id: Number(id) } });
  if (!siswa) return apiError('Siswa tidak ditemukan', 404);

  const { tanggalLahir, diterimaTanggal, ...dataLain } = parsed.data;

  const updated = await prisma.siswa.update({
    where: { id: Number(id) },
    data: {
      ...dataLain,
      tanggalLahir: tanggalLahir ? new Date(tanggalLahir) : undefined,
      diterimaTanggal: diterimaTanggal ? new Date(diterimaTanggal) : undefined,
    },
  });

  return apiSuccess(updated, 'Data siswa berhasil diperbarui');
}

// DELETE /api/v1/siswas/:id — menghapus siswa SEKALIGUS akun User-nya
// (karena relasi Guru/Siswa -> User pakai onDelete: Cascade di schema,
// cukup hapus User-nya, Siswa ikut terhapus otomatis)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);
  if (session.user.role !== 'ADMIN') {
    return apiError('Hanya Admin yang boleh menghapus siswa', 403);
  }

  const { id } = await params;

  const siswa = await prisma.siswa.findUnique({ where: { id: Number(id) } });
  if (!siswa) return apiError('Siswa tidak ditemukan', 404);

  await prisma.user.delete({ where: { id: siswa.userId } });

  return apiSuccess(null, 'Siswa berhasil dihapus');
}