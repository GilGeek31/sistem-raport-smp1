// Helper untuk kelas: mengubah tingkat (7/8/9) jadi angka romawi,
// dan membentuk nama kelas otomatis dari tingkat + rombel (misal: 7 + "A" -> "VII-A").

export const TINGKAT_VALID = [7, 8, 9] as const;
export const ROMBEL_VALID = ['A', 'B', 'C', 'D'] as const;

const ROMAWI_TINGKAT: Record<number, string> = {
  7: 'VII',
  8: 'VIII',
  9: 'IX',
};

export function tingkatKeRomawi(tingkat: number): string {
  const romawi = ROMAWI_TINGKAT[tingkat];
  if (!romawi) {
    throw new Error(`Tingkat "${tingkat}" tidak valid (harus 7, 8, atau 9)`);
  }
  return romawi;
}

export function buatNamaKelas(tingkat: number, rombel: string): string {
  return `${tingkatKeRomawi(tingkat)}-${rombel}`;
}