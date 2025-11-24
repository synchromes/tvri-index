#!/bin/bash

# TVRI Index - SSL Setup with Certbot
# Run after initial deployment
# Usage: sudo bash setup-ssl.sh yourdomain.com

DOMAIN=$1

if [ -z "$DOMAIN" ]; then
    echo "Usage: sudo bash setup-ssl.sh yourdomain.com"
    exit 1
fi

echo "Installing Certbot..."
apt install -y certbot python3-certbot-nginx

echo "Updating Nginx configuration for domain: $DOMAIN"
sed -i "s/server_name _;/server_name $DOMAIN;/" /etc/nginx/sites-available/tvri-index
nginx -t
systemctl reload nginx

echo "Obtaining SSL certificate..."
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --register-unsafely-without-email

echo "Setting up auto-renewal..."
systemctl enable certbot.timer
systemctl start certbot.timer

echo "SSL setup complete! ✅"
echo "Your site is now available at: https://$DOMAIN"
