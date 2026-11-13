import { NextRequest, NextResponse } from 'next/server'
import { getOrder, updateOrder } from '@/lib/orders'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await getOrder(Number(id))
  if (!order) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json(order)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await getOrder(Number(id))
  if (!order) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const body = await req.json()
  const allowed = ['status', 'payment_status', 'price_cents'] as const
  const update: Partial<Record<typeof allowed[number], unknown>> = {}

  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo válido' }, { status: 400 })
  }

  await updateOrder(Number(id), update as Parameters<typeof updateOrder>[1])
  return NextResponse.json({ ok: true })
}
