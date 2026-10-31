#!/usr/bin/env bash
# Daily backup of the data only the server has (price history, listings seen, sales)
# to the data-backup branch on GitHub, one commit per day. To restore a file:
#   git fetch origin data-backup && git show origin/data-backup:history.js > data/history.js
# Pushes with a deploy key (~/.ssh/riftbound_backup) that has write access to the repo.
set -euo pipefail

SITE=/srv/riftbound/site
DIR=/srv/riftbound/backup
REMOTE=${RIFTBOUND_BACKUP_REMOTE:-git@github.com:Ryuu22/koreanpricescanner.git}
BRANCH=data-backup
export GIT_SSH_COMMAND="ssh -i $HOME/.ssh/riftbound_backup -o IdentitiesOnly=yes -o UserKnownHostsFile=$DIR/known_hosts -o StrictHostKeyChecking=accept-new"

if [ ! -d "$DIR/repo/.git" ]; then
    git init -q "$DIR/repo"
    git -C "$DIR/repo" remote add origin "$REMOTE"
    if git -C "$DIR/repo" fetch -q origin "$BRANCH" 2>/dev/null; then
        git -C "$DIR/repo" checkout -q -B "$BRANCH" FETCH_HEAD
    else
        git -C "$DIR/repo" checkout -q --orphan "$BRANCH"
    fi
fi

cd "$DIR/repo"
for f in history.js prices.js seen.json; do
    [ -e "$SITE/data/$f" ] && cp "$SITE/data/$f" .
done
git add -A
if git diff --cached --quiet; then
    echo "Nothing changed since the last backup."
    exit 0
fi
git -c user.name="Riftbound backup" -c user.email="dan@torchsmith.com" commit -q -m "Data $(date +%F)"
git push -q origin "$BRANCH"
echo "Backed up to $BRANCH."
