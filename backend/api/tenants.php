<?php
require_once __DIR__ . '/auth_helper.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Require login
            $session = require_auth();
            
            if ($session['role'] === 'admin') {
                // Admin hanya melihat tenant yang terhubung dengan user yang dia buat
                $stmt = $pdo->prepare("SELECT t.* FROM tenants t JOIN users u ON t.user_id = u.id WHERE u.created_by = :admin_id");
                $stmt->execute(['admin_id' => $session['user_id']]);
            } else {
                // Tenant melihat tenant yang berada di bawah pengelola yang sama
                $stmt = $pdo->prepare("SELECT t.* FROM tenants t JOIN users u ON t.user_id = u.id WHERE u.created_by = (SELECT created_by FROM users WHERE id = :user_id)");
                $stmt->execute(['user_id' => $session['user_id']]);
            }
            $tenants = $stmt->fetchAll();
            
            echo json_encode(format_db_row($tenants));
            break;
            
        case 'POST':
            // Publicly allowed for tenant registration, or restricted to admin
            $input = get_json_input();
            
            $user_id = isset($input['user_id']) ? trim($input['user_id']) : '';
            $nama_tenant = isset($input['nama_tenant']) ? trim($input['nama_tenant']) : '';
            $nama_pemilik = isset($input['nama_pemilik']) ? trim($input['nama_pemilik']) : '';
            $hp = isset($input['hp']) ? trim($input['hp']) : '';
            $email = isset($input['email']) ? trim(strtolower($input['email'])) : '';
            $status = isset($input['status']) ? trim($input['status']) : 'active';
            $foto = isset($input['foto']) ? trim($input['foto']) : '';

            if (empty($user_id) || empty($nama_tenant) || empty($nama_pemilik) || empty($hp) || empty($email)) {
                http_response_code(400);
                echo json_encode(['error' => 'Data input tidak lengkap untuk profil tenant.']);
                exit();
            }

            // Check if user already has a tenant profile
            $checkStmt = $pdo->prepare("SELECT id FROM tenants WHERE user_id = :user_id");
            $checkStmt->execute(['user_id' => $user_id]);
            if ($checkStmt->fetch()) {
                http_response_code(400);
                echo json_encode(['error' => 'User ID ini sudah memiliki profil stan tenant.']);
                exit();
            }

            // Insert new tenant
            $insertStmt = $pdo->prepare("INSERT INTO tenants (user_id, nama_tenant, nama_pemilik, hp, email, status, foto) VALUES (:user_id, :nama_tenant, :nama_pemilik, :hp, :email, :status, :foto)");
            $insertStmt->execute([
                'user_id' => $user_id,
                'nama_tenant' => $nama_tenant,
                'nama_pemilik' => $nama_pemilik,
                'hp' => $hp,
                'email' => $email,
                'status' => $status,
                'foto' => $foto
            ]);

            $newId = $pdo->lastInsertId();
            
            $responseTenant = [
                'id' => (string)$newId,
                'user_id' => (string)$user_id,
                'nama_tenant' => $nama_tenant,
                'nama_pemilik' => $nama_pemilik,
                'hp' => $hp,
                'email' => $email,
                'status' => $status,
                'foto' => $foto
            ];

            http_response_code(201);
            echo json_encode(format_db_row($responseTenant));
            break;
            
        case 'PUT':
            // Require login
            $session = require_auth();
            $input = get_json_input();
            
            $targetId = isset($input['id']) ? trim($input['id']) : '';

            if (empty($targetId)) {
                http_response_code(400);
                echo json_encode(['error' => 'ID Tenant wajib disertakan dalam request body.']);
                exit();
            }

            // Check Ownership: if tenant, must only update their own tenant profile row
            if ($session['role'] === 'tenant' && $session['tenant_id'] !== $targetId) {
                http_response_code(403);
                echo json_encode(['error' => 'Forbidden. Anda hanya dapat memperbarui stan Anda sendiri.']);
                exit();
            }

            // Fetch existing tenant record
            $fetchStmt = $pdo->prepare("SELECT * FROM tenants WHERE id = :id");
            $fetchStmt->execute(['id' => $targetId]);
            $existingTenant = $fetchStmt->fetch();

            if (!$existingTenant) {
                http_response_code(404);
                echo json_encode(['error' => 'Tenant tidak ditemukan.']);
                exit();
            }

            // Determine values (only admin can change user_id or status)
            $nama_tenant = isset($input['nama_tenant']) ? trim($input['nama_tenant']) : $existingTenant['nama_tenant'];
            $nama_pemilik = isset($input['nama_pemilik']) ? trim($input['nama_pemilik']) : $existingTenant['nama_pemilik'];
            $hp = isset($input['hp']) ? trim($input['hp']) : $existingTenant['hp'];
            $email = isset($input['email']) ? trim(strtolower($input['email'])) : $existingTenant['email'];
            $foto = isset($input['foto']) ? trim($input['foto']) : $existingTenant['foto'];
            
            $user_id = $existingTenant['user_id'];
            $status = $existingTenant['status'];
            if ($session['role'] === 'admin') {
                $user_id = isset($input['user_id']) ? trim($input['user_id']) : $existingTenant['user_id'];
                $status = isset($input['status']) ? trim($input['status']) : $existingTenant['status'];
            }

            $updateStmt = $pdo->prepare("UPDATE tenants SET user_id = :user_id, nama_tenant = :nama_tenant, nama_pemilik = :nama_pemilik, hp = :hp, email = :email, status = :status, foto = :foto WHERE id = :id");
            $updateStmt->execute([
                'user_id' => $user_id,
                'nama_tenant' => $nama_tenant,
                'nama_pemilik' => $nama_pemilik,
                'hp' => $hp,
                'email' => $email,
                'status' => $status,
                'foto' => $foto,
                'id' => $targetId
            ]);

            $responseTenant = [
                'id' => (string)$targetId,
                'user_id' => (string)$user_id,
                'nama_tenant' => $nama_tenant,
                'nama_pemilik' => $nama_pemilik,
                'hp' => $hp,
                'email' => $email,
                'status' => $status,
                'foto' => $foto
            ];

            echo json_encode(format_db_row($responseTenant));
            break;
            
        case 'DELETE':
            // Only admin can delete tenants
            require_auth(['admin']);
            
            $id = isset($_GET['id']) ? trim($_GET['id']) : '';
            if (empty($id)) {
                http_response_code(400);
                echo json_encode(['error' => 'ID query parameter wajib disertakan.']);
                exit();
            }

            $deleteStmt = $pdo->prepare("DELETE FROM tenants WHERE id = :id");
            $deleteStmt->execute(['id' => $id]);

            echo json_encode(['success' => true, 'message' => 'Tenant berhasil dihapus.']);
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
