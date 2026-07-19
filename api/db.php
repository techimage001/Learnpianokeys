<?php
require_once __DIR__ . '/config.php';

function lpk_db() {
  static $pdo = null;
  if ($pdo) return $pdo;
  if (!is_dir(LPK_PRIVATE_DIR)) { @mkdir(LPK_PRIVATE_DIR, 0750, true); }
  $pdo = new PDO('sqlite:' . LPK_DB);
  $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  $pdo->exec('CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      token TEXT NOT NULL,
      verified INTEGER NOT NULL DEFAULT 0,
      source TEXT,
      created_at TEXT NOT NULL,
      verified_at TEXT,
      ip_hash TEXT
  )');
  $pdo->exec('CREATE TABLE IF NOT EXISTS hits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip_hash TEXT NOT NULL,
      at INTEGER NOT NULL
  )');
  return $pdo;
}

function lpk_ip_hash() {
  $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
  return hash('sha256', $ip . '|' . lpk_secret('salt', 'lpk-static-salt'));
}

function lpk_rate_ok() {
  $db = lpk_db();
  $h = lpk_ip_hash();
  $since = time() - 3600;
  $db->prepare('DELETE FROM hits WHERE at < ?')->execute([$since]);
  $q = $db->prepare('SELECT COUNT(*) FROM hits WHERE ip_hash = ? AND at >= ?');
  $q->execute([$h, $since]);
  if ((int)$q->fetchColumn() >= LPK_RATE_PER_HOUR) return false;
  $db->prepare('INSERT INTO hits (ip_hash, at) VALUES (?, ?)')->execute([$h, time()]);
  return true;
}

/* Minimal authenticated SMTP. No library, no service, no API key.
   Falls back to mail() if SMTP is not configured, and says so honestly. */
function lpk_send_mail($to, $subject, $textBody) {
  $host = lpk_secret('smtp_host');
  $user = lpk_secret('smtp_user');
  $pass = lpk_secret('smtp_pass');
  $port = (int) lpk_secret('smtp_port', '587');
  $from = LPK_FROM_EMAIL;
  $headers = "From: " . LPK_FROM_NAME . " <$from>\r\nReply-To: " . LPK_REPLY_TO .
             "\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n";

  if ($host === '' || $user === '' || $pass === '') {
    return @mail($to, $subject, $textBody, $headers);
  }

  $secure = ($port === 465) ? 'ssl://' : '';
  $fp = @stream_socket_client($secure . $host . ':' . $port, $errno, $errstr, 15);
  if (!$fp) return false;
  stream_set_timeout($fp, 15);

  $read = function () use ($fp) {
    $data = '';
    while ($line = fgets($fp, 1024)) {
      $data .= $line;
      if (strlen($line) < 4 || $line[3] === ' ') break;
    }
    return $data;
  };
  $say = function ($cmd) use ($fp, $read) { fwrite($fp, $cmd . "\r\n"); return $read(); };

  $read();
  $say('EHLO ' . parse_url(LPK_SITE, PHP_URL_HOST));
  if ($port !== 465) {
    $r = $say('STARTTLS');
    if (substr($r, 0, 3) === '220') {
      if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) { fclose($fp); return false; }
      $say('EHLO ' . parse_url(LPK_SITE, PHP_URL_HOST));
    }
  }
  $say('AUTH LOGIN');
  $say(base64_encode($user));
  $r = $say(base64_encode($pass));
  if (substr($r, 0, 3) !== '235') { fclose($fp); return false; }

  $say('MAIL FROM:<' . $from . '>');
  $say('RCPT TO:<' . $to . '>');
  $r = $say('DATA');
  if (substr($r, 0, 3) !== '354') { fclose($fp); return false; }

  $msg = "Subject: $subject\r\nTo: <$to>\r\n" . $headers . "\r\n" .
         str_replace("\r\n.", "\r\n..", $textBody) . "\r\n.";
  $r = $say($msg);
  $say('QUIT');
  fclose($fp);
  return substr($r, 0, 3) === '250';
}
