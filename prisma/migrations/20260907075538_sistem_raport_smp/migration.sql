-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'GURU_MAPEL', 'WALI_KELAS', 'KEPALA_SEKOLAH', 'KOORDINATOR_KOKURIKULER', 'SISWA') NOT NULL,
    `foto_profil` VARCHAR(191) NULL,
    `ukuran_kertas` VARCHAR(191) NULL DEFAULT 'A4',
    `margin_atas` INTEGER NULL DEFAULT 20,
    `margin_bawah` INTEGER NULL DEFAULT 20,
    `margin_kiri` INTEGER NULL DEFAULT 25,
    `margin_kanan` INTEGER NULL DEFAULT 20,
    `refresh_token` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gurus` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `nip` VARCHAR(191) NULL,
    `nuptk` VARCHAR(191) NULL,
    `nama` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `gurus_user_id_key`(`user_id`),
    UNIQUE INDEX `gurus_nip_key`(`nip`),
    UNIQUE INDEX `gurus_nuptk_key`(`nuptk`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `siswas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `nisn` VARCHAR(191) NOT NULL,
    `nis` VARCHAR(191) NULL,
    `nama` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `siswas_user_id_key`(`user_id`),
    UNIQUE INDEX `siswas_nisn_key`(`nisn`),
    UNIQUE INDEX `siswas_nis_key`(`nis`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mapels` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kode` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `kategori` ENUM('UMUM', 'MULOK', 'PEMINATAN') NOT NULL DEFAULT 'UMUM',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `mapels_kode_key`(`kode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tahun_ajarans` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tahun` VARCHAR(191) NOT NULL,
    `semester` INTEGER NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tahun_ajarans_tahun_semester_key`(`tahun`, `semester`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kelas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tahun_ajaran_id` INTEGER NOT NULL,
    `wali_kelas_id` INTEGER NULL,
    `nama` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `kelas_tahun_ajaran_id_nama_key`(`tahun_ajaran_id`, `nama`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ekskuls` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ekskuls_nama_key`(`nama`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kokurikulers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `kokurikulers_nama_key`(`nama`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `guru_mapels` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `guru_id` INTEGER NOT NULL,
    `mapel_id` INTEGER NOT NULL,
    `kelas_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `guru_mapels_guru_id_mapel_id_kelas_id_key`(`guru_id`, `mapel_id`, `kelas_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `riwayat_kelas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `siswa_id` INTEGER NOT NULL,
    `kelas_id` INTEGER NOT NULL,
    `tahun_ajaran_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `riwayat_kelas_siswa_id_tahun_ajaran_id_key`(`siswa_id`, `tahun_ajaran_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tujuan_pembelajarans` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `guru_mapel_id` INTEGER NOT NULL,
    `deskripsi` TEXT NOT NULL,
    `urutan` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `nilais` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `siswa_id` INTEGER NOT NULL,
    `guru_mapel_id` INTEGER NOT NULL,
    `nilai_akhir` DOUBLE NULL,
    `deskripsi` TEXT NULL,
    `is_final` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `nilais_siswa_id_guru_mapel_id_key`(`siswa_id`, `guru_mapel_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `nilai_tps` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nilai_id` INTEGER NOT NULL,
    `tp_id` INTEGER NOT NULL,
    `status` ENUM('TERCAPAI', 'TIDAK_TERCAPAI') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `nilai_tps_nilai_id_tp_id_key`(`nilai_id`, `tp_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `nilai_ekskuls` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `siswa_id` INTEGER NOT NULL,
    `ekskul_id` INTEGER NOT NULL,
    `tahun_ajaran_id` INTEGER NOT NULL,
    `nilai` DOUBLE NULL,
    `deskripsi` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `nilai_ekskuls_siswa_id_ekskul_id_tahun_ajaran_id_key`(`siswa_id`, `ekskul_id`, `tahun_ajaran_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `nilai_kokurikulers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `siswa_id` INTEGER NOT NULL,
    `kokurikuler_id` INTEGER NOT NULL,
    `tahun_ajaran_id` INTEGER NOT NULL,
    `deskripsi` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `nilai_kokurikulers_siswa_id_kokurikuler_id_tahun_ajaran_id_key`(`siswa_id`, `kokurikuler_id`, `tahun_ajaran_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kehadiran_siswas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `siswa_id` INTEGER NOT NULL,
    `tahun_ajaran_id` INTEGER NOT NULL,
    `sakit` INTEGER NOT NULL DEFAULT 0,
    `izin` INTEGER NOT NULL DEFAULT 0,
    `tanpa_keterangan` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `kehadiran_siswas_siswa_id_tahun_ajaran_id_key`(`siswa_id`, `tahun_ajaran_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tanda_tangans` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `tahun_ajaran_id` INTEGER NOT NULL,
    `file_ttd` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tanda_tangans_user_id_tahun_ajaran_id_key`(`user_id`, `tahun_ajaran_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pengaturan_raports` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tahun_ajaran_id` INTEGER NOT NULL,
    `tanggal` DATETIME(3) NOT NULL,
    `tempat` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pengaturan_raports_tahun_ajaran_id_key`(`tahun_ajaran_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `gurus` ADD CONSTRAINT `gurus_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `siswas` ADD CONSTRAINT `siswas_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kelas` ADD CONSTRAINT `kelas_tahun_ajaran_id_fkey` FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajarans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kelas` ADD CONSTRAINT `kelas_wali_kelas_id_fkey` FOREIGN KEY (`wali_kelas_id`) REFERENCES `gurus`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `guru_mapels` ADD CONSTRAINT `guru_mapels_guru_id_fkey` FOREIGN KEY (`guru_id`) REFERENCES `gurus`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `guru_mapels` ADD CONSTRAINT `guru_mapels_mapel_id_fkey` FOREIGN KEY (`mapel_id`) REFERENCES `mapels`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `guru_mapels` ADD CONSTRAINT `guru_mapels_kelas_id_fkey` FOREIGN KEY (`kelas_id`) REFERENCES `kelas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `riwayat_kelas` ADD CONSTRAINT `riwayat_kelas_siswa_id_fkey` FOREIGN KEY (`siswa_id`) REFERENCES `siswas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `riwayat_kelas` ADD CONSTRAINT `riwayat_kelas_kelas_id_fkey` FOREIGN KEY (`kelas_id`) REFERENCES `kelas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `riwayat_kelas` ADD CONSTRAINT `riwayat_kelas_tahun_ajaran_id_fkey` FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajarans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tujuan_pembelajarans` ADD CONSTRAINT `tujuan_pembelajarans_guru_mapel_id_fkey` FOREIGN KEY (`guru_mapel_id`) REFERENCES `guru_mapels`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nilais` ADD CONSTRAINT `nilais_siswa_id_fkey` FOREIGN KEY (`siswa_id`) REFERENCES `siswas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nilais` ADD CONSTRAINT `nilais_guru_mapel_id_fkey` FOREIGN KEY (`guru_mapel_id`) REFERENCES `guru_mapels`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nilai_tps` ADD CONSTRAINT `nilai_tps_nilai_id_fkey` FOREIGN KEY (`nilai_id`) REFERENCES `nilais`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nilai_tps` ADD CONSTRAINT `nilai_tps_tp_id_fkey` FOREIGN KEY (`tp_id`) REFERENCES `tujuan_pembelajarans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nilai_ekskuls` ADD CONSTRAINT `nilai_ekskuls_siswa_id_fkey` FOREIGN KEY (`siswa_id`) REFERENCES `siswas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nilai_ekskuls` ADD CONSTRAINT `nilai_ekskuls_ekskul_id_fkey` FOREIGN KEY (`ekskul_id`) REFERENCES `ekskuls`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nilai_ekskuls` ADD CONSTRAINT `nilai_ekskuls_tahun_ajaran_id_fkey` FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajarans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nilai_kokurikulers` ADD CONSTRAINT `nilai_kokurikulers_siswa_id_fkey` FOREIGN KEY (`siswa_id`) REFERENCES `siswas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nilai_kokurikulers` ADD CONSTRAINT `nilai_kokurikulers_kokurikuler_id_fkey` FOREIGN KEY (`kokurikuler_id`) REFERENCES `kokurikulers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nilai_kokurikulers` ADD CONSTRAINT `nilai_kokurikulers_tahun_ajaran_id_fkey` FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajarans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kehadiran_siswas` ADD CONSTRAINT `kehadiran_siswas_siswa_id_fkey` FOREIGN KEY (`siswa_id`) REFERENCES `siswas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kehadiran_siswas` ADD CONSTRAINT `kehadiran_siswas_tahun_ajaran_id_fkey` FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajarans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tanda_tangans` ADD CONSTRAINT `tanda_tangans_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tanda_tangans` ADD CONSTRAINT `tanda_tangans_tahun_ajaran_id_fkey` FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajarans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengaturan_raports` ADD CONSTRAINT `pengaturan_raports_tahun_ajaran_id_fkey` FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajarans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
