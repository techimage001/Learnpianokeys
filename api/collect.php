<?php
require_once __DIR__ . '/db.php';
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function out($arr, $code = 200) { http_response_code($code); echo json_encode($arr); exit; }

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') out(['ok' => false, 'error' => 'Use POST.'], 405);

$raw = file_get_contents('php://input');
$in = json_decode($raw, true);
if (!is_array($in)) $in = $_POST;

$email   = strtolower(trim($in['email'] ?? ''));
$hp      = trim($in['website'] ?? '');
$elapsed = (int) ($in['elapsed'] ?? 0);
$token   = trim($in['token'] ?? '');
$source  = substr(preg_replace('/[^a-z0-9\-]/i', '', $in['source'] ?? 'site'), 0, 40);

/* honeypot */
if ($hp !== '') out(['ok' => false, 'error' => 'Something went wrong. Please try again.']);
/* time trap */
if ($elapsed > 0 && $elapsed < LPK_MIN_FORM_MS) out(['ok' => false, 'error' => 'One moment, then try again.']);
/* js token: only a real page run produces one */
if ($token === '') out(['ok' => false, 'error' => 'Please enable JavaScript and try again.']);

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 190) {
  out(['ok' => false, 'error' => 'That does not look like an email address.']);
}
$domain = substr(strrchr($email, '@'), 1);
if (in_array($domain, $LPK_DISPOSABLE, true)) {
  out(['ok' => false, 'error' => 'Please use an address you can actually receive mail at.']);
}

try {
  $db = lpk_db();
  $q = $db->prepare('SELECT id, verified FROM leads WHERE email = ?');
  $q->execute([$email]);
  $row = $q->fetch(PDO::FETCH_ASSOC);

  /* An address already on the list unlocks a new device immediately. */
  if ($row) out(['ok' => true, 'known' => true, 'verified' => (int)$row['verified'] === 1]);

  if (!lpk_rate_ok()) out(['ok' => false, 'error' => 'Too many signups from this connection. Try again later.']);

  $tok = bin2hex(random_bytes(20));
  $db->prepare('INSERT INTO leads (email, token, verified, source, created_at, ip_hash)
                VALUES (?, ?, 0, ?, ?, ?)')
     ->execute([$email, $tok, $source, gmdate('c'), lpk_ip_hash()]);

  $link = LPK_SITE . '/api/verify.php?t=' . $tok;
  $body = "Thanks for signing up to Learn Piano Keys.\n\n"
        . "Click this link to confirm your address:\n$link\n\n"
        . "Signing up is free. No payment is taken and no card details are held.\n"
        . "If you did not sign up, ignore this email and nothing further will happen.\n\n"
        . "Learn Piano Keys\n" . LPK_SITE . "\n";
  lpk_send_mail($email, 'Confirm your Learn Piano Keys signup', $body);

  out(['ok' => true, 'known' => false]);
} catch (Throwable $e) {
  out(['ok' => false, 'error' => 'Could not save that just now. Please try again.'], 500);
}
