import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

export const sql = neon(process.env.DATABASE_URL);

/*
  Required schema — run once against your Neon database:

  CREATE EXTENSION IF NOT EXISTS "pgcrypto";

  CREATE TABLE cities (
    id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name      text    NOT NULL,
    map_lat   float8  NOT NULL,
    map_lng   float8  NOT NULL,
    map_zoom  int     NOT NULL DEFAULT 12
  );

  CREATE TABLE accounts (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id       uuid REFERENCES cities(id) ON DELETE CASCADE,
    email         text UNIQUE NOT NULL,
    password_hash text NOT NULL,
    role          text NOT NULL DEFAULT 'viewer',   -- 'admin' | 'viewer'
    created_at    timestamptz DEFAULT now()
  );

  CREATE TABLE access_requests (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    city_name    text NOT NULL,
    contact_name text NOT NULL,
    email        text NOT NULL,
    region       text NOT NULL,
    message      text,
    status       text NOT NULL DEFAULT 'pending',   -- 'pending' | 'approved' | 'rejected'
    created_at   timestamptz DEFAULT now()
  );
*/
