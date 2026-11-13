import Link from 'next/link'

export default function SuccessPage() {
  return (
    <div style={s.page}>
      <nav style={s.navbar}>
        <div style={s.navInner}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="Logo" style={s.navLogo} />
          <span style={s.navBrand}>ATELIÊ MÁRCIA BRAGA</span>
          <div style={{ width: 40 }} />
        </div>
      </nav>

      <div style={s.body}>
        <div style={s.left}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="Ateliê Márcia Braga" style={s.logo} />
        </div>

        <div style={s.right}>
          <div style={s.checkMark}>✓</div>
          <div style={s.tag}>PEDIDO CONFIRMADO</div>
          <h1 style={s.title}>Obrigada pela<br />sua confiança.</h1>
          <div style={s.divider} />
          <p style={s.text}>
            Recebemos o seu pedido com sucesso.<br />
            A Márcia entrará em contato pelo WhatsApp em breve para confirmar os detalhes e o valor do serviço.
          </p>
          <p style={s.hint}>
            ✦ Cada peça recebe atenção individual e é entregue com carinho.
          </p>
          <Link href="/order" style={s.btn}>
            FAZER OUTRO PEDIDO
          </Link>
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#fff',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  },
  navbar: {
    borderBottom: '1px solid #e8e8e8',
    padding: '0 32px',
  },
  navInner: {
    maxWidth: 1300,
    margin: '0 auto',
    height: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navLogo: { width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' },
  navBrand: { fontSize: 13, fontWeight: 700, letterSpacing: '0.2em', color: '#000' },

  body: {
    flex: 1,
    display: 'flex',
    minHeight: 'calc(100vh - 61px)',
  },
  left: {
    flex: '0 0 42%',
    background: '#0a0a0a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'sticky' as const,
    top: 61,
    height: 'calc(100vh - 61px)',
    alignSelf: 'flex-start' as const,
  },
  logo: {
    width: 220,
    height: 220,
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid rgba(255,215,0,0.3)',
    boxShadow: '0 0 80px rgba(255,215,0,0.08)',
  },
  right: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '60px 64px',
    gap: 24,
  },
  checkMark: {
    fontSize: 32,
    color: '#000',
    fontWeight: 300,
  },
  tag: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.25em',
    color: '#888',
  },
  title: {
    fontSize: 40,
    fontWeight: 300,
    color: '#000',
    lineHeight: 1.2,
    letterSpacing: '-0.01em',
  },
  divider: {
    width: 40,
    height: 1,
    background: '#000',
    margin: '4px 0',
  },
  text: {
    fontSize: 14,
    color: '#555',
    lineHeight: 1.8,
    maxWidth: 380,
  },
  hint: {
    fontSize: 12,
    color: '#bbb',
    letterSpacing: '0.05em',
    fontStyle: 'italic',
  },
  btn: {
    display: 'inline-block',
    marginTop: 8,
    padding: '16px 32px',
    background: '#000',
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.2em',
    alignSelf: 'flex-start' as const,
  },
}
