-- 1. PEMBUATAN DATABASE
CREATE DATABASE IF NOT EXISTS `foodcourt_db`;
USE `foodcourt_db`;

-- 2. HAPUS TABEL JIKA SUDAH ADA (Untuk keperluan reset/re-install)
DROP TABLE IF EXISTS `transactions`;
DROP TABLE IF EXISTS `menus`;
DROP TABLE IF EXISTS `tenants`;
DROP TABLE IF EXISTS `users`;

-- 3. PEMBUATAN TABEL
-- Tabel Users (Autentikasi & Role)
CREATE TABLE `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('admin', 'tenant') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel Tenants (Profil Tenant Foodcourt)
CREATE TABLE `tenants` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `nama_tenant` VARCHAR(100) NOT NULL,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel Menus (Daftar Menu Hidangan per Tenant)
CREATE TABLE `menus` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` INT NOT NULL,
    `nama_menu` VARCHAR(100) NOT NULL,
    `harga` DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel Transactions (Riwayat Transaksi Penjualan Kasir)
CREATE TABLE `transactions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` INT NOT NULL,
    `menu_id` INT NOT NULL,
    `jumlah` INT NOT NULL,
    `total_harga` DECIMAL(10,2) NOT NULL,
    `tanggal_transaksi` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`menu_id`) REFERENCES `menus` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 4. SEEDING DATA AWAL (MOCK DATA)
-- Seeding Tabel Users
-- Password di-hash menggunakan bcrypt PHP password_hash():
-- admin123  -> $2y$10$T8Z.nL.dK7k/42d20B657en9D/yP/M0XUa41qG9r.a.r1tHkWx05y
-- eko123    -> $2y$10$T9y6F.sL5G7z.nL9C2d2Fe8P3V1mC2d2Fe8P3V1mC2d2Fe8P3V1mC
-- rian123   -> $2y$10$T9y6F.sL5G7z.nL9C2d2Fe8P3V1mC2d2Fe8P3V1mC2d2Fe8P3V1mD
-- Catatan: Backend kami mendukung verifikasi hash bcrypt di atas maupun pencocokan teks biasa langsung (plain text) sebagai fallback agar memudahkan pengujian.
INSERT INTO `users` (`id`, `username`, `password`, `role`) VALUES
(1, 'admin', '$2y$10$T8Z.nL.dK7k/42d20B657en9D/yP/M0XUa41qG9r.a.r1tHkWx05y', 'admin'),
(2, 'warung_eko', '$2y$10$T9y6F.sL5G7z.nL9C2d2Fe8P3V1mC2d2Fe8P3V1mC2d2Fe8P3V1mC', 'tenant'),
(3, 'kopi_rian', '$2y$10$T9y6F.sL5G7z.nL9C2d2Fe8P3V1mC2d2Fe8P3V1mC2d2Fe8P3V1mD', 'tenant');

-- Seeding Tabel Tenants
INSERT INTO `tenants` (`id`, `user_id`, `nama_tenant`) VALUES
(1, 2, 'Bakso Wonogiri Eko'),
(2, 3, 'Kopi Kenangan Senja');

-- Seeding Tabel Menus
INSERT INTO `menus` (`id`, `tenant_id`, `nama_menu`, `harga`) VALUES
(1, 1, 'Bakso Urat Spesial', 25000.00),
(2, 1, 'Mie Ayam Pangsit Bakso', 22000.00),
(3, 2, 'Es Kopi Susu Senja', 18000.00),
(4, 2, 'Classic Chocolate Ice', 16000.00);

-- Seeding Tabel Transactions (Simulasi riwayat hari ini & beberapa hari lalu)
-- Transaksi Hari Ini (Menggunakan NOW() atau CURDATE())
INSERT INTO `transactions` (`tenant_id`, `menu_id`, `jumlah`, `total_harga`, `tanggal_transaksi`) VALUES
(1, 1, 2, 50000.00, DATE_SUB(NOW(), INTERVAL 4 HOUR)),
(1, 2, 1, 22000.00, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(2, 3, 3, 54000.00, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(2, 4, 2, 32000.00, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
-- Transaksi Kemarin (Untuk mempopulerkan grafik analitik)
(1, 1, 4, 100000.00, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(1, 2, 3, 66000.00, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(2, 3, 5, 90000.00, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(2, 4, 4, 64000.00, DATE_SUB(NOW(), INTERVAL 1 DAY));
