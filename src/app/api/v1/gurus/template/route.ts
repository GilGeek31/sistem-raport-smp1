import * as XLSX from 'xlsx';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { apiError } from '@/lib/api-response';
import { KOLOM_TEMPLATE_GURU } from '@/lib/guru-import';

// GET /api/v1/gurus/template — download template Excel kosong (+ 1 baris contoh)
export async function GET() {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);
  if (session.user.role !== 'ADMIN') {
    return apiError('Hanya Admin yang boleh mengunduh template', 403);
  }

  const contoh: Record<string, string> = {
    nama: 'Contoh Nama Guru',
    email: 'contohguru@sekolah.sch.id',
    nip: '19850101xxxxxxxxx',
    nuptk: '',
    password: '',
    role: 'GURU_MAPEL',
  };

  const worksheet = XLSX.utils.json_to_sheet([contoh], { header: [...KOLOM_TEMPLATE_GURU] });
  worksheet['!cols'] = KOLOM_TEMPLATE_GURU.map(() => ({ wch: 20 }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Guru');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="template-import-guru.xlsx"',
    },
  });
}