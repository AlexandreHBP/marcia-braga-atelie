import { db, ensureDb } from '@/db/client'
import type { InValue } from '@libsql/client'

export type Order = {
  id: number
  created_at: string
  customer_name: string
  customer_phone: string
  customer_email: string | null
  description: string
  notes: string | null
  price_cents: number | null
  payment_method: 'pix' | 'later'
  payment_proof: string | null
  payment_status: 'pending' | 'confirmed' | 'rejected'
  status: 'received' | 'in_progress' | 'ready' | 'delivered' | 'cancelled'
  deleted_at: string | null
}

export type CreateOrderInput = {
  customer_name: string
  customer_phone: string
  customer_email?: string
  description: string
  notes?: string
  payment_method: 'pix' | 'later'
  payment_proof?: string
  selected_products?: string
}

export type DashboardStats = {
  total_orders: number
  orders_today: number
  orders_pending: number
  orders_in_progress: number
  revenue_confirmed: number
  revenue_pending: number
  orders_by_status: Record<string, number>
  recent_orders: Order[]
}

function toOrder(row: Record<string, unknown>): Order {
  return {
    id: Number(row.id),
    created_at: row.created_at as string,
    customer_name: row.customer_name as string,
    customer_phone: row.customer_phone as string,
    customer_email: (row.customer_email as string | null) ?? null,
    description: row.description as string,
    notes: (row.notes as string | null) ?? null,
    price_cents: row.price_cents != null ? Number(row.price_cents) : null,
    payment_method: row.payment_method as 'pix' | 'later',
    payment_proof: (row.payment_proof as string | null) ?? null,
    payment_status: row.payment_status as 'pending' | 'confirmed' | 'rejected',
    status: row.status as 'received' | 'in_progress' | 'ready' | 'delivered' | 'cancelled',
    deleted_at: (row.deleted_at as string | null) ?? null,
  }
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  await ensureDb()
  const result = await db.execute({
    sql: `INSERT INTO orders (customer_name, customer_phone, customer_email, description, notes, payment_method, payment_proof, selected_products)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      input.customer_name,
      input.customer_phone,
      input.customer_email ?? null,
      input.description,
      input.notes ?? null,
      input.payment_method,
      input.payment_proof ?? null,
      input.selected_products ?? null,
    ],
  })
  return (await getOrder(Number(result.lastInsertRowid)))!
}

export async function getOrder(id: number): Promise<Order | undefined> {
  await ensureDb()
  const result = await db.execute({
    sql: 'SELECT * FROM orders WHERE id = ? AND deleted_at IS NULL',
    args: [id],
  })
  if (result.rows.length === 0) return undefined
  return toOrder(result.rows[0] as unknown as Record<string, unknown>)
}

export async function listOrders(): Promise<Order[]> {
  await ensureDb()
  const result = await db.execute('SELECT * FROM orders WHERE deleted_at IS NULL ORDER BY created_at DESC')
  return result.rows.map(r => toOrder(r as unknown as Record<string, unknown>))
}

export async function updateOrder(id: number, data: Partial<Pick<Order, 'status' | 'payment_status' | 'price_cents'>>): Promise<void> {
  await ensureDb()
  const keys = Object.keys(data)
  const fields = keys.map(k => `${k} = ?`).join(', ')
  const values = keys.map(k => (data as Record<string, unknown>)[k] as InValue)
  await db.execute({ sql: `UPDATE orders SET ${fields} WHERE id = ?`, args: [...values, id] })
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await ensureDb()
  const today = new Date().toISOString().slice(0, 10)

  const [
    totalRes,
    todayRes,
    pendingRes,
    inProgressRes,
    confirmedRes,
    pendingRevRes,
    byStatusRes,
    recentRes,
  ] = await Promise.all([
    db.execute('SELECT COUNT(*) as n FROM orders WHERE deleted_at IS NULL'),
    db.execute({ sql: `SELECT COUNT(*) as n FROM orders WHERE deleted_at IS NULL AND created_at >= ?`, args: [today + 'T00:00:00'] }),
    db.execute(`SELECT COUNT(*) as n FROM orders WHERE deleted_at IS NULL AND status = 'received'`),
    db.execute(`SELECT COUNT(*) as n FROM orders WHERE deleted_at IS NULL AND status = 'in_progress'`),
    db.execute(`SELECT COALESCE(SUM(price_cents),0) as s FROM orders WHERE deleted_at IS NULL AND payment_status = 'confirmed'`),
    db.execute(`SELECT COALESCE(SUM(price_cents),0) as s FROM orders WHERE deleted_at IS NULL AND payment_status = 'pending' AND price_cents IS NOT NULL`),
    db.execute('SELECT status, COUNT(*) as n FROM orders WHERE deleted_at IS NULL GROUP BY status'),
    db.execute('SELECT * FROM orders WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 8'),
  ])

  const orders_by_status: Record<string, number> = {}
  for (const row of byStatusRes.rows) {
    orders_by_status[row.status as string] = Number(row.n)
  }

  return {
    total_orders: Number(totalRes.rows[0].n),
    orders_today: Number(todayRes.rows[0].n),
    orders_pending: Number(pendingRes.rows[0].n),
    orders_in_progress: Number(inProgressRes.rows[0].n),
    revenue_confirmed: Number(confirmedRes.rows[0].s),
    revenue_pending: Number(pendingRevRes.rows[0].s),
    orders_by_status,
    recent_orders: recentRes.rows.map(r => toOrder(r as unknown as Record<string, unknown>)),
  }
}
