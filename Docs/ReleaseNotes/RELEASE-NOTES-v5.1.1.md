# Release Notes — v5.1.1 — Somewhat Simpler Selfhosting

**NewTon DC Tournament Manager v5.1.1 — May 20, 2026**

---

## Overview

v5.1.1 is a Docker release. No new features for the tournament app itself — instead, the container got a long-overdue cleanup. The mDNS code inside the container never reliably worked on a typical Linux host (where avahi-daemon already runs), so it has been removed entirely. `.local` resolution is now treated as what it has always been: a host-side concern.

Smaller image, fewer environment variables to remember, one less compose file to choose between, and clearer documentation about how to reach your container by name on the LAN. Existing deployments keep working without changes.

---

## mDNS is Host-Side Now

The Docker image used to install avahi-daemon, dbus, and avahi-tools, then attempt to broadcast `MDNS_HOSTNAME.local` from inside the container. In practice this conflicted with the host's own avahi-daemon (which most desktop Linux distributions run by default), required the host's dbus socket, and lost every host-name conflict it tried to win. The result on a typical Linux machine was that nothing was actually broadcast.

The container no longer ships avahi at all. Smaller image, fewer moving parts.

**What you do instead:** set the host's hostname and configure the host's avahi-daemon (Linux) or rely on Bonjour (macOS/Windows). The full setup is documented in [`Docs/MDNS.md`](../MDNS.md), with platform-specific steps for macOS, Windows, and Linux including the `allow-interfaces` setting that keeps avahi from advertising Docker bridge IPs instead of your LAN IP.

---

## One Less Compose

The `docker-compose-ssl-mdns.yml` variant has been removed. With mDNS now host-side, the only thing that distinguished it from `docker-compose-ssl.yml` was `network_mode: host` — which is no longer needed for `.local` resolution to work. Port mapping works equally well on all platforms.

The compose lineup is now:

- `docker-compose.yml` — minimal default, HTTP only, port-mapped
- `docker-compose-ssl.yml` — SSL with port mapping, works on Linux/macOS/Windows
- `docker-compose-demo.yml` — reverse proxy / demo site

Fewer files, simpler decision tree.

---

## Environment Variable Cleanup

`MDNS_HOSTNAME` has been renamed to `SSL_HOSTNAME` — its actual purpose. It controls the Subject Alternative Name on the auto-generated SSL certificate and has nothing to do with mDNS broadcasting (which the container no longer does). The old name still works as a fallback, so existing compose files keep functioning.

New `HTTP_PORT` environment variable (default `2020`) makes the HTTP listening port configurable, matching the existing `HTTPS_PORT`. Useful for `network_mode: host` deployments where users want to avoid privileged ports.

---

## Documentation

- **New:** [`Docs/MDNS.md`](../MDNS.md) — platform-by-platform mDNS setup, with troubleshooting (avahi interface filtering, HSTS port-change gotcha, client compatibility).
- **Updated:** `DOCKER-QUICKSTART.md` and `docker-quickstart.html` — Linux/Mac/Windows merged into a single cross-platform SSL section, env var table refreshed, troubleshooting section rewritten.
- **Updated:** `llms.txt` — AI services now describe the current Docker setup, not the old one.

---

## Third-Party Licenses in the Container

The `.dockerignore` excluded all markdown files, which meant `THIRD-PARTY-LICENSES.md` never made it into the Docker image — a compliance gap for the bundled MIT and Apache 2.0 libraries. A new HTML version (`third-party-licenses.html`) ships in the container and is linked from the landing-page footer alongside Privacy.

The markdown stays in the repo as the source.

---

## Migration

**No migration required for the tournament app itself** — data, history, and exports are fully compatible.

**Docker users:**

- `MDNS_HOSTNAME` still works (the entrypoint falls back to it if `SSL_HOSTNAME` is unset). Updating to `SSL_HOSTNAME` is recommended but not urgent.
- If you used `docker-compose-ssl-mdns.yml`, switch to `docker-compose-ssl.yml` (port-mapped) or `docker-compose.yml` (minimal). `network_mode: host` is no longer required for `.local` access; the host's avahi or Bonjour handles the broadcast.
- To enable `<hostname>.local` access: follow `Docs/MDNS.md`. On Linux desktops, this means installing avahi-daemon (often already present), setting the host's hostname, and adding `allow-interfaces=<your LAN interface>` to `/etc/avahi/avahi-daemon.conf` to keep Docker bridges out of the broadcast.

---

**NewTon DC Tournament Manager v5.1.1 — Somewhat Simpler Selfhosting.**
