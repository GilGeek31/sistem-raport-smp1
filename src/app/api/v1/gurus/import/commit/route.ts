import { NextRequest } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

const guruValidSchema = z.object({
  nama: z.string(),
  email: z.string(),
  nip: z.string().optional(),
  nuptk: z.string().optional(),
  password: z.string().optional(),
  role: z.enum(['GURU_MAPEL', 'WALI_KELAS', 'KOORDINATOR_KOKURIKULER']),
});

const commitSchema = z.object({
  guruList: z.array(guruValidSchema).min(1, 'Tidak ada data untuk disimpan'),
});

// POST /api/v1/gurus/import/commit
// Body: JSON { guruList: [...data yang sudah lolos validasi di tahap preview...] }
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);
  if (session.user.role !== 'ADMIN') {
    return apiError('Hanya Admin yang boleh melakukan import', 403);
  }

  const body = await req.json();
  const parsed = commitSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

  let berhasil = 0;
  let gagal = 0;
  const errorList: { email: string; pesan: string }[] = [];

  // Diproses satu-satu (bukan 1 transaction besar) SENGAJA — supaya kalau
  // 1 guru gagal (misal race condition duplikat), guru lain tetap
  // berhasil tersimpan, bukan semua ikut batal.
  for (const g of parsed.data.guruList) {
    try {
      const hashedPassword = await bcrypt.hash(g.password ?? g.nip ?? g.email, 10);

      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: { email: g.email, password: hashedPassword, role: g.role },
        });

        await tx.guru.create({
          data: { userId: user.id, nip: g.nip, nuptk: g.nuptk, nama: g.nama },
        });
      });

      berhasil++;
    } catch (err) {
      gagal++;
      errorList.push({
        email: g.email,
        pesan: err instanceof Error ? err.message : 'Gagal menyimpan',
      });
    }
  }

  return apiSuccess(
    { berhasil, gagal, errorList },
    `${berhasil} guru berhasil diimport${gagal > 0 ? `, ${gagal} gagal` : ''}`
  );
}