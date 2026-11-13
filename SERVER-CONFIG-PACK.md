# Server configuration pack for pamodzici.com

Plan task **E2**. Compression, caching and headers are for the host admin (cPanel). Apply those settings on the server: a committed root `.htaccess` would overwrite the one on the host. Clean URL redirects are now installed separately by deployment as described in section 5.

What it does: compresses text, caches files by how often they change, and adds the standard security headers. Nothing here changes how a page looks or works.

## 1. Check what the host already does

```
curl -sI -H "Accept-Encoding: br, gzip" https://pamodzici.com/css/base.css | grep -iE "content-encoding|cache-control"
curl -sI https://pamodzici.com/ | grep -iE "strict-transport|x-content-type|referrer-policy|permissions-policy"
```

No `content-encoding` line means text is sent uncompressed. The lab sizes in the plan assume gzip.

## 2. `.htaccess` additions (Apache)

Put these in the site's `public_html/.htaccess`, above any existing rewrite rules. Every block is wrapped in `IfModule`, so a missing module is skipped without an error.

```apache
# --- Compression ---
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/plain text/xml application/javascript application/json application/ld+json image/svg+xml
</IfModule>
<IfModule mod_brotli.c>
  AddOutputFilterByType BROTLI_COMPRESS text/html text/css text/plain text/xml application/javascript application/json application/ld+json image/svg+xml
</IfModule>

# --- Caching ---
# CSS and JavaScript are always linked with a content hash (?v=...), so a changed file gets a new URL.
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresDefault "access plus 5 minutes"
  ExpiresByType text/html "access plus 5 minutes"
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType text/javascript "access plus 1 year"
  ExpiresByType font/woff2 "access plus 1 year"
  ExpiresByType image/webp "access plus 30 days"
  ExpiresByType image/jpeg "access plus 30 days"
  ExpiresByType image/png "access plus 30 days"
  ExpiresByType image/svg+xml "access plus 30 days"
</IfModule>
<IfModule mod_headers.c>
  <FilesMatch "\.(css|js|woff2)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  # Live data and the payment API must never be served from a cache.
  <FilesMatch "^(roll|campaign|enquiry)\.php$">
    Header set Cache-Control "no-store"
  </FilesMatch>
  <If "%{REQUEST_URI} =~ m#^/api/#">
    Header set Cache-Control "no-store"
  </If>

  # --- Security headers ---
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()"
  Header always set X-Frame-Options "SAMEORIGIN"
</IfModule>
```

Two things to leave out until they are tested on staging:

- **Strict-Transport-Security.** Add `Header always set Strict-Transport-Security "max-age=300"` only after confirming every page and asset loads over HTTPS, then raise it to a year.
- **Content-Security-Policy.** The campaign pages use inline scripts and WhatsApp links. Try `Content-Security-Policy-Report-Only` first and fix what it reports before enforcing.

## 3. Cloudflare (decision 3)

If PCI controls the domain's DNS, the free plan adds compression, edge caching and basic rate limits with no code change. Turn the proxy on for the website records and add a cache rule that bypasses the cache for `/api/*` and `/admin/*`. If PCI does not control DNS, ask the host to apply section 2.

## 4. Verify after applying

1. Re-run the commands in section 1. Expect `content-encoding: br` or `gzip` on text and the security headers present.
2. Load `/walk-for-education/`, `/contribute/` and `/faith-in-motion/` and confirm nothing is blocked in the browser console.
3. Save a test pledge on staging and confirm the response is not cached.
4. Lower the ceilings in `tests/quality/budget.json` to the new lab numbers.

Rollback: remove the added block and reload. Nothing else depends on it.

## 5. Clean URLs and legacy redirects (decision D14)

Navigation now uses directory URLs such as `/about/` and `/faith-in-motion/`, plus extensionless standalone staff URLs such as `/admin/operations/guide`. Physical HTML files remain in place. The eighteen root stubs remain as a fallback for static hosts, including GitHub Pages.

After uploading the site, **Deploy PDM to cPanel** runs `php hosting/install-clean-urls.php .` through the existing SSH connection. It prepends or replaces only the `# BEGIN PDM CLEAN URLS` / `# END PDM CLEAN URLS` block from `hosting/clean-urls.conf`, preserving the rest of `.htaccess` and its permissions. Writes are atomic; malformed blocks or symlinked configurations fail without replacing the host file. The installer cannot run over HTTP.

The rules redirect explicit `index.html` requests to their directories, root stubs to existing folder pages, and standalone `.html` documents to their extensionless paths. Queries and browser fragments survive the redirect. Internal DirectoryIndex and ErrorDocument requests are excluded, unknown paths remain 404s, and PHP APIs and asset URLs retain their existing paths. The existing `/apartments/` retirement redirect remains in force.

`node tests/navigation/clean-urls.cjs` tests the actual Apache rules and no-JavaScript phone/desktop navigation before upload. `node tests/navigation/clean-urls-live.cjs` verifies the deployed HTML, permanent redirects, query preservation and missing pages after installation. `npm run check:links` rejects new `.html` navigation links on public pages. To undo the server redirects, remove only the marked block from the host's `.htaccess`; the source links still use clean directories, and legacy root stubs remain available. A future deployment reinstalls the block unless its installation step is reverted too.
