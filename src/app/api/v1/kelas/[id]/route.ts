import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { buatNamaKelas, TINGKAT_VALID, ROMBEL_VALID } from '@/lib/kelas-helper';

const updateKelasSchema = z.object({
  tingkat: z
    .number()
    .int()
    .refine((v) => (TINGKAT_VALID as readonly number[]).includes(v), {
      message: 'Tingkat harus 7, 8, atau 9',
    })
    .optional(),
  rombel: z.enum(ROMBEL_VALID, { message: 'Rombel harus A, B, C, atau D' }).optional(),
  waliKelasId: z.number().int().nullable().optional(),
});

// PUT /api/v1/kelas/:id — hanya Admin
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);
  if (session.user.role !== 'ADMIN') {
    return apiError('Hanya Admin yang boleh mengedit kelas', 403);
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateKelasSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

  const kelas = await prisma.kelas.findUnique({ where: { id: Number(id) } });
  if (!kelas) return apiError('Kelas tidak ditemukan', 404);

  if (parsed.data.waliKelasId) {
    const guru = await prisma.guru.findUnique({
      where: { id: parsed.data.waliKelasId },
    });
    if (!guru) return apiError('Guru (calon wali kelas) tidak ditemukan', 404);
  }

  // Kalau tingkat atau rombel diubah, hitung ulang kombinasi + nama-nya,
  // dan cek dulu tidak bentrok dengan kelas lain di tahun ajaran yang sama.
  const tingkatBaru = parsed.data.tingkat ?? kelas.tingkat;
  const rombelBaru = parsed.data.rombel ?? kelas.rombel;
  const adaPerubahanTingkatRombel =
    parsed.data.tingkat !== undefined || parsed.data.rombel !== undefined;

  let dataUpdate: {
    waliKelasId?: number | null;
    tingkat?: number;
    rombel?: typeof rombelBaru;
    nama?: string;
  } = { waliKelasId: parsed.data.waliKelasId };

  if (adaPerubahanTingkatRombel) {
    const bentrok = await prisma.kelas.findUnique({
      where: {
        tahunAjaranId_tingkat_rombel: {
          tahunAjaranId: kelas.tahunAjaranId,
          tingkat: tingkatBaru,
          rombel: rombelBaru,
        },
      },
    });
    if (bentrok && bentrok.id !== kelas.id) {
      return apiError(
        `Kelas "${buatNamaKelas(tingkatBaru, rombelBaru)}" sudah ada di tahun ajaran ini`,
        409
      );
    }

    dataUpdate = {
      ...dataUpdate,
      tingkat: tingkatBaru,
      rombel: rombelBaru,
      nama: buatNamaKelas(tingkatBaru, rombelBaru),
    };
  }

  const updated = await prisma.kelas.update({
    where: { id: Number(id) },
    data: dataUpdate,
  });

  return apiSuccess(updated, 'Kelas berhasil diperbarui');
}