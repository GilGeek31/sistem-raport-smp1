-- DropForeignKey
ALTER TABLE `kehadiran_siswas` DROP FOREIGN KEY `kehadiran_siswas_siswa_id_fkey`;

-- DropForeignKey
ALTER TABLE `nilai_ekskuls` DROP FOREIGN KEY `nilai_ekskuls_siswa_id_fkey`;

-- DropForeignKey
ALTER TABLE `nilai_kokurikulers` DROP FOREIGN KEY `nilai_kokurikulers_siswa_id_fkey`;

-- DropForeignKey
ALTER TABLE `nilais` DROP FOREIGN KEY `nilais_siswa_id_fkey`;

-- DropForeignKey
ALTER TABLE `riwayat_kelas` DROP FOREIGN KEY `riwayat_kelas_siswa_id_fkey`;

-- AddForeignKey
ALTER TABLE `riwayat_kelas` ADD CONSTRAINT `riwayat_kelas_siswa_id_fkey` FOREIGN KEY (`siswa_id`) REFERENCES `siswas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nilais` ADD CONSTRAINT `nilais_siswa_id_fkey` FOREIGN KEY (`siswa_id`) REFERENCES `siswas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nilai_ekskuls` ADD CONSTRAINT `nilai_ekskuls_siswa_id_fkey` FOREIGN KEY (`siswa_id`) REFERENCES `siswas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nilai_kokurikulers` ADD CONSTRAINT `nilai_kokurikulers_siswa_id_fkey` FOREIGN KEY (`siswa_id`) REFERENCES `siswas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kehadiran_siswas` ADD CONSTRAINT `kehadiran_siswas_siswa_id_fkey` FOREIGN KEY (`siswa_id`) REFERENCES `siswas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
