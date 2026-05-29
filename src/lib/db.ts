import { neon } from '@neondatabase/serverless';

export function getSQL() {
  const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('Missing POSTGRES_URL or DATABASE_URL environment variable');
  }
  return neon(databaseUrl);
}
