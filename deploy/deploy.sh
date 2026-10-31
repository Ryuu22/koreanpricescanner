#!/usr/bin/env bash
# Deploy Riftbound KR Prices to riftbound.card-cafe.com.
#
#   deploy/deploy.sh setup     # first time only: server setup with sudo (asks for the password)
#   deploy/deploy.sh           # upload the site
#   deploy/deploy.sh refresh   # refresh prices on the server now
#   deploy/deploy.sh logs      # last data refresh logs
#   deploy/deploy.sh stats     # open the visitor stats (GoAccess) in your browser
#   deploy/deploy.sh backup    # back up the price history to GitHub now (runs daily anyway)
#
# The server keeps its own data/, img/, card pages and sitemap fresh (systemd timers),
# so a deploy only uploads data/ and img/ when they are missing there.
set -euo pipefail

HOST=${RIFTBOUND_HOST:-nakshi}
SITE=/srv/riftbound/site
ROOT=$(cd "$(dirname "$0")/.." && pwd)

case "${1:-deploy}" in
setup)
    rsync -a --delete "$ROOT/deploy/" "$HOST:riftbound-setup/"
    ssh -t "$HOST" "sudo bash ~/riftbound-setup/server-setup.sh"
    ;;
deploy)
    cd "$ROOT"
    rsync -a --chmod=D755,F644 --relative index.html privacy.html about.html calc.html app.js calc.js style.css \
        ads.js robots.txt favicon.svg favicon.ico apple-touch-icon.png og.png \
        scripts/build_catalog.py scripts/scrape_bunjang.py scripts/build_pages.py scripts/backup_data.sh "$HOST:$SITE/"
    rsync -a --chmod=D755,F644 --ignore-existing --relative data/cards.js data/prices.js img/ "$HOST:$SITE/"
    # Card pages use the page template from this deploy
    ssh "$HOST" "cd $SITE && python3 scripts/build_pages.py"
    echo "Deployed: https://riftbound.card-cafe.com"
    ;;
refresh)
    ssh "$HOST" "sudo systemctl start riftbound-prices.service; sudo journalctl --no-pager -u riftbound-prices.service -u riftbound-catalog.service -n 4"
    ;;
logs)
    ssh "$HOST" "sudo journalctl --no-pager -u riftbound-prices.service -u riftbound-catalog.service -n 40"
    ;;
backup)
    ssh "$HOST" "sudo systemctl start riftbound-backup.service; sudo journalctl --no-pager -u riftbound-backup.service -n 3"
    ;;
stats)
    out=${TMPDIR:-/tmp}/riftbound-stats.html
    ssh "$HOST" "sudo systemctl start riftbound-stats.service"
    scp -q "$HOST:/srv/riftbound/stats/index.html" "$out"
    echo "$out"
    xdg-open "$out" 2>/dev/null || open "$out" 2>/dev/null || true
    ;;
*)
    sed -n '2,11p' "$0"; exit 1
    ;;
esac
