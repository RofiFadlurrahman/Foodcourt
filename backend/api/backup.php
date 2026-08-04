<?php
require_once __DIR__ . '/auth_helper.php';

try {
    // Only admin can perform backup / restore operations
    $session = require_auth(['admin']);
    $admin_id = $session['user_id'];

    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {
        case 'GET':
            $userStmt = $pdo->prepare("SELECT * FROM users WHERE created_by = :admin_id1 OR id = :admin_id2");
            $userStmt->execute([
                'admin_id1' => $admin_id,
                'admin_id2' => $admin_id
            ]);
            $users = $userStmt->fetchAll();

            // 2. Fetch only this admin's tenants
            $tenantStmt = $pdo->prepare("SELECT t.* FROM tenants t JOIN users u ON t.user_id = u.id WHERE u.created_by = :admin_id");
            $tenantStmt->execute(['admin_id' => $admin_id]);
            $tenants = $tenantStmt->fetchAll();

            // 3. Fetch only this admin's menus
            $menuStmt = $pdo->prepare("SELECT m.* FROM menus m JOIN tenants t ON m.tenant_id = t.id JOIN users u ON t.user_id = u.id WHERE u.created_by = :admin_id");
            $menuStmt->execute(['admin_id' => $admin_id]);
            $menus = $menuStmt->fetchAll();

            // 4. Fetch only this admin's transactions
            $txStmt = $pdo->prepare("SELECT tx.* FROM transactions tx JOIN tenants t ON tx.tenant_id = t.id JOIN users u ON t.user_id = u.id WHERE u.created_by = :admin_id");
            $txStmt->execute(['admin_id' => $admin_id]);
            $transactions = $txStmt->fetchAll();

            $backupData = [
                'users' => format_db_row($users),
                'tenants' => format_db_row($tenants),
                'menus' => format_db_row($menus),
                'transactions' => format_db_row($transactions)
            ];

            echo json_encode($backupData, JSON_PRETTY_PRINT);
            break;

        case 'POST':
            $input = get_json_input();

            // Validate structure
            if (!isset($input['users']) || !isset($input['tenants']) || !isset($input['menus']) || !isset($input['transactions'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Format JSON backup tidak valid. Harus mengandung tabel users, tenants, menus, dan transactions.']);
                exit();
            }

            // Begin transaction and disable FK checks to allow clean deletes/inserts
            $pdo->beginTransaction();
            $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");

            try {
                // 1. Delete only this admin's data (avoiding truncating other admins' data)
                
                // Delete transactions
                $delTx = $pdo->prepare("DELETE tx FROM transactions tx JOIN tenants t ON tx.tenant_id = t.id JOIN users u ON t.user_id = u.id WHERE u.created_by = :admin_id");
                $delTx->execute(['admin_id' => $admin_id]);

                // Delete menus
                $delMenu = $pdo->prepare("DELETE m FROM menus m JOIN tenants t ON m.tenant_id = t.id JOIN users u ON t.user_id = u.id WHERE u.created_by = :admin_id");
                $delMenu->execute(['admin_id' => $admin_id]);

                // Delete tenants
                $delTenant = $pdo->prepare("DELETE t FROM tenants t JOIN users u ON t.user_id = u.id WHERE u.created_by = :admin_id");
                $delTenant->execute(['admin_id' => $admin_id]);

                // Delete users (excluding the admin themselves)
                $delUser = $pdo->prepare("DELETE FROM users WHERE created_by = :admin_id");
                $delUser->execute(['admin_id' => $admin_id]);

                // 2. Insert users from backup
                $userStmt = $pdo->prepare("INSERT INTO users (id, username, password, role, fullName, email, avatar, created_by) VALUES (:id, :username, :password, :role, :fullName, :email, :avatar, :created_by)");
                foreach ($input['users'] as $u) {
                    // Skip inserting if it is the admin's own record (as it was not deleted)
                    if ($u['id'] == $admin_id) {
                        continue;
                    }
                    $userStmt->execute([
                        'id' => $u['id'],
                        'username' => $u['username'],
                        'password' => $u['password'],
                        'role' => $u['role'],
                        'fullName' => $u['fullName'],
                        'email' => $u['email'],
                        'avatar' => $u['avatar'] ?? null,
                        'created_by' => $admin_id // Enforce connection to this admin
                    ]);
                }

                // 3. Insert tenants
                $tenantStmt = $pdo->prepare("INSERT INTO tenants (id, user_id, nama_tenant, nama_pemilik, hp, email, status, foto) VALUES (:id, :user_id, :nama_tenant, :nama_pemilik, :hp, :email, :status, :foto)");
                foreach ($input['tenants'] as $t) {
                    $tenantStmt->execute([
                        'id' => $t['id'],
                        'user_id' => $t['user_id'],
                        'nama_tenant' => $t['nama_tenant'],
                        'nama_pemilik' => $t['nama_pemilik'],
                        'hp' => $t['hp'],
                        'email' => $t['email'],
                        'status' => $t['status'] ?? 'active',
                        'foto' => $t['foto'] ?? null
                    ]);
                }

                // 4. Insert menus
                $menuStmt = $pdo->prepare("INSERT INTO menus (id, tenant_id, nama_menu, harga, kategori, stok, status, foto) VALUES (:id, :tenant_id, :nama_menu, :harga, :kategori, :stok, :status, :foto)");
                foreach ($input['menus'] as $m) {
                    $menuStmt->execute([
                        'id' => $m['id'],
                        'tenant_id' => $m['tenant_id'],
                        'nama_menu' => $m['nama_menu'],
                        'harga' => $m['harga'],
                        'kategori' => $m['kategori'] ?? 'Makanan',
                        'stok' => $m['stok'] ?? 0,
                        'status' => $m['status'] ?? 'ready',
                        'foto' => $m['foto'] ?? null
                    ]);
                }

                // 5. Insert transactions
                $txStmt = $pdo->prepare("INSERT INTO transactions (id, tenant_id, menu_id, jumlah, total_harga, tanggal_transaksi, metode_pembayaran) VALUES (:id, :tenant_id, :menu_id, :jumlah, :total_harga, :tanggal_transaksi, :metode_pembayaran)");
                foreach ($input['transactions'] as $tx) {
                    $txStmt->execute([
                        'id' => $tx['id'],
                        'tenant_id' => $tx['tenant_id'],
                        'menu_id' => $tx['menu_id'],
                        'jumlah' => $tx['jumlah'],
                        'total_harga' => $tx['total_harga'],
                        'tanggal_transaksi' => $tx['tanggal_transaksi'],
                        'metode_pembayaran' => $tx['metode_pembayaran'] ?? 'Cash'
                    ]);
                }

                $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
                $pdo->commit();

                echo json_encode(['success' => true, 'message' => 'Restore data pengelola berhasil dilakukan.']);

            } catch (Exception $e) {
                $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
                $pdo->rollBack();
                throw $e;
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed.']);
            break;
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Gagal memproses backup/restore: ' . $e->getMessage()]);
}
?>
