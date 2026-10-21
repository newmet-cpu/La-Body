<?php
declare(strict_types=1);
require __DIR__ . '/lib.php';
// Адрес этого файла укажите в ЮKassa → Интеграция → HTTP-уведомления (событие payment.succeeded)
$n = body(); $id = (string)($n['object']['id'] ?? '');
if (($n['event'] ?? '') !== 'payment.succeeded' || !preg_match('/^[0-9a-f-]{20,}$/', $id)) out(['ok' => true]);
$r = yk('GET', '/payments/' . $id);                    // не верим присланным данным — спрашиваем у ЮKassa
$p = $r['data'];
if ($r['code'] !== 200 || ($p['status'] ?? '') !== 'succeeded' || empty($p['paid'])) out(['ok' => true]);
$flag = DATA . 'paid-' . $id . '.flag'; if (is_file($flag)) out(['ok' => true]);   // уже обработан
$m = $p['metadata'] ?? []; $code = 'LB-' . strtoupper(substr(bin2hex(random_bytes(4)), 0, 8));
file_put_contents($flag, $code);
$sum = $m['nominal'] ?? ($p['amount']['value'] ?? '');
$text = "Сертификат: $code\nНоминал: $sum ₽\nПокупатель: " . ($m['buyer'] ?? '') . "\nТелефон: " . ($m['phone'] ?? '') . "\nEmail: " . ($m['email'] ?? '') . "\nКому: " . ($m['to'] ?? '') . "\nПожелание: " . ($m['wish'] ?? '') . "\nПлатёж: $id";
file_put_contents(DATA . 'orders.log', date('c') . "\n$text\n---\n", FILE_APPEND | LOCK_EX);
notify('Оплачен сертификат ' . $code . ' на ' . $sum . ' ₽', $text);
if (!empty($m['email'])) send_mail((string)$m['email'], 'Ваш подарочный сертификат ЛАБОДИ', "Здравствуйте, " . ($m['buyer'] ?? '') . "!\n\nСпасибо за покупку. Номер сертификата: $code\nНоминал: $sum ₽\n" . (!empty($m['to']) ? "Для: {$m['to']}\n" : '') . "\nПокажите этот номер администратору студии ЛАБОДИ (г. Реутов, ул. Новая, д. 2, +7 (916) 301-61-46).");
out(['ok' => true]);
