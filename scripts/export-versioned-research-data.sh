#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

# Exports real historical rows into the private repository, one compressed dump
# per public table. It does not import, reset, or delete anything.
# Requires psql, pg_dump, sha256sum, git.
# Run from repo root:
# SOURCE_DATABASE_URL='...' SOURCE_PROJECT_REF='yckewtpfttvwiptmmrfq' bash scripts/export-versioned-research-data.sh
# The connection string must be supplied privately; never commit it.

EXPECTED_REF="yckewtpfttvwiptmmrfq"
: "${SOURCE_DATABASE_URL:?Set SOURCE_DATABASE_URL privately}"
: "${SOURCE_PROJECT_REF:?Set SOURCE_PROJECT_REF explicitly}"
[[ "$SOURCE_PROJECT_REF" == "$EXPECTED_REF" ]] || { echo "Refusing unverified source ref" >&2; exit 21; }
[[ "$SOURCE_DATABASE_URL" != *"opwkbdbpqgtgcrmqqmbq"* && "$SOURCE_DATABASE_URL" != *"gbbrmzstuhdizfvabjvz"* ]] || { echo "Refusing unrelated/unverified project" >&2; exit 22; }
for c in psql pg_dump sha256sum git; do command -v "$c" >/dev/null || { echo "Missing required command: $c" >&2; exit 2; }; done
git rev-parse --show-toplevel >/dev/null 2>&1 || { echo "Run inside the IRL git checkout" >&2; exit 2; }

ROOT="$(git rev-parse --show-toplevel)"
DATA="$ROOT/data/historical"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
SNAP="$DATA/snapshots/$STAMP"
mkdir -p "$SNAP/tables" "$SNAP/metadata"
chmod 700 "$DATA" "$SNAP" "$SNAP/tables" "$SNAP/metadata"

IDENTITY="$(psql "$SOURCE_DATABASE_URL" -X -A -t -v ON_ERROR_STOP=1 -c "select current_database() || '|' || current_setting('server_version')")"
printf 'source_ref=%s\nsource_identity=%s\nexported_at_utc=%s\nrepository_commit=%s\n' "$SOURCE_PROJECT_REF" "$IDENTITY" "$STAMP" "$(git rev-parse HEAD)" > "$SNAP/metadata/manifest.txt"
psql "$SOURCE_DATABASE_URL" -X -A -F $'\t' -t -v ON_ERROR_STOP=1 -c "select tablename from pg_tables where schemaname='public' order by tablename" > "$SNAP/metadata/public-tables.tsv"

# Exclude only obvious credential/account/security material and mutable live controls.
# Record exclusions so the export boundary is auditable.
: > "$SNAP/metadata/included-tables.txt"
: > "$SNAP/metadata/excluded-tables.txt"
: > "$SNAP/metadata/row-counts.tsv"
while IFS= read -r table; do
  [[ -n "$table" ]] || continue
  if [[ "$table" =~ (^|_)(secret|secrets|credential|credentials|api_key|api_keys|private_key|access_token|refresh_token|webhook_secret)(_|$) ]] || [[ "$table" =~ ^(user_profiles|profiles|user_settings|live_execution_config|execution_credentials|exchange_credentials|scheduler_state|cron_state)$ ]]; then
    printf 'public.%s\n' "$table" >> "$SNAP/metadata/excluded-tables.txt"
    continue
  fi
  printf 'public.%s\n' "$table" >> "$SNAP/metadata/included-tables.txt"
  outfile="$SNAP/tables/public.$table.dump"
  pg_dump "$SOURCE_DATABASE_URL" --data-only --format=custom --no-owner --no-privileges --table="public.$table" --file="$outfile"
  size="$(wc -c < "$outfile" | tr -d ' ')"
  if (( size >= 95000000 )); then
    echo "STOP: public.$table dump is $size bytes; partition it before committing (GitHub file limit safety margin)." >&2
    exit 30
  fi
  count="$(psql "$SOURCE_DATABASE_URL" -X -A -t -v ON_ERROR_STOP=1 -c "select count(*) from public.\"$table\"")"
  printf 'public.%s\t%s\t%s\n' "$table" "$count" "$size" >> "$SNAP/metadata/row-counts.tsv"
done < "$SNAP/metadata/public-tables.tsv"

pg_dump "$SOURCE_DATABASE_URL" --schema-only --schema=public --format=custom --no-owner --no-privileges --file="$SNAP/public-schema.dump"
(
  cd "$SNAP"
  find . -type f ! -name SHA256SUMS -print0 | sort -z | xargs -0 sha256sum > SHA256SUMS
)
cat > "$SNAP/RESTORE.md" <<'EOF'
Private versioned historical research snapshot. Every included public table has its own
data-only PostgreSQL custom dump; public-schema.dump is schema reference, not a blindly
applicable migration. Restore only into a newly created, verified, isolated IRL Supabase
project after reviewing schema compatibility. Reconcile row counts and temporal/cohort
invariants. Never restore into the canonical source project. Do not commit credentials.
EOF
chmod -R go-rwx "$SNAP"
echo "Export snapshot created at $SNAP"
echo "Review excluded tables, checksums, row counts, and any size guard before committing."
echo "This script does not commit, push, import, or delete. Commit the snapshot only after review."
