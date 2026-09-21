import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { bacaFileExcelGuru, validasiBarisGuru } from '@/lib/guru-import';

// POST /api/v1/gurus/import/preview
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

  let barisMentah;
  try {
    const buffer = await file.arrayBuffer();
    barisMentah = bacaFileExcelGuru(buffer);
  } catch {
    return apiError('Gagal membaca file. Pastikan formatnya .xlsx yang valid.', 422);
  }

  if (barisMentah.length === 0) {
    return apiError('File tidak berisi data (kosong)', 422);
  }

  // Ambil SEKALI semua email/NIP/NUPTK yang sudah ada di database.
  const [semuaUser, semuaGuru] = await Promise.all([
    prisma.user.findMany({ select: { email: true } }),
    prisma.guru.findMany({ select: { nip: true, nuptk: true } }),
  ]);
  const emailSudahAda = new Set(
    semuaUser.filter((u) => u.email).map((u) => (u.email as string).toLowerCase())
  );
  const nipSudahAda = new Set(semuaGuru.filter((g) => g.nip).map((g) => g.nip as string));
  const nuptkSudahAda = new Set(semuaGuru.filter((g) => g.nuptk).map((g) => g.nuptk as string));

  const emailDalamFile = new Set<string>();
  const nipDalamFile = new Set<string>();

  const hasil = [];
  for (let i = 0; i < barisMentah.length; i++) {
    const nomorBaris = i + 2; // +2 karena baris 1 di Excel adalah header
    const validasi = validasiBarisGuru(
      barisMentah[i],
      nomorBaris,
      emailSudahAda,
      nipSudahAda,
      nuptkSudahAda,
      emailDalamFile,
      nipDalamFile
    );

    if (validasi.status === 'valid' && validasi.data) {
      emailDalamFile.add(validasi.data.email as string);
      if (validasi.data.nip) nipDalamFile.add(validasi.data.nip as string);
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