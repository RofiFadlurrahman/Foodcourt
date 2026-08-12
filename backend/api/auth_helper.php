<?php
// Prevent PHP notices/warnings from polluting JSON output
ini_set('display_errors', 0);
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);

// Include CORS configuration
require_once __DIR__ . '/cors.php';

// Include PDO connection
require_once __DIR__ . '/../db.php';

// Configure session options for security
if (session_status() === PHP_SESSION_NONE) {
    // Prevent session ID from being passed in URLs
    ini_set('session.use_only_cookies', 1);
    
    // Set cookie parameters - supports array syntax for PHP >= 7.3, and standard syntax for older PHP
    if (PHP_VERSION_ID >= 70300) {
        session_set_cookie_params([
            'lifetime' => 0, // Session cookie expires when browser closes
            'path' => '/',
            'domain' => '', // Default to current domain (localhost)
            'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on',
            'httponly' => true,
            'samesite' => 'Lax'
        ]);
    } else {
        session_set_cookie_params(
            0,
            '/; samesite=Lax',
            '',
            isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on',
            true
        );
    }
    
    session_start();
}

/**
 * Ensures user is authenticated and optionally belongs to the allowed roles.
 * 
 * @param array $allowed_roles Roles allowed to access the resource (e.g. ['admin', 'tenant'])
 * @return array The current session user profile
 */
function require_auth($allowed_roles = []) {
    // 1. Ambil dari HTTP Headers (Solusi isolasi per-tab karena sessionStorage terpisah per-tab)
    $user_id = isset($_SERVER['HTTP_X_SESSION_USER_ID']) ? trim($_SERVER['HTTP_X_SESSION_USER_ID']) : '';
    $role = isset($_SERVER['HTTP_X_SESSION_USER_ROLE']) ? trim($_SERVER['HTTP_X_SESSION_USER_ROLE']) : '';
    $tenant_id = isset($_SERVER['HTTP_X_SESSION_TENANT_ID']) ? trim($_SERVER['HTTP_X_SESSION_TENANT_ID']) : '';

    // 2. Fallback ke native $_SESSION jika header kosong (Backward compatibility & direct access)
    if (empty($user_id)) {
        if (isset($_SESSION['user_id'])) {
            $user_id = (string)$_SESSION['user_id'];
            $role = $_SESSION['role'];
            $tenant_id = isset($_SESSION['tenant_id']) ? (string)$_SESSION['tenant_id'] : null;
        }
    }

    if (empty($user_id)) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized. Silakan masuk terlebih dahulu.']);
        exit();
    }
    
    if (!empty($allowed_roles) && !in_array($role, $allowed_roles)) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden. Anda tidak memiliki hak akses untuk halaman ini.']);
        exit();
    }

    return [
        'user_id' => $user_id,
        'role' => $role,
        'tenant_id' => $tenant_id ?: null
    ];
}

/**
 * Recursively formats database response rows to match TypeScript types.
 * Converts key fields (id, *_id) to string, and float/int values to correct PHP types.
 * 
 * @param array $row Database row(s)
 * @return array Formatted row(s)
 */
function format_db_row($row) {
    if (!$row) return $row;
    
    // If it is a list of rows
    if (isset($row[0]) && is_array($row[0])) {
        return array_map('format_db_row', $row);
    }
    
    foreach ($row as $key => $value) {
        if ($value === null) {
            continue;
        }
        
        // Cast key attributes to string
        if (in_array($key, ['id', 'user_id', 'tenant_id', 'menu_id'])) {
            $row[$key] = (string)$value;
        }
        // Cast decimal attributes to float
        elseif (in_array($key, ['harga', 'total_harga'])) {
            $row[$key] = (float)$value;
        }
        // Cast integer attributes to int
        elseif (in_array($key, ['stok', 'jumlah'])) {
            $row[$key] = (int)$value;
        }
    }
    return $row;
}

/**
 * Decodes JSON payload from request body.
 * 
 * @return array Parsed JSON
 */
function get_json_input() {
    $json = file_get_contents('php://input');
    return json_decode($json, true) ?: [];
}
?>
