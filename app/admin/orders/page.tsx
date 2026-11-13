import { listOrders } from '@/lib/orders'
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
const PAY_LABELS: Record<string, string> = {
  pending: 'Pendente', confirmed: 'Confirmado', rejected: 'Rejeitado',
}
const PAY_COLORS: Record<string, [string, string]> = {
  pending:   ['#fef3c7', '#d97706'],
  confirmed: ['#dcfce7', '#15803d'],
  rejected:  ['#fee2e2', '#dc2626'],
}

function fmt(cents: number | null) {
  if (cents == null) return '—'
  return `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'
  })
}

export default async function OrdersPage() {
  const orders = await listOrders()

  return (
    <div>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Pedidos</h1>
          <p style={s.sub}>{orders.length} pedido{orders.length !== 1 ? 's' : ''} no total</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div style={s.empty}>
          <div style={{ fontSize: 48 }}>🛍️</div>
          <p style={{ fontSize: 15, color: '#6b7280' }}>Nenhum pedido ainda.</p>
          <Link href="/admin/qrcode" style={s.emptyBtn}>Ver QR Code para compartilhar</Link>
        </div>
      ) : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr style={s.thead}>
                {['#', 'Data', 'Cliente', 'WhatsApp', 'Serviço', 'Valor', 'Status', 'Pagamento', ''].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order, i) => {
                const [sbg, sfg] = STATUS_COLORS[order.status]
                const [pbg, pfg] = PAY_COLORS[order.payment_status]
                return (
                  <tr key={order.id} style={i % 2 === 0 ? s.trEven : s.trOdd}>
                    <td style={{ ...s.td, color: '#9ca3af', fontWeight: 700 }}>{order.id}</td>
                    <td style={{ ...s.td, fontSize: 12, color: '#9ca3af' }}>{fmtDate(order.created_at)}</td>
                    <td style={{ ...s.td, fontWeight: 700 }}>{order.customer_name}</td>
                    <td style={s.td}>{order.customer_phone}</td>
                    <td style={{ ...s.td, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                      {order.description}
                    </td>
                    <td style={{ ...s.td, fontWeight: 700 }}>{fmt(order.price_cents)}</td>
                    <td style={s.td}>
                      <span style={{ ...s.badge, background: sbg, color: sfg }}>{STATUS_LABELS[order.status]}</span>
                    </td>
                    <td style={s.td}>
                      <span style={{ ...s.badge, background: pbg, color: pfg }}>{PAY_LABELS[order.payment_status]}</span>
                    </td>
                    <td style={s.td}>
                      <Link href={`/admin/orders/${order.id}`} style={s.detailBtn}>Abrir</Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#1a1a0e' },
  sub: { fontSize: 13, color: '#9ca3af', marginTop: 2 },
  empty: { background: '#fff', borderRadius: 16, padding: '64px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, border: '2px dashed #e5e7eb' },
  emptyBtn: { padding: '12px 28px', background: '#FFD700', color: '#1a1a0e', borderRadius: 10, fontWeight: 700, fontSize: 14 },
  tableWrap: { background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', overflow: 'auto', border: '1px solid #f0f0f0' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  thead: { background: '#fafafa', borderBottom: '2px solid #f0f0f0' },
  th: { padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#6b7280', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.08em', whiteSpace: 'nowrap' as const },
  td: { padding: '14px 16px', color: '#1a1a0e', verticalAlign: 'middle' },
  trEven: { borderBottom: '1px solid #f9f9f9' },
  trOdd: { background: '#fafaf8', borderBottom: '1px solid #f4f4f4' },
  badge: { display: 'inline-block', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' as const },
  detailBtn: { padding: '6px 14px', background: '#1a1a0e', color: '#FFD700', borderRadius: 8, fontSize: 12, fontWeight: 700, display: 'inline-block' },
}
