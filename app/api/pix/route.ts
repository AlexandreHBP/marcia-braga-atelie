import { NextRequest, NextResponse } from 'next/server'
import { generatePix } from '@/lib/pix'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const amountStr = searchParams.get('amount')
  const amount = amountStr ? parseFloat(amountStr) : undefined
  const txid = searchParams.get('txid') ?? undefined

  const key = process.env.PIX_KEY ?? ''
  const name = process.env.PIX_NAME ?? 'Atelie Marcia Braga'
  const city = process.env.PIX_CITY ?? 'Sao Paulo'

  if (!key) return NextResponse.json({ error: 'Chave PIX não configurada' }, { status: 500 })

  const code = generatePix({ key, name, city, amount, txid })
  return NextResponse.json({ code, key, name })
}
