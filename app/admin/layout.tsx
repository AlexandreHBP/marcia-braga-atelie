import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={s.root}>
      <aside style={s.sidebar}>
        <div style={s.sidebarTop}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="Logo" style={s.logo} />
          <div style={s.brandName}>Ateliê Márcia Braga</div>
          <div style={s.brandSub}>Painel Administrativo</div>
        </div>

        <nav style={s.nav}>
          <Link href="/admin" style={s.navItem}>
            <span style={s.navIcon}>📊</span>
            <span>Dashboard</span>
          </Link>
          <Link href="/admin/orders" style={s.navItem}>
            <span style={s.navIcon}>📋</span>
            <span>Pedidos</span>
          </Link>
          <Link href="/admin/products" style={s.navItem}>
            <span style={s.navIcon}>✂️</span>
            <span>Produtos</span>
          </Link>
          <Link href="/admin/qrcode" style={s.navItem}>
            <span style={s.navIcon}>📱</span>
            <span>QR Code</span>
          </Link>
        </nav>

        <div style={s.sidebarBottom}>
          <Link href="/order" target="_blank" style={s.viewStore}>
            <span>🛍️</span> Ver loja
          </Link>
        </div>
      </aside>

      <div style={s.content}>
        <main style={s.main}>{children}</main>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    minHeight: '100vh',
    background: '#f8f7f4',
  },
  sidebar: {
    width: 240,
    background: 'linear-gradient(180deg, #1a1a0e 0%, #2d2d1a 100%)',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    position: 'sticky' as const,
    top: 0,
    height: '100vh',
    overflowY: 'auto' as const,
  },
  sidebarTop: {
    padding: '32px 20px 24px',
    textAlign: 'center',
    borderBottom: '1px solid rgba(255,215,0,0.15)',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #FFD700',
    boxShadow: '0 0 0 4px rgba(255,215,0,0.15)',
    marginBottom: 12,
  },
  brandName: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 14,
    fontWeight: 700,
    color: '#FFD700',
    lineHeight: 1.3,
    marginBottom: 4,
  },
  brandSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.12em',
  },
  nav: {
    padding: '20px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    flex: 1,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '11px 14px',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 500,
    color: 'rgba(255,255,255,0.75)',
    transition: 'all 0.15s',
  },
  navIcon: {
    fontSize: 16,
    width: 20,
    textAlign: 'center' as const,
  },
  sidebarBottom: {
    padding: '16px 12px 24px',
    borderTop: '1px solid rgba(255,215,0,0.1)',
  },
  viewStore: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '10px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    color: '#FFD700',
    background: 'rgba(255,215,0,0.08)',
    border: '1px solid rgba(255,215,0,0.2)',
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  main: {
    flex: 1,
    padding: '32px',
    maxWidth: 1100,
    width: '100%',
  },
}
