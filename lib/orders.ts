import { sql, ensureDb } from '@/db/client'

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
    created_at: row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at),
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
    deleted_at: row.deleted_at instanceof Date
      ? row.deleted_at.toISOString()
      : (row.deleted_at as string | null) ?? null,
  }
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  await ensureDb()
  const rows = await sql`
    INSERT INTO orders (customer_name, customer_phone, customer_email, description, notes, payment_method, payment_proof, selected_products)
    VALUES (${input.customer_name}, ${input.customer_phone}, ${input.customer_email ?? null}, ${input.description}, ${input.notes ?? null}, ${input.payment_method}, ${input.payment_proof ?? null}, ${input.selected_products ?? null})
    RETURNING *
  `
  return toOrder(rows[0] as Record<string, unknown>)
}

export async function getOrder(id: number): Promise<Order | undefined> {
  await ensureDb()
  const rows = await sql`SELECT * FROM orders WHERE id = ${id} AND deleted_at IS NULL`
  if (rows.length === 0) return undefined
  return toOrder(rows[0] as Record<string, unknown>)
}

export async function listOrders(): Promise<Order[]> {
  await ensureDb()
  const rows = await sql`SELECT * FROM orders WHERE deleted_at IS NULL ORDER BY created_at DESC`
  return rows.map(r => toOrder(r as Record<string, unknown>))
}

export async function updateOrder(id: number, data: Partial<Pick<Order, 'status' | 'payment_status' | 'price_cents'>>): Promise<void> {
  await ensureDb()
  const keys = Object.keys(data)
  const setClauses = keys.map((k, i) => `${k} = $${i + 1}`).join(', ')
  const values = keys.map(k => (data as Record<string, unknown>)[k])
  await sql(`UPDATE orders SET ${setClauses} WHERE id = $${keys.length + 1}`, [...values, id])
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await ensureDb()
  const today = new Date().toISOString().slice(0, 10)

  const [totalRes, todayRes, pendingRes, inProgressRes, confirmedRes, pendingRevRes, byStatusRes, recentRes] = await Promise.all([
    sql`SELECT COUNT(*)::int AS n FROM orders WHERE deleted_at IS NULL`,
    sql`SELECT COUNT(*)::int AS n FROM orders WHERE deleted_at IS NULL AND created_at::date = ${today}::date`,
    sql`SELECT COUNT(*)::int AS n FROM orders WHERE deleted_at IS NULL AND status = 'received'`,
    sql`SELECT COUNT(*)::int AS n FROM orders WHERE deleted_at IS NULL AND status = 'in_progress'`,
    sql`SELECT COALESCE(SUM(price_cents), 0)::int AS s FROM orders WHERE deleted_at IS NULL AND payment_status = 'confirmed'`,
    sql`SELECT COALESCE(SUM(price_cents), 0)::int AS s FROM orders WHERE deleted_at IS NULL AND payment_status = 'pending' AND price_cents IS NOT NULL`,
    sql`SELECT status, COUNT(*)::int AS n FROM orders WHERE deleted_at IS NULL GROUP BY status`,
    sql`SELECT * FROM orders WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 8`,
  ])

  const orders_by_status: Record<string, number> = {}
  for (const row of byStatusRes) {
    orders_by_status[row.status as string] = Number(row.n)
  }

  return {
    total_orders: Number(totalRes[0].n),
    orders_today: Number(todayRes[0].n),
    orders_pending: Number(pendingRes[0].n),
    orders_in_progress: Number(inProgressRes[0].n),
    revenue_confirmed: Number(confirmedRes[0].s),
    revenue_pending: Number(pendingRevRes[0].s),
    orders_by_status,
    recent_orders: recentRes.map(r => toOrder(r as Record<string, unknown>)),
  }
}
