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

  // Kelas tempat siswa ini ditempatkan SEKARANG (di tahun ajaran aktif).
  kelasId: z.number().int().optional(),
});

// GET /api/v1/siswas/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);

  const { id } = await params;
  const siswa = await prisma.siswa.findUnique({
    where: { id: Number(id) },
    include: {
      user: { select: { email: true } },
      riwayatKelas: {
        where: { tahunAjaran: { isActive: true } },
        include: { kelas: { select: { id: true, nama: true } } },
      },
    },
  });
  if (!siswa) return apiError('Siswa tidak ditemukan', 404);

  return apiSuccess(siswa, 'Detail siswa berhasil diambil');
}

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

  const { tanggalLahir, diterimaTanggal, kelasId, ...dataLain } = parsed.data;

  if (kelasId) {
    const kelas = await prisma.kelas.findUnique({ where: { id: kelasId } });
    if (!kelas) return apiError('Kelas yang dipilih tidak ditemukan', 404);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const siswaTerbaru = await tx.siswa.update({
      where: { id: Number(id) },
      data: {
        ...dataLain,
        tanggalLahir: tanggalLahir ? new Date(tanggalLahir) : undefined,
        diterimaTanggal: diterimaTanggal ? new Date(diterimaTanggal) : undefined,
      },
    });

    if (kelasId) {
      const tahunAjaranAktif = await tx.tahunAjaran.findFirst({ where: { isActive: true } });
      if (!tahunAjaranAktif) {
        throw new Error('Belum ada tahun ajaran aktif, tidak bisa memindahkan siswa ke kelas');
      }

      // Upsert: kalau siswa ini SUDAH punya riwayat kelas di tahun ajaran
      // aktif, cukup ganti kelasnya. Kalau belum, buat baru.
      await tx.riwayatKelas.upsert({
        where: {
          siswaId_tahunAjaranId: { siswaId: siswaTerbaru.id, tahunAjaranId: tahunAjaranAktif.id },
        },
        update: { kelasId },
        create: { siswaId: siswaTerbaru.id, kelasId, tahunAjaranId: tahunAjaranAktif.id },
      });

      // Pastikan siswa ini juga sudah punya baris kehadiran di tahun ajaran
      // aktif (kalau sebelumnya belum, misalnya baru pertama kali ditempatkan).
      await tx.kehadiranSiswa.upsert({
        where: {
          siswaId_tahunAjaranId: { siswaId: siswaTerbaru.id, tahunAjaranId: tahunAjaranAktif.id },
        },
        update: {},
        create: { siswaId: siswaTerbaru.id, tahunAjaranId: tahunAjaranAktif.id },
      });
    }

    return siswaTerbaru;
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

  try {
    // Hapus User-nya: karena semua relasi Siswa (kelas, nilai, kehadiran, dst)
    // sudah diset onDelete: Cascade di schema, ini otomatis membersihkan
    // seluruh data terkait siswa ini juga.
    await prisma.user.delete({ where: { id: siswa.userId } });
  } catch (err) {
    // Jaga-jaga kalau suatu saat ada relasi baru yang belum di-cascade —
    // selalu balas JSON yang jelas, jangan sampai request crash tanpa body.
    console.error('Gagal menghapus siswa:', err);
    return apiError(
      'Gagal menghapus siswa. Kemungkinan masih ada data lain yang terkait dengan siswa ini.',
      409
    );
  }

  return apiSuccess(null, 'Siswa berhasil dihapus');
}