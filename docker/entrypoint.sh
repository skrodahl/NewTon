#!/bin/sh
set -e

# =============================================================================
# NewTon DC Tournament Manager — Container Entrypoint
# =============================================================================

# SSL_HOSTNAME (preferred) with fallback to MDNS_HOSTNAME for backwards compatibility.
# Used only for the SSL certificate's Subject Alternative Name.
HOSTNAME="${SSL_HOSTNAME:-${MDNS_HOSTNAME:-newtondarts}}"
export HTTP_PORT="${HTTP_PORT:-2020}"
export HTTPS_PORT="${HTTPS_PORT:-443}"

# Note: mDNS (.local hostname) is a host-side concern, not handled by the container.
# See Docs/MDNS.md for setup instructions.

# ─── SSL ─────────────────────────────────────────────────────────────────────
# Three modes:
#   1. SSL_CERT + SSL_KEY set  → use provided certs (implicitly enables SSL)
#   2. SSL_ENABLED=true        → auto-generate self-signed cert (30 years)
#   3. Neither                 → HTTP only on ${HTTP_PORT}

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
    echo "[newton] nginx: HTTPS mode (${HTTPS_PORT} + redirect from ${HTTP_PORT})"
    envsubst '${HTTP_PORT} ${HTTPS_PORT}' \
        < /etc/nginx/nginx-ssl.conf \
        > /etc/nginx/http.d/default.conf
else
    echo "[newton] nginx: HTTP mode (port ${HTTP_PORT})"
    envsubst '${HTTP_PORT}' \
        < /etc/nginx/nginx-http.conf \
        > /etc/nginx/http.d/default.conf
fi

# ─── Tournament storage ──────────────────────────────────────────────────────
# /var/www/html/tournaments holds uploaded tournaments and the network handover
# mailboxes. Both are written by php-fpm, which runs as www-data.
#
# This has to happen here rather than in the Dockerfile. The directory is a volume,
# so whatever the image put there — including its ownership — is replaced the moment
# the volume is mounted. With a bind mount (the documented compose setup) the host
# directory's ownership applies instead, and Docker creates a missing one as root.
# On Linux that leaves it root-owned and unwritable by www-data, which silently
# breaks tournament upload and network handover alike. On macOS and Windows the
# Docker file-sharing layer hides the problem, so it only shows on real deployments.
#
# The entrypoint runs as root, after mounting: the only moment both are true.
TOURNAMENTS_DIR=/var/www/html/tournaments

mkdir -p "$TOURNAMENTS_DIR" 2>/dev/null || true

# Only touch ownership when it is actually a problem — a directory the operator has
# already set up correctly (group-writable, or owned by www-data) is left alone.
# busybox `su` is used to ask the question as the right user; su-exec is not in this image.
if su www-data -s /bin/sh -c "test -w '$TOURNAMENTS_DIR'" 2>/dev/null; then
    : # already writable by the web server user
else
    if chown www-data:www-data "$TOURNAMENTS_DIR" 2>/dev/null; then
        echo "[newton] tournaments/ was not writable by the web server; ownership adjusted"
    else
        echo "[newton] WARNING: $TOURNAMENTS_DIR is not writable by www-data and could not be changed."
        echo "[newton]          Tournament upload and network handover will fail."
        echo "[newton]          Fix on the host with:  sudo chown -R 82:82 <the mounted directory>"
    fi
fi

if mkdir -p "$TOURNAMENTS_DIR/network" 2>/dev/null; then
    chown www-data:www-data "$TOURNAMENTS_DIR/network" 2>/dev/null || true
else
    echo "[newton] WARNING: could not create $TOURNAMENTS_DIR/network — network handover will not work"
fi

# ─── Start services ──────────────────────────────────────────────────────────
php-fpm -D
exec nginx -g 'daemon off;'
