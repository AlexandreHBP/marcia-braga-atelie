'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Product = { id: number; name: string; description: string | null; price_cents: number; image: string | null }
type CartItem = Product & { qty: number; image: string | null }

function fmt(cents: number) {
  return `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

export default function StorePage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [checkout, setCheckout] = useState(false)
  const [payMethod, setPayMethod] = useState<'pix' | 'later'>('later')
  const [pixCode, setPixCode] = useState('')
  const [pixCopied, setPixCopied] = useState(false)
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [focused, setFocused] = useState('')
  const [added, setAdded] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(setProducts).catch(() => {})
  }, [])

  const totalCents = cart.reduce((s, i) => s + i.price_cents * i.qty, 0)
  const totalItems = cart.reduce((s, i) => s + i.qty, 0)

  useEffect(() => {
    if (payMethod !== 'pix') return
    const amount = totalCents > 0 ? totalCents / 100 : undefined
    fetch(`/api/pix${amount ? `?amount=${amount.toFixed(2)}` : ''}`)
      .then(r => r.json()).then(d => { if (d.code) setPixCode(d.code) }).catch(() => {})
  }, [payMethod, totalCents])

  function addToCart(p: Product) {
    setCart(c => {
      const ex = c.find(i => i.id === p.id)
      return ex ? c.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i) : [...c, { ...p, qty: 1 }]
    })
    setAdded(p.id)
    setTimeout(() => setAdded(null), 1200)
    setCartOpen(true)
  }

  function removeFromCart(id: number) {
    setCart(c => c.filter(i => i.id !== id))
  }

  function changeQty(id: number, delta: number) {
    setCart(c => c.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = e.currentTarget
    const data = new FormData(form)
    if (cart.length > 0) {
      data.set('selected_products', JSON.stringify(cart.map(i => ({ id: i.id, name: i.name, price_cents: i.price_cents, qty: i.qty }))))
      if (!(data.get('description') as string)?.trim()) {
        data.set('description', cart.map(i => i.qty > 1 ? `${i.name} (x${i.qty})` : i.name).join(', '))
      }
    }
    try {
      const res = await fetch('/api/orders', { method: 'POST', body: data })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'Erro ao enviar pedido')
      router.push('/order/success')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro inesperado')
      setLoading(false)
    }
  }

  const inp = (name: string): React.CSSProperties => ({
    width: '100%', padding: '14px 0 10px', border: 'none',
    borderBottom: focused === name ? '1.5px solid #000' : '1px solid #d0d0d0',
    background: 'transparent', fontSize: 14, color: '#000', outline: 'none', transition: 'border-color 0.2s',
  })

  return (
    <div style={s.page}>

      {/* ── HEADER ── */}
      <header style={s.header}>
        <div style={s.headerInner}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="Logo" style={s.headerLogo} />
          <div style={s.headerCenter}>
            <span style={s.headerBrand}>ATELIÊ MÁRCIA BRAGA</span>
            <span style={s.headerSub}>Costura &amp; Criação</span>
          </div>
          <button onClick={() => setCartOpen(true)} style={s.cartBtn}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            {totalItems > 0 && <span style={s.cartBadge}>{totalItems}</span>}
          </button>
        </div>
      </header>

      {/* ── HERO BANNER ── */}
      <section style={s.heroBanner}>
        <div style={s.heroBannerLeft}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="Ateliê Márcia Braga" style={s.bannerLogo} />
        </div>
        <div style={s.heroBannerRight}>
          <p style={s.bannerEyebrow}>COLEÇÃO DE SERVIÇOS</p>
          <h1 style={s.bannerTitle}>Cada peça,<br />uma história.</h1>
          <p style={s.bannerText}>
            Ajustes, costuras e criações feitas à mão com dedicação.<br />
            Escolha os serviços e finalize seu pedido.
          </p>
          <button onClick={() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })} style={s.bannerBtn}>
            VER SERVIÇOS
          </button>
        </div>
      </section>

      {/* ── CATALOG ── */}
      <section id="catalog" style={s.catalog}>
        <div style={s.catalogHeader}>
          <h2 style={s.catalogTitle}>NOSSOS SERVIÇOS</h2>
          <div style={s.catalogLine} />
        </div>

        {products.length === 0 ? (
          <div style={s.emptyShop}>
            <p>Em breve novos serviços disponíveis.</p>
            <p style={{ fontSize: 13, color: '#888', marginTop: 8 }}>Por enquanto, descreva seu pedido abaixo.</p>
          </div>
        ) : (
          <div style={s.productGrid}>
            {products.map(p => (
              <div key={p.id} style={s.productCard}>
                <div style={s.productImgPlaceholder}>
                  {p.image
                    /* eslint-disable-next-line @next/next/no-img-element */
                    ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' as const, display: 'block' }} />
                    : <span style={s.productImgIcon}>✂️</span>
                  }
                </div>
                <div style={s.productBody}>
                  <div style={s.productName}>{p.name}</div>
                  {p.description && <div style={s.productDesc}>{p.description}</div>}
                  <div style={s.productFooter}>
                    <span style={s.productPrice}>{fmt(p.price_cents)}</span>
                    <button
                      onClick={() => addToCart(p)}
                      style={added === p.id ? { ...s.addBtn, ...s.addBtnDone } : s.addBtn}
                    >
                      {added === p.id ? '✓ ADICIONADO' : '+ ADICIONAR'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Custom order */}
        <div style={s.customBox}>
          <div style={s.customLeft}>
            <div style={s.customEye}>PEDIDO PERSONALIZADO</div>
            <p style={s.customText}>Não encontrou o que procura? Descreva seu pedido e entraremos em contato.</p>
          </div>
          <button onClick={() => { setCartOpen(false); setCheckout(true) }} style={s.customBtn}>
            FAZER PEDIDO PERSONALIZADO →
          </button>
        </div>
      </section>

      {/* ── STICKY CHECKOUT BAR ── */}
      {totalItems > 0 && !cartOpen && (
        <div style={s.stickyBar}>
          <span style={s.stickyInfo}>{totalItems} item{totalItems > 1 ? 's' : ''} · {fmt(totalCents)}</span>
          <button onClick={() => setCartOpen(true)} style={s.stickyBtn}>VER CARRINHO →</button>
        </div>
      )}

      {/* ── CART DRAWER ── */}
      {cartOpen && (
        <div style={s.overlay} onClick={() => setCartOpen(false)}>
          <div style={s.drawer} onClick={e => e.stopPropagation()}>
            <div style={s.drawerHeader}>
              <h2 style={s.drawerTitle}>CARRINHO</h2>
              <button onClick={() => setCartOpen(false)} style={s.closeBtn}>✕</button>
            </div>

            {cart.length === 0 ? (
              <div style={s.emptyCart}>
                <div style={{ fontSize: 48 }}>🛍️</div>
                <p>Seu carrinho está vazio.</p>
                <button onClick={() => setCartOpen(false)} style={s.keepShoppingBtn}>
                  CONTINUAR ESCOLHENDO
                </button>
              </div>
            ) : (
              <>
                <div style={s.cartItems}>
                  {cart.map(item => (
                    <div key={item.id} style={s.cartItem}>
                      <div style={{ ...s.cartItemIcon, overflow: 'hidden' }}>
                        {item.image
                          /* eslint-disable-next-line @next/next/no-img-element */
                          ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' as const }} />
                          : '✂️'
                        }
                      </div>
                      <div style={s.cartItemInfo}>
                        <div style={s.cartItemName}>{item.name}</div>
                        <div style={s.cartItemPrice}>{fmt(item.price_cents)}</div>
                      </div>
                      <div style={s.qtyControl}>
                        <button onClick={() => changeQty(item.id, -1)} style={s.qtyBtn}>−</button>
                        <span style={s.qtyNum}>{item.qty}</span>
                        <button onClick={() => changeQty(item.id, 1)} style={s.qtyBtn}>+</button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} style={s.removeBtn}>✕</button>
                    </div>
                  ))}
                </div>

                <div style={s.cartFooter}>
                  <div style={s.cartTotal}>
                    <span style={s.cartTotalLabel}>TOTAL</span>
                    <span style={s.cartTotalValue}>{fmt(totalCents)}</span>
                  </div>
                  <button onClick={() => { setCartOpen(false); setCheckout(true) }} style={s.checkoutBtn}>
                    FINALIZAR PEDIDO →
                  </button>
                  <button onClick={() => setCartOpen(false)} style={s.continueBtn}>
                    ← CONTINUAR ESCOLHENDO
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── CHECKOUT MODAL ── */}
      {checkout && (
        <div style={s.overlay} onClick={() => setCheckout(false)}>
          <div style={s.checkoutModal} onClick={e => e.stopPropagation()}>
            <div style={s.checkoutHead}>
              <div>
                <h2 style={s.checkoutTitle}>FINALIZAR PEDIDO</h2>
                {cart.length > 0 && <p style={s.checkoutSub}>{totalItems} serviço{totalItems > 1 ? 's' : ''} · {fmt(totalCents)}</p>}
              </div>
              <button onClick={() => setCheckout(false)} style={s.closeBtn}>✕</button>
            </div>

            <form onSubmit={handleSubmit} encType="multipart/form-data" style={s.checkoutForm}>
              <div style={s.checkoutSection}>
                <div style={s.checkoutSectionTitle}>SEUS DADOS</div>
                <div style={s.fieldGrid}>
                  <div>
                    <label style={s.lbl}>Nome completo *</label>
                    <input name="customer_name" required style={inp('name')} placeholder="Maria da Silva"
                      onFocus={() => setFocused('name')} onBlur={() => setFocused('')} />
                  </div>
                  <div>
                    <label style={s.lbl}>WhatsApp *</label>
                    <input name="customer_phone" required type="tel" style={inp('phone')} placeholder="(11) 99999-9999"
                      onFocus={() => setFocused('phone')} onBlur={() => setFocused('')} />
                  </div>
                </div>
                <div>
                  <label style={s.lbl}>E-mail <span style={s.opt}>— opcional</span></label>
                  <input name="customer_email" type="email" style={inp('email')} placeholder="maria@email.com"
                    onFocus={() => setFocused('email')} onBlur={() => setFocused('')} />
                </div>
                <div>
                  <label style={s.lbl}>Observações <span style={s.opt}>— opcional</span></label>
                  <textarea name="notes" rows={2} style={{ ...inp('notes'), resize: 'none' as const, fontFamily: 'inherit' }}
                    placeholder="Alguma informação extra para a Márcia..."
                    onFocus={() => setFocused('notes')} onBlur={() => setFocused('')} />
                </div>
                {cart.length === 0 && (
                  <div>
                    <label style={s.lbl}>Descrição do serviço *</label>
                    <textarea name="description" required rows={3}
                      style={{ ...inp('desc'), resize: 'none' as const, fontFamily: 'inherit' }}
                      placeholder="Descreva o que precisa: ajuste, bainha, costura..."
                      onFocus={() => setFocused('desc')} onBlur={() => setFocused('')} />
                  </div>
                )}
              </div>

              <div style={s.checkoutSection}>
                <div style={s.checkoutSectionTitle}>PAGAMENTO</div>

                {totalCents > 0 && (
                  <div style={s.totalDisplay}>
                    <span style={s.totalDisplayLabel}>TOTAL A PAGAR</span>
                    <span style={s.totalDisplayValue}>{fmt(totalCents)}</span>
                  </div>
                )}

                <div style={s.payOptions}>
                  {(['later', 'pix'] as const).map(m => (
                    <label key={m} style={{ ...s.payOpt, ...(payMethod === m ? s.payOptActive : {}) }}>
                      <input type="radio" name="payment_method" value={m}
                        checked={payMethod === m} onChange={() => setPayMethod(m)} style={{ display: 'none' }} />
                      <div style={s.payRadioCircle}>
                        {payMethod === m && <div style={s.payRadioDot} />}
                      </div>
                      <div>
                        <div style={s.payOptTitle}>{m === 'later' ? 'PAGAR NA RETIRADA' : 'PIX — PAGAR AGORA'}</div>
                        <div style={s.payOptDesc}>{m === 'later' ? 'Acertar pessoalmente com a Márcia' : 'Pague e envie o comprovante'}</div>
                      </div>
                    </label>
                  ))}
                </div>

                {payMethod === 'pix' && pixCode && (
                  <div style={s.pixBox}>
                    <div style={s.pixBoxTitle}>CÓDIGO PIX — COPIA E COLA</div>
                    <div style={s.pixCodeWrap}>
                      <code style={s.pixCodeText}>{pixCode}</code>
                    </div>
                    <button type="button" onClick={() => {
                      navigator.clipboard.writeText(pixCode)
                      setPixCopied(true)
                      setTimeout(() => setPixCopied(false), 3000)
                    }} style={pixCopied ? { ...s.copyBtn, background: '#000', color: '#C3D488' } : s.copyBtn}>
                      {pixCopied ? '✓ COPIADO!' : 'COPIAR CÓDIGO PIX'}
                    </button>
                    <p style={s.pixHint}>Abra o banco → PIX → Pix Copia e Cola → Cole o código</p>

                    <label style={s.fileZone}>
                      <input name="payment_proof" type="file" accept="image/*" capture="environment"
                        style={{ display: 'none' }}
                        onChange={e => setFileName(e.target.files?.[0]?.name ?? '')} />
                      <span style={{ fontSize: 16 }}>+</span>
                      <span style={s.fileText}>{fileName || 'ANEXAR COMPROVANTE'}</span>
                      {fileName && <span style={{ color: '#000', fontWeight: 700 }}>✓</span>}
                    </label>
                  </div>
                )}
              </div>

              {error && <div style={s.errMsg}>{error}</div>}

              <button type="submit" disabled={loading} style={loading ? { ...s.submitBtn, opacity: 0.6 } : s.submitBtn}>
                {loading ? 'ENVIANDO...' : 'CONFIRMAR PEDIDO'}
              </button>
            </form>
          </div>
        </div>
      )}

      <footer style={s.footer}>
        <span>© ATELIÊ MÁRCIA BRAGA</span>
        <span style={{ color: '#ccc' }}>·</span>
        <span>COSTURA &amp; CRIAÇÃO</span>
      </footer>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#fff', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", color: '#000' },

  /* Header */
  header: { position: 'sticky' as const, top: 0, zIndex: 50, background: '#fff', borderBottom: '1px solid #e8e8e8' },
  headerInner: { maxWidth: 1200, margin: '0 auto', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  headerLogo: { width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' as const },
  headerCenter: { flex: 1, textAlign: 'center' as const, display: 'flex', flexDirection: 'column', alignItems: 'center' },
  headerBrand: { fontSize: 14, fontWeight: 700, letterSpacing: '0.22em', color: '#000' },
  headerSub: { fontSize: 10, letterSpacing: '0.15em', color: '#aaa', marginTop: 1 },
  cartBtn: { position: 'relative' as const, background: 'none', border: 'none', cursor: 'pointer', color: '#000', padding: 6 },
  cartBadge: { position: 'absolute' as const, top: -2, right: -2, width: 18, height: 18, borderRadius: '50%', background: '#000', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' },

  /* Hero banner */
  heroBanner: { display: 'flex', minHeight: 500, background: '#0a0a0a' },
  heroBannerLeft: { flex: '0 0 44%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 48px', borderRight: '1px solid rgba(255,255,255,0.06)' },
  bannerLogo: { width: 260, height: 260, borderRadius: '50%', objectFit: 'cover' as const, border: '2px solid rgba(255,215,0,0.35)', boxShadow: '0 0 80px rgba(255,215,0,0.12)' },
  heroBannerRight: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 64px', gap: 20 },
  bannerEyebrow: { fontSize: 10, letterSpacing: '0.3em', color: 'rgba(255,215,0,0.6)', fontWeight: 700 },
  bannerTitle: { fontSize: 48, fontWeight: 300, color: '#fff', lineHeight: 1.15, letterSpacing: '-0.02em' },
  bannerText: { fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, maxWidth: 340 },
  bannerBtn: { display: 'inline-block', alignSelf: 'flex-start' as const, padding: '14px 28px', border: '1px solid rgba(255,255,255,0.3)', background: 'transparent', color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', cursor: 'pointer', marginTop: 8, transition: 'all 0.2s' },

  /* Catalog */
  catalog: { maxWidth: 1200, margin: '0 auto', padding: '64px 32px' },
  catalogHeader: { display: 'flex', alignItems: 'center', gap: 24, marginBottom: 40 },
  catalogTitle: { fontSize: 11, fontWeight: 700, letterSpacing: '0.3em', color: '#000', whiteSpace: 'nowrap' as const },
  catalogLine: { flex: 1, height: 1, background: '#e8e8e8' },
  emptyShop: { textAlign: 'center' as const, padding: '48px 0', color: '#888', fontSize: 15 },

  productGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 2, marginBottom: 48 },
  productCard: { background: '#fff', border: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column' },
  productImgPlaceholder: { background: '#f8f8f8', height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #f0f0f0' },
  productImgIcon: { fontSize: 56, opacity: 0.3 },
  productBody: { padding: '16px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 },
  productName: { fontSize: 13, fontWeight: 700, letterSpacing: '0.03em', color: '#000', lineHeight: 1.3 },
  productDesc: { fontSize: 12, color: '#888', lineHeight: 1.5, flex: 1 },
  productFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #f0f0f0', marginTop: 4 },
  productPrice: { fontSize: 15, fontWeight: 700, color: '#000' },
  addBtn: { padding: '8px 14px', background: '#000', color: '#fff', border: 'none', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', cursor: 'pointer', transition: 'all 0.2s' },
  addBtnDone: { background: '#C3D488', color: '#000' },

  customBox: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '32px 40px', background: '#fafafa', border: '1px solid #e8e8e8', gap: 24, flexWrap: 'wrap' as const },
  customLeft: { display: 'flex', flexDirection: 'column', gap: 6 },
  customEye: { fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: '#000' },
  customText: { fontSize: 13, color: '#888', maxWidth: 400, lineHeight: 1.6 },
  customBtn: { padding: '14px 28px', background: '#000', color: '#fff', border: 'none', fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', cursor: 'pointer', flexShrink: 0 },

  /* Sticky bar */
  stickyBar: { position: 'fixed' as const, bottom: 0, left: 0, right: 0, background: '#000', padding: '14px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 40 },
  stickyInfo: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500 },
  stickyBtn: { padding: '10px 24px', background: '#FFD700', color: '#000', border: 'none', fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', cursor: 'pointer' },

  /* Overlay */
  overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', justifyContent: 'flex-end' },

  /* Cart Drawer */
  drawer: { width: '100%', maxWidth: 420, background: '#fff', height: '100vh', overflowY: 'auto' as const, display: 'flex', flexDirection: 'column' },
  drawerHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 24px 20px', borderBottom: '1px solid #e8e8e8' },
  drawerTitle: { fontSize: 13, fontWeight: 700, letterSpacing: '0.2em' },
  closeBtn: { background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#888', padding: 4 },
  emptyCart: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 40, color: '#888', fontSize: 14 },
  keepShoppingBtn: { padding: '12px 24px', background: '#000', color: '#fff', border: 'none', fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', cursor: 'pointer' },
  cartItems: { flex: 1, padding: '8px 24px', display: 'flex', flexDirection: 'column', gap: 0 },
  cartItem: { display: 'flex', alignItems: 'center', gap: 14, padding: '18px 0', borderBottom: '1px solid #f4f4f4' },
  cartItemIcon: { width: 52, height: 52, background: '#f8f8f8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 },
  cartItemInfo: { flex: 1 },
  cartItemName: { fontSize: 13, fontWeight: 600, color: '#000', marginBottom: 3 },
  cartItemPrice: { fontSize: 13, color: '#888' },
  qtyControl: { display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #e8e8e8', padding: '4px 2px' },
  qtyBtn: { width: 28, height: 28, background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  qtyNum: { fontSize: 13, fontWeight: 700, minWidth: 20, textAlign: 'center' as const },
  removeBtn: { background: 'none', border: 'none', fontSize: 14, cursor: 'pointer', color: '#bbb', padding: 4 },
  cartFooter: { padding: '20px 24px', borderTop: '1px solid #e8e8e8', display: 'flex', flexDirection: 'column', gap: 10 },
  cartTotal: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16 },
  cartTotalLabel: { fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: '#888' },
  cartTotalValue: { fontSize: 22, fontWeight: 800, color: '#000' },
  checkoutBtn: { padding: '16px', background: '#000', color: '#fff', border: 'none', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', cursor: 'pointer' },
  continueBtn: { padding: '12px', background: 'none', border: 'none', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', cursor: 'pointer', color: '#888', textAlign: 'center' as const },

  /* Checkout modal */
  checkoutModal: { width: '100%', maxWidth: 560, background: '#fff', height: '100vh', overflowY: 'auto' as const, display: 'flex', flexDirection: 'column' },
  checkoutHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '24px 28px 20px', borderBottom: '1px solid #e8e8e8' },
  checkoutTitle: { fontSize: 13, fontWeight: 700, letterSpacing: '0.2em' },
  checkoutSub: { fontSize: 12, color: '#888', marginTop: 3 },
  checkoutForm: { flex: 1, padding: '28px', display: 'flex', flexDirection: 'column', gap: 28, overflowY: 'auto' as const },
  checkoutSection: { display: 'flex', flexDirection: 'column', gap: 18 },
  checkoutSectionTitle: { fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', paddingBottom: 12, borderBottom: '1px solid #000' },
  fieldGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  lbl: { display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#888', textTransform: 'uppercase' as const, marginBottom: 2 },
  opt: { fontWeight: 400, textTransform: 'none' as const, letterSpacing: 0, fontSize: 10, color: '#bbb' },
  totalDisplay: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: '#000' },
  totalDisplayLabel: { fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.5)' },
  totalDisplayValue: { fontSize: 20, fontWeight: 800, color: '#FFD700' },
  payOptions: { display: 'flex', flexDirection: 'column', gap: 1, border: '1px solid #e8e8e8' },
  payOpt: { display: 'flex', alignItems: 'center', gap: 14, padding: '15px 18px', cursor: 'pointer', background: '#fff', borderBottom: '1px solid #f4f4f4' },
  payOptActive: { background: '#fafafa' },
  payRadioCircle: { width: 18, height: 18, border: '1.5px solid #000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  payRadioDot: { width: 8, height: 8, borderRadius: '50%', background: '#000' },
  payOptTitle: { fontSize: 11, fontWeight: 700, letterSpacing: '0.12em' },
  payOptDesc: { fontSize: 11, color: '#888', marginTop: 2 },
  pixBox: { background: '#fafafa', border: '1px solid #e8e8e8', padding: '18px', display: 'flex', flexDirection: 'column', gap: 10 },
  pixBoxTitle: { fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: '#888' },
  pixCodeWrap: { background: '#fff', border: '1px solid #e8e8e8', padding: '10px 12px', overflowX: 'auto' as const },
  pixCodeText: { fontSize: 10, color: '#000', wordBreak: 'break-all' as const, letterSpacing: '0.02em', fontFamily: 'monospace' },
  copyBtn: { padding: '11px', background: '#000', color: '#fff', border: 'none', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', cursor: 'pointer' },
  pixHint: { fontSize: 11, color: '#888', lineHeight: 1.6 },
  fileZone: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', border: '1px dashed #bbb', cursor: 'pointer', background: '#fff' },
  fileText: { fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#555', flex: 1 },
  errMsg: { fontSize: 12, color: '#dc2626', padding: '10px 0', borderTop: '1px solid #fca5a5' },
  submitBtn: { padding: '16px', background: '#000', color: '#fff', border: 'none', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', cursor: 'pointer', marginTop: 'auto' },

  footer: { borderTop: '1px solid #e8e8e8', padding: '20px 32px', display: 'flex', justifyContent: 'center', gap: 16, fontSize: 10, letterSpacing: '0.15em', color: '#bbb' },
}
