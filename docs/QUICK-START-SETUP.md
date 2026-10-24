# PCI quick setup and Joshua training

Staff start page: https://pamodzici.com/admin/operations/start.html
Console: https://pamodzici.com/admin/operations/

## One standard arrangement

| Person | Account role | Everyday responsibility |
| --- | --- | --- |
| Neeza | coordinator | Record contributions, review records, publish walk updates, generate graphics and download reports |
| Joshua | coordinator | The same daily work from his own login |
| PCI-appointed finance verifier | finance | Confirm actual receipts/settlements and reconcile financial records |

A coordinator cannot reconcile/reverse receipts, approve milestones, or grant recognition consent. Finance remains separate from editorial publication. Only the host/authorised administrator handles account activation. These are setup instructions, not proof that production accounts have been activated.

## Host owner: one-time activation

1. Confirm each person's identity and approved role. Preserve the existing private config and any existing named accounts.
2. Download https://pamodzici.com/assets/operations/setup/PCI_Account_Setup.zip, upload it to the website root in cPanel File Manager, then extract it there. It installs only the two CLI helpers under `scripts/` plus a short instruction file; it contains no account or private configuration. Both PHP helpers return 404 over HTTP and run only in a terminal. Scripts are otherwise excluded from normal deployment. The kit can be regenerated with `python3 scripts/package-operations-setup.py`.
3. Open cPanel Terminal/SSH in the website root and run `php scripts/setup-operations-user.php`. Enter a username, approved role and personal password twice. Password entry is hidden. Repeat once per person. The helper validates the role, requires a 14-character password, prompts before replacing an existing username, backs up existing private configuration and passes only a password hash to the existing atomic provisioner. No credential is printed or written into the public website or git. If private config is absent, only an empty `admin_users` setting is initialised; existing environment/default payment settings are preserved.
4. Deliver each login privately to its verified owner. Test one coordinator login and one finance login. The coordinator should see Record contribution, Update walk status, Generate graphic and Download report; it must not see Verify & reconcile. Finance must be able to verify actual receipts but must not publish walk stories unless separately authorised.
5. Open the staff start page with Joshua. Bookmark the console on his phone and complete its ten-minute walkthrough. Rehearse graphics with SAMPLE DATA; use only genuine contributions and approved walking facts in the live register.

If no cPanel/SSH access is available, the host owner must run activation. A GitHub push installs the capability but cannot safely provide a person's private password through a public build log. Do not paste hosting or staff passwords into git, build logs or a public page.

## Defaults and history

New entries start with today's date in Uganda time. Uganda/Kenya step prices are read from the existing published price file, not retyped in the code. Other/unavailable prices remain unconfirmed (zero sponsored steps inferred). Choosing an existing related pledge uses its stored country/price snapshot, including an unknown historical price, rather than replacing it with today's price. Currency changes select the relevant published price unless an existing pledge dictates its own currency. Optional historic-price overrides remain available for finance review. Imports retain their original dates and historical price snapshots; they do not inherit the new-entry defaults.

## Daily standard

Coordinator records once → finance verifies/reconciles → approved collections update → coordinator publishes the confirmed walk update → download the report and approved graphic → sign out. Pledges, received money, sponsored steps and physical kilometres stay separate.
