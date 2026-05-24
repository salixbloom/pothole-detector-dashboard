'use client';

import { useState } from 'react';
import Link from 'next/link';
import { makeSubReports, avgIntensity, type Pothole } from '@/lib/mock-potholes';
import { severityColor, statusBadge, mapLink } from './shared';

export function ClustersTab({ potholes, minSeverity }: { potholes: Pothole[]; minSeverity: number }) {
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
