<?php
require_once __DIR__ . '/auth_helper.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    $session = require_auth();

    switch ($method) {
        case 'GET':
            if ($session['role'] === 'admin') {
                // Admin hanya melihat menu dari tenant yang terhubung dengan user yang dia buat
                $stmt = $pdo->prepare("SELECT m.* FROM menus m JOIN tenants t ON m.tenant_id = t.id JOIN users u ON t.user_id = u.id WHERE u.created_by = :admin_id");
                $stmt->execute(['admin_id' => $session['user_id']]);
                $menus = $stmt->fetchAll();
            } else {
                // Tenant can only see their own menus
                $stmt = $pdo->prepare("SELECT * FROM menus WHERE tenant_id = :tenant_id");
                $stmt->execute(['tenant_id' => $session['tenant_id']]);
                $menus = $stmt->fetchAll();
            }
            
            echo json_encode(format_db_row($menus));
            break;
            
        case 'POST':
            $input = get_json_input();
            
            $nama_menu = isset($input['nama_menu']) ? trim($input['nama_menu']) : '';
            $harga = isset($input['harga']) ? (float)$input['harga'] : 0.0;
            $kategori = isset($input['kategori']) ? trim($input['kategori']) : 'Makanan';
            $stok = isset($input['stok']) ? (int)$input['stok'] : 0;
            $status = isset($input['status']) ? trim($input['status']) : 'ready';
            $foto = isset($input['foto']) ? trim($input['foto']) : '';
            
            // Resolve tenant_id
            if ($session['role'] === 'admin') {
                $tenant_id = isset($input['tenant_id']) ? trim($input['tenant_id']) : '';
            } else {
                $tenant_id = $session['tenant_id']; // Enforce from session
            }

            if (empty($nama_menu) || empty($tenant_id) || $harga <= 0) {
                http_response_code(400);
                echo json_encode(['error' => 'Nama menu, stan tenant, dan harga valid wajib diisi.']);
                exit();
            }

            // Insert menu
            $insertStmt = $pdo->prepare("INSERT INTO menus (tenant_id, nama_menu, harga, kategori, stok, status, foto) VALUES (:tenant_id, :nama_menu, :harga, :kategori, :stok, :status, :foto)");
            $insertStmt->execute([
                'tenant_id' => $tenant_id,
                'nama_menu' => $nama_menu,
                'harga' => $harga,
                'kategori' => $kategori,
                'stok' => $stok,
                'status' => $status,
                'foto' => $foto
            ]);

            $newId = $pdo->lastInsertId();
            
            $responseMenu = [
                'id' => (string)$newId,
                'tenant_id' => (string)$tenant_id,
                'nama_menu' => $nama_menu,
                'harga' => $harga,
                'kategori' => $kategori,
                'stok' => $stok,
                'status' => $status,
                'foto' => $foto
            ];

            http_response_code(201);
            echo json_encode(format_db_row($responseMenu));
            break;
            
        case 'PUT':
            $input = get_json_input();
            $targetId = isset($input['id']) ? trim($input['id']) : '';

            if (empty($targetId)) {
                http_response_code(400);
                echo json_encode(['error' => 'ID Menu wajib disertakan dalam request body.']);
                exit();
            }

            // Fetch existing menu to check ownership
            $fetchStmt = $pdo->prepare("SELECT * FROM menus WHERE id = :id");
            $fetchStmt->execute(['id' => $targetId]);
            $existingMenu = $fetchStmt->fetch();

            if (!$existingMenu) {
                http_response_code(404);
                echo json_encode(['error' => 'Menu tidak ditemukan.']);
                exit();
            }

            // Check Ownership: if tenant, must match session tenant_id
            if ($session['role'] === 'tenant' && $existingMenu['tenant_id'] != $session['tenant_id']) {
                http_response_code(403);
                echo json_encode(['error' => 'Forbidden. Anda tidak memiliki wewenang mengedit menu stan ini.']);
                exit();
            }

            // Determine updated values
            $nama_menu = isset($input['nama_menu']) ? trim($input['nama_menu']) : $existingMenu['nama_menu'];
            $harga = isset($input['harga']) ? (float)$input['harga'] : (float)$existingMenu['harga'];
            $kategori = isset($input['kategori']) ? trim($input['kategori']) : $existingMenu['kategori'];
            $stok = isset($input['stok']) ? (int)$input['stok'] : (int)$existingMenu['stok'];
            $status = isset($input['status']) ? trim($input['status']) : $existingMenu['status'];
            $foto = isset($input['foto']) ? trim($input['foto']) : $existingMenu['foto'];
            
            $tenant_id = $existingMenu['tenant_id'];
            if ($session['role'] === 'admin') {
                $tenant_id = isset($input['tenant_id']) ? trim($input['tenant_id']) : $existingMenu['tenant_id'];
            }

            $updateStmt = $pdo->prepare("UPDATE menus SET tenant_id = :tenant_id, nama_menu = :nama_menu, harga = :harga, kategori = :kategori, stok = :stok, status = :status, foto = :foto WHERE id = :id");
            $updateStmt->execute([
                'tenant_id' => $tenant_id,
                'nama_menu' => $nama_menu,
                'harga' => $harga,
                'kategori' => $kategori,
                'stok' => $stok,
                'status' => $status,
                'foto' => $foto,
                'id' => $targetId
            ]);

            $responseMenu = [
                'id' => (string)$targetId,
                'tenant_id' => (string)$tenant_id,
                'nama_menu' => $nama_menu,
                'harga' => $harga,
                'kategori' => $kategori,
                'stok' => $stok,
                'status' => $status,
                'foto' => $foto
            ];

            echo json_encode(format_db_row($responseMenu));
            break;
            
        case 'DELETE':
            $id = isset($_GET['id']) ? trim($_GET['id']) : '';
            if (empty($id)) {
                http_response_code(400);
                echo json_encode(['error' => 'ID query parameter wajib disertakan.']);
                exit();
            }

            // Fetch existing menu to check ownership
            $fetchStmt = $pdo->prepare("SELECT * FROM menus WHERE id = :id");
            $fetchStmt->execute(['id' => $id]);
            $existingMenu = $fetchStmt->fetch();

            if (!$existingMenu) {
                http_response_code(404);
                echo json_encode(['error' => 'Menu tidak ditemukan.']);
                exit();
            }

            // Check Ownership: if tenant, must match session tenant_id
            if ($session['role'] === 'tenant' && $existingMenu['tenant_id'] != $session['tenant_id']) {
                http_response_code(403);
                echo json_encode(['error' => 'Forbidden. Anda tidak memiliki wewenang menghapus menu stan ini.']);
                exit();
            }

            $deleteStmt = $pdo->prepare("DELETE FROM menus WHERE id = :id");
            $deleteStmt->execute(['id' => $id]);

            echo json_encode(['success' => true, 'message' => 'Menu berhasil dihapus.']);
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
