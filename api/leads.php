<?php
require_once __DIR__ . '/db.php';
session_start();
header('X-Robots-Tag: noindex, nofollow', true);

if (lpk_admin_locked()) {
  http_response_code(503);
  exit('Admin is locked: no secrets.php found outside public_html. The site itself is unaffected.');
}

if (isset($_GET['logout'])) { session_destroy(); header('Location: leads.php'); exit; }

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && isset($_POST['password'])) {
  if (hash_equals(lpk_secret('admin_password'), (string)$_POST['password'])) {
    $_SESSION['lpk_admin'] = true;
  } else { $err = 'Wrong password.'; }
}

if (empty($_SESSION['lpk_admin'])) {
  ?><!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1"><title>Admin</title>
  <meta name="robots" content="noindex,nofollow">
  <link rel="stylesheet" href="/assets/styles.css"></head><body>
  <main><section><div class="wrap" style="max-width:420px">
    <h1>Admin</h1>
    <?php if (!empty($err)) echo '<p style="color:#9E3B45">' . htmlspecialchars($err) . '</p>'; ?>
    <form method="post">
      <input type="password" name="password" placeholder="Password" autofocus style="width:100%;margin-bottom:12px">
      <button class="btn btn-primary" type="submit">Sign in</button>
    </form>
  </div></section></main></body></html><?php
  exit;
}

$db = lpk_db();

if (isset($_GET['delete'])) {
  $db->prepare('DELETE FROM leads WHERE id = ?')->execute([(int)$_GET['delete']]);
  header('Location: leads.php'); exit;
}

/* CSV export contains VERIFIED addresses only. */
if (isset($_GET['csv'])) {
  header('Content-Type: text/csv; charset=utf-8');
  header('Content-Disposition: attachment; filename="learnpianokeys-verified-leads.csv"');
  $out = fopen('php://output', 'w');
  fputcsv($out, ['email', 'source', 'created_at', 'verified_at']);
  foreach ($db->query('SELECT email, source, created_at, verified_at FROM leads WHERE verified = 1 ORDER BY id') as $r) {
    fputcsv($out, [$r['email'], $r['source'], $r['created_at'], $r['verified_at']]);
  }
  exit;
}

$rows = $db->query('SELECT * FROM leads ORDER BY id DESC')->fetchAll(PDO::FETCH_ASSOC);
$v = 0; foreach ($rows as $r) if ((int)$r['verified'] === 1) $v++;
?><!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Leads</title>
<meta name="robots" content="noindex,nofollow">
<link rel="stylesheet" href="/assets/styles.css"></head><body>
<main><section><div class="wrap">
  <p class="eyebrow">Admin</p>
  <h1>Leads</h1>
  <p class="lede"><?= count($rows) ?> total, <?= $v ?> verified, <?= count($rows) - $v ?> pending.
    Only verified addresses are exported.</p>
  <p><a class="btn btn-primary btn-sm" href="?csv=1">Download verified CSV</a>
     <a class="btn btn-ghost btn-sm" href="?logout=1">Sign out</a></p>
  <div class="table-scroll"><table class="compare"><thead>
    <tr><th>Email</th><th>Status</th><th>Source</th><th>Signed up</th><th>Confirmed</th><th></th></tr>
  </thead><tbody>
  <?php foreach ($rows as $r): ?>
    <tr>
      <td><?= htmlspecialchars($r['email']) ?></td>
      <td class="<?= $r['verified'] ? 'yes' : 'no' ?>"><?= $r['verified'] ? 'VERIFIED' : 'PENDING' ?></td>
      <td class="no"><?= htmlspecialchars((string)$r['source']) ?></td>
      <td class="no"><?= htmlspecialchars(substr((string)$r['created_at'], 0, 16)) ?></td>
      <td class="no"><?= htmlspecialchars(substr((string)$r['verified_at'], 0, 16)) ?></td>
      <td><a href="?delete=<?= (int)$r['id'] ?>" onclick="return confirm('Delete this address permanently?')">Delete</a></td>
    </tr>
  <?php endforeach; ?>
  </tbody></table></div>
</div></section></main></body></html>
