'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { makeSubReports, avgIntensity, type Pothole, type PotholeStatus } from '@/lib/mock-potholes';
import { fetchPotholes, fetchMonitoringLive, fetchMonitoringHistory, type LiveMetrics, type HistorySnapshot } from '@/lib/api';

type Tab = 'clusters' | 'daily' | 'resolved' | 'intensity' | 'system';

// Hardcoded — no per-day breakdown endpoint exists yet
const DAILY_DATA = [
  { day: 'May 9',  reports: 23 }, { day: 'May 10', reports: 31 },
  { day: 'May 11', reports: 18 }, { day: 'May 12', reports: 42 },
  { day: 'May 13', reports: 37 }, { day: 'May 14', reports: 28 },
  { day: 'May 15', reports: 15 }, { day: 'May 16', reports: 33 },
  { day: 'May 17', reports: 45 }, { day: 'May 18', reports: 52 },
  { day: 'May 19', reports: 38 }, { day: 'May 20', reports: 29 },
  { day: 'May 21', reports: 61 }, { day: 'May 22', reports: 44 },
];

const INTENSITY_DIST = [
  { range: '1–2', count: 4  }, { range: '2–3', count: 11 },
  { range: '3–4', count: 18 }, { range: '4–5', count: 27 },
  { range: '5–6', count: 34 }, { range: '6–7', count: 29 },
  { range: '7–8', count: 41 }, { range: '8–9', count: 38 },
  { range: '9–10', count: 22 },
];

const TOOLTIP_STYLE = {
  contentStyle: { background: '#18181b', border: '1px solid #27272a', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#fff' },
};

function severityColor(score: number) {
  if (score >= 0.8) return 'text-red-400';
  if (score >= 0.6) return 'text-amber-400';
  return 'text-green-400';
}

function statusBadge(status: PotholeStatus) {
  const base = 'text-xs px-2 py-0.5 rounded font-medium';
  if (status === 'active')    return `${base} bg-red-900/40 text-red-400`;
  if (status === 'resolved')  return `${base} bg-green-900/40 text-green-400`;
  return `${base} bg-amber-900/40 text-amber-400`;
}

function mapLink(p: Pothole) {
  return `/dashboard?lat=${p.canonical_lat}&lng=${p.canonical_lng}&id=${p.pothole_id}`;
}

function buildResolvedData(potholes: Pothole[], view: 'weekly' | 'monthly') {
  const resolved = potholes.filter(p => p.status === 'resolved');
  const counts: Record<string, number> = {};

  for (const p of resolved) {
    const d = new Date(p.last_seen);
    const key = view === 'monthly'
      ? d.toLocaleDateString('en-US', { month: 'short' })
      : `Week ${Math.ceil(d.getDate() / 7)} (${d.toLocaleDateString('en-US', { month: 'short' })})`;
    counts[key] = (counts[key] ?? 0) + 1;
  }

  return Object.entries(counts).map(([period, resolved]) => ({ period, resolved }));
}

function ClustersTab({ potholes, minSeverity }: { potholes: Pothole[]; minSeverity: number }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const filtered = potholes.filter(p => p.severity_score >= minSeverity);

  return (
    <div className="divide-y divide-zinc-800">
      {filtered.map(p => {
        const subReports = makeSubReports(p);
        const avg = avgIntensity(p);
        const isOpen = expanded === p.pothole_id;

        return (
          <div key={p.pothole_id}>
            <div className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-900 transition-colors">
              <div
                className="flex-1 cursor-pointer"
                onClick={() => setExpanded(isOpen ? null : p.pothole_id)}
              >
                <div className="flex items-center gap-3 mb-0.5">
                  <span className="text-sm font-medium text-white">{p.street}</span>
                  <span className={statusBadge(p.status)}>{p.status}</span>
                </div>
                <span className="text-xs text-zinc-400">
                  {p.hit_count} hits · since {new Date(p.first_seen).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>

              <div className="text-right mr-2">
                <span className={`text-lg font-semibold ${severityColor(avg / 10)}`}>
                  {avg.toFixed(1)}
                </span>
                <p className="text-xs text-zinc-500">avg intensity</p>
              </div>

              <Link
                href={mapLink(p)}
                className="text-xs text-zinc-500 hover:text-red-400 transition-colors shrink-0"
                title="Jump to this location on the map"
              >
                View on map →
              </Link>

              <span
                className="text-zinc-500 text-xs cursor-pointer pl-1"
                onClick={() => setExpanded(isOpen ? null : p.pothole_id)}
              >
                {isOpen ? '▲' : '▼'}
              </span>
            </div>

            {isOpen && (
              <div className="bg-zinc-900/50 border-t border-zinc-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-zinc-500 border-b border-zinc-800">
                      <th className="text-left px-6 py-2 font-medium">Intensity</th>
                      <th className="text-left px-4 py-2 font-medium">GPS</th>
                      <th className="text-left px-4 py-2 font-medium">Time</th>
                      <th className="text-left px-4 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {[...subReports]
                      .sort((a, b) => b.intensity - a.intensity)
                      .map(r => (
                        <tr key={r.id} className="hover:bg-zinc-900/50">
                          <td className="px-6 py-2.5">
                            <span className={`font-semibold ${severityColor(r.intensity / 10)}`}>
                              {r.intensity.toFixed(1)}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-mono text-xs text-zinc-300">
                            {r.lat.toFixed(4)}, {r.lng.toFixed(4)}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-zinc-400">{r.timestamp}</td>
                          <td className="px-4 py-2.5 text-xs">
                            <span className={r.resolved ? 'text-green-400' : 'text-zinc-500'}>
                              {r.resolved ? 'Resolved' : 'Open'}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DailyTab() {
  return (
    <div className="p-6">
      <h3 className="text-sm font-medium text-white mb-1">Reports per day</h3>
      <p className="text-xs text-zinc-400 mb-6">Last 14 days across all clusters</p>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={DAILY_DATA}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="day" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip {...TOOLTIP_STYLE} itemStyle={{ color: '#f87171' }} />
          <Line
            type="monotone" dataKey="reports" stroke="#f87171"
            strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#f87171' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ResolvedTab({ potholes }: { potholes: Pothole[] }) {
  const [view, setView] = useState<'weekly' | 'monthly'>('weekly');
  const data = buildResolvedData(potholes, view);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-medium text-white mb-1">Potholes resolved</h3>
          <p className="text-xs text-zinc-400">Repair completion over time</p>
        </div>
        <div className="flex gap-1 bg-zinc-900 rounded-lg p-1">
          {(['weekly', 'monthly'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                view === v ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>
      {data.length === 0 ? (
        <p className="text-xs text-zinc-500 text-center py-16">No resolved potholes in current data</p>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="period" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip {...TOOLTIP_STYLE} itemStyle={{ color: '#4ade80' }} />
            <Bar dataKey="resolved" fill="#4ade80" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function IntensityTab({ potholes }: { potholes: Pothole[] }) {
  const [min, setMin] = useState(0);
  const filtered = potholes.filter(p => p.severity_score >= min);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-medium text-white mb-1">Intensity distribution</h3>
          <p className="text-xs text-zinc-400">Report count by severity range</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400">
            Min: <span className="text-white font-medium">{(min * 10).toFixed(1)}</span>
          </span>
          <input
            type="range" min="0" max="0.95" step="0.05" value={min}
            onChange={e => setMin(parseFloat(e.target.value))}
            className="w-32 accent-red-400"
          />
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={INTENSITY_DIST}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="range" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip {...TOOLTIP_STYLE} itemStyle={{ color: '#fb923c' }} />
          <Bar dataKey="count" fill="#fb923c" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-8">
        <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
          Clusters above {(min * 10).toFixed(1)} — {filtered.length} results
        </h4>
        <div className="divide-y divide-zinc-800 border border-zinc-800 rounded-lg overflow-hidden">
          {filtered.map(p => (
            <div key={p.pothole_id} className="flex items-center justify-between px-4 py-3 bg-zinc-900/30 hover:bg-zinc-900">
              <span className="text-sm text-white">{p.street}</span>
              <div className="flex items-center gap-4">
                <span className="text-xs text-zinc-400">{p.hit_count} hits</span>
                <span className={`text-sm font-semibold ${severityColor(p.severity_score)}`}>
                  {(p.severity_score * 10).toFixed(1)}
                </span>
                <Link
                  href={mapLink(p)}
                  className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
                >
                  Map →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
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

const CHART_COLORS = ['#60a5fa', '#f87171', '#4ade80', '#fb923c', '#a78bfa', '#facc15', '#34d399', '#f472b6'];

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

function SystemTab() {
  const [live, setLive] = useState<LiveMetrics | null>(null);
  const [history, setHistory] = useState<HistorySnapshot[]>([]);
  const [liveError, setLiveError] = useState('');
  const [histError, setHistError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [selectedKey, setSelectedKey] = useState('');

  useEffect(() => {
    const p1 = fetchMonitoringLive()
      .then(setLive)
      .catch(() => setLiveError('Could not load live metrics'));

    const p2 = fetchMonitoringHistory(24)
      .then(data => {
        setHistory(data);
        if (data.length > 0) {
          const first = Object.keys(data[0]).find(k => k !== 'timestamp' && typeof data[0][k] === 'number');
          if (first) setSelectedKey(first);
        }
      })
      .catch(() => setHistError('Could not load history'));

    Promise.allSettled([p1, p2]).finally(() => setLoading(false));
  }, []);

  const metricKeys = history.length > 0
    ? Object.keys(history[0]).filter(k => k !== 'timestamp' && typeof history[0][k] === 'number')
    : [];

  const timeLabel = histTimeLabel(history);

  function chartData(key: string) {
    return history.map(s => {
      let t = '—';
      if (s.timestamp) {
        const d = new Date(s.timestamp as string);
        t = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      }
      return { t, value: s[key] as number };
    });
  }

  const liveCards = live
    ? Object.entries(live).filter(([, v]) => typeof v !== 'object')
    : [];

  return (
    <div className="p-6 space-y-8">
      {/* Live metrics */}
      <div>
        <h3 className="text-sm font-medium text-white mb-1">Live system metrics</h3>
        <p className="text-xs text-zinc-400 mb-4">Current snapshot from the backend</p>

        {loading && <p className="text-xs text-zinc-500">Loading…</p>}
        {liveError && <p className="text-xs text-red-400">{liveError}</p>}

        {liveCards.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {liveCards.map(([key, val]) => (
              <MetricCard
                key={key}
                label={key.replace(/_/g, ' ')}
                value={formatMetricValue(val)}
              />
            ))}
          </div>
        )}
      </div>

      {/* History charts */}
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
            <div className="space-y-10">
              {metricKeys.map((k, i) => (
                <MetricChart
                  key={k}
                  metricKey={k}
                  data={chartData(k)}
                  color={CHART_COLORS[i % CHART_COLORS.length]}
                  timeLabel={timeLabel}
                  snapshotCount={history.length}
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
                snapshotCount={history.length}
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

const TABS: { id: Tab; label: string }[] = [
  { id: 'clusters',  label: 'Clusters'       },
  { id: 'daily',     label: 'Reports per day' },
  { id: 'resolved',  label: 'Resolved'        },
  { id: 'intensity', label: 'Intensity'       },
  { id: 'system',    label: 'System'          },
];

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('clusters');
  const [minSeverity, setMinSeverity] = useState(0);

  const [potholes, setPotholes] = useState<Pothole[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    fetchPotholes({ limit: 500 })
      .then(setPotholes)
      .catch(() => setFetchError('Could not load pothole data'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-6 pt-6 border-b border-zinc-800">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-lg font-semibold text-white">Reports</h1>
            <p className="text-sm text-zinc-400 mt-0.5">
              {loading ? 'Loading…' : fetchError ? fetchError : `${potholes.length} clusters`}
            </p>
          </div>
          {tab === 'clusters' && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-400">Min severity</span>
              <input
                type="range" min="0" max="0.95" step="0.05" value={minSeverity}
                onChange={e => setMinSeverity(parseFloat(e.target.value))}
                className="w-28 accent-red-400"
              />
              <span className="text-xs text-white font-medium w-8">
                {(minSeverity * 10).toFixed(1)}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm transition-colors border-b-2 -mb-px ${
                tab === t.id
                  ? 'text-white border-red-400'
                  : 'text-zinc-400 border-transparent hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'clusters'  && <ClustersTab potholes={potholes} minSeverity={minSeverity} />}
        {tab === 'daily'     && <DailyTab />}
        {tab === 'resolved'  && <ResolvedTab potholes={potholes} />}
        {tab === 'intensity' && <IntensityTab potholes={potholes} />}
        {tab === 'system'    && <SystemTab />}
      </div>
    </div>
  );
}
