# Testing, deployment and rollback

Run commands from the actual website repository, not the handoff package root. The workflows in `.github/workflows/` are the executable release definition. This guide records the current commands without changing their budgets or policy.

## Fast development validation

```sh
npm ci
npm run validate
```

`validate` checks Astro types, builds/exports the institutional site, lints and formats, checks protected files, runs page/state/image tests, then checks tokens, contrast, hooks, frozen fragments, facts, links and sitemap. The image tests check forty distinct compositions, decoded variants, source checksums and integration of all twenty scenes.

Do not run build/validate jobs concurrently in the same checkout. They replace generated HTML and `_astro` files. Review the final generated diff before committing.

## Backend fixtures and real-browser checks

Use the existing isolated fixtures. They exercise writes against temporary private storage; they are not instructions to fill the production register with sample records.

```sh
php tests/payments/ledger.php
python3 tests/payments/test_http.py
python3 tests/operations/test_http.py
python3 tests/operations/test_setup.py
python3 tests/enquiry/test_http.py
npx playwright install --with-deps chromium
node tests/navigation/wfe-redesign.cjs
node tests/operations/browser.cjs
npm run test:browser
node tests/navigation/browser.cjs
node tests/navigation/motion.cjs
node tests/quality/a11y.cjs
node tests/quality/speed.cjs
node tests/quality/responsive.cjs --strict --json responsive-report.json
```

PHP needs PDO SQLite/SQLite3. The fixtures can use `PCI_TEST_PHP` for a compatible executable. `PCI_TEST_CHROMIUM` can select an installed Chromium binary if Playwright's expected revision is unavailable. Some suites also accept a Playwright module path; inspect the actual test before using environment overrides. Do not disable browser checks because a local machine lacks its runtime; install the runtime or use CI and report the actual result.

The source snapshot has no installed dependencies. `npm ci` uses the included lockfile. Do not regenerate dependency versions merely to get a first local build.

## Unchanged route budgets

The enforcing file is `tests/quality/budget.json`. These are current ceilings, not measured results or universal web performance targets:

| Route | LCP ceiling ms | Transfer ceiling KB | Blocking ceiling ms |
| --- | --- | --- | --- |
| `/` | 2050 | 310 | 400 |
| `/about/` | 3050 | 195 | 250 |
| `/projects/` | 3300 | 330 | 250 |
| `/walk-for-education/` | 3600 | 395 | 670 |
| `/walk-for-education/take-part/` | 2900 | 360 | 250 |
| `/contribute/` | 2000 | 250 | 400 |
| `/faith-in-motion/` | 4300 | 810 | 450 |
| `/give/` | 3050 | 475 | 270 |

The speed test uses throttled phone measurements and a three-run median. Keep the existing ceilings; fix heavy images, eager downloads or blocking work rather than raising a budget. A lab result is not a guarantee of every visitor's network speed.

The strict responsive gate currently covers thirty public pages across nineteen configurations, giving 570 measurements. It includes 320–2560 px, landscape and 200% text. It fails horizontal overflow, clipping and crowded targets under its rules, and retains additional typography/image diagnostics for review. Do not hide overflow to silence a real layout defect.

## Baseline evidence

The final official-kit release passed local validation, the operations HTTP and browser suites, Walk browser checks, payment/contribution browser checks, institutional and motion tests, axe with zero WCAG 2.2 A/AA violations on the tested pages, all eight speed budgets and the strict responsive sweep. Both deployment jobs and the hosted front-end quality run subsequently succeeded. See `docs/quality/OFFICIAL-KIT-2026-10-25.md` and this package's `evidence/` directory.

Those results describe the packaged release, not future edits by Claude. Run relevant checks again after making new changes, and run the complete required release checks before publishing the final result.

## Deployment architecture

- Pushing `main` triggers **Deploy PDM to cPanel** through `.github/workflows/deploy-pdm.yml`.
- That job installs tooling, validates, runs backend/browser gates, prepares a public deployment tree and uploads static files plus PHP over the existing SSH configuration.
- **Front-end quality** runs the broader accessibility, speed and responsive gates as a separate workflow. Observe it as well; production deployment does not wait on every separate quality step.
- GitHub Pages serves the committed static output at `/pdm/`. It cannot execute PHP operations or payment endpoints.
- Pull-request static preview artifacts intentionally omit `api/` and `admin/`; they are visual previews, not a backend environment.

Existing GitHub Actions secret names are `CPANEL_HOST`, `CPANEL_USERNAME`, `CPANEL_SSH_KEY`, `CPANEL_SSH_PASSPHRASE`, `CPANEL_PORT` and `CPANEL_TARGET`. Values are not in this package. Do not ask for them unless an actual deployment failure requires host-owner action, and never put their values into source or handoff files.

## Release procedure

1. Finish the change in a branch; inspect the entire diff and generated output.
2. Complete the checks and protected review records. Confirm factual copy and image labels.
3. Follow Neeza's current instruction for merging/pushing the tested commit. Never force-push `main` or overwrite a newer remote head.
4. Observe cPanel deployment, GitHub Pages deployment and the required quality workflow for that exact commit.
5. Fetch the real production homepage, Walk home, partners, take-part, manifest and gallery. Check representative desktop/mobile image and font URLs. Compare served content to the committed files where practical.
6. Check `/api/operations.php?action=public` is available without publishing private response data. Confirm checkout retains its intended state at `/api/payments/index.php?action=status`; a visual release is not an instruction to enable it.
7. Open the real site at phone and desktop widths. Wait for image decoding, check correct source selection and inspect browser errors. Verify the staff guide loads, without submitting a live receipt or invented walk update.
8. Report the commit, live URL, actual checks and any material remaining host dependency.

## Rollback

For a presentation-only regression, revert the reviewed website commit through Git and redeploy the last tested source/output. Keep the current private configuration, staff accounts, ledger and uploaded records. Do not restore a stale database, remove additive operations tables or copy test fixtures to production to undo a visual change.

For a backend incident, follow the host's approved recovery procedure: stop affected writers/checkouts as appropriate, take a consistent private SQLite snapshot including the host's WAL/SHM handling, preserve later transactions and audit history, then recover deliberately. An older shared-password publisher must not be re-enabled as a shortcut. Do not improvise a production database restoration from a source ZIP.
