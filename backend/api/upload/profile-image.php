<?php
/**
 * upload-profile-image.php — Upload gambar profil (Avatar/Tenant Cover)
 *
 * POST /api/upload/profile-image.php (multipart/form-data)
 * Field: file (file input)
 * Requires: tenant atau admin auth
 *
 * Response: { "url": "http://localhost:8000/uploads/profiles/filename.jpg" }
 */

ini_set('display_errors', 0);
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);

require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../../db.php';
require_once __DIR__ . '/../auth_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed.']);
    exit();
}

// Harus login
require_auth();

// Validasi file ada
if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    $errCode = $_FILES['file']['error'] ?? -1;
    $errMsg  = match($errCode) {
        UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'File terlalu besar. Maksimal 5MB.',
        UPLOAD_ERR_NO_FILE => 'Tidak ada file yang dipilih.',
        default => 'Terjadi kesalahan upload (kode: ' . $errCode . ').',
    };
    http_response_code(400);
    echo json_encode(['error' => $errMsg]);
    exit();
}

$file     = $_FILES['file'];
$tmpPath  = $file['tmp_name'];
$origName = $file['name'];
$fileSize = $file['size'];
$mimeType = mime_content_type($tmpPath);

// Validasi format
$allowedMime = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
$allowedExt  = ['jpg', 'jpeg', 'png', 'webp'];

if (!in_array($mimeType, $allowedMime)) {
    http_response_code(400);
    echo json_encode(['error' => 'Format gambar tidak diizinkan. Gunakan JPG, JPEG, PNG, atau WEBP.']);
    exit();
}

$ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
if (!in_array($ext, $allowedExt)) {
    http_response_code(400);
    echo json_encode(['error' => 'Ekstensi file tidak diizinkan. Gunakan .jpg, .jpeg, .png, atau .webp.']);
    exit();
}

// Validasi ukuran (max 5MB)
if ($fileSize > 5 * 1024 * 1024) {
    http_response_code(400);
    echo json_encode(['error' => 'Ukuran gambar terlalu besar. Maksimal 5MB.']);
    exit();
}

// Siapkan direktori upload
$uploadDir = __DIR__ . '/../../uploads/profiles/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Generate nama file unik
$newFilename = uniqid('profile_', true) . '.' . $ext;
$destination = $uploadDir . $newFilename;

// Pindahkan file
if (!move_uploaded_file($tmpPath, $destination)) {
    http_response_code(500);
    echo json_encode(['error' => 'Gagal menyimpan file profil.']);
    exit();
}

// Kembalikan URL publik
$protocol   = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'http';
$host       = $_SERVER['HTTP_HOST'] ?? 'localhost:8000';
$fileUrl    = $protocol . '://' . $host . '/uploads/profiles/' . $newFilename;

echo json_encode([
    'success'  => true,
    'url'      => $fileUrl,
    'filename' => $newFilename,
]);
?>
