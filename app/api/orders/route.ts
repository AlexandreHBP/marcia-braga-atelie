import { NextRequest, NextResponse } from 'next/server'
import { createOrder } from '@/lib/orders'
import { put } from '@vercel/blob'
import crypto from 'crypto'

export const runtime = 'nodejs'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

export async function POST(req: NextRequest) {
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const customer_name = (formData.get('customer_name') as string | null)?.trim()
  const customer_phone = (formData.get('customer_phone') as string | null)?.trim()
  const customer_email = (formData.get('customer_email') as string | null)?.trim() || undefined
  const description = (formData.get('description') as string | null)?.trim()
  const notes = (formData.get('notes') as string | null)?.trim() || undefined
  const payment_method = formData.get('payment_method') as 'pix' | 'later' | null
  const proofFile = formData.get('payment_proof') as File | null

  if (!customer_name || !customer_phone || !description) {
    return NextResponse.json({ error: 'Preencha todos os campos obrigatórios' }, { status: 400 })
  }

  if (!payment_method || !['pix', 'later'].includes(payment_method)) {
    return NextResponse.json({ error: 'Método de pagamento inválido' }, { status: 400 })
  }

  let payment_proof: string | undefined

  if (proofFile && proofFile.size > 0) {
    if (!ALLOWED_TYPES.includes(proofFile.type)) {
      return NextResponse.json({ error: 'Formato de imagem não suportado' }, { status: 400 })
    }
    if (proofFile.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Imagem muito grande (máx 10 MB)' }, { status: 400 })
    }

    const ext = proofFile.type.split('/')[1].replace('jpeg', 'jpg').replace('heic', 'jpg')
    const filename = `proofs/${crypto.randomUUID()}.${ext}`
    const blob = await put(filename, proofFile, { access: 'public' })
    payment_proof = blob.url
  }

  const selected_products = (formData.get('selected_products') as string | null) || undefined

  const order = await createOrder({
    customer_name,
    customer_phone,
    customer_email,
    description,
    notes,
    payment_method,
    payment_proof,
    selected_products,
  })

  return NextResponse.json({ id: order.id }, { status: 201 })
}
