'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type Order = {
  id: number; created_at: string; customer_name: string; customer_phone: string
  customer_email: string | null; description: string; notes: string | null
  price_cents: number | null; payment_method: 'pix' | 'later'
  payment_proof: string | null; payment_status: 'pending' | 'confirmed' | 'rejected'
  status: 'received' | 'in_progress' | 'ready' | 'delivered' | 'cancelled'
}

const STATUS_OPTIONS = [
  { value: 'received',    label: 'Recebido',       color: '#1d4ed8' },
  { value: 'in_progress', label: 'Em andamento',   color: '#d97706' },
  { value: 'ready',       label: 'Pronto',          color: '#15803d' },
  { value: 'delivered',   label: 'Entregue',        color: '#6b7280' },
  { value: 'cancelled',   label: 'Cancelado',       color: '#dc2626' },
]
const PAY_OPTIONS = [
  { value: 'pending',   label: 'Pendente',   color: '#d97706' },
  { value: 'confirmed', label: 'Confirmado', color: '#15803d' },
  { value: 'rejected',  label: 'Rejeitado',  color: '#dc2626' },
]

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [status, setStatus] = useState('')
  const [payStatus, setPayStatus] = useState('')
  const [priceInput, setPriceInput] = useState('')
  const [imgZoom, setImgZoom] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch(`/api/orders/${id}`)
    if (!res.ok) { setLoading(false); return }
    const data: Order = await res.json()
    setOrder(data)
    setStatus(data.status)
    setPayStatus(data.payment_status)
    setPriceInput(data.price_cents != null ? (data.price_cents / 100).toFixed(2).replace('.', ',') : '')
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  async function save() {
    setSaving(true)
    const price_cents = priceInput
      ? Math.round(parseFloat(priceInput.replace(',', '.')) * 100)
      : null
    const res = await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, payment_status: payStatus, price_cents }),
    })
    setSaving(false)
    if (res.ok) {
      setToast('✓ Salvo com sucesso!')
      load()
      setTimeout(() => setToast(''), 3000)
    } else {
      setToast('✗ Erro ao salvar')
    }
  }

  if (loading) return <div style={s.loading}><div style={s.spinner} />Carregando...</div>
  if (!order) return <div style={s.loading}>Pedido não encontrado.</div>

  const currentStatus = STATUS_OPTIONS.find(o => o.value === order.status)
  const currentPay = PAY_OPTIONS.find(o => o.value === order.payment_status)

  return (
    <div>
      {/* Top bar */}
      <div style={s.topBar}>
        <div style={s.topLeft}>
          <Link href="/admin/orders" style={s.back}>← Pedidos</Link>
          <div>
            <div style={s.topTitle}>Pedido #{order.id}</div>
            <div style={s.topDate}>{fmtDate(order.created_at)}</div>
          </div>
        </div>
        <div style={s.topBadges}>
          {currentStatus && (
            <span style={{ ...s.bigBadge, color: currentStatus.color, border: `1.5px solid ${currentStatus.color}20`, background: currentStatus.color + '12' }}>
              {currentStatus.label}
            </span>
          )}
          {currentPay && (
            <span style={{ ...s.bigBadge, color: currentPay.color, border: `1.5px solid ${currentPay.color}20`, background: currentPay.color + '12' }}>
              {currentPay.label}
            </span>
          )}
        </div>
      </div>

      <div style={s.grid}>
        {/* Left column */}
        <div style={s.col}>
          {/* Customer */}
          <div style={s.card}>
            <h2 style={s.cardTitle}>👤 Cliente</h2>
            <div style={s.infoGrid}>
              <div style={s.infoItem}>
                <span style={s.infoKey}>Nome</span>
                <span style={s.infoVal}>{order.customer_name}</span>
              </div>
              <div style={s.infoItem}>
                <span style={s.infoKey}>WhatsApp</span>
                <a href={`https://wa.me/55${order.customer_phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                  style={s.waLink}>
                  {order.customer_phone} ↗
                </a>
              </div>
              {order.customer_email && (
                <div style={s.infoItem}>
                  <span style={s.infoKey}>E-mail</span>
                  <span style={s.infoVal}>{order.customer_email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Service */}
          <div style={s.card}>
            <h2 style={s.cardTitle}>✂️ Serviço</h2>
            <div style={s.descBox}>{order.description}</div>
            {order.notes && (
              <>
                <div style={s.cardSubtitle}>Observações</div>
                <div style={{ ...s.descBox, background: '#fffdf0', borderColor: '#FFD700' }}>{order.notes}</div>
              </>
            )}
          </div>

          {/* Payment */}
          <div style={s.card}>
            <h2 style={s.cardTitle}>💳 Pagamento</h2>
            <div style={s.infoItem}>
              <span style={s.infoKey}>Método</span>
              <span style={s.infoVal}>{order.payment_method === 'pix' ? '⚡ PIX' : '🤝 Pagar na retirada'}</span>
            </div>
            {order.payment_proof ? (
              <div>
                <div style={s.cardSubtitle}>Comprovante PIX</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={order.payment_proof}
                  alt="Comprovante"
                  onClick={() => setImgZoom(true)}
                  style={s.proofThumb}
                />
                <a href={order.payment_proof} target="_blank" rel="noreferrer" style={s.proofLink}>
                  Abrir em tamanho original ↗
                </a>
              </div>
            ) : (
              <div style={s.noProof}>Nenhum comprovante anexado</div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={s.colRight}>
          <div style={s.card}>
            <h2 style={s.cardTitle}>⚙️ Atualizar pedido</h2>

            <label style={s.fieldLabel}>
              Valor cobrado (R$)
              <div style={s.priceInputWrap}>
                <span style={s.pricePrefix}>R$</span>
                <input
                  type="text"
                  value={priceInput}
                  onChange={e => setPriceInput(e.target.value)}
                  placeholder="0,00"
                  style={s.priceInput}
                />
              </div>
            </label>

            <label style={s.fieldLabel}>
              Status do pedido
              <div style={s.selectGroup}>
                {STATUS_OPTIONS.map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => setStatus(opt.value)}
                    style={status === opt.value
                      ? { ...s.selectBtn, ...s.selectBtnActive, color: opt.color, borderColor: opt.color, background: opt.color + '15' }
                      : s.selectBtn}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </label>

            <label style={s.fieldLabel}>
              Status do pagamento
              <div style={s.selectGroup}>
                {PAY_OPTIONS.map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => setPayStatus(opt.value)}
                    style={payStatus === opt.value
                      ? { ...s.selectBtn, ...s.selectBtnActive, color: opt.color, borderColor: opt.color, background: opt.color + '15' }
                      : s.selectBtn}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </label>

            {toast && (
              <div style={{ ...s.toast, background: toast.startsWith('✓') ? '#dcfce7' : '#fee2e2', color: toast.startsWith('✓') ? '#15803d' : '#dc2626' }}>
                {toast}
              </div>
            )}

            <button onClick={save} disabled={saving} style={saving ? { ...s.saveBtn, opacity: 0.7 } : s.saveBtn}>
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </button>

            <a
              href={`https://wa.me/55${order.customer_phone.replace(/\D/g,'')}?text=${encodeURIComponent(`Olá ${order.customer_name}! Temos novidades sobre seu pedido no Ateliê Márcia Braga.`)}`}
              target="_blank"
              rel="noreferrer"
              style={s.waBtn}
            >
              <span>💬</span> Enviar mensagem no WhatsApp
            </a>

            <button onClick={() => router.push('/admin/orders')} style={s.backBtn}>
              ← Voltar para pedidos
            </button>
          </div>
        </div>
      </div>

      {/* Image zoom modal */}
      {imgZoom && order.payment_proof && (
        <div style={s.modal} onClick={() => setImgZoom(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={order.payment_proof} alt="Comprovante" style={s.modalImg} onClick={e => e.stopPropagation()} />
          <button style={s.modalClose} onClick={() => setImgZoom(false)}>✕</button>
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  loading: { display: 'flex', alignItems: 'center', gap: 12, padding: 40, color: '#9ca3af', fontSize: 15 },
  spinner: { width: 20, height: 20, border: '2px solid #e5e7eb', borderTopColor: '#FFD700', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },

  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap' as const, gap: 12 },
  topLeft: { display: 'flex', alignItems: 'center', gap: 16 },
  back: { padding: '8px 14px', background: '#f3f4f6', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#4b5563' },
  topTitle: { fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#1a1a0e' },
  topDate: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  topBadges: { display: 'flex', gap: 8 },
  bigBadge: { padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700 },

  grid: { display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 20, alignItems: 'start' },
  col: { display: 'flex', flexDirection: 'column', gap: 16 },
  colRight: { display: 'flex', flexDirection: 'column', gap: 16 },

  card: { background: '#fff', borderRadius: 16, padding: '22px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', gap: 14 },
  cardTitle: { fontSize: 14, fontWeight: 700, color: '#4b5563', display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 10, borderBottom: '1.5px solid #f0f0f0' },
  cardSubtitle: { fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginTop: 4 },

  infoGrid: { display: 'flex', flexDirection: 'column', gap: 10 },
  infoItem: { display: 'flex', gap: 12, alignItems: 'baseline' },
  infoKey: { fontSize: 12, fontWeight: 700, color: '#9ca3af', minWidth: 70 },
  infoVal: { fontSize: 14, color: '#1a1a0e' },
  waLink: { fontSize: 14, color: '#25D366', fontWeight: 600, textDecoration: 'underline' },

  descBox: { background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: '#1a1a0e', lineHeight: 1.7, whiteSpace: 'pre-wrap' as const },
  proofThumb: { width: '100%', maxHeight: 300, objectFit: 'contain' as const, borderRadius: 10, border: '1px solid #e5e7eb', cursor: 'zoom-in', display: 'block' },
  proofLink: { fontSize: 12, color: '#3b82f6', textDecoration: 'underline', marginTop: 6, display: 'block' },
  noProof: { fontSize: 13, color: '#9ca3af', fontStyle: 'italic', padding: '12px 0' },

  fieldLabel: { display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.08em' },
  priceInputWrap: { display: 'flex', alignItems: 'center', border: '1.5px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', background: '#fafafa' },
  pricePrefix: { padding: '10px 12px', background: '#f3f4f6', fontSize: 14, color: '#6b7280', fontWeight: 600, borderRight: '1px solid #e5e7eb' },
  priceInput: { flex: 1, padding: '10px 12px', border: 'none', background: 'transparent', fontSize: 15, fontWeight: 700, color: '#1a1a0e', outline: 'none' },

  selectGroup: { display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginTop: 2 },
  selectBtn: { padding: '7px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: '#fafafa', color: '#6b7280', transition: 'all 0.15s' },
  selectBtnActive: { fontWeight: 700 },

  toast: { padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600 },
  saveBtn: { padding: '13px', background: 'linear-gradient(135deg, #FFD700, #d4a800)', color: '#1a1a0e', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  waBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', background: '#25D366', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  backBtn: { padding: '11px', background: '#f3f4f6', color: '#6b7280', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' },

  modal: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 },
  modalImg: { maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, objectFit: 'contain' as const },
  modalClose: { position: 'absolute' as const, top: 20, right: 20, width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
}
