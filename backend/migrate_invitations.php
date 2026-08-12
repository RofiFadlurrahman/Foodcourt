<?php
require_once __DIR__ . '/db.php';

$sql = "CREATE TABLE IF NOT EXISTS `tenant_invitations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `admin_id` INT NOT NULL,
    `code` VARCHAR(20) NOT NULL UNIQUE,
    `email` VARCHAR(100) NULL,
    `status` ENUM('active','used','expired') NOT NULL DEFAULT 'active',
    `expires_at` DATETIME NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`admin_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

try {
    $pdo->exec($sql);
    echo "✅ Tabel tenant_invitations berhasil dibuat atau sudah ada." . PHP_EOL;
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . PHP_EOL;
}
?>
