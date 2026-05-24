import type { Pothole, PotholeStatus } from './mock-potholes';

// Shape the backend actually returns (street is display-only, not in API)
interface BackendPothole {
  pothole_id: string;
  canonical_lat: number;
  canonical_lng: number;
  severity_score: number;
  hit_count: number;
  priority_score: number;
  first_seen: string;
  last_seen: string;
  traffic_weight?: number;
  status?: string;
  street?: string;
}

function normalize(b: BackendPothole): Pothole {
  return {
    pothole_id: b.pothole_id,
    canonical_lat: b.canonical_lat,
    canonical_lng: b.canonical_lng,
    severity_score: b.severity_score,
    hit_count: b.hit_count,
    priority_score: b.priority_score,
    first_seen: b.first_seen,
    last_seen: b.last_seen,
    traffic_weight: b.traffic_weight ?? 1.0,
    status: (b.status ?? 'active') as PotholeStatus,
    street: b.street ?? `${b.canonical_lat.toFixed(4)}, ${b.canonical_lng.toFixed(4)}`,
  };
}

export async function fetchPotholes(params?: {
  minPriority?: number;
  limit?: number;
  offset?: number;
}): Promise<Pothole[]> {
  const url = new URL('/api/potholes', window.location.origin);
  if (params?.minPriority != null) url.searchParams.set('min_priority', String(params.minPriority));
  if (params?.limit != null) url.searchParams.set('limit', String(params.limit));
  if (params?.offset != null) url.searchParams.set('offset', String(params.offset));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch potholes');
  const data: BackendPothole[] = await res.json();
  return data.map(normalize);
}

export interface LiveMetrics {
  [key: string]: unknown;
}

export interface HistorySnapshot {
  timestamp?: string;
  [key: string]: unknown;
}

export async function fetchMonitoringLive(): Promise<LiveMetrics> {
  const res = await fetch('/api/monitoring/live');
  if (!res.ok) throw new Error('Failed to fetch live metrics');
  return res.json();
}

function resolveTimestamp(s: Record<string, unknown>): string | undefined {
  // 1. Try known field names
  const candidate = s.timestamp ?? s.captured_at ?? s.time ?? s.ts
    ?? s.created_at ?? s.recorded_at ?? s.date ?? s.datetime ?? s.snapshot_time;

  if (typeof candidate === 'string' && !isNaN(Date.parse(candidate))) return candidate;

  // 2. Handle numeric Unix timestamps (seconds or milliseconds)
  const asNum = typeof candidate === 'number' ? candidate : null;
  if (asNum !== null) {
    const ms = asNum > 1e12 ? asNum : asNum * 1000;
    const d = new Date(ms);
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  // 3. Scan every field — first string that parses as a date wins
  for (const val of Object.values(s)) {
    if (typeof val === 'string' && !isNaN(Date.parse(val))) return val;
    if (typeof val === 'number' && val > 1e9) {
      const ms = val > 1e12 ? val : val * 1000;
      const d = new Date(ms);
      if (!isNaN(d.getTime())) return d.toISOString();
    }
  }

  return undefined;
}

export async function fetchMonitoringHistory(hours = 24): Promise<HistorySnapshot[]> {
  const res = await fetch(`/api/monitoring/history?hours=${hours}`);
  if (!res.ok) throw new Error('Failed to fetch monitoring history');
  const data = await res.json();
  const raw: Record<string, unknown>[] = Array.isArray(data) ? data : (data.snapshots ?? data.history ?? []);
  return raw.map(s => ({ ...s, timestamp: resolveTimestamp(s) }));
}
