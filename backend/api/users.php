<?php
require_once __DIR__ . '/auth_helper.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            $session = null;
            try {
                $session = require_auth();
            } catch (Exception $e) {}
            
            if ($session && $session['role'] === 'admin') {
                $stmt = $pdo->prepare("SELECT id, username, role, fullName, email, avatar FROM users WHERE created_by = :admin_id1 OR id = :admin_id2");
                $stmt->execute([
                    'admin_id1' => $session['user_id'],
                    'admin_id2' => $session['user_id']
                ]);
                $users = $stmt->fetchAll();
            } else {
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
            $rawInput = json_decode(file_get_contents('php://input'), true) ?: $_POST;

            // Helper pencari nilai otomatis di berbagai format field
            $findVal = function($keys, $data) use (&$findVal) {
                if (!is_array($data)) return '';
                foreach ($keys as $k) {
                    if (isset($data[$k]) && !empty(trim((string)$data[$k]))) return trim((string)$data[$k]);
                }
                foreach ($data as $sub) {
                    if (is_array($sub)) {
                        $res = $findVal($keys, $sub);
                        if (!empty($res)) return $res;
                    }
                }
                return '';
            };

            $username = $findVal(['username', 'user_name', 'user', 'userName'], $rawInput);
            $password = $findVal(['password', 'pass', 'user_password', 'userPassword', 'pwd'], $rawInput);
            $fullName = $findVal(['fullName', 'fullname', 'nama_lengkap', 'nama_pemilik', 'namaPemilik', 'owner_name', 'nama', 'name'], $rawInput);
            $email    = $findVal(['email', 'user_email', 'mail'], $rawInput);
            $role     = $findVal(['role', 'user_role'], $rawInput) ?: 'tenant';
            $avatar   = $findVal(['avatar', 'foto', 'photo', 'url_foto'], $rawInput);

            // Fallback cerdas jika ada field yang terlewat
            if (empty($username)) {
                $namaTenant = $findVal(['nama_tenant', 'namaTenant', 'tenant_name'], $rawInput);
                $source = !empty($namaTenant) ? $namaTenant : (!empty($fullName) ? $fullName : 'tenant_' . substr(md5(uniqid()), 0, 4));
                $username = strtolower(preg_replace('/[^a-zA-Z0-9_]/', '', str_replace(' ', '_', $source)));
            }

            if (empty($password)) {
                $password = '123456';
            }

            if (empty($fullName)) {
                $fullName = ucfirst(str_replace('_', ' ', $username));
            }

            if (empty($email)) {
                $email = strtolower($username) . '@foodcourt.com';
            }

            // Cek jika username sudah ada
            $checkStmt = $pdo->prepare("SELECT id FROM users WHERE username = :username");
            $checkStmt->execute(['username' => $username]);
            if ($checkStmt->fetch()) {
                $username .= '_' . rand(10, 99);
            }

            // Encrypt password menggunakan Bcrypt
            $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

            $session = null;
            try {
                $session = require_auth();
            } catch (Exception $e) {}

            $created_by = ($session && $session['role'] === 'admin') ? $session['user_id'] : null;

            // Simpan ke tabel users
            $insertStmt = $pdo->prepare("INSERT INTO users (username, password, role, fullName, email, avatar, created_by) VALUES (:username, :password, :role, :fullName, :email, :avatar, :created_by)");
            $insertStmt->execute([
                'username'   => $username,
                'password'   => $hashedPassword,
                'role'       => $role,
                'fullName'   => $fullName,
                'email'      => $email,
                'avatar'     => $avatar,
                'created_by' => $created_by
            ]);

            $newId = (int)$pdo->lastInsertId();

            // Jika tenant, otomatis buatkan profil di tabel tenants
            if ($role === 'tenant') {
                $namaTenant  = $findVal(['nama_tenant', 'namaTenant', 'tenant_name'], $rawInput) ?: $fullName;
                $namaPemilik = $findVal(['nama_pemilik', 'namaPemilik', 'owner_name'], $rawInput) ?: $fullName;
                $hp          = $findVal(['hp', 'nomor_hp', 'phone', 'telepon'], $rawInput) ?: '08123456789';
                $status      = $findVal(['status', 'status_kemitraan'], $rawInput) ?: 'active';
                if (stripos($status, 'aktif') !== false || stripos($status, 'active') !== false) {
                    $status = 'active';
                } else {
                    $status = 'inactive';
                }

                try {
                    $tenantStmt = $pdo->prepare("INSERT INTO tenants (user_id, nama_tenant, nama_pemilik, hp, email, status, foto) VALUES (:uid, :nt, :np, :hp, :email, :status, :foto)");
                    $tenantStmt->execute([
                        'uid'    => $newId,
                        'nt'     => $namaTenant,
                        'np'     => $namaPemilik,
                        'hp'     => $hp,
                        'email'  => $email,
                        'status' => $status,
                        'foto'   => $avatar
                    ]);
                } catch (Exception $e) {}
            }
            
            $responseUser = [
                'id'       => (string)$newId,
                'username' => $username,
                'role'     => $role,
                'fullName' => $fullName,
                'email'    => $email,
                'avatar'   => $avatar
            ];

            http_response_code(201);
            echo json_encode(format_db_row($responseUser));
            break;
            
        case 'PUT':
            $session = require_auth();
            $input = get_json_input();
            
            $targetId = isset($input['id']) ? trim($input['id']) : '';

            if (empty($targetId)) {
                http_response_code(400);
                echo json_encode(['error' => 'ID User wajib disertakan dalam request body.']);
                exit();
            }

            if ($session['role'] === 'tenant' && $session['user_id'] !== $targetId) {
                http_response_code(403);
                echo json_encode(['error' => 'Forbidden. Anda hanya dapat memperbarui profil Anda sendiri.']);
                exit();
            }

            $fetchStmt = $pdo->prepare("SELECT * FROM users WHERE id = :id");
            $fetchStmt->execute(['id' => $targetId]);
            $existingUser = $fetchStmt->fetch();

            if (!$existingUser) {
                http_response_code(404);
                echo json_encode(['error' => 'User tidak ditemukan.']);
                exit();
            }

            $fullName = isset($input['fullName']) ? trim($input['fullName']) : $existingUser['fullName'];
            $email = isset($input['email']) ? trim(strtolower($input['email'])) : $existingUser['email'];
            $avatar = isset($input['avatar']) ? trim($input['avatar']) : $existingUser['avatar'];
            
            $username = $existingUser['username'];
            $role = $existingUser['role'];
            if ($session['role'] === 'admin') {
                $username = isset($input['username']) ? trim(strtolower($input['username'])) : $existingUser['username'];
                $role = isset($input['role']) ? trim($input['role']) : $existingUser['role'];
            }

            $passwordSql = "";
            $params = [
                'fullName' => $fullName,
                'email'    => $email,
                'avatar'   => $avatar,
                'username' => $username,
                'role'     => $role,
                'id'       => $targetId
            ];

            if (isset($input['password']) && !empty(trim($input['password']))) {
                $passwordSql = ", password = :password";
                $params['password'] = password_hash(trim($input['password']), PASSWORD_BCRYPT);
            }

            $updateStmt = $pdo->prepare("UPDATE users SET username = :username, role = :role, fullName = :fullName, email = :email, avatar = :avatar $passwordSql WHERE id = :id");
            $updateStmt->execute($params);

            $responseUser = [
                'id'       => (string)$targetId,
                'username' => $username,
                'role'     => $role,
                'fullName' => $fullName,
                'email'    => $email,
                'avatar'   => $avatar
            ];

            echo json_encode(format_db_row($responseUser));
            break;
            
        case 'DELETE':
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