import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { bacaFileExcel, validasiBaris } from '@/lib/siswa-import';

// POST /api/v1/siswas/import/preview
// Body: multipart/form-data dengan field "file"
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);
  if (session.user.role !== 'ADMIN') {
    return apiError('Hanya Admin yang boleh melakukan import', 403);
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return apiError('File tidak ditemukan dalam request', 422);

  const tahunAjaranAktif = await prisma.tahunAjaran.findFirst({ where: { isActive: true } });
  if (!tahunAjaranAktif) {
    return apiError('Belum ada tahun ajaran aktif. Aktifkan dulu sebelum import.', 422);
  }

  let barisMentah;
  try {
    const buffer = await file.arrayBuffer();
    barisMentah = bacaFileExcel(buffer);
  } catch {
    return apiError('Gagal membaca file. Pastikan formatnya .xlsx yang valid.', 422);
  }

  if (barisMentah.length === 0) {
    return apiError('File tidak berisi data (kosong)', 422);
  }

  // Ambil SEKALI semua email/NISN/NIK yang sudah ada di database,
  // supaya tidak query berulang-ulang untuk tiap baris (lebih efisien).
  const [semuaUser, semuaSiswa] = await Promise.all([
    prisma.user.findMany({ select: { email: true } }),
    prisma.siswa.findMany({ select: { nisn: true, nik: true } }),
  ]);
  const emailSudahAda = new Set(
    semuaUser.filter((u) => u.email).map((u) => (u.email as string).toLowerCase())
  );
  const nisnSudahAda = new Set(semuaSiswa.map((s) => s.nisn));
  const nikSudahAda = new Set(semuaSiswa.filter((s) => s.nik).map((s) => s.nik as string));

  const emailDalamFile = new Set<string>();
  const nisnDalamFile = new Set<string>();

  const hasil = [];
  for (let i = 0; i < barisMentah.length; i++) {
    const nomorBaris = i + 2; // +2 karena baris 1 di Excel adalah header
    const validasi = await validasiBaris(
      barisMentah[i],
      nomorBaris,
      emailSudahAda,
      nisnSudahAda,
      nikSudahAda,
      emailDalamFile,
      nisnDalamFile,
      tahunAjaranAktif.id
    );

    if (validasi.status === 'valid' && validasi.data) {
      if (validasi.data.email) emailDalamFile.add(validasi.data.email as string);
      nisnDalamFile.add(validasi.data.nisn as string);
    }

    hasil.push(validasi);
  }

  const ringkasan = {
    total: hasil.length,
    valid: hasil.filter((h) => h.status === 'valid').length,
    error: hasil.filter((h) => h.status === 'error').length,
    duplikat: hasil.filter((h) => h.status === 'duplikat').length,
  };

  return apiSuccess({ ringkasan, hasil }, 'Validasi selesai');
}