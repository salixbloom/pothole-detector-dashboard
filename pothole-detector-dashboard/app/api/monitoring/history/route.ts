import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL!;

export async function GET(req: NextRequest) {
  const hours = req.nextUrl.searchParams.get('hours') ?? '24';
  const url = `${BACKEND}/monitoring/history?hours=${hours}`;

  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return NextResponse.json({ error: 'Backend error' }, { status: res.status });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to reach backend' }, { status: 502 });
  }
}
