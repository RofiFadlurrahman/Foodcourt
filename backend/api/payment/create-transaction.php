<?php
/**
 * create-transaction.php — Buat Snap Token Midtrans
 */

ini_set('display_errors', 0);
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);

require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../../db.php';
require_once __DIR__ . '/../../midtrans/MidtransConfig.php';
require_once __DIR__ . '/../auth_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed.']);
    exit();
}

$session = require_auth(['tenant']);

$tenantLookup = $pdo->prepare("SELECT id FROM tenants WHERE user_id = :uid LIMIT 1");
$tenantLookup->execute(['uid' => $session['user_id']]);
$tenantRow = $tenantLookup->fetch();

if (!$tenantRow) {
    http_response_code(403);
    echo json_encode(['error' => 'Profil tenant tidak ditemukan untuk akun ini.']);
    exit();
}
$tenant_id = (int)$tenantRow['id'];

$input = get_json_input();

$menu_id        = isset($input['menu_id'])        ? (int)$input['menu_id']                         : 0;
$jumlah         = isset($input['jumlah'])          ? (int)$input['jumlah']                          : 1;
$total_harga    = isset($input['total_harga'])     ? (float)$input['total_harga']                   : 0.0;
$cust_name      = !empty($input['customer_name'])  ? trim($input['customer_name'])                  : 'Pelanggan';
$cust_email     = !empty($input['customer_email']) ? trim($input['customer_email'])                 : 'customer@foodcourt.com';
$cust_phone     = !empty($input['customer_phone']) ? trim($input['customer_phone'])                 : '';

if ($menu_id <= 0 || $total_harga <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Data menu_id dan total_harga wajib valid.']);
    exit();
}

// Ambil info menu
$menuStmt = $pdo->prepare("SELECT id, nama_menu, harga, stok, tenant_id FROM menus WHERE id = :id");
$menuStmt->execute(['id' => $menu_id]);
$menu = $menuStmt->fetch();

$menuName = $menu ? $menu['nama_menu'] : 'Menu Foodcourt';

// Generate unique order ID
$order_id = 'FC-' . strtoupper(substr(md5(uniqid(rand(), true)), 0, 8)) . '-' . time();

// Simpan transaksi awal
$pdo->beginTransaction();
try {
    $insertStmt = $pdo->prepare(
        "INSERT INTO transactions (tenant_id, menu_id, jumlah, total_harga, metode_pembayaran, midtrans_order_id, payment_status)
         VALUES (:tenant_id, :menu_id, :jumlah, :total_harga, 'Midtrans', :order_id, 'pending')"
    );
    $insertStmt->execute([
        'tenant_id'   => $tenant_id,
        'menu_id'     => $menu_id,
        'jumlah'      => $jumlah,
        'total_harga' => $total_harga,
        'order_id'    => $order_id,
    ]);
    $transaction_db_id = (int)$pdo->lastInsertId();
    $pdo->commit();
} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => 'Gagal menyimpan transaksi: ' . $e->getMessage()]);
    exit();
}

// Payload Midtrans yang aman & valid 100%
$payload = [
    'transaction_details' => [
        'order_id'     => $order_id,
        'gross_amount' => (int)round($total_harga),
    ],
    'item_details' => [
        [
            'id'       => (string)$menu_id,
            'price'    => (int)round($total_harga),
            'quantity' => 1,
            'name'     => mb_substr($menuName, 0, 50),
        ],
    ],
    'customer_details' => [
        'first_name' => mb_substr($cust_name, 0, 50),
        'email'      => filter_var($cust_email, FILTER_VALIDATE_EMAIL) ? $cust_email : 'customer@foodcourt.com',
    ],
];

if (!empty($cust_phone) && preg_match('/^[0-9+]+$/', $cust_phone)) {
    $payload['customer_details']['phone'] = $cust_phone;
}

$midtransResult = MidtransConfig::createSnapToken($payload);

if (!isset($midtransResult['token']) || empty($midtransResult['token'])) {
    $pdo->prepare("DELETE FROM transactions WHERE id = :id")->execute(['id' => $transaction_db_id]);
    http_response_code(502);
    $errorMsg = isset($midtransResult['error_messages']) ? implode(', ', $midtransResult['error_messages']) : json_encode($midtransResult);
    echo json_encode([
        'error'   => 'Gagal membuat Snap Token: ' . $errorMsg,
        'details' => $midtransResult,
    ]);
    exit();
}

// Simpan snap_token ke DB
$pdo->prepare("UPDATE transactions SET snap_token = :token WHERE id = :id")
    ->execute(['token' => $midtransResult['token'], 'id' => $transaction_db_id]);

MidtransConfig::init();

echo json_encode([
    'snap_token'     => $midtransResult['token'],
    'redirect_url'   => $midtransResult['redirect_url'] ?? null,
    'client_key'     => MidtransConfig::$clientKey,
    'is_production'  => MidtransConfig::$isProduction,
    'order_id'       => $order_id,
    'transaction_id' => $transaction_db_id,
]);
?>