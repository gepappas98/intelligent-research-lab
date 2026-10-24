-- Canonical source project migration. Read-only exact-ID linkage audit; no fuzzy symbol joins.
create or replace view public.council_lessons_link_audit
with (security_invoker = true) as
select
  l.id as lesson_id,
  l.source_trade_id,
  l.symbol,
  l.verdict,
  l.outcome,
  l.realized_pnl,
  l.pnl_pct,
  l.created_at as lesson_created_at,
  case
    when l.source_trade_id is null then 'missing_source_trade_id'
    when t.id is null then 'orphan_source_trade_id'
    else 'linked'
  end as link_state,
  t.status as trade_status,
  t.created_at as trade_created_at,
  t.closed_at as trade_closed_at,
  t.entry_source,
  t.regime_label
from public.council_lessons l
left join public.trades t on t.id = l.source_trade_id;
