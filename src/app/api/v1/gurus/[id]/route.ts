import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

const updateGuruSchema = z.object({
  nip: z.string().optional(),
  nuptk: z.string().optional(),
  nama: z.string().min(1).optional(),
  role: z.enum(['GURU_MAPEL', 'WALI_KELAS', 'KOORDINATOR_KOKURIKULER']).optional(),
});

// GET /api/v1/gurus/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);
  if (!['ADMIN', 'KEPALA_SEKOLAH'].includes(session.user.role)) {
    return apiError('Anda tidak punya akses ke data ini', 403);
  }

  const { id } = await params;
  const guru = await prisma.guru.findUnique({
    where: { id: Number(id) },
    include: { user: { select: { email: true, role: true } } },
  });
  if (!guru) return apiError('Guru tidak ditemukan', 404);

  return apiSuccess(guru, 'Detail guru berhasil diambil');
}

// PUT /api/v1/gurus/:id
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);
  if (session.user.role !== 'ADMIN') {
    return apiError('Hanya Admin yang boleh mengedit guru', 403);
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateGuruSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 422);

  const guru = await prisma.guru.findUnique({ where: { id: Number(id) } });
  if (!guru) return apiError('Guru tidak ditemukan', 404);

  const { role, ...dataGuru } = parsed.data;

  const updated = await prisma.$transaction(async (tx) => {
    if (role) {
      await tx.user.update({ where: { id: guru.userId }, data: { role } });
    }
    return tx.guru.update({ where: { id: Number(id) }, data: dataGuru });
  });

  return apiSuccess(updated, 'Data guru berhasil diperbarui');
}

// DELETE /api/v1/gurus/:id — sekaligus menghapus akun User-nya (cascade)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);
  if (session.user.role !== 'ADMIN') {
    return apiError('Hanya Admin yang boleh menghapus guru', 403);
  }

  const { id } = await params;

  const guru = await prisma.guru.findUnique({ where: { id: Number(id) } });
  if (!guru) return apiError('Guru tidak ditemukan', 404);

  // Cek dulu apakah guru ini masih jadi wali kelas aktif —
  // kalau iya, sebaiknya tolak dulu supaya tidak ada kelas tanpa wali
  // secara tiba-tiba (bisa disesuaikan nanti sesuai kebutuhan).
  const masihWaliKelas = await prisma.kelas.findFirst({
    where: { waliKelasId: Number(id) },
  });
  if (masihWaliKelas) {
    return apiError(
      `Guru ini masih menjadi wali kelas "${masihWaliKelas.nama}". Ganti wali kelasnya dulu sebelum menghapus.`,
      409
    );
  }

  // Sama seperti pengecekan wali kelas di atas — kalau guru ini masih
  // ditugaskan mengajar mapel tertentu (ada relasi ke Nilai/TP juga),
  // tolak dulu supaya tidak ada data nilai yang jadi yatim tiba-tiba.
  const masihMengajar = await prisma.guruMapel.findFirst({
    where: { guruId: Number(id) },
    include: { mapel: { select: { nama: true } }, kelas: { select: { nama: true } } },
  });
  if (masihMengajar) {
    return apiError(
      `Guru ini masih ditugaskan mengajar "${masihMengajar.mapel.nama}" di kelas "${masihMengajar.kelas.nama}". Hapus/ganti penugasan itu dulu di menu Penugasan mengajar sebelum menghapus guru.`,
      409
    );
  }

  try {
    await prisma.user.delete({ where: { id: guru.userId } });
  } catch (err) {
    console.error('Gagal menghapus guru:', err);
    return apiError(
      'Gagal menghapus guru. Kemungkinan masih ada data lain yang terkait dengan guru ini.',
      409
    );
  }

  return apiSuccess(null, 'Guru berhasil dihapus');
}