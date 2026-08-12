<?php
/**
 * invitations.php — Endpoint untuk manajemen kode undangan tenant
 *
 * GET  /invitations.php?code=XXX   — Public: validasi kode undangan (cek apakah valid)
 * GET  /invitations.php             — Admin only: list semua kode undangan milik admin yang login
 * POST /invitations.php             — Admin only: generate kode undangan baru
 * DELETE /invitations.php?id=X     — Admin only: hapus kode undangan milik admin
 */

require_once __DIR__ . '/auth_helper.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {

        // ─── GET ─────────────────────────────────────────────────────────────
        case 'GET':
            // Cek apakah ada query ?code= (validasi publik untuk registrasi tenant)
            if (isset($_GET['code']) && $_GET['code'] !== '') {
                $code = trim($_GET['code']);
                $stmt = $pdo->prepare(
                    "SELECT i.*, u.username AS admin_username, u.fullName AS admin_fullName
                     FROM tenant_invitations i
                     JOIN users u ON u.id = i.admin_id
                     WHERE i.code = :code"
                );
                $stmt->execute(['code' => $code]);
                $inv = $stmt->fetch();

                if (!$inv) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Kode undangan tidak ditemukan.']);
                    exit();
                }

                // Cek apakah status active dan belum expired
                if ($inv['status'] !== 'active') {
                    http_response_code(410); // Gone
                    echo json_encode(['error' => 'Kode undangan sudah digunakan atau tidak aktif.']);
                    exit();
                }

                if (strtotime($inv['expires_at']) < time()) {
                    // Auto-update expired
                    $pdo->prepare("UPDATE tenant_invitations SET status='expired' WHERE id=:id")
                        ->execute(['id' => $inv['id']]);
                    http_response_code(410);
                    echo json_encode(['error' => 'Kode undangan sudah kedaluwarsa.']);
                    exit();
                }

                // Valid — kembalikan info (tanpa data sensitif)
                echo json_encode([
                    'valid'           => true,
                    'admin_id'        => (string)$inv['admin_id'],
                    'admin_username'  => $inv['admin_username'],
                    'admin_fullName'  => $inv['admin_fullName'],
                    'email'           => $inv['email'],
                    'expires_at'      => $inv['expires_at'],
                ]);
                exit();
            }

            // List undangan milik admin yang login
            $session = require_auth(['admin']);

            $stmt = $pdo->prepare(
                "SELECT * FROM tenant_invitations WHERE admin_id = :admin_id ORDER BY created_at DESC"
            );
            $stmt->execute(['admin_id' => $session['user_id']]);
            $invitations = $stmt->fetchAll();

            echo json_encode(format_db_row($invitations));
            break;

        // ─── POST ────────────────────────────────────────────────────────────
        case 'POST':
            $session = require_auth(['admin']);
            $input   = get_json_input();

            // Generate kode unik 8 karakter jika tidak disediakan
            $code = isset($input['code']) && !empty(trim($input['code']))
                ? strtoupper(trim($input['code']))
                : strtoupper(substr(bin2hex(random_bytes(5)), 0, 8));

            // Pastikan kode belum ada
            $checkStmt = $pdo->prepare("SELECT id FROM tenant_invitations WHERE code = :code");
            $checkStmt->execute(['code' => $code]);
            if ($checkStmt->fetch()) {
                http_response_code(409);
                echo json_encode(['error' => 'Kode undangan sudah digunakan oleh undangan lain.']);
                exit();
            }

            // Default expires: 7 hari dari sekarang
            $expiresAt = isset($input['expires_at']) && !empty($input['expires_at'])
                ? $input['expires_at']
                : date('Y-m-d H:i:s', strtotime('+7 days'));

            $email = isset($input['email']) ? trim($input['email']) : null;

            $insertStmt = $pdo->prepare(
                "INSERT INTO tenant_invitations (admin_id, code, email, status, expires_at)
                 VALUES (:admin_id, :code, :email, 'active', :expires_at)"
            );
            $insertStmt->execute([
                'admin_id'   => $session['user_id'],
                'code'       => $code,
                'email'      => $email,
                'expires_at' => $expiresAt,
            ]);

            $newId = $pdo->lastInsertId();

            http_response_code(201);
            echo json_encode([
                'id'         => (string)$newId,
                'admin_id'   => (string)$session['user_id'],
                'code'       => $code,
                'email'      => $email,
                'status'     => 'active',
                'expires_at' => $expiresAt,
            ]);
            break;

        // ─── DELETE ──────────────────────────────────────────────────────────
        case 'DELETE':
            $session = require_auth(['admin']);

            $id = isset($_GET['id']) ? trim($_GET['id']) : '';
            if (empty($id)) {
                http_response_code(400);
                echo json_encode(['error' => 'ID query parameter wajib disertakan.']);
                exit();
            }

            // Pastikan undangan milik admin yang login
            $fetchStmt = $pdo->prepare("SELECT admin_id FROM tenant_invitations WHERE id = :id");
            $fetchStmt->execute(['id' => $id]);
            $inv = $fetchStmt->fetch();

            if (!$inv) {
                http_response_code(404);
                echo json_encode(['error' => 'Kode undangan tidak ditemukan.']);
                exit();
            }

            if ((int)$inv['admin_id'] !== (int)$session['user_id']) {
                http_response_code(403);
                echo json_encode(['error' => 'Forbidden. Anda tidak berhak menghapus undangan ini.']);
                exit();
            }

            $pdo->prepare("DELETE FROM tenant_invitations WHERE id = :id")->execute(['id' => $id]);

            echo json_encode(['success' => true, 'message' => 'Kode undangan berhasil dihapus.']);
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
