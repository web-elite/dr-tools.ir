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
define('AI_BASE_URL', 'https://api.atria-asi.ai/v1');
define('AI_API_KEY',  'atr_UaJZcazOm16KWIVVjPnpHFpBX-yzw6Ev');
define('AI_MODEL',    'Atria-Dawn-Preview');
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

/* ---------------------------------------------------------------------------
   Security: prompt validation
   - Max length 500 chars (token-burn prevention)
   - Tool-specific scope restriction (regex-generator only accepts regex descriptions)
   - Blocklist of common abuse patterns
   --------------------------------------------------------------------------- */
function validatePrompt(string $tool, string $prompt): ?string {
    $p = trim($prompt);
    // 1. Length cap — anything >500 chars is almost certainly abuse
    if (mb_strlen($p) > 500) return 'prompt_too_long';

    // 2. Tool scope: regex-generator prompts must be short pattern descriptions
    if ($tool === 'regex-generator') {
        // Block prompts that try to make the model do something else entirely
        $abusePatterns = [
            '/from\s+\d+\s+to\s+\d+/i',          // "from 1 to 1000"
            '/count(ing)?\s+(to|up\s+to)\s+\d+/i', // "count to 1000"
            '/(generate|create|make|list)\s+\d{2,}\s+(mac|ip|email|url|token|user|pass)/i',
            '/(mac|ip)\s+address(\s+list)?\s*(of|with)?\s*\d{2,}/i',
            '/print|echo|output\s+(all|everything|the\s+whole)/i',
            '/(system|developer|hidden)\s+(prompt|instruction|rule)/i',
            '/(reveal|show|tell|leak|dump)\s+(your|the|all\s+)?.{0,30}(prompt|instruction|rule|secret|key|token)/i',
            '/ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|rules|prompts|context)/i',
            '/you\s+are\s+now\s+(a|an)\s+(different|new|other)/i',
            '/act\s+as\s+(a|an)\s+(ai|assistant|agent|bot|character|human)/i',
            '/pretend\s+(you|that\s+you)\s+are/i',
            '/role\s*play/i',
            '/jailbreak/i',
            '/DAN\s+mode/i',
            '/write\s+(a|an)?\s*(poem|story|essay|blog|article|slogan|haiku)/i',
            '/translate\s+(this|the\s+following|into)/i',
            '/(python|java|c\+\+|c#|rust|go|ruby|php|node|javascript)\s+(script|program|code|function|class)/i',
            '/solve\s+(this|the\s+following|a)\s+(math|logic|physics|chem)/i',
            '/(what|who|when|where|why)\s+(is|was|are|were)\s+(not|the|a|an)/i',  // general knowledge Qs
            '/(explanation|explain|define|describe)\s+(what|how|why|the)\s+/i',
            '/(history|definition|meaning)\s+of\s+/i',
            '/list\s+(all|every|the)\s+(countries|languages|elements|planets|amino|viruses|bacteria)/i',
            '/(write|generate|create)\s+(a|an)\s*(song|music|video|image|picture)/i',
            '/(how\s+to|what\s+is\s+the)\s+(make|build|hack|exploit|bypass|crack)/i',
            '/(password|passwd|secret|api[_\s-]?key|token|credential)\s+(for|of|from)\s+/i',
        ];
        foreach ($abusePatterns as $pat) {
            if (preg_match($pat, $p)) return 'out_of_scope';
        }
    }

    // 3. Global blocklist (any tool)
    $globalAbuse = [
        '/(ignore|disregard|forget)\s+(all\s+)?(previous|prior|above|your)\s+(instructions|rules|prompts|context|constraints)/i',
        '/you\s+are\s+(no\s+longer|not)\s+a\s+regex/i',
        '/(system|hidden|internal)\s+(prompt|instruction|rule|directive)/i',
        '/(reveal|show|print|leak|dump)\s+(your|the|all|any)\s*(system|internal|hidden|secret)\s*(prompt|instruction|rule|key|token|secret)/i',
        '/what\s+(are|is)\s+your\s+(system|hidden|internal)\s*(prompt|instruction|rule)/i',
        '/repeat\s+(your|the)\s*(system|hidden|internal)\s*(prompt|instruction|rule)/i',
        '/from\s+\d+\s+to\s+\d+/i',
        '/count\s+(to|from|from\s+\d+\s+to\s+\d+)/i',
        '/(generate|create|make|list|produce)\s+(\d{3,}|one\s+hundred|thousand|million)\s+(mac|ip|email|url|token|user|pass)/i',
        '/(write|create|generate)\s+(a\s+)?(poem|story|essay|blog|article|slogan|haiku|limerick|song|jingle|rap|verse)/i',
        '/translate\s+(this|the\s+following|the\s+text|the\s+sentence|the\s+word)/i',
        '/(python|java|c\+\+|c#|rust|go|ruby|php|node|typescript|javascript)\s+(script|program|code|function|class|method)/i',
        '/solve\s+(this|the\s+following|a|the)\s+(math|logic|physics|chem|calculus|algebra)/i',
        '/(how\s+do\s+I|how\s+to|show\s+me)\s+(make|build|hack|exploit|bypass|crack|break)/i',
        '/(jailbreak|DAN\s+mode|developer\s+mode|sudo\s+mode|god\s+mode)/i',
    ];
    foreach ($globalAbuse as $pat) {
        if (preg_match($pat, $p)) return 'out_of_scope';
    }

    return null; // valid
}

function securityError(string $code): void {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => $code, 'blocked' => true]);
    exit;
}

switch ($action) {

    case 'ai':
        if (AI_API_KEY === '') {
            echo json_encode(['ok' => false, 'error' => 'NO_KEY']);
            exit;
        }

        // Security: validate prompt before any processing
        $blockReason = validatePrompt($tool, $prompt);
        if ($blockReason !== null) {
            securityError($blockReason);
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
