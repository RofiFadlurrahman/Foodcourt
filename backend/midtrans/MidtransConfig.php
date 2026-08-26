<?php
/**
 * MidtransConfig.php — Helper untuk Midtrans API
 */

class MidtransConfig
{
    public static string $serverKey;
    public static string $clientKey;
    public static bool   $isProduction;
    public static string $snapUrl;
    public static string $apiUrl;

    public static function init(): void
    {
        // Key langsung dari dashboard Midtrans Anda
        self::$serverKey = $_ENV['MIDTRANS_SERVER_KEY'] 
            ?? $_SERVER['MIDTRANS_SERVER_KEY'] 
            ?? getenv('MIDTRANS_SERVER_KEY') 
            ?: 'Mid-server-coI5_k1MGiAWjsrvuSnHIt5I';

        self::$clientKey = $_ENV['MIDTRANS_CLIENT_KEY'] 
            ?? $_SERVER['MIDTRANS_CLIENT_KEY'] 
            ?? getenv('MIDTRANS_CLIENT_KEY') 
            ?: 'Mid-client-R4hZlVBQk2PcDbWz';

        // Selalu true karena ini akun Production Midtrans
        self::$isProduction = true;

        self::$snapUrl = 'https://app.midtrans.com/snap/v1/transactions';
        self::$apiUrl  = 'https://api.midtrans.com/v2';
    }

    /** Buat Snap Token dari payload order */
    public static function createSnapToken(array $payload): array
    {
        self::init();
        $auth = base64_encode(self::$serverKey . ':');
        $json = json_encode($payload);

        $ch = curl_init(self::$snapUrl);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $json,
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
                'Accept: application/json',
                'Authorization: Basic ' . $auth,
            ],
            CURLOPT_SSL_VERIFYPEER => false,
        ]);

        $response  = curl_exec($ch);
        $httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $result = json_decode($response, true) ?: [];
        $result['http_code'] = $httpCode;
        return $result;
    }

    /** Cek status transaksi dari Midtrans */
    public static function getTransactionStatus(string $orderId): array
    {
        self::init();
        $auth = base64_encode(self::$serverKey . ':');
        $url  = self::$apiUrl . '/' . urlencode($orderId) . '/status';

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => [
                'Accept: application/json',
                'Authorization: Basic ' . $auth,
            ],
            CURLOPT_SSL_VERIFYPEER => false,
        ]);

        $response = curl_exec($ch);
        curl_close($ch);

        return json_decode($response, true) ?: [];
    }

    /** Verifikasi signature key notifikasi dari Midtrans */
    public static function verifySignature(string $orderId, string $statusCode, string $grossAmount, string $receivedSignature): bool
    {
        self::init();
        $expected = hash('sha512', $orderId . $statusCode . $grossAmount . self::$serverKey);
        return hash_equals($expected, $receivedSignature);
    }
}
?>