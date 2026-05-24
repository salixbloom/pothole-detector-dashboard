'use client';

import { useState, useEffect } from 'react';
import type { Pothole } from '@/lib/mock-potholes';
import { fetchPotholes } from '@/lib/api';
import { ClustersTab }  from './components/ClustersTab';
import { DailyTab }     from './components/DailyTab';
import { ResolvedTab }  from './components/ResolvedTab';
import { IntensityTab } from './components/IntensityTab';
import { SystemTab }    from './components/SystemTab';

type Tab = 'clusters' | 'daily' | 'resolved' | 'intensity' | 'system';

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
