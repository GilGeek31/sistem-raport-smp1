import * as XLSX from 'xlsx';

// Urutan & nama kolom yang WAJIB ada di file Excel (harus persis sama).
export const KOLOM_TEMPLATE_GURU = ['nama', 'email', 'nip', 'nuptk', 'password', 'role'] as const;

const ROLE_VALID = ['GURU_MAPEL', 'WALI_KELAS', 'KOORDINATOR_KOKURIKULER'];

export type BarisMentahGuru = Record<string, string | number | undefined>;

export type HasilValidasiGuru = {
  baris: number; // nomor baris di Excel, untuk ditampilkan ke user
  status: 'valid' | 'error' | 'duplikat';
  pesan?: string;
  data?: Record<string, unknown>;
};

// Baca file Excel (dalam bentuk Buffer) jadi array baris mentah.
export function bacaFileExcelGuru(buffer: ArrayBuffer): BarisMentahGuru[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json<BarisMentahGuru>(sheet, { defval: '' });
}

// Validasi 1 baris data guru. DIPANGGIL SEKALI PER BARIS — query database
// yang berat sudah di-cache di luar (lihat pemakaiannya di route.ts).
export function validasiBarisGuru(
  raw: BarisMentahGuru,
  nomorBaris: number,
  emailSudahAda: Set<string>,
  nipSudahAda: Set<string>,
  nuptkSudahAda: Set<string>,
  emailDalamFile: Set<string>,
  nipDalamFile: Set<string>
): HasilValidasiGuru {
  const nama = String(raw.nama ?? '').trim();
  const email = String(raw.email ?? '').trim().toLowerCase();
  const nip = raw.nip ? String(raw.nip).trim() : undefined;
  const nuptk = raw.nuptk ? String(raw.nuptk).trim() : undefined;

  if (!nama || !email) {
    return { baris: nomorBaris, status: 'error', pesan: 'Kolom nama dan email wajib diisi' };
  }

  // Cek duplikat DI DALAM FILE ITU SENDIRI
  if (emailDalamFile.has(email) || (nip && nipDalamFile.has(nip))) {
    return { baris: nomorBaris, status: 'duplikat', pesan: 'Email/NIP duplikat di dalam file ini' };
  }

  // Cek duplikat DENGAN DATA YANG SUDAH ADA di database
  if (emailSudahAda.has(email)) {
    return { baris: nomorBaris, status: 'duplikat', pesan: `Email "${email}" sudah terdaftar` };
  }
  if (nip && nipSudahAda.has(nip)) {
    return { baris: nomorBaris, status: 'duplikat', pesan: `NIP "${nip}" sudah terdaftar` };
  }
  if (nuptk && nuptkSudahAda.has(nuptk)) {
    return { baris: nomorBaris, status: 'duplikat', pesan: `NUPTK "${nuptk}" sudah terdaftar` };
  }

  const role = raw.role ? String(raw.role).trim().toUpperCase() : 'GURU_MAPEL';
  if (!ROLE_VALID.includes(role)) {
    return {
      baris: nomorBaris,
      status: 'error',
      pesan: `Nilai role "${raw.role}" tidak valid (isi GURU_MAPEL, WALI_KELAS, atau KOORDINATOR_KOKURIKULER)`,
    };
  }

  return {
    baris: nomorBaris,
    status: 'valid',
    data: {
      nama,
      email,
      nip,
      nuptk,
      password: raw.password ? String(raw.password) : undefined,
      role,
    },
  };
}