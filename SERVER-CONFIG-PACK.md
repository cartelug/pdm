# Server configuration pack for pamodzici.com

Plan task **E2**. This is for the host admin (cPanel). Apply it on the server, not in the repository: the deploy workflow uploads files and a committed `.htaccess` would overwrite the one on the host.

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

## 5. Real redirects for the old `.html` links (optional, decision D14)

Eighteen files in the repository root (`about.html`, `walk.html`, `give.html` and so on) exist only to forward old shared links to the folder pages, using a meta refresh. A server redirect does the same job faster and tells search engines the move is permanent. The files stay as a fallback, so applying this is safe to undo.

`npm run check:links` confirms every one of the eighteen follows the pattern `name.html` to `/name/` and that every target exists, which is what lets one rule cover them. Add this above the existing rewrite rules, after the blocks in section 2 and after reading what the host's current `.htaccess` already does:

```apache
# 301 for legacy root .html links: about.html -> /about/, walk.html -> /walk/, and so on
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{REQUEST_URI} !^/(404|index)\.html$
  RewriteCond %{DOCUMENT_ROOT}/$1/index.html -f
  RewriteRule ^([a-z-]+)\.html$ /$1/ [R=301,L]
</IfModule>
```

The extra condition sends a request to the folder only when the folder exists, so an unknown `.html` name still reaches the 404 page. Test it on staging first with `curl -sI https://pamodzici.com/about.html` and expect `301` and `location: /about/`.
