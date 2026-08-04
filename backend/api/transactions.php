<?php
require_once __DIR__ . '/auth_helper.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    $session = require_auth();

    switch ($method) {
        case 'GET':
            if ($session['role'] === 'admin') {
                // Admin hanya melihat transaksi dari tenant yang terhubung dengan user yang dia buat
                $stmt = $pdo->prepare("SELECT tx.* FROM transactions tx JOIN tenants t ON tx.tenant_id = t.id JOIN users u ON t.user_id = u.id WHERE u.created_by = :admin_id");
                $stmt->execute(['admin_id' => $session['user_id']]);
                $txs = $stmt->fetchAll();
            } else {
                // Tenant can only see their own transactions
                $stmt = $pdo->prepare("SELECT * FROM transactions WHERE tenant_id = :tenant_id");
                $stmt->execute(['tenant_id' => $session['tenant_id']]);
                $txs = $stmt->fetchAll();
            }
            
            echo json_encode(format_db_row($txs));
            break;
            
        case 'POST':
            // Only tenants are allowed to create transactions (via POS cashier)
            if ($session['role'] !== 'tenant') {
                http_response_code(403);
                echo json_encode(['error' => 'Forbidden. Hanya Stan Tenant yang dapat mencatat transaksi penjualan.']);
                exit();
            }

            $input = get_json_input();
            
            $menu_id = isset($input['menu_id']) ? trim($input['menu_id']) : '';
            $jumlah = isset($input['jumlah']) ? (int)$input['jumlah'] : 0;
            $total_harga = isset($input['total_harga']) ? (float)$input['total_harga'] : 0.0;
            $metode_pembayaran = isset($input['metode_pembayaran']) ? trim($input['metode_pembayaran']) : 'Cash';
            $tenant_id = $session['tenant_id']; // Enforce from session

            if (empty($menu_id) || $jumlah <= 0 || $total_harga <= 0) {
                http_response_code(400);
                echo json_encode(['error' => 'Data input transaksi tidak valid atau tidak lengkap.']);
                exit();
            }

            // 1. Verify that the menu exists, belongs to the tenant, and has enough stock
            $menuStmt = $pdo->prepare("SELECT tenant_id, stok, status, nama_menu FROM menus WHERE id = :menu_id");
            $menuStmt->execute(['menu_id' => $menu_id]);
            $menu = $menuStmt->fetch();

            if (!$menu) {
                http_response_code(404);
                echo json_encode(['error' => 'Menu hidangan tidak ditemukan.']);
                exit();
            }

            if ($menu['tenant_id'] != $tenant_id) {
                http_response_code(403);
                echo json_encode(['error' => 'Forbidden. Menu ini bukan milik stan outlet Anda.']);
                exit();
            }

            if ($menu['stok'] < $jumlah) {
                http_response_code(400);
                echo json_encode(['error' => 'Stok menu "' . $menu['nama_menu'] . '" tidak mencukupi (sisa ' . $menu['stok'] . ').']);
                exit();
            }

            // Begin Transaction to ensure database integrity
            $pdo->beginTransaction();

            try {
                // 2. Insert transaction
                $insertStmt = $pdo->prepare("INSERT INTO transactions (tenant_id, menu_id, jumlah, total_harga, metode_pembayaran) VALUES (:tenant_id, :menu_id, :jumlah, :total_harga, :metode_pembayaran)");
                $insertStmt->execute([
                    'tenant_id' => $tenant_id,
                    'menu_id' => $menu_id,
                    'jumlah' => $jumlah,
                    'total_harga' => $total_harga,
                    'metode_pembayaran' => $metode_pembayaran
                ]);

                $newTxId = $pdo->lastInsertId();

                // 3. Deduct stock from menu and update status if empty
                $newStock = $menu['stok'] - $jumlah;
                $newStatus = ($newStock === 0) ? 'empty' : $menu['status'];
                
                $updateStmt = $pdo->prepare("UPDATE menus SET stok = :stok, status = :status WHERE id = :menu_id");
                $updateStmt->execute([
                    'stok' => $newStock,
                    'status' => $newStatus,
                    'menu_id' => $menu_id
                ]);

                $pdo->commit();

                // Retrieve the newly created transaction
                $txStmt = $pdo->prepare("SELECT * FROM transactions WHERE id = :id");
                $txStmt->execute(['id' => $newTxId]);
                $newTx = $txStmt->fetch();

                http_response_code(201);
                echo json_encode(format_db_row($newTx));

            } catch (Exception $e) {
                $pdo->rollBack();
                throw $e;
            }
            break;
            
        case 'DELETE':
            $id = isset($_GET['id']) ? trim($_GET['id']) : '';
            if (empty($id)) {
                http_response_code(400);
                echo json_encode(['error' => 'ID query parameter wajib disertakan.']);
                exit();
            }

            // Fetch existing transaction to check ownership
            $fetchStmt = $pdo->prepare("SELECT * FROM transactions WHERE id = :id");
            $fetchStmt->execute(['id' => $id]);
            $existingTx = $fetchStmt->fetch();

            if (!$existingTx) {
                http_response_code(404);
                echo json_encode(['error' => 'Transaksi tidak ditemukan.']);
                exit();
            }

            // Check Ownership: if tenant, must match session tenant_id
            if ($session['role'] === 'tenant' && $existingTx['tenant_id'] != $session['tenant_id']) {
                http_response_code(403);
                echo json_encode(['error' => 'Forbidden. Anda tidak memiliki wewenang menghapus transaksi stan ini.']);
                exit();
            }

            $deleteStmt = $pdo->prepare("DELETE FROM transactions WHERE id = :id");
            $deleteStmt->execute(['id' => $id]);

            echo json_encode(['success' => true, 'message' => 'Transaksi berhasil dihapus.']);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed.']);
            break;
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Kesalahan database: ' . $e->getMessage()]);
}
?>
