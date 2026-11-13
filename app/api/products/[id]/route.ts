import { NextRequest, NextResponse } from 'next/server'
import { getProduct, updateProduct, deleteProduct } from '@/lib/products'
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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const p = await getProduct(Number(id))
  if (!p) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const contentType = req.headers.get('content-type') ?? ''

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData()
    const name = (formData.get('name') as string | null)?.trim()
    const description = (formData.get('description') as string | null)?.trim() || null
    const priceStr = formData.get('price_cents') as string | null
    const price_cents = priceStr ? parseInt(priceStr) : undefined
    const imgFile = formData.get('image') as File | null
    const removeImage = formData.get('remove_image') === '1'

    const update: Record<string, unknown> = {}
    if (name) update.name = name
    if (description !== undefined) update.description = description
    if (price_cents) update.price_cents = price_cents

    if (removeImage) {
      update.image = null
    } else if (imgFile && imgFile.size > 0 && ALLOWED.includes(imgFile.type)) {
      update.image = await saveImage(imgFile)
    }

    await updateProduct(Number(id), update as Parameters<typeof updateProduct>[1])
  } else {
    const body = await req.json()
    await updateProduct(Number(id), body)
  }

  return NextResponse.json(await getProduct(Number(id)))
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await deleteProduct(Number(id))
  return NextResponse.json({ ok: true })
}
