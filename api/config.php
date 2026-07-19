<?php
/* Learn Piano Keys - configuration.
   No secrets live in this file or anywhere in git. Real credentials are read
   at runtime from secrets.php placed by hand OUTSIDE public_html. If that
   file is missing the site still runs and the admin panel stays locked. */

define('LPK_SITE',        'https://learnpianokeys.com');
define('LPK_FROM_EMAIL',  'info@learnpianokeys.com');
define('LPK_FROM_NAME',   'Learn Piano Keys');
define('LPK_REPLY_TO',    'info@learnpianokeys.com');

/* public_html/api -> public_html -> domain root, then a sibling private folder */
define('LPK_PRIVATE_DIR', dirname(dirname(__DIR__)) . '/lpk_private');
define('LPK_DB',          LPK_PRIVATE_DIR . '/leads.sqlite');

define('LPK_RATE_PER_HOUR', 8);      // signups per IP per hour
define('LPK_MIN_FORM_MS',   2000);   // a human takes at least this long

$LPK_SECRETS = [];
$__s = LPK_PRIVATE_DIR . '/secrets.php';
if (is_readable($__s)) { $LPK_SECRETS = include $__s; }
if (!is_array($LPK_SECRETS)) { $LPK_SECRETS = []; }

function lpk_secret($key, $default = '') {
  global $LPK_SECRETS;
  return isset($LPK_SECRETS[$key]) && $LPK_SECRETS[$key] !== '' ? $LPK_SECRETS[$key] : $default;
}
function lpk_admin_locked() { return lpk_secret('admin_password') === ''; }

/* Disposable domains are rejected outright. Verification catches the rest. */
$LPK_DISPOSABLE = [
  'mailinator.com','guerrillamail.com','10minutemail.com','tempmail.com','temp-mail.org',
  'yopmail.com','trashmail.com','sharklasers.com','getnada.com','dispostable.com',
  'maildrop.cc','fakeinbox.com','throwawaymail.com','mailnesia.com','moakt.com',
  'emailondeck.com','tempr.email','mohmal.com','spamgourmet.com','discard.email'
];
