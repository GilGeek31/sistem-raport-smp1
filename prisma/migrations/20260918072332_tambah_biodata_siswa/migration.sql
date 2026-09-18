/*
  Warnings:

  - A unique constraint covering the columns `[nik]` on the table `siswas` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `siswas` ADD COLUMN `agama` ENUM('ISLAM', 'KRISTEN', 'KATOLIK', 'HINDU', 'BUDDHA', 'KONGHUCU', 'LAINNYA') NULL,
    ADD COLUMN `alamat_ortu` TEXT NULL,
    ADD COLUMN `alamat_siswa` TEXT NULL,
    ADD COLUMN `alamat_wali` TEXT NULL,
    ADD COLUMN `anak_ke` INTEGER NULL,
    ADD COLUMN `diterima_kelas` VARCHAR(191) NULL,
    ADD COLUMN `diterima_tanggal` DATETIME(3) NULL,
    ADD COLUMN `nama_ayah` VARCHAR(191) NULL,
    ADD COLUMN `nama_ibu` VARCHAR(191) NULL,
    ADD COLUMN `nama_wali` VARCHAR(191) NULL,
    ADD COLUMN `nik` VARCHAR(191) NULL,
    ADD COLUMN `no_hp_ortu` VARCHAR(191) NULL,
    ADD COLUMN `no_hp_wali` VARCHAR(191) NULL,
    ADD COLUMN `no_telepon_rumah` VARCHAR(191) NULL,
    ADD COLUMN `pekerjaan_ayah` VARCHAR(191) NULL,
    ADD COLUMN `pekerjaan_ibu` VARCHAR(191) NULL,
    ADD COLUMN `pekerjaan_wali` VARCHAR(191) NULL,
    ADD COLUMN `sekolah_asal` VARCHAR(191) NULL,
    ADD COLUMN `status_dalam_keluarga` ENUM('ANAK_KANDUNG', 'ANAK_ANGKAT', 'ANAK_TIRI') NULL,
    ADD COLUMN `tanggal_lahir` DATETIME(3) NULL,
    ADD COLUMN `tempat_lahir` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `siswas_nik_key` ON `siswas`(`nik`);
