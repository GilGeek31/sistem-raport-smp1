# Daftar Endpoint API — Sistem Pengelolaan Nilai Raport SMP

Semua endpoint diawali `/api/v1/...`. Response konsisten: `{ success, data, message }`.

Kolom **Role** menunjukkan siapa saja yang boleh akses (selain Admin, yang defaultnya bisa akses semua — tidak dituliskan berulang kecuali jadi satu-satunya yang boleh).

## Autentikasi

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| POST | `/api/auth/callback/credentials` | Login (ditangani otomatis oleh Auth.js) | Semua |
| GET | `/api/auth/session` | Ambil data session yang sedang login | Semua |
| POST | `/api/auth/signout` | Logout | Semua |
| POST | `/api/v1/auth/mobile-login` | Login khusus mobile app, balikin access + refresh token JWT (terpisah dari session Auth.js berbasis cookie) | Semua |
| POST | `/api/v1/auth/refresh` | Tukar refresh token jadi access token baru (untuk mobile) | Semua |

## Master Data

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| GET | `/api/v1/mapels` | List semua mapel | Semua (read) |
| POST | `/api/v1/mapels` | Tambah mapel baru | Admin |
| PUT | `/api/v1/mapels/:id` | Edit mapel | Admin |
| DELETE | `/api/v1/mapels/:id` | Hapus mapel | Admin |
| GET | `/api/v1/gurus` | List semua guru | Admin, Kepala Sekolah |
| POST | `/api/v1/gurus` | Tambah guru (otomatis buat akun `User`) | Admin |
| PUT | `/api/v1/gurus/:id` | Edit data guru | Admin |
| DELETE | `/api/v1/gurus/:id` | Nonaktifkan/hapus guru (soft delete) | Admin |
| GET | `/api/v1/siswas` | List siswa (filter `?kelas_id=`) | Admin, Wali Kelas, Kepala Sekolah |
| POST | `/api/v1/siswas` | Tambah siswa (otomatis buat akun `User`) | Admin |
| PUT | `/api/v1/siswas/:id` | Edit data siswa | Admin |
| DELETE | `/api/v1/siswas/:id` | Nonaktifkan/hapus siswa (soft delete) | Admin |
| POST | `/api/v1/users/:id/foto` | Upload foto profil | Admin, pemilik akun sendiri |
| GET | `/api/v1/tahun-ajarans` | List tahun ajaran | Semua (read) |
| POST | `/api/v1/tahun-ajarans` | Tambah tahun ajaran/semester baru | Admin |
| PATCH | `/api/v1/tahun-ajarans/:id/activate` | Set sebagai tahun ajaran aktif (otomatis nonaktifkan yang lain) | Admin |
| GET | `/api/v1/kelas` | List kelas (filter `?tahun_ajaran_id=`) | Semua (read) |
| POST | `/api/v1/kelas` | Tambah kelas + tentukan wali kelas | Admin |
| PUT | `/api/v1/kelas/:id` | Edit kelas / ganti wali kelas | Admin |
| GET | `/api/v1/ekskuls` | List ekskul | Semua (read) |
| POST | `/api/v1/ekskuls` | Tambah ekskul | Admin |
| GET | `/api/v1/kokurikulers` | List kokurikuler | Semua (read) |
| POST | `/api/v1/kokurikulers` | Tambah kokurikuler | Admin |

## Akademik — Penugasan & Tujuan Pembelajaran

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| GET | `/api/v1/guru-mapels` | List penugasan guru-mapel-kelas | Admin |
| POST | `/api/v1/guru-mapels` | Tugaskan guru mengajar mapel di kelas tertentu | Admin |
| DELETE | `/api/v1/guru-mapels/:id` | Batalkan penugasan | Admin |
| GET | `/api/v1/guru-mapels/saya` | Lihat mapel & kelas yang saya ampu | Guru Mapel |
| GET | `/api/v1/tujuan-pembelajaran?guru_mapel_id=` | List TP untuk satu penugasan | Guru Mapel (pemilik), Admin |
| POST | `/api/v1/tujuan-pembelajaran` | Tambah TP baru (form dinamis, bisa banyak sekaligus) | Guru Mapel (pemilik) |
| PUT | `/api/v1/tujuan-pembelajaran/:id` | Edit TP | Guru Mapel (pemilik) |
| DELETE | `/api/v1/tujuan-pembelajaran/:id` | Hapus TP | Guru Mapel (pemilik) |

## Akademik — Nilai

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| GET | `/api/v1/nilai?kelas_id=&mapel_id=` | Tabel massal nilai semua siswa di kelas (termasuk nilai semester lalu, readonly) | Guru Mapel (pemilik), Wali Kelas, Admin |
| POST | `/api/v1/nilai/bulk` | Submit nilai + checklist TP untuk semua siswa sekaligus, generate deskripsi otomatis | Guru Mapel (pemilik) |
| PUT | `/api/v1/nilai/:id` | Edit nilai/deskripsi satu siswa secara manual | Guru Mapel (pemilik) |
| PATCH | `/api/v1/nilai/:id/finalize` | Kunci nilai (status final, tidak bisa diedit sembarangan lagi) | Guru Mapel (pemilik) |
| GET | `/api/v1/nilai/saya` | Lihat nilai sendiri (semua mapel) | Siswa |

## Pendukung Raport

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| GET | `/api/v1/nilai-ekskul?siswa_id=&tahun_ajaran_id=` | List nilai ekskul siswa | Admin, Wali Kelas, Siswa (milik sendiri) |
| POST | `/api/v1/nilai-ekskul` | Input nilai + deskripsi ekskul | Admin, Wali Kelas |
| GET | `/api/v1/nilai-kokurikuler?siswa_id=` | List deskripsi kokurikuler siswa | Koordinator Kokurikuler, Admin |
| POST | `/api/v1/nilai-kokurikuler` | Input deskripsi kokurikuler | Koordinator Kokurikuler |
| GET | `/api/v1/kehadiran?kelas_id=` | List rekap kehadiran satu kelas | Wali Kelas (kelas sendiri), Admin |
| PUT | `/api/v1/kehadiran/:id` | Update sakit/izin/tanpa keterangan per siswa | Wali Kelas (kelas sendiri) |
| POST | `/api/v1/tanda-tangan` | Upload TTD digital (wali kelas/kepala sekolah) | Admin |
| GET | `/api/v1/pengaturan-raport?tahun_ajaran_id=` | Lihat tanggal & tempat raport | Semua (read) |
| PUT | `/api/v1/pengaturan-raport/:id` | Set tanggal & tempat raport | Admin |
| GET/PUT | `/api/v1/users/saya/setting-cetak` | Ukuran kertas & margin cetak milik sendiri | Semua |

## Cetak Raport

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| GET | `/api/v1/raport/:siswa_id/preview` | Preview raport (data JSON lengkap, dipakai frontend sebelum cetak) | Wali Kelas (kelas sendiri), Admin, Siswa (diri sendiri) |
| GET | `/api/v1/raport/:siswa_id/pdf` | Generate & unduh raport PDF (via Puppeteer) | Wali Kelas (kelas sendiri), Admin, Siswa (diri sendiri) |
| GET | `/api/v1/raport/saya` | Siswa lihat/unduh raport sendiri | Siswa |

## Monitoring & Laporan

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| GET | `/api/v1/monitoring/progress-nilai?kelas_id=` | Progress input nilai (per kelas untuk wali kelas, semua kelas untuk admin) | Wali Kelas (kelas sendiri), Admin, Kepala Sekolah |
| GET | `/api/v1/monitoring/leger?kelas_id=` | Leger nilai satu kelas (semua mapel x semua siswa) | Wali Kelas (kelas sendiri), Admin, Kepala Sekolah |
| GET | `/api/v1/monitoring/grafik/:siswa_id` | Grafik perkembangan nilai siswa lintas semester | Wali Kelas, Admin, Kepala Sekolah, Siswa (diri sendiri) |

---

### Catatan implementasi

- **"Pemilik"** di kolom Role berarti perlu pengecekan tambahan di luar role saja — misal guru cuma boleh akses `tujuan-pembelajaran` dan `nilai` untuk `guru_mapel_id` miliknya sendiri (dicek lewat tabel `guru_mapels`), bukan cuma cek `role === GURU_MAPEL`. Ini yang di rencana awal kamu disebut "Policy class".
- Endpoint dengan **"read"** untuk banyak role biasanya boleh diakses semua role yang sudah login, karena datanya tidak sensitif (misal daftar mapel).
- `/api/v1/auth/mobile-login` dan `/api/v1/auth/refresh` baru dibutuhkan **saat app mobile mulai dikembangkan** — tidak perlu dibuat sekarang kalau fokusnya masih web.
