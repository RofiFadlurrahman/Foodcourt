<?php
/**
 * register-tenant.php — Endpoint PUBLIC untuk self-registration tenant via kode undangan.
 *
 * POST /api/auth/register-tenant.php
 * Body: {
 *   "invitation_code": "BAEEBD87",
 *   "owner_name": "brian",
 *   "tenant_name": "kfc",
 *   "phone": "08789456123",
 *   "email": "brian@gmail.com",
 *   "username": "brian",
 *   "password": "brian123",
 *   "password_confirmation": "brian123"
 * }
 *
 * ENDPOINT INI SEPENUHNYA PUBLIC — tidak memerlukan session/login apapun.
 * admin_id TIDAK diambil dari frontend — diambil dari invitation di database.
 */

// Suppress PHP warnings from polluting JSON
ini_set('display_errors', 0);
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);

// CORS headers
require_once __DIR__ . '/../cors.php';

// DB connection
require_once __DIR__ . '/../../db.php';

// Helper functions (tanpa require_auth)
function get_json_input_reg() {
    $json = file_get_contents('php://input');
    return json_decode($json, true) ?: [];
}

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed. Gunakan POST.']);
    exit();
}

$input = get_json_input_reg();

// ── 1. Validasi input wajib ────────────────────────────────────────────────
$invitation_code    = isset($input['invitation_code'])     ? strtoupper(trim($input['invitation_code']))    : '';
$owner_name         = isset($input['owner_name'])          ? trim($input['owner_name'])                     : '';
$tenant_name        = isset($input['tenant_name'])         ? trim($input['tenant_name'])                    : '';
$phone              = isset($input['phone'])                ? trim($input['phone'])                          : '';
$email              = isset($input['email'])               ? strtolower(trim($input['email']))              : '';
$username           = isset($input['username'])            ? strtolower(trim($input['username']))           : '';
$password           = isset($input['password'])            ? $input['password']                             : '';
$password_confirm   = isset($input['password_confirmation']) ? $input['password_confirmation']              : '';

if (empty($invitation_code)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Kode undangan wajib disertakan.']);
    exit();
}

if (empty($owner_name) || empty($tenant_name) || empty($phone) || empty($email) || empty($username) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Semua kolom wajib diisi.']);
    exit();
}

if ($password !== $password_confirm) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Konfirmasi password tidak cocok.']);
    exit();
}

if (strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Password minimal 6 karakter.']);
    exit();
}

try {
    // ── 2. ATOMIC TRANSACTION ─────────────────────────────────────────────
    $pdo->beginTransaction();

    // ── 3. Lock & validasi invitation (FOR UPDATE mencegah race condition) ──
    $invStmt = $pdo->prepare(
        "SELECT i.*, u.fullName AS admin_fullName, u.username AS admin_username
         FROM tenant_invitations i
         JOIN users u ON u.id = i.admin_id
         WHERE i.code = :code
         FOR UPDATE"
    );
    $invStmt->execute(['code' => $invitation_code]);
    $invitation = $invStmt->fetch();

    if (!$invitation) {
        $pdo->rollBack();
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Kode undangan tidak ditemukan.']);
        exit();
    }

    if ($invitation['status'] !== 'active') {
        $pdo->rollBack();
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Kode undangan sudah digunakan atau tidak aktif.']);
        exit();
    }

    if (strtotime($invitation['expires_at']) < time()) {
        // Auto-expire
        $pdo->prepare("UPDATE tenant_invitations SET status='expired' WHERE id=:id")
            ->execute(['id' => $invitation['id']]);
        $pdo->commit();
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Kode undangan sudah kedaluwarsa.']);
        exit();
    }

    // admin_id diambil dari invitation — BUKAN dari frontend
    $admin_id = (int)$invitation['admin_id'];

    // ── 4. Cek username sudah digunakan ──────────────────────────────────
    $checkUser = $pdo->prepare("SELECT id FROM users WHERE username = :username");
    $checkUser->execute(['username' => $username]);
    if ($checkUser->fetch()) {
        $pdo->rollBack();
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Username sudah digunakan.']);
        exit();
    }

    // ── 5. Buat akun user tenant ─────────────────────────────────────────
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
    $avatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';

    $insertUser = $pdo->prepare(
        "INSERT INTO users (username, password, role, fullName, email, avatar, created_by)
         VALUES (:username, :password, 'tenant', :fullName, :email, :avatar, :created_by)"
    );
    $insertUser->execute([
        'username'   => $username,
        'password'   => $hashedPassword,
        'fullName'   => $owner_name,
        'email'      => $email,
        'avatar'     => $avatar,
        'created_by' => $admin_id,
    ]);
    $new_user_id = (int)$pdo->lastInsertId();

    // ── 6. Buat profil tenant ─────────────────────────────────────────────
    $foto = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80';

    $insertTenant = $pdo->prepare(
        "INSERT INTO tenants (user_id, nama_tenant, nama_pemilik, hp, email, status, foto)
         VALUES (:user_id, :nama_tenant, :nama_pemilik, :hp, :email, 'active', :foto)"
    );
    $insertTenant->execute([
        'user_id'     => $new_user_id,
        'nama_tenant' => $tenant_name,
        'nama_pemilik'=> $owner_name,
        'hp'          => $phone,
        'email'       => $email,
        'foto'        => $foto,
    ]);
    $new_tenant_id = (int)$pdo->lastInsertId();

    // ── 7. Tandai invitation sebagai USED ─────────────────────────────────
    $pdo->prepare("UPDATE tenant_invitations SET status='used' WHERE id=:id")
        ->execute(['id' => $invitation['id']]);

    // ── 8. Commit transaction ─────────────────────────────────────────────
    $pdo->commit();

    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Registrasi tenant berhasil.',
        'data'    => [
            'tenant_id'  => $new_tenant_id,
            'admin_name' => $invitation['admin_fullName'],
        ],
    ]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Kesalahan database: ' . $e->getMessage()]);
}
?>
