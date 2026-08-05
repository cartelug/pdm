# Faith in Motion collections API

A small PHP endpoint that lets the admin console (`/admin/`) publish contribution changes straight to the live site — no git commit, no deploy, no manual file editing. It runs on the same cPanel host the rest of the site deploys to (see `.github/workflows/deploy-pdm.yml`); pushing to `main` ships these files exactly like any other page.

## How it works

- `roll.php` is the only endpoint.
  - `GET /api/roll.php` — returns `window.ROLL_DATA = [...];` as JavaScript. Every campaign page loads this in a `<script>` tag right after the bundled `js/roll-data.js`, so a successful live fetch overwrites the bundled fallback; a failed one (network error, PHP not available, bad response) just leaves the bundled data in place, since a failed script tag doesn't clear a variable a previous script already set.
  - `GET /api/roll.php?format=json` — the same data as plain JSON (`{"roll": [...], "updated": "..."}`), used by the admin console.
  - `POST /api/roll.php` with `{"password": "...", "roll": [[...], ...]}` — validates the password and the shape of `roll`, then overwrites the live register.
- `data/roll-live.json` is the live register. **It is never committed to git** (see `.gitignore`) and is never touched by a deploy — a deploy only uploads files that exist in the repository, so a file that only ever exists on the server is left alone. It's created automatically on first read or write.
- `data/roll-seed.json` **is** committed — it's the bootstrap copy used the first time `roll-live.json` doesn't exist yet, generated from `js/roll-data.js` at the time this system was built. It is not kept in sync automatically after that; it only matters once, at first boot.
- `data/.htaccess` blocks direct web access to the data folder — everything goes through `roll.php`.

## Changing the password

The password itself is never stored anywhere in this codebase — only its hash, in `config.php`, which is safe to commit to a public repository. To change it:

```bash
php -r 'echo password_hash("your-new-password", PASSWORD_DEFAULT), PHP_EOL;'
```

Paste the output into `FIM_ADMIN_PASSWORD_HASH` in `config.php`, commit, and push.

## If this ever needs troubleshooting on the live server

- Confirm PHP is actually running: visiting `/api/roll.php` in a browser should show a line starting `window.ROLL_DATA = [...`, not raw PHP source and not a server error page. If it shows PHP source, `.php` files aren't being executed on that host and this whole approach needs a different backend.
- Confirm the data folder is writable by the web server user — if `POST` requests keep failing with "Could not write the live register," it's almost always a file-permission issue on `api/data/`.
- The admin console's "Live publishing" status line at the top of the Pledges tab reports exactly what happened on the last read or write — that's the first place to look.
