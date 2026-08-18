<?php
// CORS Headers Configuration
// Allow local Next.js dev origins while keeping cookies working for local PHP sessions.
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed_origin = 'http://localhost:3000';

if ($origin !== '') {
    if (preg_match('#^https?://(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$#', $origin) || preg_match('#\.vercel\.app$#', $origin) || preg_match('#railway\.app$#', $origin)) {
        $allowed_origin = $origin;
    }
}

header("Access-Control-Allow-Origin: " . $allowed_origin);
header("Vary: Origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, X-Session-User-ID, X-Session-User-Role, X-Session-Tenant-ID");
header("Content-Type: application/json; charset=UTF-8");

// Handle OPTIONS preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
?>
