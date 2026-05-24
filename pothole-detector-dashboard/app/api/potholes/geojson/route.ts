import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL!;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const url = new URL('/potholes/geojson', BACKEND);
  searchParams.forEach((v, k) => url.searchParams.set(k, v));

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 30 } });
    if (!res.ok) return NextResponse.json({ error: 'Backend error' }, { status: res.status });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to reach backend' }, { status: 502 });
  }
}
