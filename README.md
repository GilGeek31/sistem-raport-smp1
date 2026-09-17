================================================================

1. npx create-next-app@latest sistem-raport-smp
2. TypeScript = Yes, ESLint = Yes, Tailwind CSS = Yes, App Router = Yes, src/ directory = yes.
3. npm install prisma @prisma/client next-auth zod bcryptjs
4. npm install -D @types/bcryptjs

==================================================================

# Progres Proyek — Sistem Pengelolaan Nilai Raport SMP

Terakhir diperbarui berdasarkan progres pengembangan sejauh ini.

## Stack & Arsitektur

| Bagian           | Teknologi                                                                |
| ---------------- | ------------------------------------------------------------------------ |
| Framework        | Next.js 16.3.4 (App Router, struktur `src/`)                             |
| Database         | MySQL                                                                    |
| ORM              | Prisma 7 (dengan driver adapter `@prisma/adapter-mariadb`)               |
| Autentikasi      | Auth.js v5 (Credentials Provider, JWT, multi-identifier: email/NIP/NISN) |
| Validasi         | Zod                                                                      |
| Hashing password | bcryptjs                                                                 |
| Generate PDF     | Puppeteer                                                                |
| Proteksi halaman | `proxy.ts` (fitur Next.js 16, pengganti `middleware.ts`)                 |

## Struktur File Penting

```
src/
├── app/
│   ├── layout.tsx              — root layout, dibungkus <Providers>
│   ├── providers.tsx           — SessionProvider wrapper
│   ├── login/page.tsx          — halaman login
│   ├── dashboard/page.tsx      — halaman dashboard (contoh baca session)
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       └── v1/
│           ├── mapels/
│           ├── siswas/
│           ├── gurus/
│           ├── tahun-ajarans/
│           ├── kelas/
│           ├── ekskuls/
│           ├── kokurikulers/
│           ├── guru-mapels/
│           ├── tujuan-pembelajaran/
│           ├── nilai/
│           ├── nilai-ekskuls/
│           ├── nilai-kokurikulers/
│           ├── kehadiran/
│           ├── tanda-tangan/
│           ├── pengaturan-raport/
│           └── raport/[siswaId]/{preview,pdf}/
├── lib/
│   ├── prisma.ts
│   ├── auth.config.ts          — config ringan (tanpa Prisma), dipakai proxy.ts
│   ├── auth.ts                 — config lengkap (dengan Prisma), dipakai di server
│   ├── api-response.ts         — helper format response konsisten
│   ├── nilai-helpers.ts        — helper generate deskripsi otomatis & cek kepemilikan
│   └── raport-data.ts / raport-template.ts — pengumpul data & template HTML raport
├── proxy.ts                    — proteksi halaman (di root src/)
prisma/
├── schema.prisma                — 18 tabel + enum Role, StatusTP, KategoriMapel
└── seed.ts                      — data dummy testing
```

## ✅ Sudah Selesai

**Fondasi**

- [x] Setup Next.js + Prisma + MySQL
- [x] Skema database 18 tabel, migrasi berhasil
- [x] Seed data dummy (admin, guru, siswa, kelas, mapel dasar)
- [x] Autentikasi multi-identifier (email/NIP/NISN) + proteksi halaman berbasis role

**Endpoint API — Master Data**

- [x] `mapels` (CRUD)
- [x] `siswas` (CRUD, auto-create akun)
- [x] `gurus` (CRUD, auto-create akun, pilih role: guru mapel/wali kelas/koordinator)
- [x] `tahun-ajarans` (CRUD + endpoint aktivasi khusus)
- [x] `kelas` (CRUD)
- [x] `ekskuls`, `kokurikulers` (CRUD)

**Endpoint API — Akademik**

- [x] `guru-mapels` (penugasan mengajar + endpoint `/saya`)
- [x] `tujuan-pembelajaran` (CRUD, input banyak sekaligus, dengan pengecekan kepemilikan guru)
- [x] `nilai` — input massal (`/bulk`), tabel per kelas, edit manual, finalisasi (`isFinal`)

**Endpoint API — Pendukung Raport**

- [x] `nilai-ekskuls` (dengan filter per kelas untuk wali kelas)
- [x] `nilai-kokurikulers`
- [x] `kehadiran` (lihat + update per siswa)
- [x] `tanda-tangan` (khusus wali kelas & kepala sekolah)
- [x] `pengaturan-raport` (tanggal & tempat, per tahun ajaran)

**Cetak Raport**

- [x] `raport/:siswaId/preview` — data JSON lengkap
- [x] `raport/:siswaId/pdf` — generate PDF via Puppeteer

## 🔲 Belum Dikerjakan

- [ ] **Monitoring & Laporan** — progress input nilai per kelas, leger nilai, grafik perkembangan siswa lintas semester
- [ ] **Upload file sungguhan** — endpoint TTD & foto profil masih menerima teks (URL/path), belum ada endpoint upload file (`multipart/form-data`) yang sesungguhnya
- [ ] **Integrasi storage produksi** — keputusan Cloudflare R2/MinIO sempat dibahas di awal, belum diimplementasikan (masih asumsi lokal)
- [ ] **Endpoint unfinalize nilai** — nilai yang sudah `isFinal: true` belum ada cara "buka kunci" lagi (perlu endpoint khusus Admin kalau dibutuhkan)
- [ ] **JWT terpisah untuk mobile** (`/auth/mobile-login`, `/auth/refresh`) — didesain di awal, belum dibuat karena belum ada kebutuhan mobile app
- [ ] **Frontend/UI** — sejauh ini baru ada halaman `login` dan `dashboard` (versi debug sederhana). Semua fitur lain baru berupa API, belum ada tampilan penggunanya

## Catatan Teknis Penting

- **`lib/auth.config.ts` vs `lib/auth.ts`** — dipisah supaya `proxy.ts` tidak ikut membawa Prisma ke dalam bundle-nya (isu kompatibilitas Prisma 7 + `proxy.ts`)
- **Pola "kepemilikan"** (guru cuma boleh akses mapel/kelas yang dia ampu) dicek manual lewat helper function di tiap endpoint terkait — ini pengganti "Policy class" dari rencana awal berbasis Laravel
- **Nilai semester lalu (readonly)** di endpoint `GET /nilai` pakai pendekatan yang disederhanakan (cari tahun ajaran sebelumnya berdasarkan urutan `tahun`+`semester`) — mungkin perlu disempurnakan kalau ada kasus siswa pindah kelas antar semester
- **Password default** untuk siswa/guru baru: NISN/NIP masing-masing (kalau admin tidak isi manual)

## Rekomendasi Langkah Selanjutnya

1. Selesaikan endpoint **monitoring & leger** (sisa terakhir dari daftar API awal)
2. Mulai bangun **frontend** untuk fitur-fitur yang API-nya sudah siap — halaman input nilai massal kemungkinan paling prioritas karena itu jantung aplikasi
3. Pertimbangkan **upload file** (TTD, foto profil) kalau sudah waktunya
