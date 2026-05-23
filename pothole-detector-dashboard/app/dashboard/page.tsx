'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { MOCK_POTHOLES, lngLat, avgIntensity } from '@/lib/mock-potholes';
import type { HeatmapPoint } from '../components/Map';

const PotholeMap = dynamic(() => import('../components/Map'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-zinc-900" />,
});

const HEATMAP_POINTS: HeatmapPoint[] = MOCK_POTHOLES.map(p => ({
  pothole_id: p.pothole_id,
  severity_score: p.severity_score,
  coords: lngLat(p),
}));

function severityColor(score: number) {
  if (score >= 0.8) return 'text-red-400';
  if (score >= 0.6) return 'text-amber-400';
  return 'text-green-400';
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

  function handleSelect(id: string, coords: [number, number]) {
    setSelected(id);
    setFlyToCoords(coords);
  }

  async function handleCitySearch(e: React.FormEvent) {
    e.preventDefault();
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
        <PotholeMap flyToCoords={flyToCoords} potholes={HEATMAP_POINTS} />

        {/* City search bar */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-80">
          <form onSubmit={handleCitySearch} className="flex gap-2">
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
          {MOCK_POTHOLES.map((pothole, i) => (
            <button
              key={pothole.pothole_id}
              onClick={() => handleSelect(pothole.pothole_id, lngLat(pothole))}
              className={`w-full text-left px-4 py-3 hover:bg-zinc-900 transition-colors ${
                selected === pothole.pothole_id ? 'bg-zinc-900' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-zinc-400">#{i + 1}</span>
                <span className={`text-xs font-semibold ${severityColor(avgIntensity(pothole) / 10)}`}>
                  {avgIntensity(pothole).toFixed(1)}
                </span>
              </div>
              <p className="text-sm text-white font-medium">{pothole.street}</p>
              <p className="text-xs text-zinc-400 mt-0.5">{pothole.hit_count} hits recorded</p>
            </button>
          ))}
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
