<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);

    echo json_encode([
        "status" => "error",
        "message" => "Gunakan POST",
        "method" => $_SERVER["REQUEST_METHOD"]
    ]);

    exit;
}

$raw = file_get_contents("php://input");
$data = json_decode($raw, true);

echo json_encode([
    "status" => "success",
    "message" => "login.php berhasil menerima POST",
    "received" => $data
]);