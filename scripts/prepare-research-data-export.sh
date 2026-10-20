#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

# IRL data transfer guard. This script does not create projects, modify schemas,
# delete source data, or enable trading. It exports an explicit allowlist only.
# Requires PostgreSQL client tools and source/target connection strings in env.
# Never place connection strings in arguments, logs, Git, or chat.

: "${SOURCE_DATABASE_URL:?Set SOURCE_DATABASE_URL in the private shell environment}"
: "${TARGET_DATABASE_URL:?Set TARGET_DATABASE_URL in the private shell environment}"
: "${SOURCE_PROJECT_REF:?Set verified source project ref}"
: "${TARGET_PROJECT_REF:?Set verified IRL target project ref}"
: "${EXPORT_DIR:?Set a private export directory outside the repository}"

[[ "$SOURCE_PROJECT_REF" != "$TARGET_PROJECT_REF" ]] || {
  echo "REFUSING: source and target project refs are identical." >&2; exit 20;
}
[[ "$SOURCE_PROJECT_REF" == "yckewtpfttvwiptmmrfq" ]] || {
  echo "REFUSING: unexpected source project ref." >&2; exit 21;
}
[[ "$TARGET_PROJECT_REF" != "opwkbdbpqgtgcrmqqmbq" ]] || {
  echo "REFUSING: known unrelated inactive project is not an IRL target." >&2; exit 22;
}
[[ "$TARGET_PROJECT_REF" != "gbbrmzstuhdizfvabjvz" ]] || {
  echo "REFUSING: unresolved project ref is not an approved target." >&2; exit 23;
}
command -v pg_dump >/dev/null
command -v psql >/dev/null
mkdir -p "$EXPORT_DIR"
chmod 700 "$EXPORT_DIR"
[[ -z "$(find "$EXPORT_DIR" -mindepth 1 -maxdepth 1 -print -quit)" ]] || {
  echo "REFUSING: export directory must be empty." >&2; exit 24;
}

# Metadata preflight. Stop before export if either connection cannot be verified.
SRC_META="$(psql "$SOURCE_DATABASE_URL" -X -A -t -v ON_ERROR_STOP=1 -c "select current_database() || '|' || current_setting('server_version')")"
DST_META="$(psql "$TARGET_DATABASE_URL" -X -A -t -v ON_ERROR_STOP=1 -c "select current_database() || '|' || current_setting('server_version')")"
printf 'source_ref=%s\nsource_meta=%s\ntarget_ref=%s\ntarget_meta=%s\n' \
  "$SOURCE_PROJECT_REF" "$SRC_META" "$TARGET_PROJECT_REF" "$DST_META" > "$EXPORT_DIR/connection-preflight.txt"

# Explicit research allowlist. Deliberately excludes pipeline_runs (large raw
# result JSON), secrets, auth schemas, cron state, operational config and live
# execution controls. Tables with dependency/schema mismatches must be handled
# in a reviewed follow-up, not silently skipped.
TABLES=(
  public.composite_signals
  public.strategy_variant_signals
  public.strategy_shadow_diagnostics
  public.accumulation_shadow_observations
  public.early_entry_variant_decisions
  public.repeated_buy_research_ledger
  public.council_signals
  public.council_lessons
  public.asset_sentiment_snapshots
  public.asset_social_snapshots
  public.asset_flow_snapshots
  public.asset_price_snapshots
  public.market_candles
  public.whale_alerts
  public.whale_flow_snapshots
  public.whale_flow_transitions
  public.whale_flow_transition_context
  public.whale_flow_shock_followups
  public.event_flow_study_snapshots
  public.research_evidence
  public.research_cases
)

# This stage is export-only. It refuses to import until a separate reviewed
# schema-parity manifest exists and the operator explicitly runs a target-side
# restore procedure. Preserve IDs and timestamps; no TRUNCATE/DELETE.
args=()
for table in "${TABLES[@]}"; do args+=(--table="$table"); done
pg_dump "$SOURCE_DATABASE_URL" --data-only --format=custom --no-owner --no-privileges \
  --serializable-deferrable "${args[@]}" --file="$EXPORT_DIR/irl-research-data.dump"
sha256sum "$EXPORT_DIR/irl-research-data.dump" > "$EXPORT_DIR/SHA256SUMS"
printf 'Export complete; no target writes performed.\nsource_ref=%s\ntarget_ref=%s\ntables=%s\n' \
  "$SOURCE_PROJECT_REF" "$TARGET_PROJECT_REF" "${#TABLES[@]}" > "$EXPORT_DIR/EXPORT-STATUS.txt"
echo "Export created in private directory. Verify schema parity and row counts before any import."
