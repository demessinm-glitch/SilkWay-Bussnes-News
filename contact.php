<?php

declare(strict_types=1);

const CONTACT_PRIMARY = 'demessinm@gmail.com';
const CONTACT_COPY = '1227353115@qq.com';
const CONTACT_SENDER = 'contact@oguz.kz';
const CONTACT_RATE_LIMIT_SECONDS = 30;
const CONTACT_SERVICES = [
    '市场进入咨询',
    '公司注册与运营',
    '招投标支持',
    '翻译与文件递交',
    '本地代表与项目协调',
    '其他服务',
];

function wantsJson(): bool
{
    return strpos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;
}

function respond(int $status, array $payload, string $fallback)
{
    http_response_code($status);
    header('Cache-Control: no-store');
    header('X-Robots-Tag: noindex, nofollow');

    if (wantsJson()) {
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    header('Location: ' . $fallback, true, 303);
    exit;
}

function postedText(string $key): string
{
    $value = $_POST[$key] ?? '';
    if (!is_string($value)) {
        return '';
    }

    return trim(str_replace("\0", '', $value));
}

function textLength(string $value): int
{
    return function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
}

function validLength(string $value, int $minimum, int $maximum): bool
{
    $length = textLength($value);
    return $length >= $minimum && $length <= $maximum;
}

function singleLine(string $value): string
{
    return trim((string) preg_replace('/[\r\n]+/u', ' ', $value));
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, [
        'success' => false,
        'message' => '仅接受表单提交。',
    ], 'services.html#contact');
}

if (postedText('_honey') !== '') {
    respond(200, [
        'success' => true,
        'message' => '需求已发送。',
    ], 'thanks.html');
}

$company = singleLine(postedText('company'));
$name = singleLine(postedText('name'));
$contact = singleLine(postedText('contact'));
$service = singleLine(postedText('service'));
$message = postedText('message');
$consent = postedText('consent');

$valid = validLength($company, 2, 160)
    && validLength($name, 2, 100)
    && validLength($contact, 3, 200)
    && validLength($message, 10, 3000)
    && in_array($service, CONTACT_SERVICES, true)
    && $consent === 'yes';

if (!$valid) {
    respond(422, [
        'success' => false,
        'message' => '请检查必填信息和文字长度后重试。',
    ], 'services.html?form=invalid#contact');
}

$clientKey = hash('sha256', (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
$rateLimitFile = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'silkway-contact-' . $clientKey;
$lastSubmission = is_file($rateLimitFile) ? (int) filemtime($rateLimitFile) : 0;

if ($lastSubmission > 0 && time() - $lastSubmission < CONTACT_RATE_LIMIT_SECONDS) {
    respond(429, [
        'success' => false,
        'message' => '提交过于频繁，请稍后再试。',
    ], 'services.html?form=rate-limit#contact');
}

touch($rateLimitFile);

$submittedAt = (new DateTimeImmutable('now', new DateTimeZone('Asia/Almaty')))
    ->format('Y-m-d H:i:s T');
$body = implode("\n", [
    'New inquiry from oguz.kz',
    '-------------------------',
    'Company: ' . $company,
    'Name: ' . $name,
    'Contact: ' . $contact,
    'Service: ' . $service,
    'Submitted: ' . $submittedAt,
    '',
    'Project details:',
    $message,
]);
$subject = '=?UTF-8?B?' . base64_encode('oguz.kz 中文业务咨询') . '?=';
$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'From: SilkWayBrief Website <' . CONTACT_SENDER . '>',
    'Sender: ' . CONTACT_SENDER,
    'Bcc: ' . CONTACT_COPY,
    'X-Mailer: PHP/' . PHP_VERSION,
];

if (filter_var($contact, FILTER_VALIDATE_EMAIL)) {
    $headers[] = 'Reply-To: ' . $contact;
}

if (!function_exists('mail')) {
    respond(502, [
        'success' => false,
        'message' => '邮件服务暂时不可用，请使用页面上的邮箱直接联系。',
    ], 'services.html?form=mail-error#contact');
}

$sent = mail(CONTACT_PRIMARY, $subject, $body, implode("\r\n", $headers));

if (!$sent) {
    respond(502, [
        'success' => false,
        'message' => '邮件服务暂时未接受请求，请使用页面上的邮箱直接联系。',
    ], 'services.html?form=mail-error#contact');
}

respond(200, [
    'success' => true,
    'message' => '项目需求已发送至两位项目联系人。',
], 'thanks.html');
