<?php
declare(strict_types=1);
require __DIR__ . '/lib.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(['error' => 'Метод не поддерживается'], 405);
same_origin(); $b = body();
if (clean($b['site'] ?? '') !== '') out(['ok' => true]);          // ловушка для роботов
limit('lead', 5, 600);
$name = clean($b['name'] ?? '', 80); $phone = clean($b['phone'] ?? '', 30);
if ($name === '' || !phone_ok($phone)) out(['error' => 'Проверьте имя и телефон'], 422);
$text = "Имя: $name\nТелефон: $phone\nУслуга: " . clean($b['service'] ?? '', 120) . "\nЖелаемая дата: " . clean($b['date'] ?? '', 20) . ' ' . clean($b['slot'] ?? '', 30) . "\nКомментарий: " . clean($b['comment'] ?? '', 400) . "\nСтраница: " . clean($b['page'] ?? '', 100);
file_put_contents(DATA . 'leads.log', date('c') . "\n$text\n---\n", FILE_APPEND | LOCK_EX);   // копия на случай проблем с почтой
$ok = notify('Новая заявка с сайта ЛАБОДИ', $text);
out($ok ? ['ok' => true] : ['error' => 'Не удалось отправить заявку. Позвоните: +7 (916) 301-61-46'], $ok ? 200 : 502);
