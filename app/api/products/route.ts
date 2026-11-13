import { NextRequest, NextResponse } from 'next/server'
import { listProducts, createProduct } from '@/lib/products'
import { put } from '@vercel/blob'
import crypto from 'crypto'

export const runtime = 'nodejs'

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']

async function saveImage(file: File): Promise<string> {
  const ext = file.type.split('/')[1].replace('jpeg', 'jpg')
  const name = `products/product-${crypto.randomUUID()}.${ext}`
  const blob = await put(name, file, { access: 'public' })
  return blob.url
}

export async function GET(req: NextRequest) {
  const all = new URL(req.url).searchParams.get('all') === '1'
  return NextResponse.json(await listProducts(!all))
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const name = (formData.get('name') as string | null)?.trim()
  const description = (formData.get('description') as string | null)?.trim() || undefined
  const priceStr = formData.get('price_cents') as string | null
  const price_cents = priceStr ? parseInt(priceStr) : 0
  const imgFile = formData.get('image') as File | null

  if (!name || !price_cents) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

  let image: string | undefined
  if (imgFile && imgFile.size > 0 && ALLOWED.includes(imgFile.type)) {
    image = await saveImage(imgFile)
  }

  const p = await createProduct({ name, description, price_cents, image })
  return NextResponse.json(p, { status: 201 })
}
