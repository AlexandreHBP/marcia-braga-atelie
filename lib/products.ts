import { sql, ensureDb } from '@/db/client'

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
    created_at: row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at),
    name: row.name as string,
    description: (row.description as string | null) ?? null,
    price_cents: Number(row.price_cents),
    active: Number(row.active),
    image: (row.image as string | null) ?? null,
  }
}

export async function listProducts(onlyActive = false): Promise<Product[]> {
  await ensureDb()
  const rows = onlyActive
    ? await sql`SELECT * FROM products WHERE active = 1 ORDER BY name ASC`
    : await sql`SELECT * FROM products ORDER BY active DESC, name ASC`
  return rows.map(r => toProduct(r as Record<string, unknown>))
}

export async function getProduct(id: number): Promise<Product | undefined> {
  await ensureDb()
  const rows = await sql`SELECT * FROM products WHERE id = ${id}`
  if (rows.length === 0) return undefined
  return toProduct(rows[0] as Record<string, unknown>)
}

export async function createProduct(data: { name: string; description?: string; price_cents: number; image?: string }): Promise<Product> {
  await ensureDb()
  const rows = await sql`
    INSERT INTO products (name, description, price_cents, image)
    VALUES (${data.name}, ${data.description ?? null}, ${data.price_cents}, ${data.image ?? null})
    RETURNING *
  `
  return toProduct(rows[0] as Record<string, unknown>)
}

export async function updateProduct(id: number, data: Partial<Pick<Product, 'name' | 'description' | 'price_cents' | 'active' | 'image'>>): Promise<void> {
  await ensureDb()
  const keys = Object.keys(data)
  const setClauses = keys.map((k, i) => `${k} = $${i + 1}`).join(', ')
  const values = keys.map(k => (data as Record<string, unknown>)[k])
  await sql(`UPDATE products SET ${setClauses} WHERE id = $${keys.length + 1}`, [...values, id])
}

export async function deleteProduct(id: number): Promise<void> {
  await ensureDb()
  await sql`DELETE FROM products WHERE id = ${id}`
}
