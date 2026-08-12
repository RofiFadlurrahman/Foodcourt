<?php
/**
 * notification.php — Webhook dari Midtrans (PUBLIC endpoint)
 *
 * POST /api/payment/notification.php
 *
 * Midtrans akan POST ke sini setelah customer selesai bayar.
 * Endpoint ini HARUS PUBLIC — tidak butuh login.
 * Harus diverifikasi menggunakan signature key dari Midtrans.
 */

ini_set('display_errors', 0);
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);

// CORS — hanya terima dari Midtrans, tapi tetap include untuk PHP session
require_once __DIR__ . '/../../db.php';
require_once __DIR__ . '/../../midtrans/MidtransConfig.php';

// Content-Type JSON
header('Content-Type: application/json; charset=UTF-8');

// Handle OPTIONS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$json  = file_get_contents('php://input');
$notif = json_decode($json, true);

if (!$notif) {
    http_response_code(400);
    echo json_encode(['error' => 'Payload notifikasi tidak valid.']);
    exit();
}

$order_id         = $notif['order_id']          ?? '';
$status_code      = $notif['status_code']       ?? '';
$gross_amount     = $notif['gross_amount']       ?? '';
$transaction_status = $notif['transaction_status'] ?? '';
$fraud_status     = $notif['fraud_status']       ?? '';
$signature_key    = $notif['signature_key']      ?? '';
$payment_type     = $notif['payment_type']       ?? '';

// 1. Verifikasi signature dari Midtrans
if (!MidtransConfig::verifySignature($order_id, $status_code, $gross_amount, $signature_key)) {
    http_response_code(403);
    echo json_encode(['error' => 'Signature tidak valid. Request ditolak.']);
    exit();
}

// 2. Tentukan payment_status berdasarkan response Midtrans
$paymentStatus = 'pending';

if ($transaction_status === 'capture') {
    $paymentStatus = ($fraud_status === 'accept') ? 'paid' : 'failed';
} elseif ($transaction_status === 'settlement') {
    $paymentStatus = 'paid';
} elseif (in_array($transaction_status, ['cancel', 'deny', 'expire'])) {
    if ($transaction_status === 'expire') {
        $paymentStatus = 'expired';
    } elseif ($transaction_status === 'cancel') {
        $paymentStatus = 'cancel';
    } else {
        $paymentStatus = 'failed';
    }
} elseif ($transaction_status === 'pending') {
    $paymentStatus = 'pending';
}

try {
    $pdo->beginTransaction();

    // Update transaksi di DB
    $updateStmt = $pdo->prepare(
        "UPDATE transactions SET payment_status = :status, metode_pembayaran = 'Midtrans' WHERE midtrans_order_id = :order_id"
    );
    $updateStmt->execute([
        'status'   => $paymentStatus,
        'order_id' => $order_id,
    ]);

    // Jika pembayaran berhasil (paid), kurangi stok menu
    if ($paymentStatus === 'paid') {
        // Ambil detail transaksi untuk kurangi stok
        $txStmt = $pdo->prepare("SELECT menu_id, jumlah FROM transactions WHERE midtrans_order_id = :order_id");
        $txStmt->execute(['order_id' => $order_id]);
        $tx = $txStmt->fetch();

        if ($tx) {
            // Kurangi stok
            $menuStmt = $pdo->prepare("SELECT stok, status FROM menus WHERE id = :id");
            $menuStmt->execute(['id' => $tx['menu_id']]);
            $menu = $menuStmt->fetch();

            if ($menu) {
                $newStock  = max(0, $menu['stok'] - $tx['jumlah']);
                $newStatus = ($newStock === 0) ? 'empty' : $menu['status'];
                $pdo->prepare("UPDATE menus SET stok = :stok, status = :status WHERE id = :id")
                    ->execute(['stok' => $newStock, 'status' => $newStatus, 'id' => $tx['menu_id']]);
            }
        }
    }

    $pdo->commit();

    echo json_encode([
        'success'        => true,
        'order_id'       => $order_id,
        'payment_status' => $paymentStatus,
    ]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
