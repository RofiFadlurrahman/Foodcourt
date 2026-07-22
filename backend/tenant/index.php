<?php
session_start();

// Validasi Hak Akses: Harus login dan rolenya wajib 'tenant'
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'tenant') {
    header("Location: login.php");
    exit;
}

require_once '../db.php';

$tenantId = $_SESSION['tenant_id'] ?? 0;
$namaTenant = $_SESSION['nama_tenant'] ?? 'Tenant';

$successMsg = '';
$errorMsg = '';

// Proses form input penjualan kasir (POST)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'save_transaction') {
    $menuIdInput = intval($_POST['menu_id'] ?? 0);
    $qtyInput    = intval($_POST['qty'] ?? 0);
    
    if ($menuIdInput > 0 && $qtyInput > 0) {
        try {
            // Validasi menu: pastikan menu tersebut milik tenant yang sedang login
            $stmtCheckMenu = $pdo->prepare("SELECT * FROM `menus` WHERE `id` = ? AND `tenant_id` = ?");
            $stmtCheckMenu->execute([$menuIdInput, $tenantId]);
            $menu = $stmtCheckMenu->fetch();
            
            if ($menu) {
                // Hitung total harga = harga menu * qty
                $hargaMenu  = (float)$menu['harga'];
                $totalHarga = $hargaMenu * $qtyInput;
                
                // Simpan transaksi baru ke database
                $stmtInsert = $pdo->prepare("
                    INSERT INTO `transactions` (`tenant_id`, `menu_id`, `jumlah`, `total_harga`, `tanggal_transaksi`) 
                    VALUES (?, ?, ?, ?, NOW())
                ");
                $stmtInsert->execute([$tenantId, $menuIdInput, $qtyInput, $totalHarga]);
                
                $successMsg = "Transaksi '{$menu['nama_menu']} x{$qtyInput}' berhasil disimpan!";
            } else {
                $errorMsg = "Menu tidak valid untuk tenant Anda!";
            }
        } catch (PDOException $e) {
            $errorMsg = "Gagal menyimpan transaksi: " . $e->getMessage();
        }
    } else {
        $errorMsg = "Harap masukkan menu dan porsi yang valid!";
    }
}

// Inisialisasi variabel metrics default
$mySalesToday = 0;
$myTransactionsToday = 0;
$myMenus = [];
$myTransactions = [];

try {
    // 1. Ambil KPI Metrics khusus Tenant ini saja
    // Pendapatan Saya Hari Ini
    $stmt1 = $pdo->prepare("SELECT SUM(total_harga) AS total_sales FROM `transactions` WHERE `tenant_id` = ? AND DATE(`tanggal_transaksi`) = CURDATE()");
    $stmt1->execute([$tenantId]);
    $res1 = $stmt1->fetch();
    $mySalesToday = $res1['total_sales'] ?? 0;
    
    // Transaksi Saya Hari Ini
    $stmt2 = $pdo->prepare("SELECT COUNT(id) AS total_tx FROM `transactions` WHERE `tenant_id` = ? AND DATE(`tanggal_transaksi`) = CURDATE()");
    $stmt2->execute([$tenantId]);
    $res2 = $stmt2->fetch();
    $myTransactionsToday = $res2['total_tx'] ?? 0;

    // 2. Ambil data dropdown menu milik tenant ini
    $stmtMenus = $pdo->prepare("SELECT * FROM `menus` WHERE `tenant_id` = ? ORDER BY `nama_menu` ASC");
    $stmtMenus->execute([$tenantId]);
    $myMenus = $stmtMenus->fetchAll();

    // 3. Ambil data Tabel Riwayat Penjualan Saya Hari Ini
    $stmtTxTable = $pdo->prepare("
        SELECT tr.tanggal_transaksi, m.nama_menu, tr.jumlah, tr.total_harga 
        FROM `transactions` tr 
        JOIN `menus` m ON tr.menu_id = m.id 
        WHERE tr.tenant_id = ? AND DATE(tr.tanggal_transaksi) = CURDATE()
        ORDER BY tr.tanggal_transaksi DESC
    ");
    $stmtTxTable->execute([$tenantId]);
    $myTransactions = $stmtTxTable->fetchAll();

} catch (PDOException $e) {
    $errorMsg = "Gagal memuat data dashboard: " . $e->getMessage();
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tenant Dashboard - Sistem Kasir Foodcourt</title>
    <!-- Bootstrap 5 CSS CDN -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
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
            background-color: #0f2a1d; /* Hijau gelap khas tenant */
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
            fill: #198754;
        }

        .sidebar-logo h1 {
            font-size: 18px;
            font-weight: 700;
            margin: 0;
            background: linear-gradient(135deg, #ffffff 40%, #198754 100%);
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
            color: #a3b8ad;
            text-decoration: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s ease;
        }

        .nav-link-custom:hover {
            background-color: #163e2a;
            color: #f8fafc;
        }

        .nav-link-custom.active {
            background-color: #198754;
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

        .tenant-profile {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .tenant-avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: linear-gradient(135deg, #198754, #10b981);
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
            background-color: rgba(25, 135, 84, 0.1);
            color: #198754;
            display: flex;
            align-items: center;
            justify-content: center;
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

        /* Cards Layout */
        .card-custom {
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            padding: 24px;
            border: none;
            margin-bottom: 24px;
        }

        .card-custom-title {
            font-size: 15px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 20px;
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 12px;
        }

        /* Table custom styling */
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

        /* Form Custom Controls */
        .form-label {
            font-size: 12.5px;
            font-weight: 600;
            color: #475569;
        }

        .form-select, .form-control {
            border: 1px solid #cbd5e1;
            padding: 10px 14px;
            font-size: 14px;
            border-radius: 8px;
        }

        .form-select:focus, .form-control:focus {
            border-color: #198754;
            box-shadow: 0 0 0 2.5px rgba(25, 135, 84, 0.2);
        }

        .btn-success {
            background-color: #198754;
            border: none;
            padding: 10px 16px;
            font-weight: 600;
            border-radius: 8px;
        }

        .btn-success:hover {
            background-color: #157347;
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
            <a href="#input-penjualan" class="nav-link-custom">
                <svg viewBox="0 0 24 24">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                Input Penjualan
            </a>
            <a href="#riwayat-penjualan" class="nav-link-custom">
                <svg viewBox="0 0 24 24">
                    <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
                </svg>
                Riwayat Penjualan
            </a>
        </nav>
    </aside>

    <!-- Main Workspace -->
    <main class="main-content">
        <!-- Topbar -->
        <header class="topbar">
            <div class="page-title-label">
                <h4 class="m-0 fw-bold"><?= htmlspecialchars($namaTenant); ?></h4>
                <small class="text-muted">Hak Akses: Penjual (Tenant)</small>
            </div>
            <div class="tenant-profile">
                <div class="text-end">
                    <div class="fw-bold" style="font-size: 14px;"><?= htmlspecialchars($_SESSION['username']); ?></div>
                    <span class="badge bg-success" style="font-size: 10px;">Mitra Tenant</span>
                </div>
                <div class="tenant-avatar"><?= strtoupper(substr($_SESSION['username'], 0, 1)); ?></div>
                <a href="../logout.php" class="btn btn-outline-danger btn-sm ms-2" title="Keluar dari sistem">Logout</a>
            </div>
        </header>

        <!-- Notification Alerts -->
        <?php if (!empty($successMsg)): ?>
            <div class="alert alert-success alert-dismissible fade show d-flex align-items-center gap-2 border-0 shadow-sm mb-4" role="alert">
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <div><?= htmlspecialchars($successMsg); ?></div>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        <?php endif; ?>

        <?php if (!empty($errorMsg)): ?>
            <div class="alert alert-danger alert-dismissible fade show d-flex align-items-center gap-2 border-0 shadow-sm mb-4" role="alert">
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
                </svg>
                <div><?= htmlspecialchars($errorMsg); ?></div>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        <?php endif; ?>

        <!-- KPI Cards Section -->
        <div class="row g-4 mb-4">
            <div class="col-md-6">
                <div class="kpi-card">
                    <div>
                        <p class="kpi-title">Pendapatan Saya Hari Ini</p>
                        <h3 class="kpi-value">Rp <?= number_format($mySalesToday, 0, ',', '.'); ?></h3>
                    </div>
                    <div class="kpi-icon-box">
                        <svg viewBox="0 0 24 24">
                            <path d="M21 18v2H3v-2h18zM5 16h3v-6H5v6zm6 0h3V4h-3v12zm6 0h3v-9h-3v9z"/>
                        </svg>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="kpi-card">
                    <div>
                        <p class="kpi-title">Transaksi Saya Hari Ini</p>
                        <h3 class="kpi-value"><?= number_format($myTransactionsToday, 0, ',', '.'); ?> Transaksi</h3>
                    </div>
                    <div class="kpi-icon-box orange">
                        <svg viewBox="0 0 24 24">
                            <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                        </svg>
                    </div>
                </div>
            </div>
        </div>

        <div class="row g-4 mb-4">
            <!-- Form Input Transaksi Penjualan -->
            <div class="col-lg-5" id="input-penjualan">
                <div class="card-custom">
                    <h5 class="card-custom-title">Input Transaksi Penjualan</h5>
                    <form action="" method="POST">
                        <input type="hidden" name="action" value="save_transaction">
                        
                        <div class="mb-3">
                            <label for="menu_id" class="form-label mb-1">Pilih Menu Hidangan</label>
                            <select class="form-select" id="menu_id" name="menu_id" required>
                                <option value="" disabled selected>-- Pilih Menu --</option>
                                <?php foreach ($myMenus as $menu): ?>
                                    <option value="<?= $menu['id']; ?>" data-price="<?= $menu['harga']; ?>">
                                        <?= htmlspecialchars($menu['nama_menu']); ?> (Rp <?= number_format($menu['harga'], 0, ',', '.'); ?>)
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        
                        <div class="mb-3">
                            <label for="qty" class="form-label mb-1">Jumlah Porsi (Qty)</label>
                            <input type="number" class="form-control" id="qty" name="qty" min="1" value="1" required>
                        </div>

                        <!-- Real-time total calculation panel -->
                        <div class="p-3 mb-4 rounded-3 text-start" style="background-color: #f8fafc; border: 1px solid #e2e8f0;">
                            <span class="text-muted d-block" style="font-size: 11px; font-weight: 600; text-transform: uppercase;">Estimasi Total Bayar</span>
                            <h4 class="m-0 fw-extrabold text-success" id="totalPreview">Rp 0</h4>
                        </div>
                        
                        <button type="submit" class="btn btn-success w-100">Simpan Transaksi</button>
                    </form>
                </div>
            </div>

            <!-- Table Riwayat Penjualan Hari Ini -->
            <div class="col-lg-7" id="riwayat-penjualan">
                <div class="card-custom h-100">
                    <h5 class="card-custom-title">Riwayat Penjualan Saya Hari Ini</h5>
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>Waktu</th>
                                    <th>Menu Terjual</th>
                                    <th class="text-center">Qty</th>
                                    <th class="text-end">Total Harga</th>
                                    <th class="text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if (count($myTransactions) === 0): ?>
                                    <tr>
                                        <td colspan="5" class="text-center text-muted py-4">Belum ada transaksi diinput hari ini</td>
                                    </tr>
                                <?php else: ?>
                                    <?php foreach ($myTransactions as $tx): ?>
                                        <tr>
                                            <td><?= date('H:i:s', strtotime($tx['tanggal_transaksi'])); ?></td>
                                            <td class="fw-bold text-dark"><?= htmlspecialchars($tx['nama_menu']); ?></td>
                                            <td class="text-center fw-bold"><?= $tx['jumlah']; ?></td>
                                            <td class="text-end fw-bold text-success">Rp <?= number_format($tx['total_harga'], 0, ',', '.'); ?></td>
                                            <td class="text-center"><span class="badge bg-success" style="font-size: 11px;">Berhasil</span></td>
                                        </tr>
                                    <?php endforeach; ?>
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- Bootstrap Bundle JS CDN -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

    <!-- Real-time price calculator script -->
    <script>
        const menuSelect = document.getElementById('menu_id');
        const qtyInput    = document.getElementById('qty');
        const totalPreview = document.getElementById('totalPreview');

        function calculateTotal() {
            const selectedOption = menuSelect.options[menuSelect.selectedIndex];
            const qty = parseInt(qtyInput.value) || 0;
            
            if (selectedOption && selectedOption.value !== "") {
                const price = parseFloat(selectedOption.getAttribute('data-price')) || 0;
                const total = price * qty;
                totalPreview.innerText = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(total);
            } else {
                totalPreview.innerText = "Rp 0";
            }
        }

        // Event listeners
        menuSelect.addEventListener('change', calculateTotal);
        qtyInput.addEventListener('input', calculateTotal);
    </script>
</body>
</html>
