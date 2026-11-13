import { neon } from '@neondatabase/serverless'

export const sql = neon(process.env.DATABASE_URL!)

let _initPromise: Promise<void> | null = null

export function ensureDb(): Promise<void> {
  if (!_initPromise) {
    _initPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS orders (
          id SERIAL PRIMARY KEY,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          customer_name TEXT NOT NULL,
          customer_phone TEXT NOT NULL,
          customer_email TEXT,
          description TEXT NOT NULL,
          notes TEXT,
          price_cents INTEGER,
          payment_method TEXT NOT NULL DEFAULT 'later',
          payment_proof TEXT,
          payment_status TEXT NOT NULL DEFAULT 'pending',
          status TEXT NOT NULL DEFAULT 'received',
          selected_products TEXT,
          deleted_at TIMESTAMPTZ
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          name TEXT NOT NULL,
          description TEXT,
          price_cents INTEGER NOT NULL,
          active INTEGER NOT NULL DEFAULT 1,
          image TEXT
        )
      `
      await sql`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`
      await sql`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC)`
      await sql`CREATE INDEX IF NOT EXISTS idx_orders_payment ON orders(payment_status)`
      await sql`CREATE INDEX IF NOT EXISTS idx_products_active ON products(active)`
    })()
  }
  return _initPromise
}
