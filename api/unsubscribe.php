<?php
require_once __DIR__ . '/db.php';
$e = trim($_GET['e'] ?? '');
$t = trim($_GET['t'] ?? '');
$done = false; $found = false;
if ($e !== '' && $t !== '') {
  try {
    $db = lpk_db();
    $q = $db->prepare('SELECT id, token FROM leads WHERE email = ?');
    $q->execute([strtolower($e)]);
    if ($row = $q->fetch(PDO::FETCH_ASSOC)) {
      $found = true;
      if (hash_equals((string)$row['token'], $t)) {
        $db->prepare('DELETE FROM leads WHERE id = ?')->execute([$row['id']]);
        $done = true;
      }
    } else { $done = true; $found = true; }   // already gone counts as done
  } catch (Throwable $ex) { $done = false; }
}
?><!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title><?= $done ? 'Unsubscribed' : 'Unsubscribe' ?> · Learn Piano Keys</title>
<meta name="robots" content="noindex, nofollow">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/styles.css">
</head><body>
<main><section><div class="wrap" style="max-width:640px">
  <p class="eyebrow"><?= $done ? 'All done' : 'Sorry' ?></p>
  <h1><?= $done ? 'You are unsubscribed' : 'That link did not work' ?></h1>
  <p class="lede"><?= $done
    ? 'Your address has been deleted from our list entirely, not just flagged. You will not hear from us again unless you sign up afresh. Everything on the site stays free and open to you.'
    : 'The link may have been cut in half by your email program. Copy the whole link, or write to info@learnpianokeys.com and we will remove you by hand.' ?></p>
  <p><a class="btn btn-primary" href="/">Back to the site</a></p>
</div></section></main>
</body></html>
