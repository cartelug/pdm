<?php
/* Copy to <private-directory>/config.php, OUTSIDE public_html. Never commit filled credentials.
   Environment variables PCI_* override matching scalar values. */
return [
    'environment' => 'sandbox',
    'consumer_key' => '',
    'consumer_secret' => '',
    'site_url' => 'https://pamodzici.com',
    'checkout_enabled' => false,
    'policies_approved' => false,
    'live_approved' => false,
    /* Optional named users, with password_hash() outputs and admin / finance / viewer roles.
       Until configured, username admin uses the existing campaign-console password. */
    'admin_users' => [],
];
