<?php
// Pengaturan Koneksi Database
$host     = 'localhost';
$dbname   = 'foodcourt_db';
$username = 'root';
$password = ''; // Kosong secara default pada XAMPP/WampServer

try {
    // 1. Koneksi awal ke server MySQL (tanpa dbname agar tidak error jika db belum dibuat)
    $pdo = new PDO("mysql:host=$host;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Melempar exception jika terjadi error SQL
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // Hasil fetch berupa array asosiatif
        PDO::ATTR_EMULATE_PREPARES   => false,                  /// Menonaktifkan emulasi
    ]);

    // 2. Buat database secara otomatis jika belum ada
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbname` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci");
    
    // 3. Masuk ke database tersebut
    $pdo->exec("USE `$dbname`");

    // 4. Deteksi apakah tabel utama 'users' sudah ada
    $tableExists = false;
    try {
        $pdo->query("SELECT 1 FROM `users` LIMIT 1");
        $tableExists = true;
    } catch (PDOException $txError) {
        // Tabel tidak ditemukan, akan di-install otomatis pada langkah di bawah
    }

    // 5. Auto-Migrasi & Seeding jika tabel belum terbentuk
    if (!$tableExists) {
        $schemaFile = __DIR__ . '/schema.sql';
        if (file_exists($schemaFile)) {
            $sqlContent = file_get_contents($schemaFile);
            // Eksekusi skrip DDL/DML di schema.sql
            $pdo->exec($sqlContent);
        }
    }
} catch (PDOException $e) {
    // Jika koneksi gagal, tampilkan pesan instruktif yang rapi
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
