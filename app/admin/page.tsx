import { getDashboardStats } from '@/lib/orders'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const STATUS_LABELS: Record<string, string> = {
  received: 'Recebido', in_progress: 'Em andamento',
  ready: 'Pronto', delivered: 'Entregue', cancelled: 'Cancelado',
}
const STATUS_COLORS: Record<string, [string, string]> = {
  received:    ['#dbeafe', '#1d4ed8'],
  in_progress: ['#fef3c7', '#d97706'],
  ready:       ['#dcfce7', '#15803d'],
  delivered:   ['#f3f4f6', '#6b7280'],
  cancelled:   ['#fee2e2', '#dc2626'],
}
const PAY_COLORS: Record<string, [string, string]> = {
  pending:   ['#fef3c7', '#d97706'],
  confirmed: ['#dcfce7', '#15803d'],
  rejected:  ['#fee2e2', '#dc2626'],
}

function fmt(cents: number | null) {
  if (!cents) return '—'
  return `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats()

  const statCards = [
    { label: 'Total de pedidos', value: stats.total_orders, icon: '📋', color: '#C3D488', light: '#f0f5dd' },
    { label: 'Pedidos hoje', value: stats.orders_today, icon: '📅', color: '#FFD700', light: '#fffacc' },
    { label: 'Aguardando atendimento', value: stats.orders_pending, icon: '🕐', color: '#fb923c', light: '#fff0e6' },
    { label: 'Em produção', value: stats.orders_in_progress, icon: '✂️', color: '#a78bfa', light: '#f0eeff' },
    { label: 'Receita confirmada', value: fmt(stats.revenue_confirmed), icon: '💰', color: '#34d399', light: '#e6faf4', big: true },
    { label: 'Receita pendente', value: fmt(stats.revenue_pending), icon: '⏳', color: '#f87171', light: '#fef2f2', big: true },
  ]

  return (
    <div>
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>Dashboard</h1>
          <p style={s.pageSub}>Visão geral do seu ateliê</p>
        </div>
        <Link href="/admin/orders" style={s.viewAllBtn}>Ver todos os pedidos →</Link>
      </div>

      {/* Stat cards */}
      <div style={s.statsGrid}>
        {statCards.map(card => (
          <div key={card.label} style={{ ...s.statCard, background: card.light, borderTop: `3px solid ${card.color}` }}>
            <div style={s.statIcon}>{card.icon}</div>
            <div style={s.statValue}>{card.value}</div>
            <div style={s.statLabel}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Status breakdown */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}>Pedidos por status</h2>
        <div style={s.statusRow}>
          {Object.entries(STATUS_LABELS).map(([key, label]) => {
            const count = stats.orders_by_status[key] ?? 0
            const [bg, fg] = STATUS_COLORS[key]
            const pct = stats.total_orders > 0 ? Math.round((count / stats.total_orders) * 100) : 0
            return (
              <div key={key} style={{ ...s.statusCard, background: bg }}>
                <div style={{ ...s.statusCount, color: fg }}>{count}</div>
                <div style={{ ...s.statusLabel, color: fg }}>{label}</div>
                <div style={s.statusBar}>
                  <div style={{ ...s.statusBarFill, width: `${pct}%`, background: fg }} />
                </div>
                <div style={{ ...s.statusPct, color: fg }}>{pct}%</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent orders */}
      <div style={s.section}>
        <div style={s.sectionHeader}>
          <h2 style={s.sectionTitle}>Pedidos recentes</h2>
          <Link href="/admin/orders" style={s.seeAll}>Ver todos</Link>
        </div>
        {stats.recent_orders.length === 0 ? (
          <div style={s.empty}>
            <div style={s.emptyIcon}>🛍️</div>
            <p>Nenhum pedido ainda. Compartilhe o QR Code!</p>
            <Link href="/admin/qrcode" style={s.emptyBtn}>Ver QR Code</Link>
          </div>
        ) : (
          <div style={s.orderList}>
            {stats.recent_orders.map(order => {
              const [sbg, sfg] = STATUS_COLORS[order.status]
              const [pbg, pfg] = PAY_COLORS[order.payment_status]
              return (
                <Link href={`/admin/orders/${order.id}`} key={order.id} style={s.orderRow}>
                  <div style={s.orderNum}>#{order.id}</div>
                  <div style={s.orderInfo}>
                    <div style={s.orderName}>{order.customer_name}</div>
                    <div style={s.orderDesc}>{order.description.slice(0, 55)}{order.description.length > 55 ? '…' : ''}</div>
                  </div>
                  <div style={s.orderMeta}>
                    <span style={{ ...s.badge, background: sbg, color: sfg }}>{STATUS_LABELS[order.status]}</span>
                    <span style={{ ...s.badge, background: pbg, color: pfg }}>
                      {order.payment_method === 'pix' ? '⚡ PIX' : '🤝 Retirada'}
                    </span>
                  </div>
                  <div style={s.orderRight}>
                    <div style={s.orderPrice}>{fmt(order.price_cents)}</div>
                    <div style={s.orderDate}>{fmtDate(order.created_at)}</div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  pageTitle: { fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#1a1a0e' },
  pageSub: { fontSize: 13, color: '#9ca3af', marginTop: 2 },
  viewAllBtn: { padding: '9px 18px', background: '#1a1a0e', color: '#FFD700', borderRadius: 10, fontSize: 13, fontWeight: 600 },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 },
  statCard: { borderRadius: 14, padding: '20px', display: 'flex', flexDirection: 'column', gap: 4 },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 26, fontWeight: 800, color: '#1a1a0e', lineHeight: 1 },
  statLabel: { fontSize: 12, color: '#6b7280', fontWeight: 500, marginTop: 2 },

  section: { marginBottom: 28 },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: '#1a1a0e', marginBottom: 14 },
  seeAll: { fontSize: 13, color: '#6b7280', fontWeight: 500, textDecoration: 'underline' },

  statusRow: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 },
  statusCard: { borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', gap: 4 },
  statusCount: { fontSize: 28, fontWeight: 800, lineHeight: 1 },
  statusLabel: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 8 },
  statusBar: { height: 4, background: 'rgba(0,0,0,0.1)', borderRadius: 2, overflow: 'hidden' },
  statusBarFill: { height: '100%', borderRadius: 2, transition: 'width 0.5s' },
  statusPct: { fontSize: 11, fontWeight: 700, marginTop: 2 },

  empty: { background: '#fff', borderRadius: 14, padding: '48px', textAlign: 'center', color: '#9ca3af', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, border: '2px dashed #e5e7eb' },
  emptyIcon: { fontSize: 40 },
  emptyBtn: { padding: '10px 24px', background: '#FFD700', color: '#1a1a0e', borderRadius: 8, fontWeight: 700, fontSize: 14 },

  orderList: { background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1px solid #f0f0f0' },
  orderRow: { display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderBottom: '1px solid #f4f4f4', transition: 'background 0.15s', cursor: 'pointer' },
  orderNum: { fontSize: 12, fontWeight: 700, color: '#9ca3af', minWidth: 32 },
  orderInfo: { flex: 1, minWidth: 0 },
  orderName: { fontSize: 14, fontWeight: 700, color: '#1a1a0e', marginBottom: 2 },
  orderDesc: { fontSize: 12, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
  orderMeta: { display: 'flex', gap: 6, flexWrap: 'wrap' as const },
  badge: { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' as const },
  orderRight: { textAlign: 'right' as const, flexShrink: 0 },
  orderPrice: { fontSize: 14, fontWeight: 700, color: '#1a1a0e' },
  orderDate: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
}
