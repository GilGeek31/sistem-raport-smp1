import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient, Role, KategoriMapel, JenisKelamin, Rombel } from '../generated/prisma';
import bcrypt from 'bcryptjs';

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

// tingkat (7/8/9) + rombel (A/B/C/D) -> "VII-A", dst. Samakan dengan
// src/lib/kelas-helper.ts supaya format nama kelas konsisten di seluruh app.
function buatNamaKelas(tingkat: number, rombel: Rombel): string {
  const romawi: Record<number, string> = { 7: 'VII', 8: 'VIII', 9: 'IX' };
  return `${romawi[tingkat]}-${rombel}`;
}

async function main() {
  const password = await bcrypt.hash('password123', 10);

  // ===== TAHUN AJARAN =====
  const tahunAjaran = await prisma.tahunAjaran.create({
    data: { tahun: '2025/2026', semester: 1, isActive: true },
  });

  // ===== ADMIN =====
  await prisma.user.create({
    data: { email: 'admin@sekolah.sch.id', password, role: Role.ADMIN },
  });

  // ===== KEPALA SEKOLAH =====
  await prisma.user.create({
    data: { email: 'kepsek@sekolah.sch.id', password, role: Role.KEPALA_SEKOLAH },
  });

  // ===== KOORDINATOR KOKURIKULER =====
  await prisma.user.create({
    data: { email: 'koordinator@sekolah.sch.id', password, role: Role.KOORDINATOR_KOKURIKULER },
  });

  // ===== GURU (3 guru, salah satunya jadi wali kelas) =====
  const guru1User = await prisma.user.create({
    data: { email: 'budi.guru@sekolah.sch.id', password, role: Role.GURU_MAPEL },
  });
  const guru1 = await prisma.guru.create({
    data: { userId: guru1User.id, nip: '198501012010011001', nuptk: '1234567890123', nama: 'Budi Santoso, S.Pd' },
  });

  const guru2User = await prisma.user.create({
    data: { email: 'siti.guru@sekolah.sch.id', password, role: Role.GURU_MAPEL },
  });
  const guru2 = await prisma.guru.create({
    data: { userId: guru2User.id, nip: '198703152011012002', nuptk: '2234567890123', nama: 'Siti Aminah, S.Pd' },
  });

  const waliUser = await prisma.user.create({
    data: { email: 'wali.kelas@sekolah.sch.id', password, role: Role.WALI_KELAS },
  });
  const guruWali = await prisma.guru.create({
    data: { userId: waliUser.id, nip: '199001202012011003', nuptk: '3234567890123', nama: 'Andi Wijaya, S.Pd' },
  });

  // ===== MAPEL =====
  const matematika = await prisma.mapel.create({
    data: { kode: 'MTK', nama: 'Matematika', kategori: KategoriMapel.UMUM },
  });
  const bindo = await prisma.mapel.create({
    data: { kode: 'BIN', nama: 'Bahasa Indonesia', kategori: KategoriMapel.UMUM },
  });
  const ipa = await prisma.mapel.create({
    data: { kode: 'IPA', nama: 'Ilmu Pengetahuan Alam', kategori: KategoriMapel.UMUM },
  });

  // ===== KELAS =====
  // Kelas utama (VII-A) yang dipakai untuk sebagian besar data dummy di bawah,
  // plus beberapa kelas lain di tingkat berbeda sekadar supaya dropdown filter
  // kelas & fitur kenaikan kelas nanti ada beberapa pilihan untuk dicoba.
  const kelas7a = await prisma.kelas.create({
    data: {
      tahunAjaranId: tahunAjaran.id,
      waliKelasId: guruWali.id,
      tingkat: 7,
      rombel: Rombel.A,
      nama: buatNamaKelas(7, Rombel.A),
    },
  });
  await prisma.kelas.createMany({
    data: [
      { tahunAjaranId: tahunAjaran.id, tingkat: 7, rombel: Rombel.B, nama: buatNamaKelas(7, Rombel.B) },
      { tahunAjaranId: tahunAjaran.id, tingkat: 8, rombel: Rombel.A, nama: buatNamaKelas(8, Rombel.A) },
      { tahunAjaranId: tahunAjaran.id, tingkat: 9, rombel: Rombel.A, nama: buatNamaKelas(9, Rombel.A) },
    ],
  });

  // ===== GURU_MAPEL (penugasan mengajar) =====
  const guruMapelMtk = await prisma.guruMapel.create({
    data: { guruId: guru1.id, mapelId: matematika.id, kelasId: kelas7a.id },
  });
  const guruMapelIpa = await prisma.guruMapel.create({
    data: { guruId: guru2.id, mapelId: ipa.id, kelasId: kelas7a.id },
  });

  // ===== TUJUAN PEMBELAJARAN (contoh untuk Matematika) =====
  await prisma.tujuanPembelajaran.createMany({
    data: [
      { guruMapelId: guruMapelMtk.id, deskripsi: 'Memahami operasi bilangan bulat', urutan: 1 },
      { guruMapelId: guruMapelMtk.id, deskripsi: 'Menyelesaikan persamaan linear satu variabel', urutan: 2 },
      { guruMapelId: guruMapelMtk.id, deskripsi: 'Menerapkan konsep himpunan dalam masalah sehari-hari', urutan: 3 },
    ],
  });
  await prisma.tujuanPembelajaran.createMany({
    data: [
      { guruMapelId: guruMapelIpa.id, deskripsi: 'Memahami klasifikasi makhluk hidup', urutan: 1 },
      { guruMapelId: guruMapelIpa.id, deskripsi: 'Menjelaskan konsep energi dan perubahannya', urutan: 2 },
    ],
  });

  // ===== SISWA (5 siswa di kelas VII-A) =====
  const namaSiswa = [
    { nama: 'Ahmad Fauzi', nisn: '0051234561', jenisKelamin: JenisKelamin.LAKI_LAKI },
    { nama: 'Dewi Lestari', nisn: '0051234562', jenisKelamin: JenisKelamin.PEREMPUAN },
    { nama: 'Rizky Ramadhan', nisn: '0051234563', jenisKelamin: JenisKelamin.LAKI_LAKI },
    { nama: 'Putri Ayu', nisn: '0051234564', jenisKelamin: JenisKelamin.PEREMPUAN },
    { nama: 'Farhan Maulana', nisn: '0051234565', jenisKelamin: JenisKelamin.LAKI_LAKI },
  ];

  for (const [i, s] of namaSiswa.entries()) {
    const siswaUser = await prisma.user.create({
      data: { email: `siswa${i + 1}@sekolah.sch.id`, password, role: Role.SISWA },
    });
    const siswa = await prisma.siswa.create({
      data: {
        userId: siswaUser.id,
        nisn: s.nisn,
        nis: `2526${String(i + 1).padStart(4, '0')}`,
        nama: s.nama,
        jenisKelamin: s.jenisKelamin,
      },
    });
    await prisma.riwayatKelas.create({
      data: { siswaId: siswa.id, kelasId: kelas7a.id, tahunAjaranId: tahunAjaran.id },
    });
    await prisma.kehadiranSiswa.create({
      data: { siswaId: siswa.id, tahunAjaranId: tahunAjaran.id, sakit: 0, izin: 0, tanpaKeterangan: 0 },
    });
  }

  // ===== EKSKUL & KOKURIKULER =====
  await prisma.ekskul.createMany({
    data: [{ nama: 'Pramuka' }, { nama: 'Basket' }, { nama: 'Paduan Suara' }],
  });
  await prisma.kokurikuler.createMany({
    data: [{ nama: 'Proyek Profil Pelajar Pancasila - Gaya Hidup Berkelanjutan' }],
  });

  // ===== PENGATURAN RAPORT =====
  await prisma.pengaturanRaport.create({
    data: { tahunAjaranId: tahunAjaran.id, tanggal: new Date('2025-12-20'), tempat: 'Sumbawa Besar' },
  });

  console.log('✅ Seed selesai.');
  console.log('Kelas dibuat: VII-A (5 siswa + wali kelas), VII-B, VIII-A, IX-A (kosong).');
  console.log('Login dummy (semua password: password123):');
  console.log('- Admin: admin@sekolah.sch.id');
  console.log('- Kepala Sekolah: kepsek@sekolah.sch.id');
  console.log('- Koordinator Kokurikuler: koordinator@sekolah.sch.id');
  console.log('- Guru Mapel (Matematika): budi.guru@sekolah.sch.id / NIP 198501012010011001');
  console.log('- Guru Mapel (IPA): siti.guru@sekolah.sch.id / NIP 198703152011012002');
  console.log('- Wali Kelas VII-A: wali.kelas@sekolah.sch.id / NIP 199001202012011003');
  console.log('- Siswa: siswa1@sekolah.sch.id s/d siswa5@sekolah.sch.id / NISN 0051234561-65');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });