#!/bin/sh
set -e

# =============================================================================
# NewTon DC Tournament Manager — Container Entrypoint
# =============================================================================

HOSTNAME="${MDNS_HOSTNAME:-newton}"
HTTPS_PORT="${HTTPS_PORT:-443}"

# ─── mDNS via Avahi ──────────────────────────────────────────────────────────
# Broadcasts ${HOSTNAME}.local on the local network.
# Requires network_mode: host in docker-compose.
# Gracefully skipped if avahi is unavailable.

mkdir -p /run/dbus
dbus-daemon --system --fork 2>/dev/null || true

cat > /etc/avahi/avahi-daemon.conf <<EOF
[server]
host-name=${HOSTNAME}
use-ipv4=yes
use-ipv6=no
ratelimit-interval-usec=1000000
ratelimit-burst=1000

[wide-area]
enable-wide-area=yes

[publish]
publish-addresses=yes
publish-hinfo=yes
publish-workstation=no
publish-domain=yes

[reflector]
enable-reflector=no

[rlimits]
EOF

avahi-daemon --daemonize --no-chroot 2>/dev/null || true

# ─── SSL ─────────────────────────────────────────────────────────────────────
# Three modes:
#   1. SSL_CERT + SSL_KEY set  → use provided certs (implicitly enables SSL)
#   2. SSL_ENABLED=true        → auto-generate self-signed cert (30 years)
#   3. Neither                 → HTTP only on port 2020

SSL_DIR=/etc/nginx/ssl
mkdir -p "$SSL_DIR"
USE_SSL=false

if [ -n "$SSL_CERT" ] && [ -n "$SSL_KEY" ]; then
    cp "$SSL_CERT" "$SSL_DIR/cert.pem"
    cp "$SSL_KEY"  "$SSL_DIR/key.pem"
    USE_SSL=true
    echo "[newton] SSL: using provided certificates"

elif [ "${SSL_ENABLED}" = "true" ]; then
    if [ ! -f "$SSL_DIR/cert.pem" ] || [ ! -f "$SSL_DIR/key.pem" ]; then
        echo "[newton] SSL: generating self-signed certificate for ${HOSTNAME}.local (30 years)"
        cat > /tmp/openssl.cnf <<OPENSSLEOF
[req]
distinguished_name = req_distinguished_name
x509_extensions   = v3_req
prompt            = no

[req_distinguished_name]
CN = ${HOSTNAME}.local

[v3_req]
subjectAltName = DNS:${HOSTNAME}.local, DNS:localhost, IP:127.0.0.1
OPENSSLEOF
        openssl req -x509 -newkey rsa:2048 \
            -keyout "$SSL_DIR/key.pem" \
            -out    "$SSL_DIR/cert.pem" \
            -days 10950 -nodes \
            -config /tmp/openssl.cnf
        rm /tmp/openssl.cnf
        echo "[newton] SSL: certificate generated"
    else
        echo "[newton] SSL: existing certificate found, skipping generation"
    fi
    USE_SSL=true
fi

# ─── Select nginx config ─────────────────────────────────────────────────────
if [ "$USE_SSL" = "true" ]; then
    echo "[newton] nginx: HTTPS mode (${HTTPS_PORT} + redirect from 2020)"
    # Substitute HTTPS_PORT into the SSL config template
    HTTPS_PORT="$HTTPS_PORT" envsubst '${HTTPS_PORT}' \
        < /etc/nginx/nginx-ssl.conf \
        > /etc/nginx/http.d/default.conf
else
    echo "[newton] nginx: HTTP mode (port 2020)"
    cp /etc/nginx/nginx-http.conf /etc/nginx/http.d/default.conf
fi

# ─── Start services ──────────────────────────────────────────────────────────
php-fpm -D
exec nginx -g 'daemon off;'
