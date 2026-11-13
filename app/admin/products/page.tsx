'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

type Product = {
  id: number; name: string; description: string | null
  price_cents: number; active: number; image: string | null
}

function fmt(cents: number) {
  return `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', description: '', price: '' })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    const r = await fetch('/api/products?all=1')
    if (r.ok) setProducts(await r.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openNew() {
    setForm({ name: '', description: '', price: '' })
    setImageFile(null); setImagePreview(null); setRemoveImage(false)
    setEditId(null); setShowForm(true); setMsg('')
  }

  function openEdit(p: Product) {
    setForm({
      name: p.name,
      description: p.description ?? '',
      price: (p.price_cents / 100).toFixed(2).replace('.', ','),
    })
    setImageFile(null)
    setImagePreview(p.image ?? null)
    setRemoveImage(false)
    setEditId(p.id); setShowForm(true); setMsg('')
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setImageFile(f)
    setImagePreview(URL.createObjectURL(f))
    setRemoveImage(false)
  }

  function clearImage() {
    setImageFile(null)
    setImagePreview(null)
    setRemoveImage(true)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function save() {
    setSaving(true); setMsg('')
    const price_cents = Math.round(parseFloat(form.price.replace(',', '.')) * 100)
    if (!form.name || isNaN(price_cents) || price_cents <= 0) {
      setMsg('Preencha nome e preço válido.'); setSaving(false); return
    }

    const fd = new FormData()
    fd.append('name', form.name.trim())
    fd.append('description', form.description.trim())
    fd.append('price_cents', String(price_cents))
    if (imageFile) fd.append('image', imageFile)
    if (removeImage) fd.append('remove_image', '1')

    if (editId) {
      await fetch(`/api/products/${editId}`, { method: 'PUT', body: fd })
    } else {
      await fetch('/api/products', { method: 'POST', body: fd })
    }
    setSaving(false); setShowForm(false); load()
  }

  async function toggleActive(p: Product) {
    await fetch(`/api/products/${p.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: p.active ? 0 : 1 }),
    })
    load()
  }

  async function del(id: number) {
    if (!confirm('Remover este produto?')) return
    await fetch(`/api/products/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Produtos</h1>
          <p style={s.sub}>{products.length} produto{products.length !== 1 ? 's' : ''} cadastrado{products.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openNew} style={s.addBtn}>+ Novo produto</button>
      </div>

      {/* ── MODAL ── */}
      {showForm && (
        <div style={s.overlay} onClick={() => setShowForm(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHead}>
              <h2 style={s.modalTitle}>{editId ? 'Editar produto' : 'Novo produto'}</h2>
              <button onClick={() => setShowForm(false)} style={s.closeBtn}>✕</button>
            </div>

            {/* Image upload */}
            <div style={s.imgSection}>
              <div
                style={imagePreview ? s.imgPreviewWrap : s.imgDropZone}
                onClick={() => fileRef.current?.click()}
              >
                {imagePreview ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={imagePreview} alt="preview" style={s.imgPreview} />
                ) : (
                  <div style={s.imgDropContent}>
                    <span style={s.imgDropIcon}>🖼️</span>
                    <span style={s.imgDropText}>CLIQUE PARA ADICIONAR FOTO</span>
                    <span style={s.imgDropHint}>JPG, PNG ou WEBP</span>
                  </div>
                )}
              </div>
              {imagePreview && (
                <div style={s.imgActions}>
                  <button type="button" onClick={() => fileRef.current?.click()} style={s.imgChangeBtn}>
                    Trocar foto
                  </button>
                  <button type="button" onClick={clearImage} style={s.imgRemoveBtn}>
                    Remover foto
                  </button>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }} onChange={handleImageChange} />
            </div>

            {/* Fields */}
            <div style={s.fields}>
              <div style={s.field}>
                <label style={s.lbl}>NOME DO SERVIÇO *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  style={s.input} placeholder="Ex: Bainha simples, Ajuste de vestido..." />
              </div>
              <div style={s.field}>
                <label style={s.lbl}>DESCRIÇÃO <span style={s.opt}>— opcional</span></label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} style={s.textarea} placeholder="Detalhes do serviço..." />
              </div>
              <div style={s.field}>
                <label style={s.lbl}>PREÇO (R$) *</label>
                <div style={s.priceWrap}>
                  <span style={s.pricePrefix}>R$</span>
                  <input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    style={s.priceInput} placeholder="0,00" />
                </div>
              </div>
            </div>

            {msg && <div style={s.errMsg}>{msg}</div>}

            <div style={s.modalActions}>
              <button onClick={() => setShowForm(false)} style={s.cancelBtn}>Cancelar</button>
              <button onClick={save} disabled={saving} style={s.saveBtn}>
                {saving ? 'Salvando...' : editId ? 'Salvar alterações' : 'Criar produto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── GRID ── */}
      {loading ? (
        <div style={s.empty}>Carregando...</div>
      ) : products.length === 0 ? (
        <div style={s.emptyCard}>
          <div style={{ fontSize: 48 }}>✂️</div>
          <p style={{ fontSize: 15, color: '#6b7280' }}>Nenhum produto cadastrado ainda.</p>
          <p style={{ fontSize: 13, color: '#9ca3af' }}>Adicione os serviços que você oferece para que os clientes possam selecionar.</p>
          <button onClick={openNew} style={s.addBtn}>+ Adicionar primeiro produto</button>
        </div>
      ) : (
        <div style={s.grid}>
          {products.map(p => (
            <div key={p.id} style={{ ...s.card, opacity: p.active ? 1 : 0.55 }}>
              {/* Product image */}
              <div style={s.cardImg}>
                {p.image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={p.image} alt={p.name} style={s.cardImgEl} />
                ) : (
                  <div style={s.cardImgEmpty}>
                    <span style={{ fontSize: 36, opacity: 0.25 }}>✂️</span>
                    <span style={s.cardImgEmptyText}>Sem foto</span>
                  </div>
                )}
                {!p.active && <div style={s.inactiveBadge}>INATIVO</div>}
              </div>

              <div style={s.cardBody}>
                <div style={s.cardTop}>
                  <div style={s.cardName}>{p.name}</div>
                  <div style={s.cardPrice}>{fmt(p.price_cents)}</div>
                </div>
                {p.description && <div style={s.cardDesc}>{p.description}</div>}
                <div style={s.cardActions}>
                  <button onClick={() => toggleActive(p)}
                    style={{ ...s.chip, background: p.active ? '#dcfce7' : '#fee2e2', color: p.active ? '#15803d' : '#dc2626' }}>
                    {p.active ? '● Ativo' : '○ Inativo'}
                  </button>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openEdit(p)} style={s.editBtn}>Editar</button>
                    <button onClick={() => del(p.id)} style={s.delBtn}>✕</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  title: { fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#1a1a0e' },
  sub: { fontSize: 13, color: '#9ca3af', marginTop: 2 },
  addBtn: { padding: '10px 20px', background: '#000', color: '#FFD700', border: 'none', fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', cursor: 'pointer', borderRadius: 8 },

  overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 },
  modal: { background: '#fff', borderRadius: 16, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' as const, display: 'flex', flexDirection: 'column' },
  modalHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 24px 16px' },
  modalTitle: { fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#1a1a0e' },
  closeBtn: { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#9ca3af', padding: 4 },

  imgSection: { padding: '0 24px 16px', display: 'flex', flexDirection: 'column', gap: 8 },
  imgDropZone: { border: '2px dashed #e0e0e0', borderRadius: 10, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#fafafa', transition: 'border-color 0.2s' },
  imgDropContent: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 },
  imgDropIcon: { fontSize: 32 },
  imgDropText: { fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#888' },
  imgDropHint: { fontSize: 10, color: '#bbb' },
  imgPreviewWrap: { borderRadius: 10, overflow: 'hidden', height: 220, cursor: 'pointer', border: '1px solid #e8e8e8' },
  imgPreview: { width: '100%', height: '100%', objectFit: 'cover' as const, display: 'block' },
  imgActions: { display: 'flex', gap: 8 },
  imgChangeBtn: { flex: 1, padding: '8px', border: '1px solid #e0e0e0', background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: 6, color: '#333' },
  imgRemoveBtn: { flex: 1, padding: '8px', border: '1px solid #fca5a5', background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: 6, color: '#dc2626' },

  fields: { padding: '0 24px 16px', display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  lbl: { fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#888' },
  opt: { fontWeight: 400, letterSpacing: 0, fontSize: 10, color: '#bbb' },
  input: { padding: '11px 14px', border: '1px solid #e5e7eb', fontSize: 14, color: '#000', outline: 'none', borderRadius: 0 },
  textarea: { padding: '11px 14px', border: '1px solid #e5e7eb', fontSize: 14, color: '#000', outline: 'none', resize: 'vertical' as const, fontFamily: 'inherit', borderRadius: 0 },
  priceWrap: { display: 'flex', border: '1px solid #e5e7eb' },
  pricePrefix: { padding: '11px 12px', background: '#f9f9f9', fontSize: 14, color: '#888', borderRight: '1px solid #e5e7eb' },
  priceInput: { flex: 1, padding: '11px 12px', border: 'none', fontSize: 15, fontWeight: 700, outline: 'none' },
  errMsg: { margin: '0 24px', fontSize: 12, color: '#dc2626', padding: '8px 12px', background: '#fef2f2', border: '1px solid #fca5a5' },
  modalActions: { display: 'flex', gap: 10, justifyContent: 'flex-end', padding: '16px 24px 24px' },
  cancelBtn: { padding: '10px 20px', background: '#f3f4f6', color: '#6b7280', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRadius: 6 },
  saveBtn: { padding: '10px 24px', background: '#000', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer', borderRadius: 6 },

  empty: { textAlign: 'center', padding: 40, color: '#9ca3af' },
  emptyCard: { background: '#fff', border: '2px dashed #e5e7eb', borderRadius: 16, padding: 64, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 },
  card: { background: '#fff', border: '1px solid #f0f0f0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' },
  cardImg: { height: 180, background: '#f8f8f8', position: 'relative' as const, overflow: 'hidden' },
  cardImgEl: { width: '100%', height: '100%', objectFit: 'cover' as const, display: 'block' },
  cardImgEmpty: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 },
  cardImgEmptyText: { fontSize: 11, color: '#ccc', letterSpacing: '0.08em', fontWeight: 600 },
  inactiveBadge: { position: 'absolute' as const, top: 10, left: 10, background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', padding: '4px 8px' },
  cardBody: { padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  cardName: { fontSize: 14, fontWeight: 700, color: '#1a1a0e', flex: 1, lineHeight: 1.3 },
  cardPrice: { fontSize: 15, fontWeight: 800, color: '#000', flexShrink: 0 },
  cardDesc: { fontSize: 12, color: '#9ca3af', lineHeight: 1.5, flex: 1 },
  cardActions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid #f4f4f4', marginTop: 4 },
  chip: { padding: '4px 10px', fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', borderRadius: 20 },
  editBtn: { padding: '5px 12px', background: '#f3f4f6', color: '#1a1a0e', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: 6 },
  delBtn: { padding: '5px 10px', background: '#fee2e2', color: '#dc2626', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', borderRadius: 6 },
}
