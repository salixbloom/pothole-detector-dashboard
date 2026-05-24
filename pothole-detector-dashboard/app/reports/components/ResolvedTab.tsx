'use client';

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { Pothole } from '@/lib/mock-potholes';
import { TOOLTIP_STYLE } from './shared';

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

export function ResolvedTab({ potholes }: { potholes: Pothole[] }) {
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
