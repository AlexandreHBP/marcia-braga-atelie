import { NextRequest, NextResponse } from 'next/server'

export const config = {
  matcher: ['/admin/:path*'],
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

export async function proxy(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? ''

  if (authHeader.startsWith('Basic ')) {
    const encoded = authHeader.slice(6)
    let decoded = ''
    try { decoded = atob(encoded) } catch { /* ignore */ }

    const colonIdx = decoded.indexOf(':')
    if (colonIdx !== -1) {
      const user = decoded.slice(0, colonIdx)
      const pass = decoded.slice(colonIdx + 1)
      const expectedUser = process.env.ADMIN_USER ?? 'marcia'
      const expectedPass = process.env.ADMIN_PASS ?? 'marcia2024'

      if (constantTimeEqual(user, expectedUser) && constantTimeEqual(pass, expectedPass)) {
        return NextResponse.next()
      }
    }
  }

  return new NextResponse('Acesso negado', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Atelie Admin"' },
  })
}
