'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { Pothole } from '@/lib/mock-potholes';
import { TOOLTIP_STYLE, severityColor, mapLink } from './shared';

export function IntensityTab({ potholes }: { potholes: Pothole[] }) {
  const [min, setMin] = useState(0);
  const filtered = potholes.filter(p => p.severity_score >= min);

  const buckets = Array(10).fill(0);
  for (const p of potholes) {
    buckets[Math.min(Math.floor(p.severity_score * 10), 9)]++;
  }
  const intensityDist = buckets
    .map((count, i) => ({ range: `${i}–${i + 1}`, count }))
    .filter(d => d.count > 0);

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
        <BarChart data={intensityDist}>
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
