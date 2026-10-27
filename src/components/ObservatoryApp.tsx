// @ts-nocheck — ported verbatim from intelligent-research-lab
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { readBoundedArchiveResponse } from "../lib/archive-response";
import {
  Activity, ArrowDownRight, ArrowUpRight, Bell, BookOpen, BrainCircuit, CheckCircle2,
  ChevronDown, CircleHelp, Clock3, Database, Download, ExternalLink, FlaskConical,
  Gauge, GitBranch, LayoutDashboard, Menu, Network, RefreshCw, Search, ShieldCheck,
  Sparkles, Target, TrendingUp, X
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";

type Row = Record<string, any>;
type ArchiveCategory = { record_type: string; document_count: number; latest_created_at: string | null; snapshot_rows_declared_max: number; batch_records_declared: number };
type Dataset = { trades: Row[]; lessons: Row[]; evidence: Row[]; variants: Row[]; cmc: Row[]; errors: string[]; archiveDocumentCount: number | null; archiveGeneratedAt: string | null; archiveError: string | null; archiveCategories: ArchiveCategory[]; archiveCategoryError: string | null };
type Tab = "overview" | "strategies" | "quality" | "memory";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;
const isLiveConfigured = Boolean(supabaseUrl && supabaseKey);
const supabase: SupabaseClient | null = isLiveConfigured ? createClient(supabaseUrl!, supabaseKey!, {
  auth: { persistSession: false, autoRefreshToken: false }
}) : null;

const formatDate = (value: unknown) => {
  if (!value) return "—";
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString(undefined, { month:"short", day:"2-digit", hour:"2-digit", minute:"2-digit" });
};
const num = (v: unknown) => typeof v === "number" ? v : Number(v ?? 0);
const pnlOf = (r: Row) => num(r.net_pnl ?? r.realized_pnl ?? r.pnl ?? r.pnl_pct ?? r.profit_loss);
const symbolOf = (r: Row) => String(r.symbol ?? r.asset ?? r.ticker ?? "—").replace(/USDT$/i, "");
const statusOf = (r: Row) => String(r.status ?? r.outcome ?? r.verdict ?? "observed").toLowerCase();

async function invokeBoundedArchive(endpoint: "archive-summary" | "archive-category-summary") {
  try {
    // Supabase functions.invoke sends the project API key and, with this client configured
    // without a persisted session, uses that key as the bearer token. Keep those headers.
    const response = await fetch(`${supabaseUrl}/functions/v1/${endpoint}`, {
      method: "GET",
      headers: {
        apikey: supabaseKey!,
        Authorization: `Bearer ${supabaseKey!}`,
        Accept: "application/json",
      },
    });
    const parsed = await readBoundedArchiveResponse(response);
    if (!response.ok) return { data: null, error: { message: `HTTP ${response.status}` } };
    if (!parsed.ok) return { data: null, error: { message: `Archive response ${parsed.error}` } };
    return { data: parsed.value, error: null };
  } catch {
    return { data: null, error: { message: "Archive request failed" } };
  }
}

async function readTable(client: SupabaseClient, candidates: string[]): Promise<{ rows: Row[]; used: string | null; error?: string }> {
  for (const table of candidates) {
    const ordered = await client.from(table).select("*").order("created_at", { ascending: false }).limit(150);
    if (!ordered.error) return { rows: (ordered.data ?? []) as Row[], used: table };
    // Some source tables use observed_at / captured_at instead of created_at. Retry without assuming a timestamp column.
    const fallback = await client.from(table).select("*").limit(150);
    if (!fallback.error) {
      const rows = (fallback.data ?? []) as Row[];
      rows.sort((a, b) => {
        const ta = new Date(String(a.created_at ?? a.observed_at ?? a.available_at ?? a.captured_at ?? 0)).getTime();
        const tb = new Date(String(b.created_at ?? b.observed_at ?? b.available_at ?? b.captured_at ?? 0)).getTime();
        return tb - ta;
      });
      return { rows, used: table };
    }
  }
  return { rows: [], used: null, error: `No readable table found among: ${candidates.join(", ")}` };
}

function useResearchData() {
  const [data, setData] = useState<Dataset>({ trades:[], lessons:[], evidence:[], variants:[], cmc:[], errors:[], archiveDocumentCount:null, archiveGeneratedAt:null, archiveError:null, archiveCategories:[], archiveCategoryError:null });
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [tables, setTables] = useState<Record<string,string>>({});
  const refresh = useCallback(async () => {
    if (!supabase) { setData(prior => ({...prior, archiveError:"Supabase environment variables are missing."})); setLastSync(new Date()); return; }
    setLoading(true);
    const archivePromise = invokeBoundedArchive("archive-summary");
    const categoryPromise = invokeBoundedArchive("archive-category-summary");
    const specs = [
      ["trades", ["trades", "paper_trades", "trade_outcomes"]],
      ["lessons", ["council_lessons", "ai_council_lessons", "research_lessons"]],
      ["evidence", ["research_evidence", "signal_evidence", "evidence_snapshots"]],
      ["variants", ["strategy_variant_signals", "variant_signals", "v3_benchmark_results"]],
      ["cmc", ["cmc_observations", "cmc_snapshots", "coinmarketcap_snapshots"]]
    ] as const;
    const results = await Promise.all(specs.map(async ([key, candidates]) => [key, await readTable(supabase!, [...candidates])] as const));
    const [archiveResult, categoryResult] = await Promise.all([archivePromise, categoryPromise]);
    const summary = archiveResult.data as { document_count?: number; generated_at?: string } | null;
    const categorySummary = categoryResult.data as { by_type?: ArchiveCategory[] } | null;
    const hasCategories = Array.isArray(categorySummary?.by_type);
    const next: any = { trades:[], lessons:[], evidence:[], variants:[], cmc:[], errors:[],
      archiveDocumentCount: archiveResult.error ? null : (typeof summary?.document_count === "number" ? summary.document_count : null),
      archiveGeneratedAt: summary?.generated_at ?? null,
      archiveError: archiveResult.error ? "archive-summary request failed" : (typeof summary?.document_count === "number" ? null : "archive-summary returned no document_count"),
      archiveCategories: categoryResult.error || !hasCategories ? [] : categorySummary!.by_type!,
      archiveCategoryError: categoryResult.error ? "archive-category-summary request failed" : (hasCategories ? null : "archive-category-summary returned no categories")
    };
    const used: Record<string,string> = {};
    for (const [key, result] of results) {
      next[key] = result.rows;
      if (result.used) used[key] = result.used;
      else if (result.error) next.errors.push(`${key}: ${result.error}`);
    }
    setData(next);
    setTables(used);
    setLastSync(new Date());
    setLoading(false);
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  return { data, loading, lastSync, tables, refresh };
}

function Metric({ label, value, sub, icon: Icon, trend, tone = "neutral" }: { label:string; value:string; sub:string; icon:any; trend?:string; tone?:string }) {
  return <div className="metric-card"><div className="metric-top"><span>{label}</span><span className="metric-icon"><Icon size={17}/></span></div><div className="metric-value">{value}</div><div className="metric-bottom"><span className={tone === "good" ? "good" : tone === "bad" ? "bad" : "muted"}>{trend}</span><span>{sub}</span></div></div>;
}
function SectionTitle({ eyebrow, title, description, action }: { eyebrow:string; title:string; description:string; action?:ReactNode }) {
  return <div className="section-title"><div><div className="eyebrow">{eyebrow}</div><h2>{title}</h2><p>{description}</p></div>{action}</div>;
}
function EmptyState({ title, text }: { title:string; text:string }) {
  return <div className="empty-state"><Database size={24}/><strong>{title}</strong><span>{text}</span></div>;
}

export default function App() {
  const [tab, setTab] = useState<Tab>("overview");
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data, loading, lastSync, tables, refresh } = useResearchData();
  const demo = false;
  const trades = data.trades;
  const lessons = data.lessons;
  const evidence: Row[] = data.evidence;
  const variants = data.variants;
  const filteredTrades = useMemo(() => trades.filter(r => `${symbolOf(r)} ${r.strategy ?? r.strategy_name ?? r.entry_source ?? ""} ${r.status ?? ""}`.toLowerCase().includes(search.toLowerCase())), [trades, search]);
  const closedTrades = trades.filter(r => String(r.status ?? "").toLowerCase().includes("closed") || r.closed_at || r.close_reason);
  const wins = closedTrades.filter(r => pnlOf(r) > 0).length;
  const winRate = closedTrades.length ? wins / closedTrades.length * 100 : 0;
  const totalPnl = closedTrades.reduce((s,r)=>s+pnlOf(r),0);
  const strategyRows = Object.entries(data.variants.reduce((acc:Record<string,{n:number;wins:number;pnl:number}>, r) => {
    const name = String(r.strategy_name ?? r.variant_name ?? r.strategy ?? "Unclassified");
    acc[name] ??= {n:0,wins:0,pnl:0}; acc[name].n++; acc[name].pnl += pnlOf(r); if(pnlOf(r)>0) acc[name].wins++; return acc;
  }, {})).map(([name,v])=>({name,n:v.n,win:v.n?v.wins/v.n*100:0,pnl:v.n?v.pnl/v.n:0,status:"Derived from observed rows"}));
  const chartData = [...closedTrades].slice(0,30).reverse().reduce((acc: {day:string;pnl:number}[], r) => { const prior = acc.length ? acc[acc.length - 1].pnl : 0; acc.push({day:formatDate(r.closed_at ?? r.created_at),pnl:prior + pnlOf(r)}); return acc; }, []);
  const navItems: {id:Tab; label:string; icon:any; group:string}[] = [
    {id:"overview",label:"Live Data Monitor",icon:LayoutDashboard,group:"OBSERVATORY"},
    {id:"strategies",label:"Strategy Intelligence",icon:FlaskConical,group:"OBSERVATORY"},
    {id:"quality",label:"Timeline & Data Quality",icon:Activity,group:"RESEARCH"},
    {id:"memory",label:"AI Research Memory",icon:BrainCircuit,group:"RESEARCH"}
  ];
  const pageNames: Record<Tab,{title:string;desc:string}> = {
    overview:{title:"Research command center",desc:"A live, auditable view of signals, outcomes and research-system health."},
    strategies:{title:"Strategy intelligence",desc:"Compare research cohorts without mixing incompatible benchmark generations."},
    quality:{title:"Research timeline & data quality",desc:"Track source freshness, provenance, missingness and capture timing."},
    memory:{title:"AI research memory",desc:"Lessons and durable hypotheses, linked to their evidence—not automatic strategy changes."}
  };
  const current = pageNames[tab];
  return <div className="app-shell">
    {mobileOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={()=>setMobileOpen(false)}/>}
    <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
      <div className="brand"><div className="brand-mark"><Network size={20}/></div><div><strong>INTELLIGENT</strong><span>RESEARCH OBSERVATORY</span></div><button className="mobile-close" onClick={()=>setMobileOpen(false)}><X size={17}/></button></div>
      <div className="workspace"><div className="workspace-avatar">IR</div><div><strong>Research Lab</strong><span>Observatory workspace</span></div><ChevronDown size={15}/></div>
      {["OBSERVATORY","RESEARCH"].map(group=><div className="nav-group" key={group}><div className="nav-label">{group}</div>{navItems.filter(n=>n.group===group).map(item=>{const Icon=item.icon;return <button key={item.id} className={`nav-item ${tab===item.id?"active":""}`} onClick={()=>{setTab(item.id);setMobileOpen(false)}}><Icon size={17}/><span>{item.label}</span>{item.id==="overview"&&<span className="live-dot"/>}</button>})}</div>)}
      <div className="sidebar-bottom"><div className="safe-note"><ShieldCheck size={16}/><div><strong>Research-only boundary</strong><span>Read-only analytics. No order execution.</span></div></div><div className="sidebar-footer"><span className="status-dot"/><span>{demo ? "Demo preview" : "Supabase source configured"}</span><button title="Refresh data" onClick={()=>void refresh()}><RefreshCw size={14}/></button></div></div>
    </aside>
    <main className="main">
      <header className="topbar"><button className="mobile-menu" onClick={()=>setMobileOpen(true)}><Menu size={19}/></button><div className="breadcrumbs">Workspace <span>/</span> <strong>{navItems.find(n=>n.id===tab)?.label}</strong></div><div className="top-actions"><div className={`connection-pill ${demo?"demo":"connected"}`}><span className="status-dot"/>{data.archiveDocumentCount !== null ? "ARCHIVE VERIFIED" : "SOURCE UNVERIFIED"}</div><button className="icon-button" title="Notifications"><Bell size={17}/><i/></button><div className="user-avatar">G</div></div></header>
      <div className="page-content">
        <div className="page-heading"><div><div className="overline"><span className="overline-line"/>{data.archiveDocumentCount !== null ? "LIVE ARCHIVE ENVIRONMENT" : "CONNECTION NOT VERIFIED"} <span className="overline-sep">·</span> {new Date().toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"})}</div><h1>{current.title}</h1><p>{current.desc}</p></div><div className="heading-actions"><button className="button secondary" onClick={()=>void refresh()} disabled={loading}><RefreshCw size={15} className={loading?"spin":""}/>{loading?"Refreshing":"Refresh data"}</button><button className="button primary" onClick={()=>setTab("quality")}><Activity size={15}/>System health</button></div></div>
        {data.archiveError && <div className="warning-banner"><CircleHelp size={18}/><div><strong>Archive summary unavailable</strong><span>{data.archiveError}</span></div></div>}
        {!demo && data.errors.length>0 && <div className="warning-banner"><CircleHelp size={18}/><div><strong>Source connected; some research tables could not be read</strong><span>Check table names and SELECT policies. The UI never writes to the database.</span></div></div>}
        {tab==="overview" && <>
          <div className="metrics-grid">
            <Metric label="Closed research trades" value={demo?"121":String(closedTrades.length)} sub="Across loaded source rows" icon={Target} trend={demo?"Last 7 days":"Loaded sample"} />
            <Metric label="Observed win rate" value={closedTrades.length? `${(demo?68.5:winRate).toFixed(1)}%`:"—"} sub="Closed rows with known P&L" icon={Gauge} trend={closedTrades.length?"Outcome-derived":"No resolved rows"} tone="good"/>
            <Metric label="Net P&L (loaded sample)" value={closedTrades.length?`${totalPnl>=0?"+":"−"}$${Math.abs(demo?1842.6:totalPnl).toLocaleString(undefined,{maximumFractionDigits:2})}`:"—"} sub="Not a live account balance" icon={TrendingUp} trend={demo?"Illustrative":"Source-derived"} tone={totalPnl>=0?"good":"bad"}/>
            <Metric label="Research evidence" value={demo?"2,486":String(evidence.length)} sub="Available observations" icon={Database} trend={demo?"Demo count":"Loaded rows"}/>
          </div>
          <div className="dashboard-grid">
            <section className="panel performance-panel"><div className="panel-heading"><div><div className="panel-kicker">OUTCOME TRACKING</div><h3>Research P&L trajectory</h3><p>Chronological outcomes from the selected dataset</p></div><button className="select-chip">7 days <ChevronDown size={14}/></button></div><div className="chart-legend"><span><i className="legend-blue"/>Cumulative research P&L</span><span className="chart-note">Illustrative / loaded sample</span></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{top:12,right:8,left:0,bottom:0}}><defs><linearGradient id="pnlFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5e8bff" stopOpacity={0.24}/><stop offset="95%" stopColor="#5e8bff" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#242b36" strokeDasharray="3 5" vertical={false}/><XAxis dataKey="day" tick={{fill:"#778397",fontSize:11}} axisLine={false} tickLine={false} minTickGap={20}/><YAxis tick={{fill:"#778397",fontSize:11}} axisLine={false} tickLine={false} width={38}/><Tooltip contentStyle={{background:"#141923",border:"1px solid #30394a",borderRadius:10,color:"#e7edf7"}}/><Area type="monotone" dataKey="pnl" name="P&L" stroke="#6b91ff" strokeWidth={2.4} fill="url(#pnlFill)" activeDot={{r:4,fill:"#91acff"}}/></AreaChart></ResponsiveContainer></div><div className="chart-footer"><span><span className="status-dot"/> Data source: {demo?"illustrative preview":tables.trades??"trade rows"}</span><span>Updated {formatDate(lastSync)}</span></div></section>
            <section className="panel source-panel"><div className="panel-heading"><div><div className="panel-kicker">PIPELINE OBSERVABILITY</div><h3>Source health</h3><p>Connectivity and mapped data feeds</p></div><Activity size={18} className="muted-icon"/></div><div className="source-list">{[
              {name:"Trade outcomes",desc:demo?"Illustrative dataset":tables.trades??"No table mapped",icon:Target,ok:demo||Boolean(tables.trades)},
              {name:"Council lessons",desc:demo?"Example post-mortems":tables.lessons??"No table mapped",icon:BrainCircuit,ok:demo||Boolean(tables.lessons)},
              {name:"Research evidence",desc:demo?"Illustrative observations":tables.evidence??"No table mapped",icon:Database,ok:demo||Boolean(tables.evidence)},
              {name:"V3 / variant benchmarks",desc:demo?"Cohort comparison preview":tables.variants??"No table mapped",icon:GitBranch,ok:demo||Boolean(tables.variants)},
              {name:"CMC observations",desc:demo?"Market context preview":tables.cmc??"No table mapped",icon:Activity,ok:demo||Boolean(tables.cmc)}
            ].map((s,i)=>{const Icon=s.icon;return <div className="source-row" key={s.name}><div className="source-icon"><Icon size={16}/></div><div className="source-copy"><strong>{s.name}</strong><span>{s.desc}</span></div><span className={`source-state ${s.ok?"ok":"missing"}`}>{s.ok?(demo?"PREVIEW":"READABLE"):"UNMAPPED"}</span></div>})}</div><button className="text-link" onClick={()=>setTab("quality")}>Inspect data quality <ArrowUpRight size={14}/></button></section>
          </div>
          <section className="panel trades-panel"><div className="panel-heading table-heading"><div><div className="panel-kicker">LATEST OBSERVATIONS</div><h3>Trade & outcome stream</h3><p>Research records only — not exchange execution activity</p></div><div className="table-tools"><div className="search-box"><Search size={15}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search symbol or strategy"/></div><button className="button secondary compact" onClick={()=>void refresh()}><RefreshCw size={14}/>Refresh</button></div></div><div className="table-scroll"><table><thead><tr><th>ASSET</th><th>STRATEGY / SOURCE</th><th>STATUS</th><th>OUTCOME P&L</th><th>EXIT / CONTEXT</th><th>OBSERVED</th></tr></thead><tbody>{filteredTrades.slice(0,8).map((r,i)=>{const pnl=pnlOf(r);return <tr key={r.id??i}><td><div className="asset-cell"><span className="coin-avatar">{symbolOf(r).slice(0,1)}</span><strong>{symbolOf(r)}</strong></div></td><td>{r.strategy??r.strategy_name??r.entry_source??"Unclassified"}</td><td><span className={`state-tag ${statusOf(r).includes("open")?"open":statusOf(r).includes("clos")?"closed":"neutral"}`}>{statusOf(r)}</span></td><td className={pnl>=0?"good":"bad"}>{r.pnl_pct!==undefined ? `${num(r.pnl_pct)>=0?"+":"−"}${Math.abs(num(r.pnl_pct)).toFixed(2)}%` : `${pnl>=0?"+":"−"}${Math.abs(pnl).toFixed(2)}`}</td><td className="muted">{String(r.close_reason??r.regime_label??"—").replaceAll("_"," ")}</td><td className="muted">{formatDate(r.closed_at??r.created_at??r.observed_at)}</td></tr>})}{filteredTrades.length===0&&<tr><td colSpan={6}><EmptyState title="No matching records" text={demo?"Try another symbol in the demo preview.":"No rows matched the search in the readable source tables."}/></td></tr>}</tbody></table></div><div className="table-footer"><span>Showing {Math.min(filteredTrades.length,8)} of {filteredTrades.length} loaded records</span><span>Stable IDs and source timestamps are retained where available</span></div></section>
          <div className="bottom-grid"><section className="panel mini-panel"><div className="panel-heading"><div><div className="panel-kicker">RESEARCH MEMORY</div><h3>Latest Council lessons</h3></div><button className="text-link" onClick={()=>setTab("memory")}>View all <ArrowUpRight size={14}/></button></div>{lessons.slice(0,3).map((l,i)=><div className="lesson-row" key={l.id??i}><div className={`lesson-outcome ${String(l.outcome??l.verdict).toLowerCase().includes("win")?"win":"loss"}`}>{String(l.outcome??l.verdict??"?").slice(0,1).toUpperCase()}</div><div className="lesson-copy"><div><strong>{symbolOf(l)}</strong><span>{formatDate(l.created_at)}</span></div><p>{String(l.lesson??l.summary??l.content??"No lesson text available.")}</p></div></div>)}{lessons.length===0&&<EmptyState title="No lessons loaded" text="Lessons will appear when the connected source grants read access."/>}</section><section className="panel mini-panel"><div className="panel-heading"><div><div className="panel-kicker">PROVENANCE FIRST</div><h3>Research guardrails</h3></div><ShieldCheck size={18} className="muted-icon"/></div><div className="guardrail-list"><div><CheckCircle2 size={16}/><span><strong>Entry-time snapshots</strong><small>Keep information known at entry separate from later outcomes.</small></span></div><div><CheckCircle2 size={16}/><span><strong>V3-aligned comparisons</strong><small>Legacy / V2 results are not blended into active cohorts.</small></span></div><div><CheckCircle2 size={16}/><span><strong>No execution writes</strong><small>This UI only issues read queries using the anon key.</small></span></div><div><Clock3 size={16}/><span><strong>Bitemporal evidence</strong><small>Preserve observed time and recorded/available time separately.</small></span></div></div></section></div>
        </>}
        {tab==="strategies" && <><div className="metrics-grid"><Metric label="Comparable cohorts" value={String(strategyRows.length)} sub="Detected strategy groups" icon={FlaskConical}/><Metric label="Resolved sample" value={String(strategyRows.reduce((s:any,r:any)=>s+num(r.n??r.count),0))} sub="Rows across loaded groups" icon={Target}/><Metric label="Benchmark policy" value="V3 aligned" sub="MTF-aligned research comparison" icon={GitBranch}/><Metric label="Execution mode" value="Disabled" sub="Research-only boundary" icon={ShieldCheck}/></div><section className="panel"><SectionTitle eyebrow="COHORT COMPARISON" title="Strategy performance" description="Sample sizes, win rates and per-row P&L are shown only where source data supports them."/><div className="table-scroll"><table><thead><tr><th>STRATEGY / COHORT</th><th>SAMPLE</th><th>WIN RATE</th><th>AVG P&L</th><th>CLASSIFICATION</th></tr></thead><tbody>{strategyRows.map((r:any,i:number)=><tr key={r.name??i}><td><strong>{r.name??r.strategy_name??"Unclassified"}</strong></td><td>{r.n??r.count??"—"}</td><td>{r.n||r.count?`${num(r.win??r.win_rate).toFixed(1)}%`:"—"}</td><td className={num(r.pnl??r.avg_pnl)>=0?"good":"bad"}>{r.n||r.count?`${num(r.pnl??r.avg_pnl)>=0?"+":"−"}${Math.abs(num(r.pnl??r.avg_pnl)).toFixed(2)}`:"—"}</td><td><span className="state-tag neutral">{r.status??r.cohort_type??"Observed"}</span></td></tr>)}</tbody></table></div><div className="policy-note"><ShieldCheck size={17}/><span>Interpretation guardrail: small samples are hypotheses, not proof. No automatic strategy promotion or threshold changes are implemented here.</span></div></section><section className="panel chart-panel"><SectionTitle eyebrow="DISTRIBUTION" title="Loaded outcome rows" description="Visual summary of the currently loaded strategy sample."/><div className="bar-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={strategyRows.map((r:any)=>({name:r.name??r.strategy_name??"Other",pnl:num(r.pnl??r.avg_pnl)}))} margin={{top:8,right:12,left:0,bottom:24}}><CartesianGrid stroke="#242b36" strokeDasharray="3 5" vertical={false}/><XAxis dataKey="name" tick={{fill:"#8a96a9",fontSize:11}} axisLine={false} tickLine={false}/><YAxis tick={{fill:"#8a96a9",fontSize:11}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:"#141923",border:"1px solid #30394a",borderRadius:10}}/><Bar dataKey="pnl" name="Average P&L" fill="#7294ff" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div></section></>}
        {tab==="quality" && <><div className="metrics-grid"><Metric label="Readable sources" value={demo?"5":String(Object.keys(tables).length)} sub="Of 5 expected research feeds" icon={Database}/><Metric label="Evidence rows loaded" value={String(evidence.length)} sub="Current query sample" icon={Activity}/><Metric label="Unmapped feeds" value={demo?"0":String(5-Object.keys(tables).length)} sub="Require table / policy review" icon={CircleHelp} tone={demo?"good":"bad"}/><Metric label="Last refresh" value={lastSync?lastSync.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"—"} sub={demo?"Preview timestamp":loading?"Refreshing source":"Last query completion"} icon={Clock3}/></div><section className="panel"><SectionTitle eyebrow="DATA FRESHNESS" title="Source inventory" description="The UI reports only what it can read; missing tables are not treated as zero-valued outcomes."/><div className="source-table">{[
          ["Trade outcomes",tables.trades,"Trades and realized outcomes"],
          ["Council lessons",tables.lessons,"Post-mortems linked to source trade IDs"],
          ["Research evidence",tables.evidence,"Signals, snapshots and evidence provenance"],
          ["V3 benchmark / variants",tables.variants,"Versioned and MTF-aligned cohort observations"],
          ["CMC context",tables.cmc,"Market-cap and macro snapshots; context only"]
        ].map(([name,table,desc],i)=><div className="source-table-row" key={String(name)}><div className="source-table-icon"><Database size={17}/></div><div className="source-table-name"><strong>{name}</strong><span>{desc}</span></div><div className="source-table-mapping">{demo?"Preview fixture":table??"No matching readable table"}</div><span className={`source-state ${demo||table?"ok":"missing"}`}>{demo?"DEMO":table?"READABLE":"UNMAPPED"}</span></div>)}</div>{data.errors.length>0&&!demo&&<div className="error-list">{data.errors.map(e=><p key={e}>{e}</p>)}</div>}</section><section className="panel"><SectionTitle eyebrow="OBSERVATION TIMELINE" title="Latest evidence" description="Each row is a point-in-time observation; future outcomes must not leak into entry context."/><div className="timeline">{evidence.slice(0,12).map((r,i)=><div className="timeline-row" key={r.id??i}><div className="timeline-rail"><span/></div><div className="timeline-time">{formatDate(r.observed_at??r.available_at??r.created_at??r.captured_at)}</div><div className="timeline-main"><strong>{r.source??r.source_name??r.evidence_type??"Research evidence"} <span>· {symbolOf(r)}</span></strong><p>{r.summary??r.description??r.quality_note??"Observation captured; inspect the source record for full provenance."}</p></div><span className="state-tag neutral">{r.quality??r.status??"Observed"}</span></div>)}{evidence.length===0&&<EmptyState title="No evidence rows readable" text="Connect a source table with SELECT access to populate the timeline."/>}</div></section></>}
        {tab==="memory" && <><div className="memory-intro"><div className="memory-art"><BrainCircuit size={31}/><Sparkles size={17}/></div><div><div className="eyebrow">COMPOUNDING RESEARCH KNOWLEDGE</div><h2>Lessons are evidence, not commands.</h2><p>Store post-mortems with source trade IDs, preserve uncertainty, and require repeated out-of-sample support before a hypothesis can influence a strategy.</p></div></div><div className="metrics-grid"><Metric label="Lessons available" value={String(lessons.length)} sub={demo?"Illustrative preview rows":"Loaded lesson rows"} icon={BookOpen}/><Metric label="Linked evidence" value={demo?"3":String(lessons.filter(r=>r.source_trade_id).length)} sub="Lessons with source_trade_id" icon={GitBranch}/><Metric label="Strategy auto-changes" value="0" sub="Not supported by this app" icon={ShieldCheck}/><Metric label="Knowledge status" value="Auditable" sub="Source-linked when available" icon={BrainCircuit}/></div><section className="panel"><SectionTitle eyebrow="COUNCIL / RESEARCH MEMORY" title="Latest post-mortems" description="Each lesson is displayed as recorded. Rule-based fallbacks and AI-generated lessons should remain distinguishable."/><div className="memory-list">{lessons.map((l,i)=><article className="memory-card" key={l.id??i}><div className="memory-card-top"><div className={`lesson-outcome ${String(l.outcome??l.verdict).toLowerCase().includes("win")?"win":"loss"}`}>{String(l.outcome??l.verdict??"?").slice(0,1).toUpperCase()}</div><div className="memory-title"><strong>{symbolOf(l)} <span className="state-tag neutral">{l.lesson_type??l.source??"Post-mortem"}</span></strong><small>{formatDate(l.created_at??l.observed_at)} {l.source_trade_id? `· trade ${String(l.source_trade_id).slice(0,8)}`:""}</small></div><span className={`outcome-label ${String(l.outcome??l.verdict).toLowerCase().includes("win")?"good":"bad"}`}>{l.outcome??l.verdict??"unclassified"}</span></div><p>{l.lesson??l.summary??l.content??"Lesson text is not available in this source row."}</p><div className="memory-card-foot"><span><Database size={13}/> Source-linked record</span><span><ShieldCheck size={13}/> No automatic strategy change</span></div></article>)}{lessons.length===0&&<EmptyState title="No lessons available" text="No rows were returned from the configured Council Lessons table."/>}</div></section><section className="panel"><SectionTitle eyebrow="KNOWLEDGE GOVERNANCE" title="Promotion gates" description="The Observatory makes the research process visible; it does not promote findings automatically."/><div className="promotion-grid"><div><span className="promotion-number">01</span><strong>Evidence quality</strong><p>Check timestamps, source IDs, missingness and duplicate keys.</p></div><div><span className="promotion-number">02</span><strong>Repeated support</strong><p>Require comparable samples and adequate sample size.</p></div><div><span className="promotion-number">03</span><strong>Out-of-sample validation</strong><p>Validate chronologically without using future labels as entry inputs.</p></div><div><span className="promotion-number">04</span><strong>Human review</strong><p>Keep strategy changes separate and explicitly approved.</p></div></div></section></>}
        <section className="panel"><SectionTitle eyebrow="READ-ONLY ARCHIVE" title="Archive Inventory" description="Aggregates only · no archive payload values exposed."/><div className="source-status-note"><Database size={16}/><span>{data.archiveDocumentCount !== null ? `Archive connected · ${data.archiveDocumentCount.toLocaleString()} documents · verified ${formatDate(data.archiveGeneratedAt)}` : "Connection not verified"}</span></div>{data.archiveCategoryError && <p className="muted">{data.archiveCategoryError}</p>}<div className="table-scroll"><table><thead><tr><th>ARCHIVE CATEGORY</th><th>DOCUMENTS</th><th>DECLARED SOURCE ROWS (MAX)</th><th>DECLARED BATCH RECORDS</th><th>LAST ARCHIVED</th></tr></thead><tbody>{data.archiveCategories.slice(0,12).map((r,i)=><tr key={r.record_type ?? i}><td>{r.record_type}</td><td>{num(r.document_count).toLocaleString()}</td><td>{num(r.snapshot_rows_declared_max).toLocaleString()}</td><td>{num(r.batch_records_declared).toLocaleString()}</td><td>{formatDate(r.latest_created_at)}</td></tr>)}</tbody></table></div></section>
        <footer className="app-footer"><span>INTELLIGENT RESEARCH OBSERVATORY <span>·</span> v0.1.0</span><span><ShieldCheck size={13}/> Read-only dashboard <span>·</span> No execution pathways</span></footer>
      </div>
    </main>
  </div>;
}