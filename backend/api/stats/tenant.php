<?php
require_once __DIR__ . '/../auth_helper.php';

try {
    // Require tenant role
    $session = require_auth(['tenant']);
    $tenant_id = $session['tenant_id'];

    if (empty($tenant_id)) {
        http_response_code(400);
        echo json_encode(['error' => 'Stan tenant tidak teridentifikasi pada sesi Anda.']);
        exit();
    }

    // 1. Revenue Today
    $todayStmt = $pdo->prepare("SELECT COALESCE(SUM(total_harga), 0) as val FROM transactions WHERE tenant_id = :tenant_id AND DATE(tanggal_transaksi) = CURRENT_DATE()");
    $todayStmt->execute(['tenant_id' => $tenant_id]);
    $revenueToday = (float)$todayStmt->fetch()['val'];

    // 2. Revenue This Month
    $monthStmt = $pdo->prepare("SELECT COALESCE(SUM(total_harga), 0) as val FROM transactions WHERE tenant_id = :tenant_id AND YEAR(tanggal_transaksi) = YEAR(CURRENT_DATE()) AND MONTH(tanggal_transaksi) = MONTH(CURRENT_DATE())");
    $monthStmt->execute(['tenant_id' => $tenant_id]);
    $revenueThisMonth = (float)$monthStmt->fetch()['val'];

    // 3. Total Revenue
    $totalRevStmt = $pdo->prepare("SELECT COALESCE(SUM(total_harga), 0) as val FROM transactions WHERE tenant_id = :tenant_id");
    $totalRevStmt->execute(['tenant_id' => $tenant_id]);
    $totalRevenue = (float)$totalRevStmt->fetch()['val'];

    // 4. Counts
    $salesCountStmt = $pdo->prepare("SELECT COUNT(*) FROM transactions WHERE tenant_id = :tenant_id");
    $salesCountStmt->execute(['tenant_id' => $tenant_id]);
    $totalSalesCount = (int)$salesCountStmt->fetchColumn();

    $menusCountStmt = $pdo->prepare("SELECT COUNT(*) FROM menus WHERE tenant_id = :tenant_id");
    $menusCountStmt->execute(['tenant_id' => $tenant_id]);
    $totalMenusCount = (int)$menusCountStmt->fetchColumn();

    // 5. Best Seller Menu Name
    $bestSellerStmt = $pdo->prepare("SELECT m.nama_menu FROM transactions tx JOIN menus m ON tx.menu_id = m.id WHERE tx.tenant_id = :tenant_id GROUP BY tx.menu_id ORDER BY SUM(tx.jumlah) DESC LIMIT 1");
    $bestSellerStmt->execute(['tenant_id' => $tenant_id]);
    $bestSellerRow = $bestSellerStmt->fetch();
    $bestSellerMenu = $bestSellerRow ? $bestSellerRow['nama_menu'] : 'Belum Ada';

    // 6. Line Chart Data (Past 7 Days)
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

    $chartStmt = $pdo->prepare("SELECT DATE(tanggal_transaksi) as tgl, SUM(total_harga) as revenue FROM transactions WHERE tenant_id = :tenant_id AND tanggal_transaksi >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 DAY) GROUP BY DATE(tanggal_transaksi)");
    $chartStmt->execute(['tenant_id' => $tenant_id]);
    while ($row = $chartStmt->fetch()) {
        $tglDate = $row['tgl'];
        if (isset($lineChartData[$tglDate])) {
            $lineChartData[$tglDate]['pendapatan'] = (float)$row['revenue'];
        }
    }

    // 7. Recent Transactions (last 5)
    $recentStmt = $pdo->prepare("SELECT tx.id, tx.tenant_id, tx.menu_id, tx.jumlah, tx.total_harga, tx.tanggal_transaksi, tx.metode_pembayaran FROM transactions tx WHERE tx.tenant_id = :tenant_id ORDER BY tx.tanggal_transaksi DESC LIMIT 5");
    $recentStmt->execute(['tenant_id' => $tenant_id]);
    $recentTransactions = $recentStmt->fetchAll();

    // Assemble final response
    $response = [
        'revenueToday' => $revenueToday,
        'revenueThisMonth' => $revenueThisMonth,
        'totalRevenue' => $totalRevenue,
        'totalSalesCount' => $totalSalesCount,
        'bestSellerMenu' => $bestSellerMenu,
        'totalMenusCount' => $totalMenusCount,
        'chartData' => array_values($lineChartData),
        'recentTransactions' => format_db_row($recentTransactions)
    ];

    echo json_encode($response);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Gagal memproses analitik tenant: ' . $e->getMessage()]);
}
?>
