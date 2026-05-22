'use client';

import { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

type Status = 'active' | 'resolved' | 'scheduled';
type Tab = 'clusters' | 'daily' | 'resolved' | 'intensity';

interface Report {
  id: string;
  intensity: number;
  lat: number;
  lng: number;
  timestamp: string;
  resolved: boolean;
}

interface Cluster {
  id: string;
  street: string;
  severity: number;
  hits: number;
  status: Status;
  reports: Report[];
}

const CLUSTERS: Cluster[] = [
  {
    id: '1', street: "O'Connell Street", severity: 9.2, hits: 847, status: 'active',
    reports: [
      { id: 'r1', intensity: 9.8, lat: 53.3498, lng: -6.2597, timestamp: '2026-05-22 08:14', resolved: false },
      { id: 'r2', intensity: 9.4, lat: 53.3499, lng: -6.2596, timestamp: '2026-05-22 07:52', resolved: false },
      { id: 'r3', intensity: 8.9, lat: 53.3497, lng: -6.2598, timestamp: '2026-05-21 18:33', resolved: false },
      { id: 'r4', intensity: 8.7, lat: 53.3498, lng: -6.2597, timestamp: '2026-05-21 12:05', resolved: false },
      { id: 'r5', intensity: 7.2, lat: 53.3500, lng: -6.2595, timestamp: '2026-05-20 09:17', resolved: false },
    ],
  },
  {
    id: '2', street: 'Dame Street', severity: 8.7, hits: 623, status: 'active',
    reports: [
      { id: 'r6', intensity: 9.1, lat: 53.3441, lng: -6.2672, timestamp: '2026-05-22 09:30', resolved: false },
      { id: 'r7', intensity: 8.8, lat: 53.3442, lng: -6.2671, timestamp: '2026-05-22 06:45', resolved: false },
      { id: 'r8', intensity: 8.3, lat: 53.3440, lng: -6.2673, timestamp: '2026-05-21 15:22', resolved: false },
      { id: 'r9', intensity: 7.9, lat: 53.3441, lng: -6.2672, timestamp: '2026-05-20 11:08', resolved: false },
    ],
  },
  {
    id: '3', street: 'Grafton Street', severity: 7.9, hits: 511, status: 'scheduled',
    reports: [
      { id: 'r10', intensity: 8.2, lat: 53.3401, lng: -6.2591, timestamp: '2026-05-21 14:17', resolved: false },
      { id: 'r11', intensity: 7.8, lat: 53.3402, lng: -6.2590, timestamp: '2026-05-21 10:33', resolved: false },
      { id: 'r12', intensity: 7.5, lat: 53.3400, lng: -6.2592, timestamp: '2026-05-20 16:44', resolved: false },
    ],
  },
  {
    id: '4', street: 'Dorset Street', severity: 7.1, hits: 390, status: 'active',
    reports: [
      { id: 'r13', intensity: 7.6, lat: 53.3576, lng: -6.2651, timestamp: '2026-05-22 07:12', resolved: false },
      { id: 'r14', intensity: 7.2, lat: 53.3577, lng: -6.2650, timestamp: '2026-05-21 19:05', resolved: false },
      { id: 'r15', intensity: 6.8, lat: 53.3575, lng: -6.2652, timestamp: '2026-05-21 08:29', resolved: false },
    ],
  },
  {
    id: '5', street: 'Thomas Street', severity: 6.4, hits: 274, status: 'resolved',
    reports: [
      { id: 'r16', intensity: 7.0, lat: 53.3427, lng: -6.2827, timestamp: '2026-05-15 11:30', resolved: true },
      { id: 'r17', intensity: 6.5, lat: 53.3428, lng: -6.2826, timestamp: '2026-05-14 14:22', resolved: true },
    ],
  },
  {
    id: '6', street: 'Pearse Street', severity: 5.8, hits: 198, status: 'active',
    reports: [
      { id: 'r18', intensity: 6.2, lat: 53.3457, lng: -6.2497, timestamp: '2026-05-22 10:15', resolved: false },
      { id: 'r19', intensity: 5.9, lat: 53.3458, lng: -6.2496, timestamp: '2026-05-21 16:40', resolved: false },
    ],
  },
];

const DAILY_DATA = [
  { day: 'May 9',  reports: 23 }, { day: 'May 10', reports: 31 },
  { day: 'May 11', reports: 18 }, { day: 'May 12', reports: 42 },
  { day: 'May 13', reports: 37 }, { day: 'May 14', reports: 28 },
  { day: 'May 15', reports: 15 }, { day: 'May 16', reports: 33 },
  { day: 'May 17', reports: 45 }, { day: 'May 18', reports: 52 },
  { day: 'May 19', reports: 38 }, { day: 'May 20', reports: 29 },
  { day: 'May 21', reports: 61 }, { day: 'May 22', reports: 44 },
];

const WEEKLY_RESOLVED  = [
  { period: 'Week 1', resolved: 3 }, { period: 'Week 2', resolved: 5 },
  { period: 'Week 3', resolved: 2 }, { period: 'Week 4', resolved: 7 },
  { period: 'Week 5', resolved: 4 }, { period: 'Week 6', resolved: 8 },
  { period: 'Week 7', resolved: 6 }, { period: 'Week 8', resolved: 9 },
];

const MONTHLY_RESOLVED = [
  { period: 'Jan', resolved: 12 }, { period: 'Feb', resolved: 8  },
  { period: 'Mar', resolved: 15 }, { period: 'Apr', resolved: 19 },
  { period: 'May', resolved: 34 },
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
  if (score >= 8) return 'text-red-400';
  if (score >= 6) return 'text-amber-400';
  return 'text-green-400';
}

function statusBadge(status: Status) {
  const base = 'text-xs px-2 py-0.5 rounded font-medium';
  if (status === 'active')   return `${base} bg-red-900/40 text-red-400`;
  if (status === 'resolved') return `${base} bg-green-900/40 text-green-400`;
  return `${base} bg-amber-900/40 text-amber-400`;
}

function ClustersTab({ minIntensity }: { minIntensity: number }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const filtered = CLUSTERS.filter(c => c.severity >= minIntensity);

  return (
    <div className="divide-y divide-zinc-800">
      {filtered.map(cluster => (
        <div key={cluster.id}>
          <button
            onClick={() => setExpanded(expanded === cluster.id ? null : cluster.id)}
            className="w-full flex items-center gap-4 px-6 py-4 hover:bg-zinc-900 transition-colors text-left"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-0.5">
                <span className="text-sm font-medium text-white">{cluster.street}</span>
                <span className={statusBadge(cluster.status)}>{cluster.status}</span>
              </div>
              <span className="text-xs text-zinc-400">
                {cluster.hits} hits · {cluster.reports.length} unique events
              </span>
            </div>
            <div className="text-right mr-4">
              <span className={`text-lg font-semibold ${severityColor(cluster.severity)}`}>
                {cluster.severity.toFixed(1)}
              </span>
              <p className="text-xs text-zinc-500">severity</p>
            </div>
            <span className="text-zinc-500 text-xs">{expanded === cluster.id ? '▲' : '▼'}</span>
          </button>

          {expanded === cluster.id && (
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
                  {[...cluster.reports]
                    .sort((a, b) => b.intensity - a.intensity)
                    .map(report => (
                      <tr key={report.id} className="hover:bg-zinc-900/50">
                        <td className="px-6 py-2.5">
                          <span className={`font-semibold ${severityColor(report.intensity)}`}>
                            {report.intensity.toFixed(1)}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs text-zinc-300">
                          {report.lat.toFixed(4)}, {report.lng.toFixed(4)}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-zinc-400">{report.timestamp}</td>
                        <td className="px-4 py-2.5 text-xs">
                          <span className={report.resolved ? 'text-green-400' : 'text-zinc-500'}>
                            {report.resolved ? 'Resolved' : 'Open'}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
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

function ResolvedTab() {
  const [view, setView] = useState<'weekly' | 'monthly'>('weekly');
  const data = view === 'weekly' ? WEEKLY_RESOLVED : MONTHLY_RESOLVED;

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
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="period" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip {...TOOLTIP_STYLE} itemStyle={{ color: '#4ade80' }} />
          <Bar dataKey="resolved" fill="#4ade80" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function IntensityTab() {
  const [min, setMin] = useState(0);
  const filtered = CLUSTERS.filter(c => c.severity >= min);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-medium text-white mb-1">Intensity distribution</h3>
          <p className="text-xs text-zinc-400">Report count by severity range</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400">
            Min: <span className="text-white font-medium">{min.toFixed(1)}</span>
          </span>
          <input
            type="range" min="0" max="9" step="0.5" value={min}
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
          Clusters above {min.toFixed(1)} — {filtered.length} results
        </h4>
        <div className="divide-y divide-zinc-800 border border-zinc-800 rounded-lg overflow-hidden">
          {filtered.map(c => (
            <div key={c.id} className="flex items-center justify-between px-4 py-3 bg-zinc-900/30 hover:bg-zinc-900">
              <span className="text-sm text-white">{c.street}</span>
              <div className="flex items-center gap-4">
                <span className="text-xs text-zinc-400">{c.hits} hits</span>
                <span className={`text-sm font-semibold ${severityColor(c.severity)}`}>
                  {c.severity.toFixed(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'clusters',  label: 'Clusters'       },
  { id: 'daily',     label: 'Reports per day' },
  { id: 'resolved',  label: 'Resolved'        },
  { id: 'intensity', label: 'Intensity'       },
];

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('clusters');
  const [minIntensity, setMinIntensity] = useState(0);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-6 pt-6 border-b border-zinc-800">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-lg font-semibold text-white">Reports</h1>
            <p className="text-sm text-zinc-400 mt-0.5">
              Dublin City Council · {CLUSTERS.length} clusters
            </p>
          </div>
          {tab === 'clusters' && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-400">Min severity</span>
              <input
                type="range" min="0" max="9" step="0.5" value={minIntensity}
                onChange={e => setMinIntensity(parseFloat(e.target.value))}
                className="w-28 accent-red-400"
              />
              <span className="text-xs text-white font-medium w-6">{minIntensity.toFixed(1)}</span>
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
        {tab === 'clusters'  && <ClustersTab minIntensity={minIntensity} />}
        {tab === 'daily'     && <DailyTab />}
        {tab === 'resolved'  && <ResolvedTab />}
        {tab === 'intensity' && <IntensityTab />}
      </div>
    </div>
  );
}