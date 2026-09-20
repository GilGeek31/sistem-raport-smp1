-- 1. Tambah kolom dulu sebagai NULLABLE (supaya baris lama tidak bikin error)
ALTER TABLE `kelas` ADD COLUMN `tingkat` INTEGER NULL;
ALTER TABLE `kelas` ADD COLUMN `rombel` ENUM('A', 'B', 'C', 'D') NULL;

-- 2. Isi otomatis untuk baris yang SUDAH ADA, berdasarkan kolom `nama` yang formatnya "VII-A", "VIII-B", dst.
UPDATE `kelas`
SET
  `tingkat` = CASE
    WHEN `nama` LIKE 'VII-%'  THEN 7
    WHEN `nama` LIKE 'VIII-%' THEN 8
    WHEN `nama` LIKE 'IX-%'   THEN 9
    ELSE NULL
  END,
  `rombel` = SUBSTRING_INDEX(`nama`, '-', -1)
WHERE `tingkat` IS NULL OR `rombel` IS NULL;

-- 3. Kalau ada baris yang polanya tidak cocok (nama tidak ikut format "TINGKAT-ROMBEL"),
--    query di atas akan menyisakan NULL. Cek dulu dengan:
--    SELECT id, nama, tingkat, rombel FROM kelas WHERE tingkat IS NULL OR rombel IS NULL;
--    Kalau ada, isi manual baris itu sebelum lanjut ke langkah 4, misalnya:
--    UPDATE kelas SET tingkat = 7, rombel = 'A' WHERE id = 1;

-- 4. Baru kunci jadi NOT NULL setelah semua baris terisi
ALTER TABLE `kelas` MODIFY COLUMN `tingkat` INTEGER NOT NULL;
ALTER TABLE `kelas` MODIFY COLUMN `rombel` ENUM('A', 'B', 'C', 'D') NOT NULL;

-- 5. Tambah unique index tahun_ajaran_id + tingkat + rombel
CREATE UNIQUE INDEX `kelas_tahun_ajaran_id_tingkat_rombel_key` ON `kelas`(`tahun_ajaran_id`, `tingkat`, `rombel`);