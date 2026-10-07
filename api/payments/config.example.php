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
    /* Currencies the Pesapal merchant account can take and settle. Contributions in any other currency are
       recorded as pledges. Add a currency only after Pesapal has confirmed it for this merchant account. */
    'payment_currencies' => ['UGX'],
    /* Optional named users, with password_hash() outputs and admin / finance / viewer roles.
       Until configured, username admin uses the existing campaign-console password. */
    'admin_users' => [],
];
