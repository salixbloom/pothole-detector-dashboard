'use client';

import { useState, useEffect, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie,
} from 'recharts';
import { fetchMonitoringLive, fetchMonitoringHistory, type LiveMetrics, type HistorySnapshot } from '@/lib/api';
import { TOOLTIP_STYLE } from './shared';

const LIVE_POLL_MS = 30_000;

const HANDLED_LIVE_KEYS = new Set([
  'captured_at', 'timestamp', 'time', 'captured_timestamp',
  'cpu_percent', 'cpu', 'cpu_usage',
  'memory_percent', 'memory', 'memory_usage',
  'db_memory_used', 'db_memory', 'database_memory', 'database_memory_used',
  'total_memory', 'memory_total', 'memory_limit',
  'queue_pending', 'pending_queue', 'pending', 'queue_depth',
  'dlq', 'dlq_count', 'dead_letter_queue', 'dlq_pending',
  'events_processed', 'processed', 'processed_events',
  'events_failed', 'failed', 'failed_events',
  'events_rejected', 'rejected', 'rejected_events',
]);

const CHART_COLORS = ['#60a5fa', '#f87171', '#4ade80', '#fb923c', '#a78bfa', '#facc15', '#34d399', '#f472b6'];

function pickField<T>(obj: Record<string, unknown>, ...keys: string[]): T | null {
  for (const k of keys) {
    if (k in obj && obj[k] != null) return obj[k] as T;
  }
  return null;
}

function gaugeColor(pct: number): string {
  if (pct >= 0.8) return '#f87171';
  if (pct >= 0.5) return '#fb923c';
  return '#4ade80';
}

function formatMetricValue(v: unknown): string {
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(2);
  if (typeof v === 'string') return v;
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  return '—';
}

function histTimeLabel(snapshots: HistorySnapshot[]): string {
  if (snapshots.length === 0) return '';
  const times = snapshots
    .map(s => s.timestamp ? new Date(s.timestamp as string).getTime() : null)
    .filter((t): t is number => t !== null);
  if (times.length < 2) return `${snapshots.length} snapshot${snapshots.length === 1 ? '' : 's'}`;
  const spanMs = Math.max(...times) - Math.min(...times);
  const spanMins = Math.round(spanMs / 60000);
  if (spanMins < 60) return `last ${spanMins} min`;
  const spanHours = parseFloat((spanMs / 3600000).toFixed(1));
  return `last ${spanHours} h`;
}

function LiveTimestamp({ lastFetchedAt, onReconnect }: {
  lastFetchedAt: number | null;
  onReconnect: () => void;
}) {
  const [secondsAgo, setSecondsAgo] = useState<number | null>(null);

  useEffect(() => {
    if (lastFetchedAt === null) return;
    const tick = () => setSecondsAgo(Math.floor((Date.now() - lastFetchedAt) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lastFetchedAt]);

  if (secondsAgo === null) return null;

  if (secondsAgo >= 300) {
    return (
      <button
        onClick={onReconnect}
        className="text-xs text-red-400 hover:text-red-300 transition-colors"
      >
        Last attempt failed — reconnect
      </button>
    );
  }

  const label = secondsAgo < 60
    ? `${secondsAgo}s ago`
    : `${Math.floor(secondsAgo / 60)}m ${secondsAgo % 60}s ago`;

  return <span className="text-xs text-zinc-500">{label}</span>;
}

function GaugeChart({ label, value, max = 100, sub }: { label: string; value: number; max?: number; sub?: string }) {
  const pct = Math.min(Math.max(value / max, 0), 1);
  const color = gaugeColor(pct);
  const data = [
    { v: pct,     fill: color      },
    { v: 1 - pct, fill: '#3f3f46' },
  ];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex flex-col items-center">
      <p className="text-xs text-zinc-500 mb-2 self-start">{label}</p>
      <div className="relative overflow-hidden" style={{ width: 168, height: 90 }}>
        <PieChart width={180} height={160}>
          <Pie
            data={data}
            cx={80}
            cy={90}
            startAngle={180}
            endAngle={0}
            innerRadius={60}
            outerRadius={80}
            dataKey="v"
            strokeWidth={0}
          />
        </PieChart>
        <div className="absolute bottom-0 inset-x-0 flex justify-center">
          <span className="text-xl font-bold text-white">{value.toFixed(1)}%</span>
        </div>
      </div>
      {sub && <p className="text-xs text-zinc-500 mt-2 text-center">{sub}</p>}
    </div>
  );
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-5 py-4">
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className="text-xl font-semibold text-white">{value}</p>
      {sub && <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function PipelineStats({ processed, failed, rejected, queuePending, dlq }: {
  processed: number | null;
  failed: number | null;
  rejected: number | null;
  queuePending: number | null;
  dlq: number | null;
}) {
  const total = (processed ?? 0) + (failed ?? 0) + (rejected ?? 0);
  const successRate = total > 0 ? ((processed ?? 0) / total * 100).toFixed(1) : null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">Event pipeline</p>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-2xl font-semibold text-green-400">{processed ?? '—'}</p>
          <p className="text-xs text-zinc-500 mt-0.5">processed</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-semibold text-red-400">{failed ?? '—'}</p>
          <p className="text-xs text-zinc-500 mt-0.5">failed</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-semibold text-amber-400">{rejected ?? '—'}</p>
          <p className="text-xs text-zinc-500 mt-0.5">rejected</p>
        </div>
      </div>

      {total > 0 && (
        <div className="flex h-1.5 rounded-full overflow-hidden mb-4">
          <div className="bg-green-500 transition-all" style={{ width: `${(processed ?? 0) / total * 100}%` }} />
          <div className="bg-red-500 transition-all"   style={{ width: `${(failed   ?? 0) / total * 100}%` }} />
          <div className="bg-amber-500 transition-all" style={{ width: `${(rejected ?? 0) / total * 100}%` }} />
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 text-xs border-t border-zinc-800 pt-3">
        <span className="text-zinc-500 text-center">
          Success rate{' '}
          <span className="text-white font-medium">{successRate !== null ? `${successRate}%` : '—'}</span>
        </span>
        <span className="text-zinc-500 text-center">
          Queue{' '}
          <span className="text-white font-medium">{queuePending ?? '—'}</span>
        </span>
        <span className="text-zinc-500 text-center">
          DLQ{' '}
          <span className={`font-medium ${(dlq ?? 0) > 0 ? 'text-red-400' : 'text-white'}`}>
            {dlq ?? '—'}
          </span>
        </span>
      </div>
    </div>
  );
}

function MetricChart({
  metricKey,
  data,
  color,
  timeLabel,
  snapshotCount,
}: {
  metricKey: string;
  data: { t: string; value: number }[];
  color: string;
  timeLabel: string;
  snapshotCount: number;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <h4 className="text-sm font-medium text-white capitalize">{metricKey.replace(/_/g, ' ')}</h4>
        <span className="text-xs text-zinc-500">{timeLabel}</span>
      </div>
      <p className="text-xs text-zinc-500 mb-3">
        {snapshotCount} snapshot{snapshotCount === 1 ? '' : 's'} · 15-min intervals
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="t" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
          <Tooltip {...TOOLTIP_STYLE} itemStyle={{ color }} />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: color }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SystemTab() {
  const [live, setLive] = useState<LiveMetrics | null>(null);
  const [history, setHistory] = useState<HistorySnapshot[]>([]);
  const [liveError, setLiveError] = useState('');
  const [histError, setHistError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [selectedKey, setSelectedKey] = useState('');
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);

  const pollRef = useRef<() => void>(() => {});

  useEffect(() => {
    function poll() {
      fetchMonitoringLive()
        .then(data => { setLive(data); setLiveError(''); setLastFetchedAt(Date.now()); })
        .catch(() => setLiveError('Server unreachable'));
    }
    pollRef.current = poll;
    poll();

    fetchMonitoringHistory(24)
      .then(data => {
        setHistory(data);
        if (data.length > 0) {
          const first = Object.keys(data[0]).find(k => k !== 'timestamp' && typeof data[0][k] === 'number');
          if (first) setSelectedKey(first);
        }
      })
      .catch(() => setHistError('Could not load history'))
      .finally(() => setLoading(false));

    const id = setInterval(poll, LIVE_POLL_MS);
    return () => clearInterval(id);
  }, []);

  const L = (live ?? {}) as Record<string, unknown>;
  const cpuPct       = pickField<number>(L, 'cpu_percent');
  const memPct       = pickField<number>(L, 'memory_percent');
  const dbMemUsed    = pickField<number>(L, 'db_size_mb');
  const totalMem     = pickField<number>(L, 'memory_used_mb');
  const processed    = pickField<number>(L, 'events_processed');
  const failed       = pickField<number>(L, 'events_failed');
  const rejected     = pickField<number>(L, 'events_rejected');
  const queuePending = pickField<number>(L, 'queue_pending');
  const dlq          = pickField<number>(L, 'queue_dead_letter');

  const memSub = dbMemUsed !== null
    ? totalMem !== null && memPct != null
      ? `Memory: ${formatMetricValue(totalMem)} / ${formatMetricValue(totalMem / memPct)} total`
      : `Memory: ${formatMetricValue(totalMem)}`
    : undefined;

  const hasGauges   = cpuPct !== null || memPct !== null;
  const hasPipeline = [processed, failed, rejected, queuePending, dlq].some(v => v !== null);

  const residualCards = live
    ? Object.entries(live).filter(([k, v]) => !HANDLED_LIVE_KEYS.has(k) && typeof v !== 'object')
    : [];

  const metricKeys = history.length > 0
    ? Object.keys(history[0]).filter(k => k !== 'timestamp' && typeof history[0][k] === 'number')
    : [];

  const displayHistory = history.length > 120
    ? history.filter((_, i) => i % Math.ceil(history.length / 120) === 0)
    : history;

  const timeLabel = histTimeLabel(displayHistory);

  function chartData(key: string) {
    return displayHistory.map(s => {
      let t = '—';
      if (s.timestamp) {
        const d = new Date(s.timestamp as string);
        if (!isNaN(d.getTime())) {
          t = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        }
      }
      return { t, value: s[key] as number };
    });
  }

  return (
    <div className="p-6 space-y-8">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">Live system metrics</h3>
          <LiveTimestamp lastFetchedAt={lastFetchedAt} onReconnect={() => pollRef.current()} />
        </div>

        {loading && <p className="text-xs text-zinc-500">Loading…</p>}
        {liveError && <p className="text-xs text-red-400">{liveError}</p>}

        {hasGauges && (
          <div className="grid grid-cols-2 gap-3">
            {cpuPct !== null && <GaugeChart label="CPU"    value={cpuPct} />}
            {memPct !== null && <GaugeChart label="Memory" value={memPct*100} sub={memSub} />}
          </div>
        )}

        {hasPipeline && (
          <PipelineStats
            processed={processed}
            failed={failed}
            rejected={rejected}
            queuePending={queuePending}
            dlq={dlq}
          />
        )}

        {residualCards.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {residualCards.map(([key, val]) => (
              <MetricCard
                key={key}
                label={key.replace(/_/g, ' ')}
                value={formatMetricValue(val)}
              />
            ))}
          </div>
        )}
      </div>

      {metricKeys.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-white">History</h3>
            {!showAll && metricKeys.length > 1 && (
              <select
                value={selectedKey}
                onChange={e => setSelectedKey(e.target.value)}
                className="text-xs bg-zinc-900 border border-zinc-700 text-white rounded px-2 py-1.5 focus:outline-none focus:border-zinc-500"
              >
                {metricKeys.map(k => (
                  <option key={k} value={k}>{k.replace(/_/g, ' ')}</option>
                ))}
              </select>
            )}
          </div>

          {histError && <p className="text-xs text-red-400 mb-3">{histError}</p>}

          {showAll ? (
            <div className="grid grid-cols-2 gap-6">
              {metricKeys.map((k, i) => (
                <MetricChart
                  key={k}
                  metricKey={k}
                  data={chartData(k)}
                  color={CHART_COLORS[i % CHART_COLORS.length]}
                  timeLabel={timeLabel}
                  snapshotCount={displayHistory.length}
                />
              ))}
            </div>
          ) : (
            selectedKey && (
              <MetricChart
                metricKey={selectedKey}
                data={chartData(selectedKey)}
                color={CHART_COLORS[metricKeys.indexOf(selectedKey) % CHART_COLORS.length]}
                timeLabel={timeLabel}
                snapshotCount={displayHistory.length}
              />
            )
          )}

          {metricKeys.length > 1 && (
            <button
              onClick={() => setShowAll(v => !v)}
              className="mt-6 text-xs text-zinc-400 hover:text-white transition-colors underline underline-offset-2"
            >
              {showAll ? 'Hide all' : `Show all ${metricKeys.length} metrics`}
            </button>
          )}
        </div>
      )}

      {!loading && metricKeys.length === 0 && !histError && (
        <p className="text-xs text-zinc-500">No history snapshots available yet.</p>
      )}
    </div>
  );
}
