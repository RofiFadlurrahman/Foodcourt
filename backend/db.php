<?php
// Pengaturan Koneksi Database
$host     = $_ENV['MYSQLHOST']     ?? $_SERVER['MYSQLHOST']     ?? getenv('MYSQLHOST')     ?: 'mysql.railway.internal';
$dbname   = $_ENV['MYSQLDATABASE'] ?? $_SERVER['MYSQLDATABASE'] ?? getenv('MYSQLDATABASE') ?: 'railway';
$username = $_ENV['MYSQLUSER']     ?? $_SERVER['MYSQLUSER']     ?? getenv('MYSQLUSER')     ?: 'root';
$db_port  = $_ENV['MYSQLPORT']     ?? $_SERVER['MYSQLPORT']     ?? getenv('MYSQLPORT')     ?: '3306';
$password = $_ENV['MYSQLPASSWORD'] ?? $_SERVER['MYSQLPASSWORD'] ?? getenv('MYSQLPASSWORD') ?: 'xSxEtrkuiQebSvNGBLPIBkJxByGYPzVh';

$pdo = null;
try {
    $pdo = new PDO("mysql:host=$host;port=$db_port;dbname=$dbname;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode(['error' => 'Gagal koneksi ke database: ' . $e->getMessage()]);
    exit();
}

// Auto migrasi struktur tabel jika database masih baru/kosong
try {
    $check = $pdo->query("SHOW TABLES LIKE 'users'")->fetch();
    if (!$check) {
        $schemaFile = __DIR__ . '/schema.sql';
        if (file_exists($schemaFile)) {
            $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
            $pdo->exec(file_get_contents($schemaFile));
            $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
        }
    }
} catch (Exception $e) {}

try {
    $pdo->exec("ALTER TABLE `transactions` ADD COLUMN IF NOT EXISTS `midtrans_order_id` VARCHAR(255) NULL");
    $pdo->exec("ALTER TABLE `transactions` ADD COLUMN IF NOT EXISTS `snap_token` VARCHAR(255) NULL");
    $pdo->exec("ALTER TABLE `transactions` ADD COLUMN IF NOT EXISTS `payment_status` VARCHAR(50) DEFAULT 'pending'");
} catch (Exception $e) {}
?>