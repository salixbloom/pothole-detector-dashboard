'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const PotholeMap = dynamic(() => import('../components/Map'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-zinc-900" />,
});

const MOCK_POTHOLES = [
  { id: 1, rank: 1, severity: 9.2, hits: 847, street: "O'Connell Street", coords: [-6.2597, 53.3498] as [number, number] },
  { id: 2, rank: 2, severity: 8.7, hits: 623, street: 'Dame Street', coords: [-6.2672, 53.3441] as [number, number] },
  { id: 3, rank: 3, severity: 7.9, hits: 511, street: 'Grafton Street', coords: [-6.2591, 53.3401] as [number, number] },
  { id: 4, rank: 4, severity: 7.1, hits: 390, street: 'Dorset Street', coords: [-6.2651, 53.3576] as [number, number] },
  { id: 5, rank: 5, severity: 6.4, hits: 274, street: 'Thomas Street', coords: [-6.2827, 53.3427] as [number, number] },
];

export default function Dashboard() {
  const [flyToCoords, setFlyToCoords] = useState<[number, number] | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  function handleSelect(id: number, coords: [number, number]) {
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
        <PotholeMap flyToCoords={flyToCoords} potholes={MOCK_POTHOLES} />

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
          <p className="text-xs text-zinc-400 mt-0.5">Ranked by severity × traffic</p>
        </div>

        <div className="divide-y divide-zinc-800">
          {MOCK_POTHOLES.map(pothole => (
            <button
              key={pothole.id}
              onClick={() => handleSelect(pothole.id, pothole.coords)}
              className={`w-full text-left px-4 py-3 hover:bg-zinc-900 transition-colors ${
                selected === pothole.id ? 'bg-zinc-900' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-zinc-400">#{pothole.rank}</span>
                <span className={`text-xs font-semibold ${
                  pothole.severity >= 8 ? 'text-red-400' :
                  pothole.severity >= 6 ? 'text-amber-400' : 'text-green-400'
                }`}>
                  {pothole.severity.toFixed(1)}
                </span>
              </div>
              <p className="text-sm text-white font-medium">{pothole.street}</p>
              <p className="text-xs text-zinc-400 mt-0.5">{pothole.hits} hits recorded</p>
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}
