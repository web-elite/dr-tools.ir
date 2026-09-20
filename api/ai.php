<?php
/**
 * dr-tools.ir — AI proxy endpoint
 * Hides the API key server-side; stores remembered responses in JSON files.
 *
 * Deploy:  /opt/1panel/www/sites/dr-tools.ir/api/ai.php
 * Memory:  /opt/1panel/www/sites/dr-tools.ir/api/memory/<tool>.json
 *
 * Endpoints (POST, JSON body):
 *   { "action":"ai",      "tool":"regex-generator", "prompt":"..." }
 *   { "action":"remember","tool":"regex-generator", "prompt":"...", "text":"..." }
 *   { "action":"forget",  "tool":"regex-generator", "prompt":"..." }
 *
 * Responses (JSON):
 *   ai:       { "ok":true, "text":"...", "fromCache":false, "memKey":"..." }
 *   remember: { "ok":true }
 *   forget:   { "ok":true }
 *   error:    { "ok":false, "error":"NO_KEY" | "API_500" | ... }
 */

// ─── CONFIG: change these before deploying ──────────────────────────────────
define('AI_BASE_URL', 'https://www.completions.me/api/v1');
define('AI_API_KEY',  'sk-cp_6676587eaa35495c7749c59ba83c9af507ec8558db5ddfc5');
define('AI_MODEL',    'gemini-3.1-pro-preview');
// ─────────────────────────────────────────────────────────────────────────────

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

// Only accept POST JSON
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['ok' => false, 'error' => 'METHOD_NOT_ALLOWED']);
    exit;
}
$raw = file_get_contents('php://input');
$body = json_decode($raw, true);
if (!is_array($body)) {
    echo json_encode(['ok' => false, 'error' => 'BAD_JSON']);
    exit;
}

$action  = $body['action']  ?? 'ai';
$tool    = preg_replace('/[^a-z0-9\-]/', '', $body['tool']   ?? '');
$prompt  = isset($body['prompt']) ? (string)$body['prompt']  : '';
$memKey  = memKey($tool, $prompt);
$memDir  = __DIR__ . '/memory';
$memFile = $memDir . '/' . ($tool ?: 'misc') . '.json';

// ─── djb2 hash (identical to JS aiHash) ─────────────────────────────────────
function memKey(string $tool, string $prompt): string {
    $s = $tool . '::' . $prompt;
    $h = 5381;
    for ($i = 0; $i < strlen($s); $i++) {
        $h = (($h << 5) + $h + ord($s[$i])) & 0xFFFFFFFF;
        // keep as unsigned 32-bit
        if ($h > 0x7FFFFFFF) $h -= 0x100000000;
        if ($h < 0) $h += 0x100000000;
    }
    // Convert to base36 same as JS toString(36)
    return toBase36($h);
}

function toBase36(int $n): string {
    if ($n === 0) return '0';
    $chars = '0123456789abcdefghijklmnopqrstuvwxyz';
    $out = '';
    $n = abs($n);
    while ($n > 0) { $out = $chars[$n % 36] . $out; $n = intdiv($n, 36); }
    return $out;
}

function loadMem(string $file): array {
    if (!is_file($file)) return [];
    $data = json_decode(file_get_contents($file), true);
    return is_array($data) ? $data : [];
}

function saveMem(string $file, array $mem): void {
    if (!is_dir(dirname($file))) @mkdir(dirname($file), 0755, true);
    $tmp = $file . '.tmp';
    file_put_contents($tmp, json_encode($mem, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
    rename($tmp, $file);
}

switch ($action) {

    case 'ai':
        if (AI_API_KEY === '') {
            echo json_encode(['ok' => false, 'error' => 'NO_KEY']);
            exit;
        }

        // 1) Check memory first
        $mem = loadMem($memFile);
        if (isset($mem[$memKey]) && !empty($mem[$memKey]['res'])) {
            echo json_encode([
                'ok' => true, 'text' => $mem[$memKey]['res'],
                'fromCache' => true, 'memKey' => $memKey,
            ]);
            exit;
        }

        // 2) Call OpenAI-compatible endpoint
        $url = rtrim(AI_BASE_URL, '/') . '/chat/completions';
        $ch  = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 30,
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . AI_API_KEY,
            ],
            CURLOPT_POSTFIELDS => json_encode([
                'model'      => AI_MODEL,
                'messages'   => [['role' => 'user', 'content' => $prompt]],
                'temperature'=> 0.2,
            ]),
        ]);
        $resp = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err  = curl_error($ch);
        curl_close($ch);

        if ($resp === false) {
            echo json_encode(['ok' => false, 'error' => 'CURL_ERROR', 'detail' => $err]);
            exit;
        }
        if ($code !== 200) {
            echo json_encode(['ok' => false, 'error' => 'API_' . $code]);
            exit;
        }

        $data = json_decode($resp, true);
        $text = $data['choices'][0]['message']['content'] ?? '';

        // 3) Save to memory immediately (user can react 👍 to confirm)
        $mem[$memKey] = [
            'tool'   => $tool,
            'prompt' => $prompt,
            'res'    => $text,
            'ts'     => time(),
        ];
        saveMem($memFile, $mem);

        echo json_encode([
            'ok' => true, 'text' => $text,
            'fromCache' => false, 'memKey' => $memKey,
        ]);
        break;

    case 'remember':
        $mem = loadMem($memFile);
        $text = isset($body['text']) ? (string)$body['text'] : '';
        $mem[$memKey] = [
            'tool'   => $tool,
            'prompt' => $prompt,
            'res'    => $text,
            'ts'     => time(),
        ];
        saveMem($memFile, $mem);
        echo json_encode(['ok' => true]);
        break;

    case 'forget':
        $mem = loadMem($memFile);
        unset($mem[$memKey]);
        saveMem($memFile, $mem);
        echo json_encode(['ok' => true]);
        break;

    default:
        echo json_encode(['ok' => false, 'error' => 'UNKNOWN_ACTION']);
}
