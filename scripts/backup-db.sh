#!/usr/bin/env bash
# Backup SQLite (WAL-safe) — à cronner, ex: 0 3 * * * /path/scripts/backup-db.sh
set -euo pipefail
cd "$(dirname "$0")/.."
DEST="${1:-backups}"
mkdir -p "$DEST"
STAMP="$(date +%Y%m%d-%H%M%S)"
sqlite3 prisma/dev.db ".backup '$DEST/dev-$STAMP.db'"
# Purge des backups > 30 jours
find "$DEST" -name 'dev-*.db' -mtime +30 -delete
echo "backup: $DEST/dev-$STAMP.db"
