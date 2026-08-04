<?php
require_once __DIR__ . '/../auth_helper.php';

try {
    // Require admin role
    $session = require_auth(['admin']);
    $admin_id = $session['user_id'];

    // 1. Revenue Today (scoped to admin's tenants)
    $todayStmt = $pdo->prepare("SELECT COALESCE(SUM(tx.total_harga), 0) as val FROM transactions tx JOIN tenants t ON tx.tenant_id = t.id JOIN users u ON t.user_id = u.id WHERE u.created_by = :admin_id AND DATE(tx.tanggal_transaksi) = CURRENT_DATE()");
    $todayStmt->execute(['admin_id' => $admin_id]);
    $revenueToday = (float)$todayStmt->fetch()['val'];

    // 2. Revenue This Month
    $monthStmt = $pdo->prepare("SELECT COALESCE(SUM(tx.total_harga), 0) as val FROM transactions tx JOIN tenants t ON tx.tenant_id = t.id JOIN users u ON t.user_id = u.id WHERE u.created_by = :admin_id AND YEAR(tx.tanggal_transaksi) = YEAR(CURRENT_DATE()) AND MONTH(tx.tanggal_transaksi) = MONTH(CURRENT_DATE())");
    $monthStmt->execute(['admin_id' => $admin_id]);
    $revenueThisMonth = (float)$monthStmt->fetch()['val'];

    // 3. Total Revenue
    $totalRevStmt = $pdo->prepare("SELECT COALESCE(SUM(tx.total_harga), 0) as val FROM transactions tx JOIN tenants t ON tx.tenant_id = t.id JOIN users u ON t.user_id = u.id WHERE u.created_by = :admin_id");
    $totalRevStmt->execute(['admin_id' => $admin_id]);
    $totalRevenue = (float)$totalRevStmt->fetch()['val'];

    // 4. Totals of entities
    $tenantsCountStmt = $pdo->prepare("SELECT COUNT(*) FROM tenants t JOIN users u ON t.user_id = u.id WHERE u.created_by = :admin_id");
    $tenantsCountStmt->execute(['admin_id' => $admin_id]);
    $tenantsCount = (int)$tenantsCountStmt->fetchColumn();

    $menusCountStmt = $pdo->prepare("SELECT COUNT(*) FROM menus m JOIN tenants t ON m.tenant_id = t.id JOIN users u ON t.user_id = u.id WHERE u.created_by = :admin_id");
    $menusCountStmt->execute(['admin_id' => $admin_id]);
    $menusCount = (int)$menusCountStmt->fetchColumn();

    $usersCountStmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE created_by = :admin_id1 OR id = :admin_id2");
    $usersCountStmt->execute([
        'admin_id1' => $admin_id,
        'admin_id2' => $admin_id
    ]);
    $usersCount = (int)$usersCountStmt->fetchColumn();

    $transactionsCountStmt = $pdo->prepare("SELECT COUNT(*) FROM transactions tx JOIN tenants t ON tx.tenant_id = t.id JOIN users u ON t.user_id = u.id WHERE u.created_by = :admin_id");
    $transactionsCountStmt->execute(['admin_id' => $admin_id]);
    $transactionsCount = (int)$transactionsCountStmt->fetchColumn();

    // 5. Line Chart Data (Past 7 Days)
    $months = [
        1 => 'Jan', 2 => 'Feb', 3 => 'Mar', 4 => 'Apr', 5 => 'Mei', 6 => 'Jun',
        7 => 'Jul', 8 => 'Agt', 9 => 'Sep', 10 => 'Okt', 11 => 'Nov', 12 => 'Des'
    ];
    $lineChartData = [];
    for ($i = 6; $i >= 0; $i--) {
        $time = strtotime("-$i days");
        $dbDate = date('Y-m-d', $time);
        $dayStr = date('d', $time);
        $monthNum = (int)date('m', $time);
        $label = $dayStr . ' ' . $months[$monthNum];
        
        $lineChartData[$dbDate] = [
            'tanggal' => $label,
            'pendapatan' => 0.0
        ];
    }

    $chartStmt = $pdo->prepare("SELECT DATE(tx.tanggal_transaksi) as tgl, SUM(tx.total_harga) as revenue FROM transactions tx JOIN tenants t ON tx.tenant_id = t.id JOIN users u ON t.user_id = u.id WHERE u.created_by = :admin_id AND tx.tanggal_transaksi >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 DAY) GROUP BY DATE(tx.tanggal_transaksi)");
    $chartStmt->execute(['admin_id' => $admin_id]);
    while ($row = $chartStmt->fetch()) {
        $tglDate = $row['tgl'];
        if (isset($lineChartData[$tglDate])) {
            $lineChartData[$tglDate]['pendapatan'] = (float)$row['revenue'];
        }
    }

    // 6. Tenant Performance (Bar Chart)
    $tenantPerformance = [];
    $perfStmt = $pdo->prepare("SELECT t.id, t.nama_tenant as name, COALESCE(SUM(tx.total_harga), 0) as pendapatan, COUNT(tx.id) as transaksi FROM tenants t JOIN users u ON t.user_id = u.id LEFT JOIN transactions tx ON t.id = tx.tenant_id WHERE u.created_by = :admin_id GROUP BY t.id");
    $perfStmt->execute(['admin_id' => $admin_id]);
    while ($row = $perfStmt->fetch()) {
        $tenantPerformance[] = [
            'id' => (string)$row['id'],
            'name' => $row['name'],
            'pendapatan' => (float)$row['pendapatan'],
            'transaksi' => (int)$row['transaksi']
        ];
    }

    // 7. Best Seller Menus (Pie Chart)
    $pieChartBestSellers = [];
    $pieStmt = $pdo->prepare("SELECT m.nama_menu as name, COALESCE(SUM(tx.jumlah), 0) as value FROM transactions tx JOIN menus m ON tx.menu_id = m.id JOIN tenants t ON m.tenant_id = t.id JOIN users u ON t.user_id = u.id WHERE u.created_by = :admin_id GROUP BY tx.menu_id ORDER BY value DESC LIMIT 5");
    $pieStmt->execute(['admin_id' => $admin_id]);
    while ($row = $pieStmt->fetch()) {
        $pieChartBestSellers[] = [
            'name' => $row['name'],
            'value' => (int)$row['value']
        ];
    }

    // 8. Hourly Sales Distribution (9:00 to 21:00)
    $hourBuckets = [];
    for ($h = 9; $h <= 21; $h++) {
        $label = str_pad($h, 2, '0', STR_PAD_LEFT) . ':00';
        $hourBuckets[$h] = [
            'label' => $label,
            'hour' => $h,
            'transaksi' => 0,
            'pendapatan' => 0.0
        ];
    }

    $hourStmt = $pdo->prepare("SELECT HOUR(tx.tanggal_transaksi) as hr, COUNT(*) as tx_count, SUM(tx.total_harga) as revenue FROM transactions tx JOIN tenants t ON tx.tenant_id = t.id JOIN users u ON t.user_id = u.id WHERE u.created_by = :admin_id AND HOUR(tx.tanggal_transaksi) BETWEEN 9 AND 21 GROUP BY HOUR(tx.tanggal_transaksi)");
    $hourStmt->execute(['admin_id' => $admin_id]);
    while ($row = $hourStmt->fetch()) {
        $hr = (int)$row['hr'];
        if (isset($hourBuckets[$hr])) {
            $hourBuckets[$hr]['transaksi'] = (int)$row['tx_count'];
            $hourBuckets[$hr]['pendapatan'] = (float)$row['revenue'];
        }
    }

    // 9. Recent Transactions
    $recentStmt = $pdo->prepare("SELECT tx.id, tx.tenant_id, tx.menu_id, tx.jumlah, tx.total_harga, tx.tanggal_transaksi, tx.metode_pembayaran FROM transactions tx JOIN tenants t ON tx.tenant_id = t.id JOIN users u ON t.user_id = u.id WHERE u.created_by = :admin_id ORDER BY tx.tanggal_transaksi DESC LIMIT 6");
    $recentStmt->execute(['admin_id' => $admin_id]);
    $recentTransactions = $recentStmt->fetchAll();

    // Assemble final response
    $response = [
        'revenueToday' => $revenueToday,
        'revenueThisMonth' => $revenueThisMonth,
        'totalRevenue' => $totalRevenue,
        'totalTenants' => $tenantsCount,
        'totalMenus' => $menusCount,
        'totalUsers' => $usersCount,
        'totalTransactions' => $transactionsCount,
        'lineChartData' => array_values($lineChartData),
        'barChartTenantPerformance' => $tenantPerformance,
        'pieChartBestSellers' => $pieChartBestSellers,
        'hourDistribution' => array_values($hourBuckets),
        'recentTransactions' => format_db_row($recentTransactions)
    ];

    echo json_encode($response);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Gagal memproses analitik admin: ' . $e->getMessage()]);
}
?>
