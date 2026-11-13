import { NextResponse } from 'next/server'
import QRCode from 'qrcode'

export const runtime = 'nodejs'

export async function GET() {
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000'
  const url = `${baseUrl}/order`

  const dataUrl = await QRCode.toDataURL(url, {
    width: 400,
    margin: 2,
    color: { dark: '#1a1a14', light: '#ffffff' },
  })

  const base64 = dataUrl.replace('data:image/png;base64,', '')
  const buffer = Buffer.from(base64, 'base64')

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-store',
    },
  })
}
