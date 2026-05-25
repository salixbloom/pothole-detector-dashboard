'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { lngLat, type Pothole } from '@/lib/mock-potholes';
import { fetchPotholes } from '@/lib/api';
import type { HeatmapPoint } from '../components/Map';

const PotholeMap = dynamic(() => import('../components/Map'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-zinc-900" />,
});

function priorityColor(score: number) {
  if (score >= 5) return 'text-red-400';
  if (score >= 3) return 'text-amber-400';
  return 'text-green-400';
}

function severityBarColor(score: number) {
  if (score >= 5) return 'bg-red-500';
  if (score >= 3) return 'bg-amber-500';
  return 'bg-green-500';
}

function DashboardContent() {
  const searchParams = useSearchParams();

  const initLat = searchParams.get('lat');
  const initLng = searchParams.get('lng');
  const initId  = searchParams.get('id');

  const [flyToCoords, setFlyToCoords] = useState<[number, number] | null>(
    initLat && initLng ? [parseFloat(initLng), parseFloat(initLat)] : null
  );
  const [selected, setSelected] = useState<string | null>(initId);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const [potholes, setPotholes] = useState<Pothole[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    fetchPotholes({ limit: 500 })
      .then(data => setPotholes([...data].sort((a, b) => (b.hit_count * b.severity_score) - (a.hit_count * a.severity_score))))
      .catch(() => setFetchError('Could not load pothole data'))
      .finally(() => setLoading(false));
  }, []);

  const heatmapPoints: HeatmapPoint[] = potholes.map(p => ({
    pothole_id: p.pothole_id,
    severity_score: p.severity_score,
    coords: lngLat(p),
  }));

  function handleSelect(id: string, coords: [number, number]) {
    setSelected(id);
    setFlyToCoords(coords);
  }

  async function handleCitySearch() {
    const trimmed = query.trim();
    if (!trimmed) return;

    setSearching(true);
    setSearchError('');

    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(trimmed)}.json?access_token=${token}&types=place&limit=1`
      );
      const data = await res.json();
      if (data.features?.length > 0) {
        const [lng, lat] = data.features[0].center as [number, number];
        setFlyToCoords([lng, lat]);
        setSelected(null);
      } else {
        setSearchError('City not found');
      }
    } catch {
      setSearchError('Search failed');
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 relative">
        <PotholeMap flyToCoords={flyToCoords} potholes={heatmapPoints} />

        {/* City search bar */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-80">
          <form onSubmit={(e) => { e.preventDefault(); handleCitySearch(); }} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setSearchError(''); }}
              placeholder="Search for a city…"
              className="flex-1 px-3 py-2 text-sm bg-zinc-900/90 backdrop-blur border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
            />
            <button
              type="submit"
              disabled={searching}
              className="px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded-lg transition-colors"
            >
              {searching ? '…' : 'Go'}
            </button>
          </form>
          {searchError && (
            <p className="mt-1 text-xs text-red-400 text-center">{searchError}</p>
          )}
        </div>
      </div>

      <aside className="w-80 border-l border-zinc-800 bg-zinc-950 overflow-y-auto shrink-0">
        <div className="p-4 border-b border-zinc-800">
          <h2 className="text-sm font-medium text-white">Priority Potholes</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Ranked by priority score</p>
        </div>

        <div className="divide-y divide-zinc-800">
          {loading && (
            <div className="px-4 py-8 text-center">
              <p className="text-xs text-zinc-500">Loading…</p>
            </div>
          )}
          {fetchError && (
            <div className="px-4 py-8 text-center">
              <p className="text-xs text-red-400">{fetchError}</p>
            </div>
          )}
          {!loading && !fetchError && potholes.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-xs text-zinc-500">No potholes found</p>
            </div>
          )}
          {potholes.map((pothole, i) => {
            const priorityScore = pothole.hit_count * (pothole.severity_score * 10);
            const maxSeverity = pothole.severity_score * 10;
            return (
              <button
                key={pothole.pothole_id}
                onClick={() => handleSelect(pothole.pothole_id, lngLat(pothole))}
                className={`w-full text-left px-4 py-3 hover:bg-zinc-900 transition-colors ${
                  selected === pothole.pothole_id ? 'bg-zinc-900' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-zinc-500">#{i + 1}</span>
                  <span className="text-xs text-zinc-500">{pothole.hit_count} hits</span>
                </div>
                <p className="text-sm font-medium text-white mb-2">{pothole.street}</p>

                {/* Priority score — most prominent */}
                <div className="flex items-baseline gap-1.5 mb-3">
                  <span className={`text-2xl font-bold tabular-nums ${priorityColor(priorityScore)}`}>
                    {priorityScore.toFixed(0)}
                  </span>
                  <span className="text-xs text-zinc-500">priority score</span>
                </div>

                {/* Max severity bar */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-zinc-500">Max severity</span>
                    <span className={`text-xs font-medium tabular-nums ${priorityColor(priorityScore)}`}>
                      {maxSeverity.toFixed(1)}<span className="text-zinc-600">/10</span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full opacity-25 ${severityBarColor(priorityScore)}`}
                      style={{ width: `${pothole.severity_score * 100}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="w-full h-full bg-zinc-900" />}>
      <DashboardContent />
    </Suspense>
  );
}
