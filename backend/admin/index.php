<?php
session_start();

// Validasi Hak Akses: Harus login dan rolenya wajib 'admin'
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    header("Location: login.php");
    exit;
}

require_once '../db.php';

// Inisialisasi variabel metrics default
$salesToday = 0;
$transactionsToday = 0;
$activeTenantsCount = 0;

try {
    // 1. Ambil KPI Metrics
    // Total Pendapatan Hari Ini
    $stmt1 = $pdo->query("SELECT SUM(total_harga) AS total_sales FROM `transactions` WHERE DATE(`tanggal_transaksi`) = CURDATE()");
    $res1 = $stmt1->fetch();
    $salesToday = $res1['total_sales'] ?? 0;
    
    // Total Transaksi Hari Ini
    $stmt2 = $pdo->query("SELECT COUNT(id) AS total_tx FROM `transactions` WHERE DATE(`tanggal_transaksi`) = CURDATE()");
    $res2 = $stmt2->fetch();
    $transactionsToday = $res2['total_tx'] ?? 0;
    
    // Jumlah Tenant Aktif
    $stmt3 = $pdo->query("SELECT COUNT(id) AS total_tenants FROM `tenants`");
    $res3 = $stmt3->fetch();
    $activeTenantsCount = $res3['total_tenants'] ?? 0;

    // 2. Fetch Data Grafik 1 (Bar Chart): Total Pendapatan per Tenant
    $stmtBar = $pdo->query("
        SELECT t.nama_tenant, COALESCE(SUM(tr.total_harga), 0) AS total_sales 
        FROM `tenants` t 
        LEFT JOIN `transactions` tr ON t.id = tr.tenant_id 
        GROUP BY t.id, t.nama_tenant
    ");
    $barData = $stmtBar->fetchAll();
    
    // Pecah data ke array untuk Chart.js
    $barLabels = [];
    $barValues = [];
    foreach ($barData as $row) {
        $barLabels[] = $row['nama_tenant'];
        $barValues[] = (float)$row['total_sales'];
    }

    // 3. Fetch Data Grafik 2 (Pie Chart): Tren Menu Paling Diminati (Qty Terjual)
    $stmtPie = $pdo->query("
        SELECT m.nama_menu, SUM(tr.jumlah) AS total_qty 
        FROM `transactions` tr 
        JOIN `menus` m ON tr.menu_id = m.id 
        GROUP BY m.id, m.nama_menu 
        ORDER BY total_qty DESC
    ");
    $pieData = $stmtPie->fetchAll();
    
    // Pecah data ke array untuk Chart.js
    $pieLabels = [];
    $pieValues = [];
    foreach ($pieData as $row) {
        $pieLabels[] = $row['nama_menu'];
        $pieValues[] = (int)$row['total_qty'];
    }

    // 4. Fetch 10 Transaksi Terakhir (Tabel Real-time)
    $stmtTxTable = $pdo->query("
        SELECT tr.tanggal_transaksi, t.nama_tenant, m.nama_menu, tr.jumlah, tr.total_harga 
        FROM `transactions` tr 
        JOIN `tenants` t ON tr.tenant_id = t.id 
        JOIN `menus` m ON tr.menu_id = m.id 
        ORDER BY tr.tanggal_transaksi DESC 
        LIMIT 10
    ");
    $recentTransactions = $stmtTxTable->fetchAll();

} catch (PDOException $e) {
    die("Error fetching dashboard data: " . $e->getMessage());
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - Sistem Informasi Foodcourt</title>
    <!-- Bootstrap 5 CSS CDN -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Chart.js Library CDN -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: #f4f6f9;
            color: #334155;
            min-height: 100vh;
        }

        /* Sidebar Styling */
        .sidebar {
            width: 250px;
            background-color: #0f172a;
            color: #f8fafc;
            min-height: 100vh;
            position: fixed;
            left: 0;
            top: 0;
            padding-top: 20px;
            z-index: 100;
        }

        .sidebar-logo {
            display: flex;
            align-items: center;
            padding: 10px 24px;
            margin-bottom: 30px;
            gap: 12px;
        }

        .sidebar-logo svg {
            width: 32px;
            height: 32px;
            fill: #0d6efd;
        }

        .sidebar-logo h1 {
            font-size: 18px;
            font-weight: 700;
            margin: 0;
            background: linear-gradient(135deg, #ffffff 40%, #0d6efd 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .nav-menu {
            display: flex;
            flex-direction: column;
            gap: 4px;
            padding: 0 16px;
        }

        .nav-link-custom {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            color: #94a3b8;
            text-decoration: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s ease;
        }

        .nav-link-custom:hover {
            background-color: #1e293b;
            color: #f8fafc;
        }

        .nav-link-custom.active {
            background-color: #0d6efd;
            color: #ffffff;
            font-weight: 600;
        }

        .nav-link-custom svg {
            width: 20px;
            height: 20px;
            fill: currentColor;
        }

        /* Main Content wrapper */
        .main-content {
            margin-left: 250px;
            padding: 24px 40px;
        }

        /* Topbar styling */
        .topbar {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 16px 24px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 30px;
        }

        .admin-profile {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .admin-avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: linear-gradient(135deg, #0d6efd, #8b5cf6);
            color: white;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
        }

        /* KPI Cards */
        .kpi-card {
            background-color: #ffffff;
            border-radius: 12px;
            border: none;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            padding: 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .kpi-title {
            font-size: 13px;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
        }

        .kpi-value {
            font-size: 26px;
            font-weight: 800;
            color: #0f172a;
            margin: 0;
        }

        .kpi-icon-box {
            width: 48px;
            height: 48px;
            border-radius: 10px;
            background-color: rgba(13, 110, 253, 0.1);
            color: #0d6efd;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .kpi-icon-box.green {
            background-color: rgba(25, 135, 84, 0.1);
            color: #198754;
        }

        .kpi-icon-box.orange {
            background-color: rgba(245, 158, 11, 0.1);
            color: #f59e0b;
        }

        .kpi-icon-box svg {
            width: 24px;
            height: 24px;
            fill: currentColor;
        }

        /* Analytics Dashboard Cards */
        .chart-card {
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            padding: 24px;
            margin-bottom: 24px;
            height: 100%;
        }

        .chart-title {
            font-size: 15px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 20px;
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 12px;
        }

        .chart-container {
            position: relative;
            height: 250px;
            width: 100%;
        }

        /* Table custom styling */
        .table-card {
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            padding: 24px;
            margin-bottom: 40px;
        }

        .table th {
            color: #64748b;
            font-weight: 600;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #f1f5f9;
            padding: 12px 16px;
        }

        .table td {
            padding: 16px;
            vertical-align: middle;
            font-size: 13.5px;
            color: #475569;
        }

        /* Responsive Sidebar */
        @media (max-width: 992px) {
            .sidebar {
                display: none;
            }
            .main-content {
                margin-left: 0;
                padding: 16px 20px;
            }
        }
    </style>
</head>
<body>

    <!-- Sidebar Menu -->
    <aside class="sidebar">
        <div class="sidebar-logo">
            <svg viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
            <h1>Foodcourt POS</h1>
        </div>
        <nav class="nav-menu">
            <a href="index.php" class="nav-link-custom active">
                <svg viewBox="0 0 24 24">
                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                </svg>
                Dashboard
            </a>
            <a href="#" class="nav-link-custom" onclick="alert('Fitur Manajemen Tenant dalam pengembangan.')">
                <svg viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v9z"/>
                </svg>
                Manajemen Tenant
            </a>
            <a href="#" class="nav-link-custom" onclick="alert('Fitur Manajemen Pengguna dalam pengembangan.')">
                <svg viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                Manajemen Pengguna
            </a>
            <a href="#" class="nav-link-custom" onclick="alert('Fitur Laporan Penjualan dalam pengembangan.')">
                <svg viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
                Laporan Penjualan
            </a>
        </nav>
    </aside>

    <!-- Main Workspace -->
    <main class="main-content">
        <!-- Topbar -->
        <header class="topbar">
            <div class="page-title-label">
                <h4 class="m-0 fw-bold">Overview Analitik</h4>
                <small class="text-muted">Hak Akses: Pengelola Foodcourt</small>
            </div>
            <div class="admin-profile">
                <div class="text-end">
                    <div class="fw-bold" style="font-size: 14px;"><?= htmlspecialchars($_SESSION['username']); ?></div>
                    <span class="badge bg-primary" style="font-size: 10px;">Administrator</span>
                </div>
                <div class="admin-avatar">A</div>
                <a href="../logout.php" class="btn btn-outline-danger btn-sm ms-2" title="Keluar dari sistem">Logout</a>
            </div>
        </header>

        <!-- KPI Cards Section -->
        <div class="row g-4 mb-4">
            <div class="col-md-4">
                <div class="kpi-card">
                    <div>
                        <p class="kpi-title">Total Pendapatan Hari Ini</p>
                        <h3 class="kpi-value">Rp <?= number_format($salesToday, 0, ',', '.'); ?></h3>
                    </div>
                    <div class="kpi-icon-box">
                        <svg viewBox="0 0 24 24">
                            <path d="M21 18v2H3v-2h18zM5 16h3v-6H5v6zm6 0h3V4h-3v12zm6 0h3v-9h-3v9z"/>
                        </svg>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="kpi-card">
                    <div>
                        <p class="kpi-title">Total Transaksi Hari Ini</p>
                        <h3 class="kpi-value"><?= number_format($transactionsToday, 0, ',', '.'); ?> Transaksi</h3>
                    </div>
                    <div class="kpi-icon-box green">
                        <svg viewBox="0 0 24 24">
                            <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                        </svg>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="kpi-card">
                    <div>
                        <p class="kpi-title">Jumlah Tenant Aktif</p>
                        <h3 class="kpi-value"><?= $activeTenantsCount; ?> Tenant</h3>
                    </div>
                    <div class="kpi-icon-box orange">
                        <svg viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                        </svg>
                    </div>
                </div>
            </div>
        </div>

        <!-- Charts Dashboard Section -->
        <div class="row mb-4">
            <!-- Bar Chart: Perbandingan Performa Penjualan Tenant -->
            <div class="col-lg-7">
                <div class="chart-card">
                    <h5 class="chart-title">Perbandingan Performa Penjualan Tenant</h5>
                    <div class="chart-container">
                        <canvas id="barChartTenantSales"></canvas>
                    </div>
                </div>
            </div>
            <!-- Pie Chart: Tren Menu Paling Diminati -->
            <div class="col-lg-5">
                <div class="chart-card">
                    <h5 class="chart-title">Tren Menu Paling Diminati (Qty Terjual)</h5>
                    <div class="chart-container">
                        <canvas id="pieChartMenuDemands"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <!-- Recent Transactions Table -->
        <div class="table-card">
            <h5 class="fw-bold mb-4" style="color: #0f172a;">Riwayat Transaksi Real-time</h5>
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Waktu Transaksi</th>
                            <th>Nama Tenant</th>
                            <th>Menu</th>
                            <th class="text-center">Qty</th>
                            <th class="text-end">Total Harga</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (count($recentTransactions) === 0): ?>
                            <tr>
                                <td colspan="5" class="text-center text-muted py-4">Belum ada riwayat transaksi masuk</td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($recentTransactions as $tx): ?>
                                <tr>
                                    <td><?= date('d-m-Y H:i:s', strtotime($tx['tanggal_transaksi'])); ?></td>
                                    <td><span class="fw-bold" style="color: #4f46e5;"><?= htmlspecialchars($tx['nama_tenant']); ?></span></td>
                                    <td><?= htmlspecialchars($tx['nama_menu']); ?></td>
                                    <td class="text-center fw-bold"><?= $tx['jumlah']; ?> porsi</td>
                                    <td class="text-end fw-bold text-dark">Rp <?= number_format($tx['total_harga'], 0, ',', '.'); ?></td>
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </main>

    <!-- Bootstrap Bundle JS CDN -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

    <!-- Chart.js Config Scripts -->
    <script>
        // Data dari backend PHP (Json encoded)
        const barLabels = <?= json_encode($barLabels); ?>;
        const barValues = <?= json_encode($barValues); ?>;
        
        const pieLabels = <?= json_encode($pieLabels); ?>;
        const pieValues = <?= json_encode($pieValues); ?>;

        // 1. Render Bar Chart - Performa Penjualan Tenant
        const ctxBar = document.getElementById('barChartTenantSales').getContext('2d');
        const barChart = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: barLabels,
                datasets: [{
                    label: 'Total Pendapatan (Rp)',
                    data: barValues,
                    backgroundColor: 'rgba(13, 110, 253, 0.75)',
                    borderColor: 'rgb(13, 110, 253)',
                    borderWidth: 1.5,
                    borderRadius: 6,
                    barThickness: 45
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: '#f1f5f9' },
                        ticks: {
                            callback: function(value) {
                                return 'Rp ' + value.toLocaleString('id-ID');
                            }
                        }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });

        // 2. Render Pie/Doughnut Chart - Tren Menu Paling Diminati
        const ctxPie = document.getElementById('pieChartMenuDemands').getContext('2d');
        const pieChart = new Chart(ctxPie, {
            type: 'doughnut',
            data: {
                labels: pieLabels,
                datasets: [{
                    data: pieValues,
                    backgroundColor: [
                        '#6366f1', // Indigo
                        '#10b981', // Emerald
                        '#f59e0b', // Amber
                        '#ec4899', // Pink
                        '#06b6d4', // Cyan
                        '#a855f7'  // Purple
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            boxWidth: 12,
                            font: { size: 11, family: "'Plus Jakarta Sans', sans-serif" }
                        }
                    }
                },
                cutout: '65%'
            }
        });
    </script>
</body>
</html>
