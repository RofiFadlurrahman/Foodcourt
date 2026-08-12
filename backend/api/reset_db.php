<?php
require_once __DIR__ . '/auth_helper.php';

try {
    // Only admin can perform database reset
    $session = require_auth(['admin']);

    // Disable FK checks and drop all tables to start clean
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
    $pdo->exec("DROP TABLE IF EXISTS `transactions`");
    $pdo->exec("DROP TABLE IF EXISTS `menus`");
    $pdo->exec("DROP TABLE IF EXISTS `tenants`");
    $pdo->exec("DROP TABLE IF EXISTS `users`");
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

    // Read schema.sql table creation query (skip seeding)
    $schemaFile = __DIR__ . '/../schema.sql';
    if (file_exists($schemaFile)) {
        $sqlContent = file_get_contents($schemaFile);
        $parts = explode('-- 4. SEEDING DATA AWAL (MOCK DATA)', $sqlContent);
        $createTablesSql = $parts[0];
        $pdo->exec($createTablesSql);
    } else {
        throw new Exception("schema.sql tidak ditemukan.");
    }

    // Seed Users using native password_hash() (ensuring local PHP verification compatibility)
    $users = [
        [1, 'admin', 'admin123', 'admin', 'Administrator Utama', 'admin@foodcourt.cloud', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', null],
        [2, 'warung_eko', 'eko123', 'tenant', 'Eko Prasetyo', 'eko@wonogiri.com', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', 1],
        [3, 'kopi_rian', 'rian123', 'tenant', 'Rian Kurniawan', 'rian@kenangansenja.com', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80', 1],
        [4, 'sushi_sari', 'sari123', 'tenant', 'Sari Wijaya', 'sari@sushizen.com', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', 1]
    ];

    $userStmt = $pdo->prepare("INSERT INTO users (id, username, password, role, fullName, email, avatar, created_by) VALUES (:id, :username, :password, :role, :fullName, :email, :avatar, :created_by)");
    foreach ($users as $u) {
        $userStmt->execute([
            'id' => $u[0],
            'username' => $u[1],
            'password' => password_hash($u[2], PASSWORD_BCRYPT),
            'role' => $u[3],
            'fullName' => $u[4],
            'email' => $u[5],
            'avatar' => $u[6],
            'created_by' => $u[7]
        ]);
    }

    // Seed Tenants
    $tenants = [
        [1, 2, 'Bakso Wonogiri Eko', 'Eko Prasetyo', '081234567890', 'eko@wonogiri.com', 'active', 'https://images.unsplash.com/photo-1582298538104-fe2e74c27f59?auto=format&fit=crop&w=400&q=80'],
        [2, 3, 'Kopi Kenangan Senja', 'Rian Kurniawan', '082345678901', 'rian@kenangansenja.com', 'active', 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=400&q=80'],
        [3, 4, 'Sushi Zen Sari', 'Sari Wijaya', '083456789012', 'sari@sushizen.com', 'active', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=400&q=80']
    ];

    $tenantStmt = $pdo->prepare("INSERT INTO tenants (id, user_id, nama_tenant, nama_pemilik, hp, email, status, foto) VALUES (:id, :user_id, :nama_tenant, :nama_pemilik, :hp, :email, :status, :foto)");
    foreach ($tenants as $t) {
        $tenantStmt->execute([
            'id' => $t[0],
            'user_id' => $t[1],
            'nama_tenant' => $t[2],
            'nama_pemilik' => $t[3],
            'hp' => $t[4],
            'email' => $t[5],
            'status' => $t[6],
            'foto' => $t[7]
        ]);
    }

    // Seed Menus
    $menus = [
        [1, 1, 'Bakso Urat Spesial', 25000.00, 'Makanan', 50, 'ready', 'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=150&q=80'],
        [2, 1, 'Mie Ayam Pangsit Bakso', 22000.00, 'Makanan', 40, 'ready', 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=150&q=80'],
        [3, 1, 'Es Teh Manis Segar', 5000.00, 'Minuman', 100, 'ready', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=150&q=80'],
        [4, 2, 'Es Kopi Susu Senja', 18000.00, 'Minuman', 80, 'ready', 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=150&q=80'],
        [5, 2, 'Classic Chocolate Ice', 16000.00, 'Minuman', 60, 'ready', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=150&q=80'],
        [6, 2, 'Roti Bakar Keju Meleleh', 15000.00, 'Cemilan', 30, 'ready', 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=150&q=80'],
        [7, 3, 'Salmon Mentai Roll', 45000.00, 'Makanan', 25, 'ready', 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=150&q=80'],
        [8, 3, 'Chicken Katsu Curry', 35000.00, 'Makanan', 30, 'ready', 'https://images.unsplash.com/photo-1598511726623-d73400609951?auto=format&fit=crop&w=150&q=80'],
        [9, 3, 'Ocha Green Tea (Refill)', 8000.00, 'Minuman', 150, 'ready', 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=150&q=80']
    ];

    $menuStmt = $pdo->prepare("INSERT INTO menus (id, tenant_id, nama_menu, harga, kategori, stok, status, foto) VALUES (:id, :tenant_id, :nama_menu, :harga, :kategori, :stok, :status, :foto)");
    foreach ($menus as $m) {
        $menuStmt->execute([
            'id' => $m[0],
            'tenant_id' => $m[1],
            'nama_menu' => $m[2],
            'harga' => $m[3],
            'kategori' => $m[4],
            'stok' => $m[5],
            'status' => $m[6],
            'foto' => $m[7]
        ]);
    }

    // Seed Transactions
    $pdo->exec("INSERT INTO `transactions` (`tenant_id`, `menu_id`, `jumlah`, `total_harga`, `tanggal_transaksi`, `metode_pembayaran`) VALUES
        (1, 1, 2, 50000.00, DATE_SUB(NOW(), INTERVAL 4 HOUR), 'QRIS'),
        (1, 2, 1, 22000.00, DATE_SUB(NOW(), INTERVAL 3 HOUR), 'Cash'),
        (2, 4, 3, 54000.00, DATE_SUB(NOW(), INTERVAL 2 HOUR), 'Debit'),
        (2, 5, 2, 32000.00, DATE_SUB(NOW(), INTERVAL 1 HOUR), 'QRIS'),
        (3, 7, 1, 45000.00, DATE_SUB(NOW(), INTERVAL 5 HOUR), 'Midtrans'),
        (3, 9, 2, 16000.00, DATE_SUB(NOW(), INTERVAL 2 HOUR), 'QRIS'),
        (1, 1, 4, 100000.00, DATE_SUB(NOW(), INTERVAL 1 DAY), 'QRIS'),
        (1, 2, 3, 66000.00, DATE_SUB(NOW(), INTERVAL 1 DAY), 'Cash'),
        (2, 4, 5, 90000.00, DATE_SUB(NOW(), INTERVAL 1 DAY), 'Debit'),
        (2, 5, 4, 64000.00, DATE_SUB(NOW(), INTERVAL 1 DAY), 'QRIS'),
        (3, 8, 3, 105000.00, DATE_SUB(NOW(), INTERVAL 1 DAY), 'Midtrans'),
        (3, 9, 5, 40000.00, DATE_SUB(NOW(), INTERVAL 1 DAY), 'Cash')");

    echo json_encode(['success' => true, 'message' => 'Reset database berhasil! Semua tabel telah dibuat ulang dan di-seed dengan hash bcrypt native PHP.']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Gagal mereset database: ' . $e->getMessage()]);
}
?>
