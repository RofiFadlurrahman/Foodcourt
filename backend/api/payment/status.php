<?php
/**
 * status.php — Cek status pembayaran Midtrans
 *
 * GET /api/payment/status.php?order_id=FC-XXXXXXXX-123456
 * Requires: tenant atau admin auth
 */

ini_set('display_errors', 0);
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);

require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../../db.php';
require_once __DIR__ . '/../../midtrans/MidtransConfig.php';
require_once __DIR__ . '/../auth_helper.php';

$session  = require_auth();
$order_id = isset($_GET['order_id']) ? trim($_GET['order_id']) : '';

if (empty($order_id)) {
    http_response_code(400);
    echo json_encode(['error' => 'Parameter order_id wajib disertakan.']);
    exit();
}

// Ambil dari DB
$stmt = $pdo->prepare("SELECT * FROM transactions WHERE midtrans_order_id = :order_id");
$stmt->execute(['order_id' => $order_id]);
$tx = $stmt->fetch();

if (!$tx) {
    http_response_code(404);
    echo json_encode(['error' => 'Transaksi tidak ditemukan.']);
    exit();
}

// Ownership check
if ($session['role'] === 'tenant' && $tx['tenant_id'] != $session['tenant_id']) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden.']);
    exit();
}

// Jika masih pending, cek langsung ke Midtrans untuk update real-time
if ($tx['payment_status'] === 'pending') {
    $midtransStatus = MidtransConfig::getTransactionStatus($order_id);
    $txStatus = $midtransStatus['transaction_status'] ?? 'pending';
    $fraudStatus = $midtransStatus['fraud_status'] ?? '';

    $paymentStatus = 'pending';
    if ($txStatus === 'capture')    $paymentStatus = ($fraudStatus === 'accept') ? 'paid' : 'failed';
    elseif ($txStatus === 'settlement') $paymentStatus = 'paid';
    elseif (in_array($txStatus, ['cancel', 'deny'])) $paymentStatus = 'failed';
    elseif ($txStatus === 'expire') $paymentStatus = 'expired';

    if ($paymentStatus !== 'pending') {
        $pdo->prepare("UPDATE transactions SET payment_status = :s WHERE midtrans_order_id = :oid")
            ->execute(['s' => $paymentStatus, 'oid' => $order_id]);
        $tx['payment_status'] = $paymentStatus;
    }
}

echo json_encode([
    'order_id'       => $order_id,
    'transaction_id' => $tx['id'],
    'payment_status' => $tx['payment_status'] ?? 'pending',
    'total_harga'    => (float)$tx['total_harga'],
]);
?>
