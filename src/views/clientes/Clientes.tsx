import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../supabaseClient'

type Cliente = {
  id?: string
  empresa: string
  nif?: string | null
  contacto?: string | null
  email?: string | null
  telefono?: string | null
  direccion?: string | null
  sector?: string | null
  notas?: string | null
  owner?: string | null
  actualizado_en?: string | null
}

const blank: Cliente = {
  empresa: '',
  nif: '',
  contacto: '',
  email: '',
  telefono: '',
  direccion: '',
  sector: '',
  notas: ''
}

export default function Clientes() {
  const [items, setItems] = useState<Cliente[]>([])
  const [q, setQ] = useState('')
  const [form, setForm] = useState<Cliente>(blank)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .order('actualizado_en', { ascending: false })
      .limit(200)
    setItems((data || []) as any)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(
    () =>
      items.filter((i) => JSON.stringify(i).toLowerCase().includes(q.toLowerCase())),
    [items, q]
  )

  const save = async () => {
    if (!form.empresa) return alert('Empresa es requerida')
    if (form.id) {
      await supabase.from('clientes').update(form).eq('id', form.id)
    } else {
      const { data: user } = await supabase.auth.getUser()
      await supabase.from('clientes').insert({ ...form, owner: user.user?.id } as any)
    }
    setForm({ ...blank })
    await load()
  }

  const del = async (id?: string) => {
    if (!id) return
    if (!confirm('¿Borrar cliente?')) return
    await supabase.from('clientes').delete().eq('id', id)
    await load()
  }

  return (
    <section style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          placeholder="Buscar cliente..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button onClick={() => setForm({ ...blank })} className="btn">Nuevo cliente</button>
        <button onClick={load} className="btn secondary">Refrescar</button>
      </div>

      <Editor form={form} setForm={setForm} onSave={save} onCancel={() => setForm({ ...blank })} />

      {loading ? (
        <div style={{ padding: 12 }}>Cargando...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 12, marginTop: 12 }}>
          {filtered.map((c) => (
            <div key={c.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{c.empresa}</strong>
                <span style={{ border: '1px solid #ddd', padding: '2px 8px', borderRadius: 12 }}>
                  {c.sector || 'Sin sector'}
                </span>
              </div>
              <small style={{ color: '#666' }}>NIF: {c.nif || '—'}</small>
              <div style={{ fontSize: 14 }}>Contacto: {c.contacto || '—'}</div>
              <div style={{ fontSize: 14, color: '#555' }}>{c.email || '—'} · {c.telefono || '—'}</div>
              <div style={{ fontSize: 14 }}>{c.direccion || '—'}</div>
              <div style={{ fontSize: 14 }}>{c.notas || ''}</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <button onClick={() => setForm(c)} className="btn secondary">Editar</button>
                <button onClick={() => del(c.id)} className="btn secondary" style={{ color: '#b91c1c' }}>
                  Borrar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

/** Editor embebido — esto evita el “editor is not defined” */
function Editor({
  form,
  setForm,
  onSave,
  onCancel
}: {
  form: Cliente
  setForm: React.Dispatch<React.SetStateAction<Cliente>>
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        <label>Empresa<input value={form.empresa} onChange={(e) => setForm({ ...form, empresa: e.target.value })} /></label>
        <label>NIF<input value={form.nif || ''} onChange={(e) => setForm({ ...form, nif: e.target.value })} /></label>
        <label>Contacto<input value={form.contacto || ''} onChange={(e) => setForm({ ...form, contacto: e.target.value })} /></label>
        <label>Email<input value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label>Teléfono<input value={form.telefono || ''} onChange={(e) => setForm({ ...form, telefono: e.target.value })} /></label>
        <label>Dirección<input value={form.direccion || ''} onChange={(e) => setForm({ ...form, direccion: e.target.value })} /></label>
        <label>Sector<input value={form.sector || ''} onChange={(e) => setForm({ ...form, sector: e.target.value })} /></label>
        <label style={{ gridColumn: '1 / -1' }}>Notas<input value={form.notas || ''} onChange={(e) => setForm({ ...form, notas: e.target.value })} /></label>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
        <button onClick={onCancel} className="btn secondary">Cancelar</button>
        <button onClick={onSave} className="btn">Guardar</button>
      </div>
    </div>
  )
}
