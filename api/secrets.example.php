<?php
/* Copy this to lpk_private/secrets.php OUTSIDE public_html and fill it in.
   Never commit the real file. If it is missing the site still runs and the
   admin panel simply stays locked. */
return [
  'admin_password' => 'choose-a-long-random-password',
  'salt'           => 'another-long-random-string',
  'smtp_host'      => 'smtp.hostinger.com',
  'smtp_port'      => '587',
  'smtp_user'      => 'info@learnpianokeys.com',
  'smtp_pass'      => 'the-mailbox-password'
];
