import { prisma } from './prisma';

// Sama seperti helper di tujuan-pembelajaran, tapi ditaruh di sini
// supaya bisa dipakai ulang oleh semua endpoint terkait nilai.
export async function pastikanPemilikGuruMapel(
  userId: number,
  role: string,
  guruMapelId: number
) {
  const guruMapel = await prisma.guruMapel.findUnique({
    where: { id: guruMapelId },
    include: { guru: true, kelas: true, mapel: true },
  });

  if (!guruMapel) return { guruMapel: null, boleh: false };
  if (role === 'ADMIN') return { guruMapel, boleh: true };

  const boleh = guruMapel.guru.userId === userId;
  return { guruMapel, boleh };
}

// Ini yang generate deskripsi otomatis berdasarkan checklist TP.
// Contoh hasil:
// "Ananda telah mencapai: Memahami operasi bilangan bulat, Menyelesaikan
// persamaan linear. Perlu ditingkatkan: Menerapkan konsep himpunan."
export function generateDeskripsiOtomatis(
  tpList: { deskripsi: string; status: 'TERCAPAI' | 'TIDAK_TERCAPAI' }[]
): string {
  const tercapai = tpList
    .filter((tp) => tp.status === 'TERCAPAI')
    .map((tp) => tp.deskripsi);

  const tidakTercapai = tpList
    .filter((tp) => tp.status === 'TIDAK_TERCAPAI')
    .map((tp) => tp.deskripsi);

  const bagian: string[] = [];

  if (tercapai.length > 0) {
    bagian.push(`Ananda telah mencapai: ${tercapai.join(', ')}.`);
  }
  if (tidakTercapai.length > 0) {
    bagian.push(`Perlu ditingkatkan: ${tidakTercapai.join(', ')}.`);
  }

  return bagian.join(' ');
}