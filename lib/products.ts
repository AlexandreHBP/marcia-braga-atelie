import { db, ensureDb } from '@/db/client'
import type { InValue } from '@libsql/client'

export type Product = {
  id: number
  created_at: string
  name: string
  description: string | null
  price_cents: number
  active: number
  image: string | null
}

function toProduct(row: Record<string, unknown>): Product {
  return {
    id: Number(row.id),
    created_at: row.created_at as string,
    name: row.name as string,
    description: (row.description as string | null) ?? null,
    price_cents: Number(row.price_cents),
    active: Number(row.active),
    image: (row.image as string | null) ?? null,
  }
}

export async function listProducts(onlyActive = false): Promise<Product[]> {
  await ensureDb()
  const sql = onlyActive
    ? 'SELECT * FROM products WHERE active = 1 ORDER BY name ASC'
    : 'SELECT * FROM products ORDER BY active DESC, name ASC'
  const result = await db.execute(sql)
  return result.rows.map(r => toProduct(r as unknown as Record<string, unknown>))
}

export async function getProduct(id: number): Promise<Product | undefined> {
  await ensureDb()
  const result = await db.execute({ sql: 'SELECT * FROM products WHERE id = ?', args: [id] })
  if (result.rows.length === 0) return undefined
  return toProduct(result.rows[0] as unknown as Record<string, unknown>)
}

export async function createProduct(data: { name: string; description?: string; price_cents: number; image?: string }): Promise<Product> {
  await ensureDb()
  const result = await db.execute({
    sql: 'INSERT INTO products (name, description, price_cents, image) VALUES (?, ?, ?, ?)',
    args: [data.name, data.description ?? null, data.price_cents, data.image ?? null],
  })
  return (await getProduct(Number(result.lastInsertRowid)))!
}

export async function updateProduct(id: number, data: Partial<Pick<Product, 'name' | 'description' | 'price_cents' | 'active' | 'image'>>): Promise<void> {
  await ensureDb()
  const keys = Object.keys(data)
  const fields = keys.map(k => `${k} = ?`).join(', ')
  const values = keys.map(k => (data as Record<string, unknown>)[k] as InValue)
  await db.execute({ sql: `UPDATE products SET ${fields} WHERE id = ?`, args: [...values, id] })
}

export async function deleteProduct(id: number): Promise<void> {
  await ensureDb()
  await db.execute({ sql: 'DELETE FROM products WHERE id = ?', args: [id] })
}
