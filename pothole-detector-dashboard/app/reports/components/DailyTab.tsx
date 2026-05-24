'use client';

import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { TOOLTIP_STYLE } from './shared';

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

export function DailyTab() {
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
