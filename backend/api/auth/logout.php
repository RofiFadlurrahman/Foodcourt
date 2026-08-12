<?php
// Include auth helper
require_once __DIR__ . '/../auth_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed. Gunakan POST.']);
    exit();
}

// Clear all session variables
$_SESSION = [];

// Destroy session cookie in browser
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(), 
        '', 
        time() - 42000,
        $params["path"], 
        $params["domain"],
        $params["secure"], 
        $params["httponly"]
    );
}

// Destroy session on server
session_destroy();

http_response_code(200);
echo json_encode(['success' => true, 'message' => 'Logout berhasil.']);
