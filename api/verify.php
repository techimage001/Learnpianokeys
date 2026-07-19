<?php
require_once __DIR__ . '/db.php';
$t = trim($_GET['t'] ?? '');
$ok = false;
if ($t !== '' && preg_match('/^[a-f0-9]{40}$/', $t)) {
  try {
    $db = lpk_db();
    $q = $db->prepare('SELECT id FROM leads WHERE token = ?');
    $q->execute([$t]);
    if ($row = $q->fetch(PDO::FETCH_ASSOC)) {
      $db->prepare('UPDATE leads SET verified = 1, verified_at = ? WHERE id = ?')
         ->execute([gmdate('c'), $row['id']]);
      $ok = true;
    }
  } catch (Throwable $e) { $ok = false; }
}
?><!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title><?= $ok ? 'Confirmed' : 'Link not recognised' ?> · Learn Piano Keys</title>
<meta name="robots" content="noindex, nofollow">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/styles.css">
</head><body>
<main><section><div class="wrap" style="max-width:640px">
  <p class="eyebrow"><?= $ok ? 'All done' : 'Hmm' ?></p>
  <h1><?= $ok ? 'Your email is confirmed' : 'That link did not work' ?></h1>
  <p class="lede"><?= $ok
    ? 'Thank you. You are on the list, and you will hear from us when new pieces, lessons and tools are added. Nothing else changes and there is nothing to pay.'
    : 'The link may have already been used, or it may have been cut in half by your email program. Try copying the whole link, or write to info@learnpianokeys.com and we will sort it out.' ?></p>
  <p><a class="btn btn-primary" href="/app.html">Back to the practice room</a></p>
</div></section></main>
</body></html>
