import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

const createTpSchema = z.object({
  guruMapelId: z.number().int(),
  // Terima banyak TP sekaligus dalam 1 request (sesuai kebutuhan "form dinamis")
  tps: z
    .array(
      z.object({
        deskripsi: z.string().min(1, 'Deskripsi TP tidak boleh kosong'),
      })
    )
    .min(1, 'Minimal 1 tujuan pembelajaran'),
});

// Helper: pastikan yang akses ini memang pemilik guru_mapel_id yang dimaksud
// (atau Admin, yang boleh akses semua).
async function pastikanPemilikGuruMapel(
  userId: number,
  role: string,
  guruMapelId: number
) {
  const guruMapel = await prisma.guruMapel.findUnique({
    where: { id: guruMapelId },
    include: { guru: true },
  });

  if (!guruMapel) return { guruMapel: null, boleh: false };
  if (role === 'ADMIN') return { guruMapel, boleh: true };

  const boleh = guruMapel.guru.userId === userId;
  return { guruMapel, boleh };
}

// GET /api/v1/tujuan-pembelajaran?guru_mapel_id=...
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);

  const guruMapelId = req.nextUrl.searchParams.get('guru_mapel_id');
  if (!guruMapelId) {
    return apiError('Parameter guru_mapel_id wajib diisi', 422);
  }

  const { guruMapel, boleh } = await pastikanPemilikGuruMapel(
    Number(session.user.id),
    session.user.role,
    Number(guruMapelId)
  );

  if (!guruMapel) return apiError('Penugasan tidak ditemukan', 404);
  if (!boleh) return apiError('Anda tidak punya akses ke data ini', 403);

  const tps = await prisma.tujuanPembelajaran.findMany({
    where: { guruMapelId: Number(guruMapelId) },
    orderBy: { urutan: 'asc' },
  });

  return apiSuccess(tps, 'Daftar tujuan pembelajaran berhasil diambil');
}

// POST /api/v1/tujuan-pembelajaran — tambah banyak TP sekaligus
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);

  const body = await req.json();
  const parsed = createTpSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

  const { guruMapelId, tps } = parsed.data;

  const { guruMapel, boleh } = await pastikanPemilikGuruMapel(
    Number(session.user.id),
    session.user.role,
    guruMapelId
  );

  if (!guruMapel) return apiError('Penugasan tidak ditemukan', 404);
  if (!boleh) {
    return apiError('Anda hanya boleh menambah TP untuk mapel yang Anda ampu sendiri', 403);
  }

  // Cari urutan terakhir yang sudah ada, supaya TP baru nyambung urutannya
  const tpTerakhir = await prisma.tujuanPembelajaran.findFirst({
    where: { guruMapelId },
    orderBy: { urutan: 'desc' },
  });
  let urutan = (tpTerakhir?.urutan ?? 0) + 1;

  const dataToInsert = tps.map((tp) => ({
    guruMapelId,
    deskripsi: tp.deskripsi,
    urutan: urutan++,
  }));

  await prisma.tujuanPembelajaran.createMany({ data: dataToInsert });

  const hasilAkhir = await prisma.tujuanPembelajaran.findMany({
    where: { guruMapelId },
    orderBy: { urutan: 'asc' },
  });

  return apiSuccess(hasilAkhir, `${tps.length} tujuan pembelajaran berhasil ditambahkan`, 201);
}