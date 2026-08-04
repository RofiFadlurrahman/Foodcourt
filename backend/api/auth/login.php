<?php
// Include auth helper
require_once __DIR__ . '/../auth_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed. Gunakan POST.']);
    exit();
}

$input = get_json_input();
$username = isset($input['username']) ? trim($input['username']) : '';
$password = isset($input['password']) ? trim($input['password']) : '';

if (empty($username) || empty($password)) {
    http_response_code(400);
    echo json_encode(['error' => 'Username dan password wajib diisi.']);
    exit();
}

try {
    // 1. Fetch user from database
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = :username");
    $stmt->execute(['username' => $username]);
    $user = $stmt->fetch();

    // 2. Check user existence and verify bcrypt password hash
    if (!$user || !password_verify($password, $user['password'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Username atau password salah.']);
        exit();
    }

    // 3. Clear session data from previous logins
    session_unset();

    // 4. Set session values
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['role'] = $user['role'];

    // 5. If role is tenant, fetch their tenant profile
    $tenant = null;
    if ($user['role'] === 'tenant') {
        $tenantStmt = $pdo->prepare("SELECT * FROM tenants WHERE user_id = :user_id");
        $tenantStmt->execute(['user_id' => $user['id']]);
        $tenant = $tenantStmt->fetch();
        
        if ($tenant) {
            $_SESSION['tenant_id'] = $tenant['id'];
        }
    }

    // 6. Remove password from the user array before returning
    unset($user['password']);

    // 7. Format data and send JSON response
    $response = [
        'user' => format_db_row($user)
    ];
    if ($tenant) {
        $response['tenant'] = format_db_row($tenant);
    }

    http_response_code(200);
    echo json_encode($response);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Terjadi kesalahan sistem database: ' . $e->getMessage()]);
}
?>
