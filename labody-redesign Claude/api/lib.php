<?php
declare(strict_types=1);
$CFG = require __DIR__ . '/config.php';
const DATA = __DIR__ . '/data/';
function out(array $d, int $code = 200): void { http_response_code($code); header('Content-Type: application/json; charset=utf-8'); echo json_encode($d, JSON_UNESCAPED_UNICODE); exit; }
function body(): array { $j = json_decode((string)file_get_contents('php://input'), true); return is_array($j) ? $j : []; }
function clean($v, int $max = 300): string { $v = trim(strip_tags((string)$v)); $v = (string)preg_replace('/\s+/u', ' ', $v); return mb_substr($v, 0, $max); }
function same_origin(): void {
  $o = $_SERVER['HTTP_ORIGIN'] ?? ''; if ($o === '') return;
  if (parse_url($o, PHP_URL_HOST) !== ($_SERVER['HTTP_HOST'] ?? '')) out(['error' => 'Запрос отклонён'], 403);
}
function limit(string $key, int $max, int $win): void {
  $f = DATA . 'rl-' . md5(($_SERVER['REMOTE_ADDR'] ?? '') . $key) . '.json'; $now = time();
  $t = is_file($f) ? (json_decode((string)file_get_contents($f), true) ?: []) : [];
  $t = array_values(array_filter($t, fn($x) => $x > $now - $win));
  if (count($t) >= $max) out(['error' => 'Слишком много попыток. Попробуйте позже или позвоните нам.'], 429);
  $t[] = $now; file_put_contents($f, json_encode($t), LOCK_EX);
}
function send_mail(string $to, string $subject, string $text): bool {
  global $CFG; if (!filter_var($to, FILTER_VALIDATE_EMAIL)) return false;
  $h = "From: ЛАБОДИ <{$CFG['mail_from']}>\r\nContent-Type: text/plain; charset=UTF-8\r\nMIME-Version: 1.0\r\n";
  return @mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $text, $h);
}
function tg(string $text): void {
  global $CFG; if (!$CFG['telegram_token'] || !$CFG['telegram_chat']) return;
  $ch = curl_init('https://api.telegram.org/bot' . $CFG['telegram_token'] . '/sendMessage');
  curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => ['chat_id' => $CFG['telegram_chat'], 'text' => $text], CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 6]);
  curl_exec($ch); curl_close($ch);
}
function notify(string $subject, string $text): bool { global $CFG; $ok = send_mail($CFG['mail_to'], $subject, $text); tg($subject . "\n" . $text); return $ok; }
function phone_ok(string $p): bool { return strlen((string)preg_replace('/\D/', '', $p)) >= 11; }
function yk(string $method, string $path, ?array $payload = null): array {
  global $CFG; $ch = curl_init('https://api.yookassa.ru/v3' . $path);
  $h = ['Content-Type: application/json']; if ($method === 'POST') $h[] = 'Idempotence-Key: ' . bin2hex(random_bytes(16));
  curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 20, CURLOPT_HTTPHEADER => $h, CURLOPT_USERPWD => $CFG['yk_shop_id'] . ':' . $CFG['yk_secret']]);
  if ($method === 'POST') { curl_setopt($ch, CURLOPT_POST, true); curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload, JSON_UNESCAPED_UNICODE)); }
  $r = curl_exec($ch); $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
  $j = json_decode((string)$r, true); return ['code' => $code, 'data' => is_array($j) ? $j : []];
}
