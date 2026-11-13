export default function QRCodePage() {
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000'
  const orderUrl = `${baseUrl}/order`

  return (
    <div>
      <div style={s.header}>
        <h1 style={s.title}>QR Code</h1>
        <p style={s.sub}>Clientes escaneiam para fazer um pedido</p>
      </div>

      <div style={s.card}>
        <div style={s.left}>
          <div style={s.qrFrame}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/api/qrcode" alt="QR Code" style={s.qr} />
          </div>
          <a href="/api/qrcode" download="qrcode-atelie-marcia-braga.png" style={s.downloadBtn}>
            ⬇️ Baixar PNG para imprimir
          </a>
        </div>

        <div style={s.right}>
          <div style={s.infoCard}>
            <div style={s.infoIcon}>📱</div>
            <h3 style={s.infoTitle}>Como usar</h3>
            <p style={s.infoText}>
              Imprima este QR Code e coloque em um local visível no ateliê — balcão, espelho, vitrine.
              Seus clientes apontam a câmera do celular e o pedido abre automaticamente.
            </p>
          </div>

          <div style={s.urlBox}>
            <div style={s.urlLabel}>Link direto para pedidos</div>
            <code style={s.urlCode}>{orderUrl}</code>
          </div>

          <div style={s.tipBox}>
            <strong>💡 Dica:</strong> O link gerado usa a variável <code>BASE_URL</code> configurada no painel do Vercel. Se você mudar o domínio, atualize essa variável e faça um novo deploy.
          </div>
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  header: { marginBottom: 28 },
  title: { fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#1a1a0e' },
  sub: { fontSize: 13, color: '#9ca3af', marginTop: 2 },

  card: { background: '#fff', borderRadius: 20, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: '40px', display: 'flex', gap: 48, alignItems: 'flex-start', flexWrap: 'wrap' as const, border: '1px solid #f0f0f0' },

  left: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 },
  qrFrame: { padding: 20, background: '#fff', border: '3px solid #C3D488', borderRadius: 20, boxShadow: '0 4px 20px rgba(195,212,136,0.3)' },
  qr: { width: 220, height: 220, display: 'block' },
  downloadBtn: { display: 'inline-block', padding: '12px 24px', background: 'linear-gradient(135deg, #FFD700, #d4a800)', color: '#1a1a0e', borderRadius: 10, fontWeight: 700, fontSize: 14, boxShadow: '0 4px 12px rgba(255,215,0,0.3)' },

  right: { flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 16 },

  infoCard: { background: '#f8f7f4', borderRadius: 14, padding: '20px', display: 'flex', flexDirection: 'column', gap: 8 },
  infoIcon: { fontSize: 28 },
  infoTitle: { fontSize: 15, fontWeight: 700, color: '#1a1a0e' },
  infoText: { fontSize: 13, color: '#6b7280', lineHeight: 1.7 },

  urlBox: { background: '#1a1a0e', borderRadius: 12, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 6 },
  urlLabel: { fontSize: 10, fontWeight: 700, color: 'rgba(255,215,0,0.6)', textTransform: 'uppercase' as const, letterSpacing: '0.12em' },
  urlCode: { fontSize: 13, color: '#FFD700', wordBreak: 'break-all' as const },

  tipBox: { background: '#fffdf0', border: '1px solid #FFD700', borderRadius: 10, padding: '14px 16px', fontSize: 12, color: '#6b7280', lineHeight: 1.7 },
}
