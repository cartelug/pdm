<?php
/* Faith in Motion collections API — configuration.
   FIM_ADMIN_PASSWORD_HASH is a password_hash() digest, not the password
   itself — this file is safe to commit to a public repository. The
   plaintext password is held by the campaign team, not stored anywhere
   in this codebase.

   To change the password: run
     php -r 'echo password_hash("your-new-password", PASSWORD_DEFAULT), PHP_EOL;'
   and replace the value below. */

define('FIM_ADMIN_PASSWORD_HASH', '$2y$12$MyYFVki4nFxG.XU1eTss..KRr8FuqBnxIyto30nOuxwF9L/VVWKgi');
