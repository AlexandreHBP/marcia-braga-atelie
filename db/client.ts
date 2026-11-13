import { createClient } from '@libsql/client'

export const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

let _initPromise: Promise<void> | null = null

export function ensureDb(): Promise<void> {
  if (!_initPromise) {
    _initPromise = db.batch([
      `CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
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
        deleted_at TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        name TEXT NOT NULL,
        description TEXT,
        price_cents INTEGER NOT NULL,
        active INTEGER NOT NULL DEFAULT 1,
        image TEXT
      )`,
      `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`,
      `CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_orders_payment ON orders(payment_status)`,
      `CREATE INDEX IF NOT EXISTS idx_products_active ON products(active)`,
    ], 'write').then(() => undefined)
  }
  return _initPromise
}
