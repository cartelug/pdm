# Quick-start and standard coordinator release — 24 October 2026

- Added a phone-friendly staff start page with a ten-minute Joshua walkthrough and a daily routine.
- Added a coordinator role for records, reports, walk publication and graphics. It grants no receipt reconciliation/reversal, milestone approval or recognition-consent authority. No production account is automatically created or granted a role.
- New-entry dates use Africa/Kampala. Current published prices come from the existing source price file; related pledges retain their own stored historic country/unit, and unconfirmed prices stay unknown. Imports are unchanged.
- Added a two-helper host setup ZIP and a guided CLI activation flow. Passwords are hidden before the prompt is displayed, passed as hashes through stdin, and never printed, stored in git or added to public configuration. Private config backups and existing-account replacement confirmation are preserved.

Validation: full `npm run validate`; 74 isolated operations HTTP assertions including coordinator restrictions; activation tests for hidden input, current ZIP contents, existing configuration/settings, backup and restricted permissions, refusal to replace without confirmation, mismatched-password rejection and first-account configuration; actual browser coordinator login/entry, Uganda date across a different browser timezone, UGX/KES prices, unknown USD pricing, historic pledge snapshot retention, no receipt inflation, four training-page viewport widths, plus the original 15 PNG export combinations. No production financial writes or account activations were performed during tests.

Host action remains necessary: download the setup kit, extract it in the website root, run the helper in cPanel Terminal/SSH for each verified person, and deliver their login privately. See `../QUICK-START-SETUP.md`.
