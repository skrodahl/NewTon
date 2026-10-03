<?php
/**
 * Relay API — forwards tournament uploads to a remote NewTon instance.
 * The browser can't post to another origin without CORS, so PHP makes the request
 * server-side, adding the remote server's API key (X-API-Key) when one is given.
 */

// Check if API is enabled
require_once 'api-check.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, X-API-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Writes need the API key when NEWTON_API_KEY is set (see api-check.php)
require_api_key();

$input = file_get_contents('php://input');
$request = json_decode($input, true);

if ($request === null) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

// Required: remote URL and the tournament payload
if (empty($request['url']) || !isset($request['payload'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing url or payload']);
    exit;
}

$remoteUrl = $request['url'];
$apiKey    = isset($request['apiKey']) ? trim((string)$request['apiKey']) : '';
$payload   = json_encode($request['payload']);

if ($payload === false) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid payload']);
    exit;
}

// Validate URL
if (!filter_var($remoteUrl, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid remote URL']);
    exit;
}

// Only allow https (or http for local development)
$scheme = parse_url($remoteUrl, PHP_URL_SCHEME);
if (!in_array($scheme, ['http', 'https'])) {
    http_response_code(400);
    echo json_encode(['error' => 'URL must use http or https']);
    exit;
}

// Optional relay allowlist: when NEWTON_RELAY_ALLOWLIST is set (comma-separated
// hostnames), only those hosts may be relayed to. Unset = any host (current
// behavior) — the relay is then only as protected as the deployment around it.
$relayAllowlist = getenv('NEWTON_RELAY_ALLOWLIST');
if ($relayAllowlist !== false && trim($relayAllowlist) !== '') {
    $allowedHosts = array_filter(array_map('trim', explode(',', strtolower($relayAllowlist))));
    $remoteHost = strtolower(parse_url($remoteUrl, PHP_URL_HOST) ?? '');
    if (!in_array($remoteHost, $allowedHosts, true)) {
        http_response_code(403);
        echo json_encode(['error' => 'Remote host is not in NEWTON_RELAY_ALLOWLIST']);
        exit;
    }
}

// Forward the request via cURL
$ch = curl_init($remoteUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
// The remote server's API key, when given, travels as the X-API-Key header
$headers = ['Content-Type: application/json'];
if ($apiKey !== '' && strpbrk($apiKey, "\r\n") === false) {
    $headers[] = 'X-API-Key: ' . $apiKey;
}
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

$response   = curl_exec($ch);
$httpCode   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError  = curl_error($ch);
curl_close($ch);

if ($response === false) {
    http_response_code(502);
    echo json_encode(['error' => 'Could not reach remote server', 'detail' => $curlError]);
    exit;
}

// Pass through the remote server's response
http_response_code($httpCode);
echo $response;
