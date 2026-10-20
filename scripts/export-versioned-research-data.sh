#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

# Export the reviewed historical-research allowlist only. Read-only against source.
# Requires psql, pg_dump, sha256sum, git.
# SOURCE_DATABASE_URL must be supplied privately; never commit it.
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

# Deliberate research allowlist. Add a table only after reviewing its schema/content.
TABLES=(
  composite_signals strategy_variant_signals strategy_shadow_diagnostics
  accumulation_shadow_observations early_entry_variant_decisions repeated_buy_research_ledger
  trades council_signals council_lessons asset_sentiment_snapshots asset_social_snapshots
  asset_flow_snapshots asset_price_snapshots market_candles whale_alerts
  whale_flow_snapshots whale_flow_transitions whale_flow_transition_context
  whale_flow_shock_followups event_flow_study_snapshots research_evidence research_cases
  pipeline_runs trade_alerts indicator_snapshots
)
: > "$SNAP/metadata/included-tables.txt"
: > "$SNAP/metadata/missing-allowlisted-tables.txt"
: > "$SNAP/metadata/excluded-public-tables.txt"
: > "$SNAP/metadata/row-counts.tsv"
printf 'table\trows\tbytes\tsha256\n' > "$SNAP/metadata/row-counts.tsv"

for table in "${TABLES[@]}"; do
  if ! grep -Fxq "$table" "$SNAP/metadata/public-tables.tsv"; then
    printf 'public.%s\n' "$table" >> "$SNAP/metadata/missing-allowlisted-tables.txt"
    continue
  fi
  # Exclude any unexpected credential-like table name even if added to the allowlist.
  if [[ "$table" =~ (^|_)(secret|secrets|credential|credentials|api_key|api_keys|private_key|access_token|refresh_token|webhook_secret)(_|$) ]]; then
    printf 'public.%s\n' "$table" >> "$SNAP/metadata/excluded-public-tables.txt"
    continue
  fi
  outfile="$SNAP/tables/public.$table.dump"
  pg_dump "$SOURCE_DATABASE_URL" --data-only --format=custom --no-owner --no-privileges --table="public.$table" --file="$outfile"
  size="$(wc -c < "$outfile" | tr -d ' ')"
  if (( size >= 95000000 )); then
    rm -f "$outfile"
    echo "STOP: public.$table dump reached $size bytes; partition before committing (GitHub file-limit safety margin)." >&2
    exit 30
  fi
  count="$(psql "$SOURCE_DATABASE_URL" -X -A -t -v ON_ERROR_STOP=1 -c "select count(*) from public.\"$table\"")"
  checksum="$(sha256sum "$outfile" | awk '{print $1}')"
  printf 'public.%s\n' "$table" >> "$SNAP/metadata/included-tables.txt"
  printf 'public.%s\t%s\t%s\t%s\n' "$table" "$count" "$size" "$checksum" >> "$SNAP/metadata/row-counts.tsv"
done

# Explicitly inventory every public table not covered by the export allowlist.
# This is coverage metadata only; it does not export or modify excluded tables.
while IFS= read -r table; do
  [[ -z "$table" ]] && continue
  if ! printf '%s\\n' "${TABLES[@]}" | grep -Fxq -- "$table"; then
    printf 'public.%s\\n' "$table" >> "$SNAP/metadata/excluded-public-tables.txt"
  fi
done < "$SNAP/metadata/public-tables.tsv"

# Schema reference is for review/rebuild, not a blind migration into any existing DB.
pg_dump "$SOURCE_DATABASE_URL" --schema-only --schema=public --format=custom --no-owner --no-privileges --file="$SNAP/public-schema.dump"
(
  cd "$SNAP"
  find . -type f ! -name SHA256SUMS -print0 | sort -z | xargs -0 sha256sum > SHA256SUMS
)
cat > "$SNAP/RESTORE.md" <<'EOF'
Private versioned historical research snapshot. This snapshot contains only the reviewed
research allowlist listed in metadata/included-tables.txt; missing tables are recorded.
Each table is a data-only PostgreSQL custom dump. public-schema.dump is a schema reference,
not a blindly applicable migration. Before restoring, inspect schema and data for secrets,
create a NEW isolated destination, restore there only, then reconcile checksums, row counts,
primary-key uniqueness, timestamp ranges, strategy/cohort identifiers, and unresolved outcomes.
Never restore into the canonical source project. No import, commit, push, or deletion occurs here.
EOF
chmod -R go-rwx "$SNAP"
echo "Export snapshot created at $SNAP"
echo "Review included/missing tables, pipeline_runs contents, counts, time ranges and checksums before committing."
echo "This script does not commit, push, import, or delete. Repeated full snapshots grow Git history; do not schedule full snapshots as automatic refreshes."
