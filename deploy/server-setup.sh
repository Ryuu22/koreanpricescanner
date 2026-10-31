#!/usr/bin/env bash
# One-time server setup for Riftbound KR Prices. Needs root; safe to run again.
#
#   deploy/deploy.sh setup      # uploads this folder and runs it with sudo (asks for the password)
#
# Creates /srv/riftbound/site (owned by the deploy user), installs the timers that
# refresh the data, and the Apache site with a Let's Encrypt certificate.
# Everything after this is done by deploy/deploy.sh, no sudo needed.
set -euo pipefail

DOMAIN=riftbound.card-cafe.com
BASE=/srv/riftbound
DEPLOY_USER=${SUDO_USER:?run this with sudo from the deploy user}
HERE=$(cd "$(dirname "$0")" && pwd)

[ "$(id -u)" = 0 ] || { echo "Run with sudo."; exit 1; }

echo "== Folders"
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" -m 755 "$BASE" "$BASE/site"

echo "== sudo rules for $DEPLOY_USER"
SUDOERS=/etc/sudoers.d/riftbound-deploy
cat > "$SUDOERS.tmp" <<RULES
# Riftbound deploys (deploy/deploy.sh): run a data refresh now, read its logs.
$DEPLOY_USER ALL=(root) NOPASSWD: /usr/bin/systemctl start riftbound-prices.service riftbound-catalog.service, \\
    /usr/bin/systemctl start --no-block riftbound-prices.service riftbound-catalog.service, \\
    /usr/bin/journalctl --no-pager -u riftbound-prices.service -u riftbound-catalog.service *
RULES
chmod 440 "$SUDOERS.tmp"
visudo -cf "$SUDOERS.tmp" >/dev/null
mv "$SUDOERS.tmp" "$SUDOERS"

echo "== systemd timers"
for unit in riftbound-prices.service riftbound-prices.timer riftbound-catalog.service riftbound-catalog.timer; do
    sed "s/@DEPLOY_USER@/$DEPLOY_USER/" "$HERE/$unit" > "/etc/systemd/system/$unit"
    chmod 644 "/etc/systemd/system/$unit"
done
systemctl daemon-reload
systemctl enable --now riftbound-prices.timer riftbound-catalog.timer

echo "== Apache site"
SITE=/etc/apache2/sites-available/$DOMAIN.conf
a2enmod -q headers rewrite ssl deflate >/dev/null
if [ ! -e "/etc/apache2/sites-available/$DOMAIN-le-ssl.conf" ]; then
    install -m 644 "$HERE/apache-$DOMAIN.conf" "$SITE"
    a2ensite -q "$DOMAIN" >/dev/null
    apache2ctl configtest
    systemctl reload apache2
    echo "== HTTPS certificate"
    certbot --apache --non-interactive --agree-tos --redirect -d "$DOMAIN"
else
    echo "HTTPS site already set up; not touching it (edit $SITE and its -le-ssl.conf by hand)."
fi
apache2ctl configtest
systemctl reload apache2

echo "Done. Next: deploy/deploy.sh (from your computer)."
