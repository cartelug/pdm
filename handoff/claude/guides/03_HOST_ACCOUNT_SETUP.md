# One-time host account setup

Audience: the authorised hosting administrator. Joshua does not perform server setup.

## What you need

- Access to the existing cPanel/SSH terminal for the production website.
- The real website document-root path, supplied by the host; do not guess it from a local development folder.
- A confirmed person and approved role for each account.
- The existing private configuration and storage preserved in place.

This handoff has no production login, SSH key, private config or live database. No named account is claimed active. A GitHub push cannot safely activate a staff password through a public build.

## Standard roles

| Person | Standard role | Main responsibilities |
| --- | --- | --- |
| Neeza | coordinator | Record, review records, publish approved walking updates, graphics, reports |
| Joshua | coordinator | The same everyday workflow from his own login |
| Appointed finance verifier | finance | Check actual receipts and settlements; reconcile/reverse; authorised consent and milestone actions |
| Hosting administrator | admin, if required and authorised | Administration and account configuration |

The code supports other named roles; consult `docs/OPERATIONS-HANDOVER.md` before assigning them. Do not make everyone an administrator for convenience.

## Activation procedure

1. Preserve the current private configuration, existing named users and database. Follow the host's backup procedure before changing configuration.
2. Use the included `assets/operations/setup/PCI_Account_Setup.zip`. The same kit is published at https://pamodzici.com/assets/operations/setup/PCI_Account_Setup.zip . The nested archive contains the CLI helpers and instructions; it contains no account or private configuration.
3. Upload the kit to the production website root using cPanel File Manager and extract it there. Normal web deployment excludes `scripts/`, so the terminal helpers are installed separately for this task.
4. Open Terminal/SSH in that website root and run:

```sh
php scripts/setup-operations-user.php
```

5. Enter the verified person's username, approved role, and a unique personal password twice. Password entry is hidden. The helper requires at least 14 characters, validates the role, confirms replacement of an existing username, backs up existing private config and updates it atomically through the hash-only provisioner. Keep the terminal private.
6. Repeat for each approved person. Deliver each login privately to that verified owner, using your organisation's normal secure channel. Do not paste credentials into Claude, this ZIP, Git, a ticket or build output.
7. Sign in with a coordinator account and confirm the everyday actions are available but Verify & reconcile is absent. Check the finance role separately against its approved responsibilities.
8. Complete guide 02 with Joshua on his actual phone. Use SAMPLE DATA graphics for practice.

The helpers return 404 when accessed over HTTP; they are terminal tools, not web setup pages. The kit can be regenerated from source with `python3 scripts/package-operations-setup.py` if needed. Do not alter the site's public build to expose the scripts.

## What successful setup means

Each person can sign in with a personal account, the role is correct, real financial approval remains with finance, the console can reach the existing writable private storage, and Joshua can complete the staff walkthrough. Successful deployment alone does not establish those facts.

If there is no cPanel/SSH access, give the authorised host owner this guide and the kit. The rest of the design work can continue without access to the production ledger. Claude should report account activation as a host dependency rather than invent a default password.
