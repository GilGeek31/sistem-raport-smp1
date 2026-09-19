import * as XLSX from 'xlsx';
import { prisma } from './prisma';

// Urutan & nama kolom yang WAJIB ada di file Excel (harus persis sama).
export const KOLOM_TEMPLATE = [
  'nama', 'email', 'nisn', 'nis', 'password',
  'tempat_lahir', 'tanggal_lahir', 'jenis_kelamin', 'agama', 'nik', 'status_dalam_keluarga', 'anak_ke',
  'alamat_siswa', 'no_telepon_rumah',
  'sekolah_asal', 'diterima_kelas', 'diterima_tanggal',
  'nama_ayah', 'nama_ibu', 'alamat_ortu', 'no_hp_ortu', 'pekerjaan_ayah', 'pekerjaan_ibu',
  'nama_wali', 'alamat_wali', 'no_hp_wali', 'pekerjaan_wali',
  'kelas',
] as const;

const AGAMA_VALID = ['ISLAM', 'KRISTEN', 'KATOLIK', 'HINDU', 'BUDDHA', 'KONGHUCU', 'LAINNYA'];
const STATUS_KELUARGA_VALID = ['ANAK_KANDUNG', 'ANAK_ANGKAT', 'ANAK_TIRI'];
const JENIS_KELAMIN_VALID = ['LAKI_LAKI', 'PEREMPUAN'];

export type BarisMentah = Record<string, string | number | undefined>;

export type HasilValidasi = {
  baris: number; // nomor baris di Excel, untuk ditampilkan ke user
  status: 'valid' | 'error' | 'duplikat';
  pesan?: string;
  data?: Record<string, unknown>; // data yang sudah bersih, siap disimpan (kalau valid)
};

// Baca file Excel (dalam bentuk Buffer) jadi array baris mentah.
export function bacaFileExcel(buffer: ArrayBuffer): BarisMentah[] {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json<BarisMentah>(sheet, { defval: '' });
}

// Ubah nilai tanggal dari Excel (bisa berupa Date object atau string) jadi "YYYY-MM-DD".
function normalisasiTanggal(nilai: unknown): string | undefined {
  if (!nilai) return undefined;
  if (nilai instanceof Date) return nilai.toISOString().slice(0, 10);
  const parsed = new Date(String(nilai));
  if (isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString().slice(0, 10);
}

// Validasi 1 baris data. Ini DIPANGGIL SEKALI PER BARIS, jadi query database
// yang berat sebaiknya sudah di-cache di luar (lihat pemakaiannya di route.ts).
export async function validasiBaris(
  raw: BarisMentah,
  nomorBaris: number,
  emailSudahAda: Set<string>,
  nisnSudahAda: Set<string>,
  nikSudahAda: Set<string>,
  emailDalamFile: Set<string>,
  nisnDalamFile: Set<string>,
  tahunAjaranAktifId: number
): Promise<HasilValidasi> {
  const nama = String(raw.nama ?? '').trim();
  const emailMentah = String(raw.email ?? '').trim().toLowerCase();
  const email = emailMentah === '' ? undefined : emailMentah;
  const nisn = String(raw.nisn ?? '').trim();

  if (!nama || !nisn) {
    return { baris: nomorBaris, status: 'error', pesan: 'Kolom nama dan nisn wajib diisi' };
  }

  // Cek duplikat DI DALAM FILE ITU SENDIRI (misal 2 baris pakai email yang sama)
  if ((email && emailDalamFile.has(email)) || nisnDalamFile.has(nisn)) {
    return { baris: nomorBaris, status: 'duplikat', pesan: 'Email/NISN duplikat di dalam file ini' };
  }

  // Cek duplikat DENGAN DATA YANG SUDAH ADA di database
  if (email && emailSudahAda.has(email)) {
    return { baris: nomorBaris, status: 'duplikat', pesan: `Email "${email}" sudah terdaftar` };
  }
  if (nisnSudahAda.has(nisn)) {
    return { baris: nomorBaris, status: 'duplikat', pesan: `NISN "${nisn}" sudah terdaftar` };
  }

  const nik = raw.nik ? String(raw.nik).trim() : undefined;
  if (nik && nikSudahAda.has(nik)) {
    return { baris: nomorBaris, status: 'duplikat', pesan: `NIK "${nik}" sudah terdaftar` };
  }

  const agama = raw.agama ? String(raw.agama).trim().toUpperCase() : undefined;
  if (agama && !AGAMA_VALID.includes(agama)) {
    return { baris: nomorBaris, status: 'error', pesan: `Nilai agama "${raw.agama}" tidak valid` };
  }

  const jenisKelamin = raw.jenis_kelamin ? String(raw.jenis_kelamin).trim().toUpperCase() : undefined;
  if (jenisKelamin && !JENIS_KELAMIN_VALID.includes(jenisKelamin)) {
    return {
      baris: nomorBaris,
      status: 'error',
      pesan: `Nilai jenis_kelamin "${raw.jenis_kelamin}" tidak valid (isi LAKI_LAKI atau PEREMPUAN)`,
    };
  }

  const statusKeluarga = raw.status_dalam_keluarga
    ? String(raw.status_dalam_keluarga).trim().toUpperCase()
    : undefined;
  if (statusKeluarga && !STATUS_KELUARGA_VALID.includes(statusKeluarga)) {
    return {
      baris: nomorBaris,
      status: 'error',
      pesan: `Nilai status_dalam_keluarga "${raw.status_dalam_keluarga}" tidak valid`,
    };
  }

  // Cek nama kelas cocok dengan kelas yang ada di tahun ajaran aktif
  let kelasId: number | undefined;
  const namaKelas = raw.kelas ? String(raw.kelas).trim() : undefined;
  if (namaKelas) {
    const kelas = await prisma.kelas.findUnique({
      where: { tahunAjaranId_nama: { tahunAjaranId: tahunAjaranAktifId, nama: namaKelas } },
    });
    if (!kelas) {
      return {
        baris: nomorBaris,
        status: 'error',
        pesan: `Kelas "${namaKelas}" tidak ditemukan di tahun ajaran aktif`,
      };
    }
    kelasId = kelas.id;
  }

  return {
    baris: nomorBaris,
    status: 'valid',
    data: {
      nama,
      email,
      nisn,
      nis: raw.nis ? String(raw.nis).trim() : undefined,
      password: raw.password ? String(raw.password) : undefined,
      tempatLahir: raw.tempat_lahir ? String(raw.tempat_lahir).trim() : undefined,
      tanggalLahir: normalisasiTanggal(raw.tanggal_lahir),
      agama,
      jenisKelamin,
      nik,
      statusDalamKeluarga: statusKeluarga,
      anakKe: raw.anak_ke ? Number(raw.anak_ke) : undefined,
      alamatSiswa: raw.alamat_siswa ? String(raw.alamat_siswa).trim() : undefined,
      noTeleponRumah: raw.no_telepon_rumah ? String(raw.no_telepon_rumah).trim() : undefined,
      sekolahAsal: raw.sekolah_asal ? String(raw.sekolah_asal).trim() : undefined,
      diterimaKelas: raw.diterima_kelas ? String(raw.diterima_kelas).trim() : undefined,
      diterimaTanggal: normalisasiTanggal(raw.diterima_tanggal),
      namaAyah: raw.nama_ayah ? String(raw.nama_ayah).trim() : undefined,
      namaIbu: raw.nama_ibu ? String(raw.nama_ibu).trim() : undefined,
      alamatOrtu: raw.alamat_ortu ? String(raw.alamat_ortu).trim() : undefined,
      noHpOrtu: raw.no_hp_ortu ? String(raw.no_hp_ortu).trim() : undefined,
      pekerjaanAyah: raw.pekerjaan_ayah ? String(raw.pekerjaan_ayah).trim() : undefined,
      pekerjaanIbu: raw.pekerjaan_ibu ? String(raw.pekerjaan_ibu).trim() : undefined,
      namaWali: raw.nama_wali ? String(raw.nama_wali).trim() : undefined,
      alamatWali: raw.alamat_wali ? String(raw.alamat_wali).trim() : undefined,
      noHpWali: raw.no_hp_wali ? String(raw.no_hp_wali).trim() : undefined,
      pekerjaanWali: raw.pekerjaan_wali ? String(raw.pekerjaan_wali).trim() : undefined,
      kelasId,
    },
  };
}