<?php
/**
 * validate-invitation.php — Endpoint PUBLIC untuk validasi kode undangan.
 *
 * POST /api/auth/validate-invitation.php
 * Body: { "code": "BAEEBD87" }
 *
 * Response jika valid:
 * { "success": true, "valid": true, "invitation": { "admin_id": 1, "admin_name": "Administrator Utama" } }
 *
 * Response jika tidak valid:
 * { "success": false, "valid": false, "message": "..." }
 *
 * ENDPOINT INI SEPENUHNYA PUBLIC — tidak memerlukan login apapun.
 */

ini_set('display_errors', 0);
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);

require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'valid' => false, 'message' => 'Method Not Allowed.']);
    exit();
}

$json  = file_get_contents('php://input');
$input = json_decode($json, true) ?: [];
$code  = isset($input['code']) ? strtoupper(trim($input['code'])) : '';

if (empty($code)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'valid' => false, 'message' => 'Kode undangan wajib disertakan.']);
    exit();
}

try {
    $stmt = $pdo->prepare(
        "SELECT i.*, u.fullName AS admin_fullName, u.username AS admin_username
         FROM tenant_invitations i
         JOIN users u ON u.id = i.admin_id
         WHERE i.code = :code"
    );
    $stmt->execute(['code' => $code]);
    $inv = $stmt->fetch();

    if (!$inv) {
        http_response_code(404);
        echo json_encode(['success' => false, 'valid' => false, 'message' => 'Kode undangan tidak ditemukan.']);
        exit();
    }

    if ($inv['status'] !== 'active') {
        http_response_code(410);
        echo json_encode(['success' => false, 'valid' => false, 'message' => 'Kode undangan sudah digunakan atau tidak aktif.']);
        exit();
    }

    if (strtotime($inv['expires_at']) < time()) {
        // Auto-mark expired
        $pdo->prepare("UPDATE tenant_invitations SET status='expired' WHERE id=:id")
            ->execute(['id' => $inv['id']]);
        http_response_code(410);
        echo json_encode(['success' => false, 'valid' => false, 'message' => 'Kode undangan sudah kedaluwarsa.']);
        exit();
    }

    // Valid
    echo json_encode([
        'success'    => true,
        'valid'      => true,
        'invitation' => [
            'admin_id'   => (int)$inv['admin_id'],
            'admin_name' => $inv['admin_fullName'],
        ],
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'valid' => false, 'message' => 'Kesalahan database.']);
}
?>
