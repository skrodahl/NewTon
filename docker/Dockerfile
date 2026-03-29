FROM php:8.2-fpm-alpine

# Install nginx, SSL tools, and mDNS support
RUN apk add --no-cache nginx openssl avahi avahi-tools dbus gettext

# Copy application files
COPY . /var/www/html/

# Rename tournament.html to tournament.php for PHP-FPM processing
RUN mv /var/www/html/tournament.html /var/www/html/tournament.php

# Copy nginx configurations (entrypoint selects the right one at runtime)
COPY docker/nginx-http.conf /etc/nginx/nginx-http.conf
COPY docker/nginx-ssl.conf  /etc/nginx/nginx-ssl.conf

# Copy PHP configuration (upload limits, UTF-8 encoding)
COPY docker/php.ini /usr/local/etc/php/conf.d/uploads.ini

# Copy and prepare container entrypoint
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Create tournaments directory for persistent storage
RUN mkdir -p /var/www/html/tournaments

# Set proper permissions
RUN chown -R www-data:www-data /var/www/html && \
    chmod -R 755 /var/www/html

# Create directory for nginx pid
RUN mkdir -p /run/nginx

# Volume for persistent tournament storage
VOLUME ["/var/www/html/tournaments"]

# Expose HTTP port (redirect to HTTPS when SSL enabled) and default HTTPS port
EXPOSE 2020 443

ENTRYPOINT ["/entrypoint.sh"]
