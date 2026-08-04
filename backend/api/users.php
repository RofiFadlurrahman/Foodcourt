<?php
require_once __DIR__ . '/auth_helper.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Resolve session (bisa dari header maupun cookie native)
            $session = require_auth();
            
            // Jika masuk sebagai admin, kembalikan daftar lengkap user milik admin ini saja
            if ($session['role'] === 'admin') {
                $stmt = $pdo->prepare("SELECT id, username, role, fullName, email, avatar FROM users WHERE created_by = :admin_id1 OR id = :admin_id2");
                $stmt->execute([
                    'admin_id1' => $session['user_id'],
                    'admin_id2' => $session['user_id']
                ]);
                $users = $stmt->fetchAll();
            } else {
                // Jika tamu/guest (untuk registrasi), hanya kembalikan username demi keamanan data privasi
                $stmt = $pdo->query("SELECT username FROM users");
                $users = $stmt->fetchAll();
                foreach ($users as &$u) {
                    $u['id'] = '';
                    $u['role'] = 'tenant';
                    $u['fullName'] = '';
                    $u['email'] = '';
                    $u['avatar'] = '';
                }
            }
            
            echo json_encode(format_db_row($users));
            break;
            
        case 'POST':
            // Admin can create users, or anonymous can register a new account (e.g. registration pages)
            $input = get_json_input();
            
            $username = isset($input['username']) ? trim(strtolower($input['username'])) : '';
            $password = isset($input['password']) ? trim($input['password']) : '';
            $role = isset($input['role']) ? trim($input['role']) : 'tenant';
            $fullName = isset($input['fullName']) ? trim($input['fullName']) : '';
            $email = isset($input['email']) ? trim(strtolower($input['email'])) : '';
            $avatar = isset($input['avatar']) ? trim($input['avatar']) : '';

            if (empty($username) || empty($password) || empty($fullName) || empty($email)) {
                http_response_code(400);
                echo json_encode(['error' => 'Username, password, nama lengkap, dan email wajib diisi.']);
                exit();
            }

            // Check if username already exists
            $checkStmt = $pdo->prepare("SELECT id FROM users WHERE username = :username");
            $checkStmt->execute(['username' => $username]);
            if ($checkStmt->fetch()) {
                http_response_code(400);
                echo json_encode(['error' => 'Username sudah digunakan.']);
                exit();
            }

            // Encrypt password using Bcrypt
            $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

            // Tentukan created_by
            $session = null;
            try {
                $session = require_auth();
            } catch (Exception $e) {
                // Tamu/Guest (melakukan sign up mandiri tanpa session)
            }

            if ($session && $session['role'] === 'admin') {
                $created_by = $session['user_id'];
            } else {
                if ($role === 'admin') {
                    $created_by = null; // Independent new admin space
                } else {
                    // Default to the first admin in DB for guest tenant registration
                    $adminQuery = $pdo->query("SELECT id FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1");
                    $created_by = $adminQuery->fetchColumn() ?: null;
                }
            }

            // Insert new user
            $insertStmt = $pdo->prepare("INSERT INTO users (username, password, role, fullName, email, avatar, created_by) VALUES (:username, :password, :role, :fullName, :email, :avatar, :created_by)");
            $insertStmt->execute([
                'username' => $username,
                'password' => $hashedPassword,
                'role' => $role,
                'fullName' => $fullName,
                'email' => $email,
                'avatar' => $avatar,
                'created_by' => $created_by
            ]);

            $newId = $pdo->lastInsertId();
            
            // Return new user profile (exclude password)
            $responseUser = [
                'id' => (string)$newId,
                'username' => $username,
                'role' => $role,
                'fullName' => $fullName,
                'email' => $email,
                'avatar' => $avatar
            ];

            http_response_code(201);
            echo json_encode(format_db_row($responseUser));
            break;
            
        case 'PUT':
            // Must be authenticated to update profile
            $session = require_auth();
            $input = get_json_input();
            
            $targetId = isset($input['id']) ? trim($input['id']) : '';

            if (empty($targetId)) {
                http_response_code(400);
                echo json_encode(['error' => 'ID User wajib disertakan dalam request body.']);
                exit();
            }

            // Check Ownership: if tenant, must only update their own user row
            if ($session['role'] === 'tenant' && $session['user_id'] !== $targetId) {
                http_response_code(403);
                echo json_encode(['error' => 'Forbidden. Anda hanya dapat memperbarui profil Anda sendiri.']);
                exit();
            }

            // Fetch existing user record
            $fetchStmt = $pdo->prepare("SELECT * FROM users WHERE id = :id");
            $fetchStmt->execute(['id' => $targetId]);
            $existingUser = $fetchStmt->fetch();

            if (!$existingUser) {
                http_response_code(404);
                echo json_encode(['error' => 'User tidak ditemukan.']);
                exit();
            }

            // Determine updated values (only admin can change role/username)
            $fullName = isset($input['fullName']) ? trim($input['fullName']) : $existingUser['fullName'];
            $email = isset($input['email']) ? trim(strtolower($input['email'])) : $existingUser['email'];
            $avatar = isset($input['avatar']) ? trim($input['avatar']) : $existingUser['avatar'];
            
            $username = $existingUser['username'];
            $role = $existingUser['role'];
            if ($session['role'] === 'admin') {
                $username = isset($input['username']) ? trim(strtolower($input['username'])) : $existingUser['username'];
                $role = isset($input['role']) ? trim($input['role']) : $existingUser['role'];
            }

            // Handle password updates if provided
            $passwordSql = "";
            $params = [
                'fullName' => $fullName,
                'email' => $email,
                'avatar' => $avatar,
                'username' => $username,
                'role' => $role,
                'id' => $targetId
            ];

            if (isset($input['password']) && !empty(trim($input['password']))) {
                $passwordSql = ", password = :password";
                $params['password'] = password_hash(trim($input['password']), PASSWORD_BCRYPT);
            }

            $updateStmt = $pdo->prepare("UPDATE users SET username = :username, role = :role, fullName = :fullName, email = :email, avatar = :avatar $passwordSql WHERE id = :id");
            $updateStmt->execute($params);

            // Fetch and return updated record (excluding password)
            $responseUser = [
                'id' => (string)$targetId,
                'username' => $username,
                'role' => $role,
                'fullName' => $fullName,
                'email' => $email,
                'avatar' => $avatar
            ];

            echo json_encode(format_db_row($responseUser));
            break;
            
        case 'DELETE':
            // Only admin can delete users
            require_auth(['admin']);
            
            $id = isset($_GET['id']) ? trim($_GET['id']) : '';
            if (empty($id)) {
                http_response_code(400);
                echo json_encode(['error' => 'ID query parameter wajib disertakan.']);
                exit();
            }

            $deleteStmt = $pdo->prepare("DELETE FROM users WHERE id = :id");
            $deleteStmt->execute(['id' => $id]);

            echo json_encode(['success' => true, 'message' => 'User berhasil dihapus.']);
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
