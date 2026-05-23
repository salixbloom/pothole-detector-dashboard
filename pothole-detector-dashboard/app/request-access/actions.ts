'use server';

import { sql } from '@/lib/db';

export type RequestState =
  | { status: 'success' }
  | { status: 'error'; message: string }
  | null;

export async function requestAccessAction(
  _prev: RequestState,
  formData: FormData,
): Promise<RequestState> {
  const cityName    = (formData.get('city_name')     as string | null)?.trim();
  const contactName = (formData.get('contact_name')  as string | null)?.trim();
  const email       = (formData.get('email')         as string | null)?.trim().toLowerCase();
  const region      = (formData.get('region')        as string | null)?.trim();
  const message     = (formData.get('message')       as string | null)?.trim() || null;

  if (!cityName || !contactName || !email || !region) {
    return { status: 'error', message: 'Please fill in all required fields.' };
  }

  // Basic email format guard — full validation happens in the DB constraint
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: 'error', message: 'Please enter a valid email address.' };
  }

  // Prevent duplicate pending requests from the same email
  const existing = await sql`
    SELECT id FROM access_requests
    WHERE email = ${email} AND status = 'pending'
    LIMIT 1
  `;

  if (existing.length > 0) {
    return {
      status: 'error',
      message: 'A request from this email is already under review.',
    };
  }

  await sql`
    INSERT INTO access_requests (city_name, contact_name, email, region, message)
    VALUES (${cityName}, ${contactName}, ${email}, ${region}, ${message})
  `;

  return { status: 'success' };
}
