import * as XLSX from 'xlsx';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { apiError } from '@/lib/api-response';
import { KOLOM_TEMPLATE } from '@/lib/siswa-import';

// GET /api/v1/siswas/template — download template Excel kosong (+ 1 baris contoh)
export async function GET() {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);
  if (session.user.role !== 'ADMIN') {
    return apiError('Hanya Admin yang boleh mengunduh template', 403);
  }

  const contoh: Record<string, string> = {
    nama: 'Contoh Nama Siswa',
    email: 'contoh@sekolah.sch.id',
    nisn: '0051234599',
    nis: '25260099',
    password: '',
    tempat_lahir: 'Sumbawa Besar',
    tanggal_lahir: '2012-05-14',
    jenis_kelamin: 'LAKI_LAKI',
    agama: 'ISLAM',
    nik: '5201xxxxxxxxxxxx',
    status_dalam_keluarga: 'ANAK_KANDUNG',
    anak_ke: '1',
    alamat_siswa: 'Jl. Contoh No. 1',
    no_telepon_rumah: '0371xxxxxx',
    sekolah_asal: 'SD Contoh 1',
    diterima_kelas: 'VII',
    diterima_tanggal: '2025-07-14',
    nama_ayah: 'Nama Ayah',
    nama_ibu: 'Nama Ibu',
    alamat_ortu: 'Jl. Contoh No. 1',
    no_hp_ortu: '08xxxxxxxxxx',
    pekerjaan_ayah: 'Wiraswasta',
    pekerjaan_ibu: 'Ibu Rumah Tangga',
    nama_wali: '',
    alamat_wali: '',
    no_hp_wali: '',
    pekerjaan_wali: '',
    kelas: 'VII-A',
  };

  const worksheet = XLSX.utils.json_to_sheet([contoh], { header: [...KOLOM_TEMPLATE] });
  worksheet['!cols'] = KOLOM_TEMPLATE.map(() => ({ wch: 18 }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Siswa');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="template-import-siswa.xlsx"',
    },
  });
}