# Release Notes — v5.4.7 — Urgent PHP Security Release

**NewTon DC Tournament Manager v5.4.7 — October 22, 2026**

---

## Overview

A security release for the Docker image. PHP published fixes yesterday for two critical flaws that could let an attacker run commands on a web server running PHP. This release rebuilds the image on the fixed PHP. Nothing in the application has changed.

---

## What to Do

If you run NewTon from Docker, pull the new image and recreate the container:

```
docker compose pull
docker compose up -d
```

Do this soon, particularly if the server can be reached from the internet. If you run the Tournament Manager from a downloaded file, or install the Chalker app, there is nothing to do: they don't run PHP.

---

## Details

- **The flaws:** CVE-2026-109618 and CVE-2026-109619, both rated critical (CVSS 9.2), in PHP's core. They affect every PHP release before 8.5.12, 8.4.27, 8.3.36 and 8.2.35, and remote code execution has been shown on PHP-FPM, which the NewTon image uses.
- **The fix:** the image is built on PHP 8.2.35. The publish workflow now always takes the newest base image, so later PHP and Alpine fixes aren't held back by a cached layer.
- **What's next:** PHP 8.2 receives security fixes until the end of 2026. A move to PHP 8.4 will follow as its own release.

---

## Files Changed

- `docker/Dockerfile` — the image is built on PHP 8.2.35 or later
- `.github/workflows/docker-hub-publish.yml` — always pulls the newest base image

---

## Migration

No migration required. Fully compatible with all existing tournament data, match history, Analytics and settings. Nothing stored has changed; the export format is unchanged.

This release moves `:latest` forward to v5.4.7. Installed Chalker apps refresh automatically on their next online launch.

---

*NewTon DC Tournament Manager v5.4.7 — Urgent PHP Security Release*
