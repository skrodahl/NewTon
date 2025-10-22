FROM php:8.2-fpm-alpine

# Install nginx
RUN apk add --no-cache nginx

# Copy application files
COPY . /var/www/html/

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/http.d/default.conf

# Copy PHP configuration (upload limits, UTF-8 encoding)
COPY docker/php.ini /usr/local/etc/php/conf.d/uploads.ini

# Create tournaments directory for persistent storage
RUN mkdir -p /var/www/html/tournaments

# Set proper permissions
RUN chown -R www-data:www-data /var/www/html && \
    chmod -R 755 /var/www/html

# Create directory for nginx pid
RUN mkdir -p /run/nginx

# Volume for persistent tournament storage
VOLUME ["/var/www/html/tournaments"]

# Expose port 2020 ("Double 20" - darts reference) 🎯
EXPOSE 2020

# Start both PHP-FPM and nginx
CMD php-fpm -D && nginx -g 'daemon off;'
