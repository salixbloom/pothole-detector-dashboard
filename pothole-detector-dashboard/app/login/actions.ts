'use server';

import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { signSession, setSessionCookie } from '@/lib/auth';

export type LoginState = { error: string } | null;

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = (formData.get('email') as string | null)?.trim().toLowerCase();
  const password = formData.get('password') as string | null;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const rows = await sql`
    SELECT
      a.id, a.password_hash, a.role, a.city_id,
      c.name AS city_name, c.map_lat, c.map_lng, c.map_zoom
    FROM accounts a
    JOIN cities c ON c.id = a.city_id
    WHERE a.email = ${email}
    LIMIT 1
  `;

  const account = rows[0];

  // Use a constant-time comparison even on "not found" to prevent email enumeration
  const hash = account?.password_hash ?? '$2b$12$invalidhashpaddingtomatchlength000000000000000000000';
  const valid = await bcrypt.compare(password, hash);

  if (!account || !valid) {
    return { error: 'Invalid email or password.' };
  }

  const token = await signSession({
    accountId: account.id,
    cityId: account.city_id,
    cityName: account.city_name,
    email,
    role: account.role,
    mapLat: account.map_lat,
    mapLng: account.map_lng,
    mapZoom: account.map_zoom,
  });

  await setSessionCookie(token);
  redirect('/dashboard');
}
