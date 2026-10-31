#!/usr/bin/env bash
# Deploy Riftbound KR Prices to riftbound.card-cafe.com.
#
#   deploy/deploy.sh setup     # first time only: server setup with sudo (asks for the password)
#   deploy/deploy.sh           # upload the site
#   deploy/deploy.sh refresh   # refresh prices on the server now
#   deploy/deploy.sh logs      # last data refresh logs
#
# The server keeps its own data/ and img/ fresh (systemd timers), so a deploy only
# uploads them when they are missing there.
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
    rsync -a --chmod=D755,F644 --relative index.html app.js style.css ads.js scripts/build_catalog.py scripts/scrape_bunjang.py "$HOST:$SITE/"
    rsync -a --chmod=D755,F644 --ignore-existing --relative data/ img/ "$HOST:$SITE/"
    echo "Deployed: https://riftbound.card-cafe.com"
    ;;
refresh)
    ssh "$HOST" "sudo systemctl start riftbound-prices.service; sudo journalctl --no-pager -u riftbound-prices.service -n 3"
    ;;
logs)
    ssh "$HOST" "sudo journalctl --no-pager -u riftbound-prices.service -u riftbound-catalog.service -n 40"
    ;;
*)
    sed -n '2,9p' "$0"; exit 1
    ;;
esac
