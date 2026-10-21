<?php
declare(strict_types=1);
require __DIR__ . '/lib.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(['error' => 'Метод не поддерживается'], 405);
same_origin(); $b = body();
if (clean($b['site'] ?? '') !== '') out(['ok' => true]);
limit('cert', 6, 600);
if (!$CFG['yk_shop_id'] || !$CFG['yk_secret']) out(['error' => 'Оплата ещё не подключена. Позвоните: +7 (916) 301-61-46'], 503);
$amount = (int)($b['amount'] ?? 0); $name = clean($b['name'] ?? '', 80); $email = clean($b['email'] ?? '', 120); $phone = clean($b['phone'] ?? '', 30);
if ($amount < 1000 || $amount > 100000) out(['error' => 'Сумма от 1 000 до 100 000 ₽'], 422);
if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || !phone_ok($phone)) out(['error' => 'Проверьте имя, телефон и email'], 422);
$val = number_format($amount, 2, '.', ''); $desc = "Подарочный сертификат ЛАБОДИ на $amount ₽";
$p = [
  'amount' => ['value' => $val, 'currency' => 'RUB'], 'capture' => true,
  'confirmation' => ['type' => 'redirect', 'return_url' => $CFG['site_url'] . '/certificates.html?paid=1'],
  'description' => $desc,
  'metadata' => ['buyer' => $name, 'phone' => $phone, 'email' => $email, 'to' => clean($b['to'] ?? '', 80), 'wish' => clean($b['wish'] ?? '', 300), 'nominal' => (string)$amount],
];
if ($CFG['send_receipt']) {
  $p['receipt'] = ['customer' => ['email' => $email, 'phone' => '+' . preg_replace('/\D/', '', $phone)],
    'items' => [['description' => $desc, 'quantity' => '1.00', 'amount' => ['value' => $val, 'currency' => 'RUB'], 'vat_code' => $CFG['vat_code'], 'payment_mode' => $CFG['payment_mode'], 'payment_subject' => $CFG['payment_subject']]]];
  if ($CFG['tax_system_code']) $p['receipt']['tax_system_code'] = $CFG['tax_system_code'];
}
$r = yk('POST', '/payments', $p);
$url = $r['data']['confirmation']['confirmation_url'] ?? '';
if ($r['code'] !== 200 || $url === '') { file_put_contents(DATA . 'errors.log', date('c') . ' ' . json_encode($r['data'], JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND | LOCK_EX); out(['error' => 'Не удалось создать платёж. Позвоните: +7 (916) 301-61-46'], 502); }
out(['url' => $url]);
