<?php
/**
 * Relay API — forwards tournament uploads to a remote NewTon instance.
 * Used when the browser can't make cross-origin requests with basic auth (CORS preflight).
 * PHP handles the remote request server-side — no CORS, no preflight, auth works naturally.
 */

// Check if API is enabled
require_once 'api-check.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

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
$username  = $request['username'] ?? '';
$password  = $request['password'] ?? '';
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

// Forward the request via cURL
$ch = curl_init($remoteUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

// Basic auth if provided
if ($username !== '') {
    curl_setopt($ch, CURLOPT_USERPWD, $username . ':' . $password);
    curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
}

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
