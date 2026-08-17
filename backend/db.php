<?php
// Pengaturan Koneksi Database
$host     = 'sql309.ezyro.com';
$dbname   = 'ezyro_42639789_foodcourt';
$username = 'ezyro_42639789';
$possible_passwords = ['b9380654'];

$pdo = null;
$connected = false;
$last_exception = null;
$password = '';

foreach ($possible_passwords as $pwd) {
    try {
        // 1. Koneksi awal ke server MySQL (tanpa dbname agar tidak error jika db belum dibuat)
        $pdo = new PDO("mysql:host=$host;charset=utf8mb4", $username, $pwd, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Melempar exception jika terjadi error SQL
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // Hasil fetch berupa array asosiatif
            PDO::ATTR_EMULATE_PREPARES   => false,                  /// Menonaktifkan emulasi
        ]);
        $password = $pwd; // Simpan password yang berhasil digunakan
        $connected = true;
        break;
    } catch (PDOException $e) {
        $last_exception = $e;
    }
}

if (!$connected) {
    throw $last_exception;
}

try {
    // 2. Buat database secara otomatis jika belum ada
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbname` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci");
    
    // 3. Masuk ke database tersebut
    $pdo->exec("USE `$dbname`");

    // 4. Deteksi apakah tabel utama 'users' sudah ada dan memiliki kolom baru
    $schemaNeedsUpdate = false;
    try {
        $pdo->query("SELECT 1 FROM `users` LIMIT 1");
        // Periksa apakah kolom 'fullName' dan 'created_by' ada, jika tidak, butuh migrasi
        $checkCol = $pdo->query("SHOW COLUMNS FROM `users` LIKE 'fullName'");
        $checkCreatedBy = $pdo->query("SHOW COLUMNS FROM `users` LIKE 'created_by'");
        if (!$checkCol->fetch() || !$checkCreatedBy->fetch()) {
            $schemaNeedsUpdate = true;
        }
    } catch (PDOException $txError) {
        // Tabel tidak ditemukan, perlu inisialisasi awal
        $schemaNeedsUpdate = true;
    }

    // 5. Auto-Migrasi & Seeding jika tabel belum terbentuk atau masih versi lama
    if ($schemaNeedsUpdate) {
        $schemaFile = __DIR__ . '/schema.sql';
        if (file_exists($schemaFile)) {
            $sqlContent = file_get_contents($schemaFile);
            
            // Nonaktifkan foreign key checks untuk melakukan drop/truncate secara aman
            $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
            
            // Eksekusi skrip DDL/DML di schema.sql
            $pdo->exec($sqlContent);
            
            $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
            
            // Enforce password hashing secara native di PHP untuk semua user seed setelah migrasi
            // Ini mencegah isu kompatibilitas hash OpenBSD ($2b$) pada system Windows/XAMPP lama.
            $usersToHash = [
                'admin' => 'admin123',
                'warung_eko' => 'eko123',
                'kopi_rian' => 'rian123',
                'sushi_sari' => 'sari123'
            ];
            $updatePassStmt = $pdo->prepare("UPDATE users SET password = :password WHERE username = :username");
            foreach ($usersToHash as $uName => $plainPass) {
                $updatePassStmt->execute([
                    'password' => password_hash($plainPass, PASSWORD_BCRYPT),
                    'username' => $uName
                ]);
            }
        }
    }
} catch (PDOException $e) {
    // Jika request berasal dari folder /api/, kembalikan JSON agar frontend bisa membacanya
    if (strpos($_SERVER['REQUEST_URI'], '/api/') !== false) {
        http_response_code(500);
        header("Content-Type: application/json; charset=UTF-8");
        echo json_encode([
            'error' => 'Gagal menghubungkan ke database MySQL. Detail: ' . $e->getMessage()
        ]);
        exit();
    }

    // Jika request halaman HTML biasa, tampilkan layout error HTML
    die("<div style='font-family: sans-serif; padding: 20px; background-color: #ffebee; color: #c62828; border: 1px solid #ef9a9a; border-radius: 8px; max-width: 600px; margin: 50px auto;'>
        <h3 style='margin-top: 0;'>Gagal Menghubungkan ke Server Database!</h3>
        <p>Terjadi kesalahan koneksi MySQL: <code>" . htmlspecialchars($e->getMessage()) . "</code></p>
        <hr style='border: 0; border-top: 1px solid #ef9a9a;'>
        <p style='font-size: 14px; color: #555;'><strong>Langkah Penanganan:</strong></p>
        <ol style='font-size: 14px; color: #555; line-height: 1.6;'>
            <li>Pastikan server database MySQL Anda (XAMPP / WampServer / Laragon) sudah <strong>dinyalakan / aktif</strong>.</li>
            <li>Pastikan port MySQL Anda standar (3306) atau sesuaikan konfigurasi host di file <code>db.php</code>.</li>
            <li>Pastikan file <code>schema.sql</code> berada dalam direktori yang sama dengan <code>db.php</code> agar migrasi tabel berjalan otomatis.</li>
        </ol>
    </div>");
}
?>
