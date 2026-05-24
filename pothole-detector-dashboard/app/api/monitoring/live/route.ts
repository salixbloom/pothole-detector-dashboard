import { NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL!;

export async function GET() {
  try {
    const res = await fetch(`${BACKEND}/monitoring/live`, { cache: 'no-store' });
    if (!res.ok) return NextResponse.json({ error: 'Backend error' }, { status: res.status });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to reach backend' }, { status: 502 });
  }
}
