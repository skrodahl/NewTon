# mDNS (.local Hostname) Setup

mDNS lets devices on your LAN reach the NewTon container by name (e.g., `https://newtondarts.local:8443`) instead of by IP address.

**mDNS is a host-side concern.** The Docker container does not handle mDNS — your host operating system does. The `SSL_HOSTNAME` environment variable is used only for the SSL certificate's Subject Alternative Name (SAN), not for mDNS broadcasting.

---

## Platform Overview

| Platform | mDNS Support | Setup Required |
|----------|-------------|----------------|
| macOS    | Built in (Bonjour) | None — `.local` resolution works out of the box |
| Windows  | Via Bonjour | Install Bonjour (included with iTunes/iCloud, or [standalone](https://support.apple.com/kb/DL999)) |
| Linux    | Via avahi-daemon | See setup steps below |

---

## Linux Setup

### 1. Install avahi-daemon

Most desktop Linux distributions have avahi pre-installed. If not:

```bash
# Debian / Ubuntu
sudo apt install avahi-daemon

# Fedora / RHEL
sudo dnf install avahi

# Arch
sudo pacman -S avahi
```

### 2. Set the hostname

```bash
sudo hostnamectl set-hostname newtondarts
```

### 3. Configure avahi to use your LAN interface only

Without this step, avahi may advertise a Docker bridge IP (e.g., `172.18.0.1`) instead of your LAN IP.

Find your LAN interface name:

```bash
ip route | grep default
# Example output: default via 192.168.86.1 dev wlp4s0 proto dhcp ...
#                                              ^^^^^^
#                                              This is your interface name
```

Edit `/etc/avahi/avahi-daemon.conf` and add `allow-interfaces` under `[server]`:

```ini
[server]
allow-interfaces=wlp4s0
```

Replace `wlp4s0` with your actual interface name (common names: `eth0`, `enp3s0`, `wlan0`, `eno1`).

### 4. Restart avahi

```bash
sudo systemctl enable avahi-daemon
sudo systemctl restart avahi-daemon
```

### 5. Verify

```bash
avahi-resolve -n newtondarts.local
# Expected: newtondarts.local    192.168.86.20 (your LAN IP)
```

---

## Docker Compose

With mDNS handled by the host, the compose file just needs SSL and (on Linux) host networking:

### Linux

```yaml
services:
  newton-tournament:
    image: skrodahl/newton:latest
    container_name: newton
    network_mode: host
    volumes:
      - ./tournaments:/var/www/html/tournaments
      - ./images:/var/www/html/images:ro
      - newton-ssl:/etc/nginx/ssl
    restart: unless-stopped
    environment:
      - TZ=Europe/Oslo
      - SSL_ENABLED=true
      - HTTP_PORT=2020
      - HTTPS_PORT=8443
      - SSL_HOSTNAME=newtondarts
      - NEWTON_API_ENABLED=true
      - NEWTON_DEMO_MODE=false

volumes:
  newton-ssl:
```

Access at `https://newtondarts.local:8443`. HTTP requests to port 2020 redirect to HTTPS.

With `network_mode: host`, the container listens directly on the host's network. Use `HTTP_PORT` and `HTTPS_PORT` to avoid claiming privileged ports 80 and 443. Both default to 80/443 if not set.

### macOS / Windows

```yaml
services:
  newton-tournament:
    image: skrodahl/newton:latest
    container_name: newton
    ports:
      - "2020:2020"
      - "443:443"
    volumes:
      - ./tournaments:/var/www/html/tournaments
      - ./images:/var/www/html/images:ro
      - newton-ssl:/etc/nginx/ssl
    restart: unless-stopped
    environment:
      - TZ=Europe/Oslo
      - SSL_ENABLED=true
      - SSL_HOSTNAME=newtondarts
      - NEWTON_API_ENABLED=true
      - NEWTON_DEMO_MODE=false

volumes:
  newton-ssl:
```

Access at `https://newtondarts.local`. The host's mDNS service (Bonjour) advertises the machine's hostname — set it to `newtondarts` in System Settings if needed.

---

## Troubleshooting

### avahi-resolve returns a Docker bridge IP (172.x.x.x)

Add `allow-interfaces=<your-lan-interface>` to `/etc/avahi/avahi-daemon.conf` and restart avahi. See step 3 above.

### Browser redirects to the wrong port after changing HTTPS_PORT

HSTS (HTTP Strict Transport Security) caches the port in your browser. Clear it:

- **Chrome:** Go to `chrome://net-internals/#hsts`, enter your hostname under "Delete domain security policies", and press Delete.
- **Firefox:** Clear browsing history for the site, or use a private window.
- **Safari:** Clear website data in Settings > Privacy.

### .local not resolving on a client device

- **iOS / macOS:** Built-in Bonjour handles `.local` — should work automatically.
- **Android:** Most Android versions do not support mDNS natively. Use the IP address instead.
- **Windows:** Requires Bonjour. Verify with `ping newtondarts.local` after installation.
- **Linux client:** Install `avahi-daemon` and ensure `nss-mdns` is installed for system-wide `.local` resolution.
