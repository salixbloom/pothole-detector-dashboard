export type PotholeStatus = 'active' | 'resolved' | 'scheduled';

// Matches GET /potholes response schema
export interface Pothole {
  pothole_id: string;
  street: string;          // not in API spec, added for display
  canonical_lat: number;
  canonical_lng: number;
  severity_score: number;  // 0–1
  hit_count: number;
  priority_score: number;  // severity_score × hit_count × traffic_weight
  first_seen: string;
  last_seen: string;
  traffic_weight: number;
  status: PotholeStatus;
}

// Returns [longitude, latitude] — GeoJSON / Mapbox order
export function lngLat(p: Pothole): [number, number] {
  return [p.canonical_lng, p.canonical_lat];
}

export interface SubReport {
  id: string;
  intensity: number;
  lat: number;
  lng: number;
  timestamp: string;
  resolved: boolean;
}

function shiftDate(iso: string, dayOffset: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + dayOffset);
  return d.toISOString().slice(0, 16).replace('T', ' ');
}

export function makeSubReports(p: Pothole): SubReport[] {
  const base = p.severity_score * 10;
  const count = Math.min(6, Math.max(2, Math.floor(p.hit_count / 30)));
  return Array.from({ length: count }, (_, i) => ({
    id: `${p.pothole_id}-r${i + 1}`,
    intensity: parseFloat((base * (1 - i * 0.06)).toFixed(1)),
    lat: p.canonical_lat + (i % 2 === 0 ? i * 0.00004 : -i * 0.00003),
    lng: p.canonical_lng + (i % 2 === 0 ? -i * 0.00003 : i * 0.00004),
    timestamp: shiftDate(p.last_seen, -i),
    resolved: p.status === 'resolved',
  }));
}

export function avgIntensity(p: Pothole): number {
  const reports = makeSubReports(p);
  return reports.reduce((sum, r) => sum + r.intensity, 0) / reports.length;
}

export const MOCK_POTHOLES: Pothole[] = [
  {
    pothole_id: 'pc-001',
    street: 'Pacific Ave S',
    canonical_lat: 47.2317,
    canonical_lng: -122.4474,
    severity_score: 0.91,
    hit_count: 183,
    priority_score: 166.53,
    first_seen: '2026-03-12T09:15:00Z',
    last_seen: '2026-05-21T16:44:00Z',
    traffic_weight: 1.0,
    status: 'active',
  },
  {
    pothole_id: 'pc-002',
    street: 'S Tacoma Way',
    canonical_lat: 47.1919,
    canonical_lng: -122.4753,
    severity_score: 0.87,
    hit_count: 152,
    priority_score: 132.24,
    first_seen: '2026-03-19T14:02:00Z',
    last_seen: '2026-05-22T08:31:00Z',
    traffic_weight: 1.0,
    status: 'active',
  },
  {
    pothole_id: 'pc-003',
    street: '6th Ave',
    canonical_lat: 47.2496,
    canonical_lng: -122.4687,
    severity_score: 0.78,
    hit_count: 124,
    priority_score: 96.72,
    first_seen: '2026-04-01T11:20:00Z',
    last_seen: '2026-05-21T19:05:00Z',
    traffic_weight: 1.0,
    status: 'active',
  },
  {
    pothole_id: 'pc-004',
    street: 'Portland Ave E',
    canonical_lat: 47.2091,
    canonical_lng: -122.4187,
    severity_score: 0.84,
    hit_count: 98,
    priority_score: 82.32,
    first_seen: '2026-04-07T07:45:00Z',
    last_seen: '2026-05-22T10:17:00Z',
    traffic_weight: 1.0,
    status: 'active',
  },
  {
    pothole_id: 'pc-005',
    street: 'McKinley Ave E',
    canonical_lat: 47.2095,
    canonical_lng: -122.4063,
    severity_score: 0.71,
    hit_count: 89,
    priority_score: 56.90,
    first_seen: '2026-04-14T13:30:00Z',
    last_seen: '2026-05-21T14:22:00Z',
    traffic_weight: 0.9,
    status: 'scheduled',
  },
  {
    pothole_id: 'pc-006',
    street: 'S 38th St',
    canonical_lat: 47.2167,
    canonical_lng: -122.4560,
    severity_score: 0.68,
    hit_count: 76,
    priority_score: 51.68,
    first_seen: '2026-04-20T09:10:00Z',
    last_seen: '2026-05-20T17:33:00Z',
    traffic_weight: 1.0,
    status: 'active',
  },
  {
    pothole_id: 'pc-007',
    street: 'Yakima Ave S',
    canonical_lat: 47.2451,
    canonical_lng: -122.4540,
    severity_score: 0.74,
    hit_count: 61,
    priority_score: 40.63,
    first_seen: '2026-04-25T15:55:00Z',
    last_seen: '2026-05-19T11:48:00Z',
    traffic_weight: 0.9,
    status: 'active',
  },
  {
    pothole_id: 'pc-008',
    street: 'Martin Luther King Jr Way',
    canonical_lat: 47.2453,
    canonical_lng: -122.4390,
    severity_score: 0.62,
    hit_count: 58,
    priority_score: 35.96,
    first_seen: '2026-05-01T08:32:00Z',
    last_seen: '2026-05-22T07:19:00Z',
    traffic_weight: 1.0,
    status: 'active',
  },
  {
    pothole_id: 'pc-009',
    street: 'Canyon Rd E',
    canonical_lat: 47.1862,
    canonical_lng: -122.3016,
    severity_score: 0.55,
    hit_count: 47,
    priority_score: 21.98,
    first_seen: '2026-05-05T10:14:00Z',
    last_seen: '2026-05-21T15:06:00Z',
    traffic_weight: 0.85,
    status: 'scheduled',
  },
  {
    pothole_id: 'pc-010',
    street: 'Meridian Ave S',
    canonical_lat: 47.1803,
    canonical_lng: -122.2961,
    severity_score: 0.49,
    hit_count: 39,
    priority_score: 19.11,
    first_seen: '2026-05-08T12:40:00Z',
    last_seen: '2026-05-20T09:55:00Z',
    traffic_weight: 1.0,
    status: 'active',
  },
  {
    pothole_id: 'pc-011',
    street: 'Bridgeport Way SW',
    canonical_lat: 47.2108,
    canonical_lng: -122.5475,
    severity_score: 0.41,
    hit_count: 34,
    priority_score: 12.55,
    first_seen: '2026-05-10T16:22:00Z',
    last_seen: '2026-05-18T13:41:00Z',
    traffic_weight: 0.9,
    status: 'active',
  },
  {
    pothole_id: 'pc-012',
    street: 'N Pearl St',
    canonical_lat: 47.2729,
    canonical_lng: -122.4583,
    severity_score: 0.35,
    hit_count: 28,
    priority_score: 7.84,
    first_seen: '2026-05-12T08:05:00Z',
    last_seen: '2026-05-15T14:22:00Z',
    traffic_weight: 0.8,
    status: 'resolved',
  },
];
