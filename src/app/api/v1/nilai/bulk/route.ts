import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { pastikanPemilikGuruMapel, generateDeskripsiOtomatis } from '@/lib/nilai-helpers';

const bulkNilaiSchema = z.object({
  guruMapelId: z.number().int(),
  nilaiSiswa: z
    .array(
      z.object({
        siswaId: z.number().int(),
        nilaiAkhir: z.number().min(0).max(100),
        // Checklist TP: satu siswa punya status TERCAPAI/TIDAK_TERCAPAI
        // untuk setiap TP yang ada di mapel ini.
        tpStatus: z.array(
          z.object({
            tpId: z.number().int(),
            status: z.enum(['TERCAPAI', 'TIDAK_TERCAPAI']),
          })
        ),
      })
    )
    .min(1, 'Minimal 1 data siswa'),
});

// POST /api/v1/nilai/bulk
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);

  const body = await req.json();
  const parsed = bulkNilaiSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

  const { guruMapelId, nilaiSiswa } = parsed.data;

  const { guruMapel, boleh } = await pastikanPemilikGuruMapel(
    Number(session.user.id),
    session.user.role,
    guruMapelId
  );
  if (!guruMapel) return apiError('Penugasan tidak ditemukan', 404);
  if (!boleh) {
    return apiError('Anda hanya boleh input nilai untuk mapel yang Anda ampu sendiri', 403);
  }

  // Ambil semua TP milik guru_mapel ini sekali di awal,
  // supaya tidak query berulang-ulang di dalam loop nanti.
  const semuaTp = await prisma.tujuanPembelajaran.findMany({
    where: { guruMapelId },
  });
  const tpMap = new Map(semuaTp.map((tp) => [tp.id, tp.deskripsi]));

  if (semuaTp.length === 0) {
    return apiError(
      'Belum ada Tujuan Pembelajaran untuk mapel ini. Tambahkan TP dulu sebelum input nilai.',
      422
    );
  }

  // Proses semua siswa dalam SATU transaction —
  // kalau di tengah jalan ada yang gagal, semua dibatalkan (tidak ada nilai setengah masuk).
  let hasil;
  try {
    hasil = await prisma.$transaction(async (tx) => {
      const semuaHasil = [];

      for (const item of nilaiSiswa) {
        // Cek apakah nilai untuk siswa ini sudah final sebelumnya — kalau iya, skip (tidak boleh dioverwrite lewat bulk)
        const nilaiSebelumnya = await tx.nilai.findUnique({
          where: { siswaId_guruMapelId: { siswaId: item.siswaId, guruMapelId } },
        });

        if (nilaiSebelumnya?.isFinal) {
          throw new Error(
            `Nilai siswa (id: ${item.siswaId}) sudah final dan tidak bisa diubah lewat input massal.`
          );
        }

        // Susun deskripsi TP untuk generate teks otomatis
        const tpListWithDeskripsi = item.tpStatus.map((t) => ({
          deskripsi: tpMap.get(t.tpId) ?? '(TP tidak ditemukan)',
          status: t.status,
        }));
        const deskripsiOtomatis = generateDeskripsiOtomatis(tpListWithDeskripsi);

        // Upsert: kalau nilai untuk siswa ini sudah ada, update. Kalau belum, buat baru.
        const nilai = await tx.nilai.upsert({
          where: { siswaId_guruMapelId: { siswaId: item.siswaId, guruMapelId } },
          create: {
            siswaId: item.siswaId,
            guruMapelId,
            nilaiAkhir: item.nilaiAkhir,
            deskripsi: deskripsiOtomatis,
          },
          update: {
            nilaiAkhir: item.nilaiAkhir,
            deskripsi: deskripsiOtomatis,
          },
        });

        // Hapus checklist TP yang lama punya nilai ini, ganti dengan yang baru dikirim
        // (lebih simpel daripada cek satu-satu mana yang berubah)
        await tx.nilaiTp.deleteMany({ where: { nilaiId: nilai.id } });
        await tx.nilaiTp.createMany({
          data: item.tpStatus.map((t) => ({
            nilaiId: nilai.id,
            tpId: t.tpId,
            status: t.status,
          })),
        });

        semuaHasil.push(nilai);
      }

      return semuaHasil;
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal menyimpan nilai';
    return apiError(message, 422);
  }

  return apiSuccess(hasil, `Nilai untuk ${hasil.length} siswa berhasil disimpan`);
}