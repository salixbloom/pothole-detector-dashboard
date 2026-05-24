import type { Pothole, PotholeStatus } from '@/lib/mock-potholes';

export const TOOLTIP_STYLE = {
  contentStyle: { background: '#18181b', border: '1px solid #27272a', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#fff' },
};

export function severityColor(score: number) {
  if (score >= 0.8) return 'text-red-400';
  if (score >= 0.6) return 'text-amber-400';
  return 'text-green-400';
}

export function statusBadge(status: PotholeStatus) {
  const base = 'text-xs px-2 py-0.5 rounded font-medium';
  if (status === 'active')   return `${base} bg-red-900/40 text-red-400`;
  if (status === 'resolved') return `${base} bg-green-900/40 text-green-400`;
  return `${base} bg-amber-900/40 text-amber-400`;
}

export function mapLink(p: Pothole) {
  return `/dashboard?lat=${p.canonical_lat}&lng=${p.canonical_lng}&id=${p.pothole_id}`;
}
