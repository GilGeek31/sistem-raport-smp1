import { NextRequest } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

const siswaValidSchema = z.object({
  nama: z.string(),
  email: z.string().optional(),
  nisn: z.string(),
  nis: z.string().optional(),
  password: z.string().optional(),
  tempatLahir: z.string().optional(),
  tanggalLahir: z.string().optional(),
  agama: z.enum(['ISLAM', 'KRISTEN', 'KATOLIK', 'HINDU', 'BUDDHA', 'KONGHUCU', 'LAINNYA']).optional(),
  jenisKelamin: z.enum(['LAKI_LAKI', 'PEREMPUAN']).optional(),
  nik: z.string().optional(),
  statusDalamKeluarga: z.enum(['ANAK_KANDUNG', 'ANAK_ANGKAT', 'ANAK_TIRI']).optional(),
  anakKe: z.number().optional(),
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
  kelasId: z.number().optional(),
});

const commitSchema = z.object({
  siswaList: z.array(siswaValidSchema).min(1, 'Tidak ada data untuk disimpan'),
});

// POST /api/v1/siswas/import/commit
// Body: JSON { siswaList: [...data yang sudah lolos validasi di tahap preview...] }
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);
  if (session.user.role !== 'ADMIN') {
    return apiError('Hanya Admin yang boleh melakukan import', 403);
  }

  const body = await req.json();
  const parsed = commitSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

  const tahunAjaranAktif = await prisma.tahunAjaran.findFirst({ where: { isActive: true } });
  if (!tahunAjaranAktif) {
    return apiError('Belum ada tahun ajaran aktif', 422);
  }

  let berhasil = 0;
  let gagal = 0;
  const errorList: { nisn: string; pesan: string }[] = [];

  // Diproses satu-satu (bukan 1 transaction besar) SENGAJA — supaya kalau
  // 1 siswa gagal (misal race condition duplikat), siswa lain tetap
  // berhasil tersimpan, bukan semua ikut batal.
  for (const s of parsed.data.siswaList) {
    try {
      const { tanggalLahir, diterimaTanggal, kelasId, password, ...dataLain } = s;
      const hashedPassword = await bcrypt.hash(password ?? s.nisn, 10);

      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: { email: s.email, password: hashedPassword, role: 'SISWA' },
        });

        const siswa = await tx.siswa.create({
          data: {
            userId: user.id,
            ...dataLain,
            tanggalLahir: tanggalLahir ? new Date(tanggalLahir) : undefined,
            diterimaTanggal: diterimaTanggal ? new Date(diterimaTanggal) : undefined,
          },
        });

        if (kelasId) {
          await tx.riwayatKelas.create({
            data: { siswaId: siswa.id, kelasId, tahunAjaranId: tahunAjaranAktif.id },
          });
          await tx.kehadiranSiswa.create({
            data: { siswaId: siswa.id, tahunAjaranId: tahunAjaranAktif.id },
          });
        }
      });

      berhasil++;
    } catch (err) {
      gagal++;
      errorList.push({
        nisn: s.nisn,
        pesan: err instanceof Error ? err.message : 'Gagal menyimpan',
      });
    }
  }

  return apiSuccess(
    { berhasil, gagal, errorList },
    `${berhasil} siswa berhasil diimport${gagal > 0 ? `, ${gagal} gagal` : ''}`
  );
}