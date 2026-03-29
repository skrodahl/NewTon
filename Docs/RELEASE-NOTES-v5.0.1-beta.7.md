# Release Notes — v5.0.1-beta.7 — Secure by Default

**NewTon DC Tournament Manager v5.0.1-beta.7 — 2026-03-29**

---

## Overview

v5.0.1-beta.7 adds SSL/HTTPS and mDNS support to the Docker image. Camera features (QR scanning via BarcodeDetector/getUserMedia) require a secure context. This beta makes it easy to run NewTon over HTTPS on a local network without an external reverse proxy.

All changes are in the Docker layer. The application itself is unchanged.

---

## SSL Support

Two supported paths:

- **No certificate** — set `SSL_ENABLED=true`, a self-signed certificate is generated automatically on first start (30-year expiry, persisted in a named volume). Accepts a one-time browser exception.
- **Real certificate** — run a reverse proxy (NPM, Caddy, etc.) in front and let it handle SSL termination. The container stays HTTP-only behind it.

When SSL is active, port 2020 redirects to HTTPS (default port 443, configurable via `HTTPS_PORT`).

The auto-generated certificate includes a Subject Alternative Name covering `<hostname>.local`, `localhost`, and `127.0.0.1`, so browsers accept it when accessed via the mDNS name.

---

## mDNS — `newton.local`

The container now broadcasts itself on the local network via Avahi (mDNS/Zeroconf). Devices on the same LAN can reach it at `newton.local` (or a custom hostname) without DNS configuration.

The hostname is configurable via `MDNS_HOSTNAME` (default: `newton`).

`network_mode: host` is required for mDNS multicast to reach the LAN. **This only works on Linux hosts** — Docker Desktop for Mac and Windows runs containers in a VM and does not support host networking on the physical LAN. SSL with port mapping works on all platforms.

---

## New Environment Variables

| Variable | Default | Description |
|---|---|---|
| `SSL_ENABLED` | `false` | Set to `true` to auto-generate a self-signed certificate |
| `HTTPS_PORT` | `443` | HTTPS listening port |
| `MDNS_HOSTNAME` | `newton` | mDNS hostname → `<value>.local` |

---

## Docker Compose Files

Two compose files are provided for SSL deployments:

- `docker/docker-compose-ssl.yml` — SSL with port mapping, works on all platforms (Mac, Windows, Linux)
- `docker/docker-compose-ssl-mdns.yml` — SSL + mDNS via `network_mode: host`, Linux only

The existing `docker/docker-compose.yml` remains the HTTP-only default.

---

## Bug Fixes (Found During Beta Testing)

- **`envsubst` not found** — `gettext` package was missing from the Dockerfile. Added to the `apk add` line.
- **SSL session cache conflict** — nginx template files were placed in `/etc/nginx/http.d/` and auto-loaded alongside the generated `default.conf`, causing a duplicate zone declaration. Templates moved to `/etc/nginx/` where nginx does not auto-load them.
- **`ssl_session_cache` conflict with Alpine nginx** — Alpine's base `nginx.conf` already declares `ssl_session_cache shared:SSL:2m` at the http level. Our server block declared it again at a different size. Removed from `nginx-ssl.conf`.

---

## Files Changed

- `docker/Dockerfile` — installs `openssl`, `avahi`, `avahi-tools`, `dbus`, `gettext`; copies nginx templates to `/etc/nginx/` (not `http.d/`); copies and chmod +x `entrypoint.sh`; exposes port 443; switches `CMD` → `ENTRYPOINT`
- `docker/entrypoint.sh` — new: dbus + Avahi mDNS startup; SSL cert logic; nginx config selection via `envsubst`; starts php-fpm and nginx
- `docker/nginx-http.conf` — new: HTTP-only config
- `docker/nginx-ssl.conf` — new: HTTPS config with `${HTTPS_PORT}` placeholder; HTTP→HTTPS redirect on 2020; HSTS; all existing location blocks preserved
- `docker/docker-compose.yml` — updated: `network_mode: host`, removed `ports`, added `newton-ssl` named volume, documented new env vars
- `docker/docker-compose-ssl.yml` — new: SSL with port mapping, all platforms
- `docker/docker-compose-ssl-mdns.yml` — new: SSL + mDNS, Linux only

---

## What's Next

- v5.0.1 stable release
