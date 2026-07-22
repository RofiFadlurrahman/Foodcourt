<?php
session_start();

$role = $_SESSION['role'] ?? '';

// Hapus semua variabel session
$_SESSION = [];

// Hancurkan session cookie jika ada
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// Hancurkan session secara keseluruhan
session_destroy();

// Alihkan ke halaman login masing-masing
if ($role === 'admin') {
    header("Location: admin/login.php");
} elseif ($role === 'tenant') {
    header("Location: tenant/login.php");
} else {
    header("Location: index.php");
}
exit;
?>
