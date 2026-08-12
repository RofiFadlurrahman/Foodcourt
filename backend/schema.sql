-- 1. PEMBUATAN DATABASE
CREATE DATABASE IF NOT EXISTS `foodcourt_db`;
USE `foodcourt_db`;

-- 2. HAPUS TABEL JIKA SUDAH ADA (Untuk keperluan reset/re-install)
DROP TABLE IF EXISTS `transactions`;
DROP TABLE IF EXISTS `menus`;
DROP TABLE IF EXISTS `tenants`;
DROP TABLE IF EXISTS `tenant_invitations`;
DROP TABLE IF EXISTS `users`;

-- 3. PEMBUATAN TABEL
-- Tabel Users (Autentikasi & Role)
CREATE TABLE `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('admin', 'tenant') NOT NULL,
    `fullName` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `avatar` VARCHAR(255) NULL,
    `created_by` INT NULL,
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel Tenant Invitations (Kode Undangan oleh Admin)
CREATE TABLE `tenant_invitations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `admin_id` INT NOT NULL,
    `code` VARCHAR(20) NOT NULL UNIQUE,
    `email` VARCHAR(100) NULL,
    `status` ENUM('active','used','expired') NOT NULL DEFAULT 'active',
    `expires_at` DATETIME NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel Tenants (Profil Tenant Foodcourt)
CREATE TABLE `tenants` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `nama_tenant` VARCHAR(100) NOT NULL,
    `nama_pemilik` VARCHAR(100) NOT NULL,
    `hp` VARCHAR(20) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `foto` VARCHAR(255) NULL,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel Menus (Daftar Menu Hidangan per Tenant)
CREATE TABLE `menus` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` INT NOT NULL,
    `nama_menu` VARCHAR(100) NOT NULL,
    `harga` DECIMAL(10,2) NOT NULL,
    `kategori` ENUM('Makanan', 'Minuman', 'Cemilan') NOT NULL DEFAULT 'Makanan',
    `stok` INT NOT NULL DEFAULT 0,
    `status` ENUM('ready', 'empty') NOT NULL DEFAULT 'ready',
    `foto` VARCHAR(255) NULL,
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
    `metode_pembayaran` ENUM('Cash', 'QRIS', 'Debit', 'Midtrans') NOT NULL DEFAULT 'Cash',
    FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`menu_id`) REFERENCES `menus` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 4. SEEDING DATA AWAL (MOCK DATA)
-- Seeding Tabel Users
-- Password di-hash menggunakan bcrypt:
-- admin123  -> $2b$10$Pv2S5t2jR.1g8PFe8o8gBeH3HJcyhrUoP6NXrfJcyrqcla1CWO3ue
-- eko123    -> $2b$10$LI9GGx4Ktp58Q0GBdUWZsucntNnRDkgxzx4B3qZbHo0g2yMwALztK
-- rian123   -> $2b$10$uj55aEmVre2KdLYMvZ0o../ECUFpZObkIaqxXoOMEQI3wGVHusO3i
-- sari123   -> $2b$10$ysn497E4KjOLsmZqnhOL3eVz/1dPIlcrXwB6SFNtQsDkCN6dQBf.m
INSERT INTO `users` (`id`, `username`, `password`, `role`, `fullName`, `email`, `avatar`, `created_by`) VALUES
(1, 'admin', '$2b$10$Pv2S5t2jR.1g8PFe8o8gBeH3HJcyhrUoP6NXrfJcyrqcla1CWO3ue', 'admin', 'Administrator Utama', 'admin@foodcourt.cloud', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', NULL),
(2, 'warung_eko', '$2b$10$LI9GGx4Ktp58Q0GBdUWZsucntNnRDkgxzx4B3qZbHo0g2yMwALztK', 'tenant', 'Eko Prasetyo', 'eko@wonogiri.com', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', 1),
(3, 'kopi_rian', '$2b$10$uj55aEmVre2KdLYMvZ0o../ECUFpZObkIaqxXoOMEQI3wGVHusO3i', 'tenant', 'Rian Kurniawan', 'rian@kenangansenja.com', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80', 1),
(4, 'sushi_sari', '$2b$10$ysn497E4KjOLsmZqnhOL3eVz/1dPIlcrXwB6SFNtQsDkCN6dQBf.m', 'tenant', 'Sari Wijaya', 'sari@sushizen.com', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', 1);

-- Seeding Tabel Tenants
INSERT INTO `tenants` (`id`, `user_id`, `nama_tenant`, `nama_pemilik`, `hp`, `email`, `status`, `foto`) VALUES
(1, 2, 'Bakso Wonogiri Eko', 'Eko Prasetyo', '081234567890', 'eko@wonogiri.com', 'active', 'https://images.unsplash.com/photo-1582298538104-fe2e74c27f59?auto=format&fit=crop&w=400&q=80'),
(2, 3, 'Kopi Kenangan Senja', 'Rian Kurniawan', '082345678901', 'rian@kenangansenja.com', 'active', 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=400&q=80'),
(3, 4, 'Sushi Zen Sari', 'Sari Wijaya', '083456789012', 'sari@sushizen.com', 'active', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=400&q=80');

-- Seeding Tabel Menus
INSERT INTO `menus` (`id`, `tenant_id`, `nama_menu`, `harga`, `kategori`, `stok`, `status`, `foto`) VALUES
-- Bakso Wonogiri Eko (tenant 1)
(1, 1, 'Bakso Urat Spesial', 25000.00, 'Makanan', 50, 'ready', 'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=150&q=80'),
(2, 1, 'Mie Ayam Pangsit Bakso', 22000.00, 'Makanan', 40, 'ready', 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=150&q=80'),
(3, 1, 'Es Teh Manis Segar', 5000.00, 'Minuman', 100, 'ready', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=150&q=80'),
-- Kopi Kenangan Senja (tenant 2)
(4, 2, 'Es Kopi Susu Senja', 18000.00, 'Minuman', 80, 'ready', 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=150&q=80'),
(5, 2, 'Classic Chocolate Ice', 16000.00, 'Minuman', 60, 'ready', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=150&q=80'),
(6, 2, 'Roti Bakar Keju Meleleh', 15000.00, 'Cemilan', 30, 'ready', 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=150&q=80'),
-- Sushi Zen Sari (tenant 3)
(7, 3, 'Salmon Mentai Roll', 45000.00, 'Makanan', 25, 'ready', 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=150&q=80'),
(8, 3, 'Chicken Katsu Curry', 35000.00, 'Makanan', 30, 'ready', 'https://images.unsplash.com/photo-1598511726623-d73400609951?auto=format&fit=crop&w=150&q=80'),
(9, 3, 'Ocha Green Tea (Refill)', 8000.00, 'Minuman', 150, 'ready', 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=150&q=80');

-- Seeding Tabel Transactions (Simulasi riwayat hari ini & beberapa hari lalu)
-- Transaksi Hari Ini
INSERT INTO `transactions` (`tenant_id`, `menu_id`, `jumlah`, `total_harga`, `tanggal_transaksi`, `metode_pembayaran`) VALUES
-- Tenant 1
(1, 1, 2, 50000.00, DATE_SUB(NOW(), INTERVAL 4 HOUR), 'QRIS'),
(1, 2, 1, 22000.00, DATE_SUB(NOW(), INTERVAL 3 HOUR), 'Cash'),
-- Tenant 2
(2, 4, 3, 54000.00, DATE_SUB(NOW(), INTERVAL 2 HOUR), 'Debit'),
(2, 5, 2, 32000.00, DATE_SUB(NOW(), INTERVAL 1 HOUR), 'QRIS'),
-- Tenant 3
(3, 7, 1, 45000.00, DATE_SUB(NOW(), INTERVAL 5 HOUR), 'Midtrans'),
(3, 9, 2, 16000.00, DATE_SUB(NOW(), INTERVAL 2 HOUR), 'QRIS'),

-- Transaksi Kemarin (Untuk mempopulerkan grafik analitik)
-- Tenant 1
(1, 1, 4, 100000.00, DATE_SUB(NOW(), INTERVAL 1 DAY), 'QRIS'),
(1, 2, 3, 66000.00, DATE_SUB(NOW(), INTERVAL 1 DAY), 'Cash'),
-- Tenant 2
(2, 4, 5, 90000.00, DATE_SUB(NOW(), INTERVAL 1 DAY), 'Debit'),
(2, 5, 4, 64000.00, DATE_SUB(NOW(), INTERVAL 1 DAY), 'QRIS'),
-- Tenant 3
(3, 8, 3, 105000.00, DATE_SUB(NOW(), INTERVAL 1 DAY), 'Midtrans'),
(3, 9, 5, 40000.00, DATE_SUB(NOW(), INTERVAL 1 DAY), 'Cash');
