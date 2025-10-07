import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../supabaseClient'

type Tarea = {
  id?: string
  titulo: string
  descripcion?: string | null
  fecha?: string | null
  estado: 'Pendiente' | 'En curso' | 'Hecho'
  departamento: 'comercial' | 'tecnico' | 'envios' | 'administracion'
  asignado_a?: string | null
  creador?: string | null
  ref_modulo?: string | null
  ref_id?: string | null
}

const blank: Tarea = {
  titulo: '',
  descripcion: '',
  fecha: '',
  estado: 'Pendiente',
  departamento: 'comercial',
  asignado_a: null,
  creador: null,
  ref_modulo: '',
  ref_id: ''
}

export default function Tareas() {
  const [items, setItems] = useState<Tarea[]>([])
  const [q, setQ] = useState('')
  const [estado, setEstado] = useState('')
  const [form, setForm] = useState<Tarea>(blank)

  const load = async () => {
    const { data, error } = await supabase
      .from('tareas')
      .select('*')
      .order('fecha', { ascending: false })
      .limit(200)
    if (!error) setItems((data || []) as any)
  }

  useEffect(() => {
    load()
    const ch = supabase
      .channel('tareas-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tareas' }, () => load())
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [])

  const filtered = useMemo(
    () =>
      items
        .filter((i) => !estado || i.estado === (estado as any))
        .filter((i) => JSON.stringify(i).toLowerCase().includes(q.toLowerCase())),
    [items, estado, q]
  )

  const save = async () => {
    if (!form.titulo) return alert('Título es requerido')
    if (form.id) {
      await supabase.from('tareas').update(form).eq('id', form.id)
    } else {
      const { data: user } = await supabase.auth.getUser()
      const payload = {
        ...form,
        creador: user.user?.id,
        asignado_a: form.asignado_a || user.user?.id
      }
      await supabase.from('tareas').insert(payload as any)
    }
    setForm({ ...blank })
    await load()
  }

  const del = async (id: string | undefined) => {
    if (!id) return
    if (!confirm('¿Borrar tarea?')) return
    await supabase.from('tareas').delete().eq('id', id)
    await load()
  }

  return (
    <section style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          placeholder="Buscar tarea..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ minWidth: 220 }}
        />
        <select value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="">Todas</option>
          <option>Pendiente</option>
          <option>En curso</option>
          <option>Hecho</option>
        </select>
        <button onClick={() => setForm({ ...blank })} className="btn" style={{ marginLeft: 'auto' }}>
          Nueva tarea
        </button>
      </div>

      <Editor form={form} setForm={setForm} onSave={save} onCancel={() => setForm({ ...blank })} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0,1fr))',
          gap: 12,
          marginTop: 12
        }}
      >
        {filtered.map((t: any) => (
          <div key={t.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{t.titulo}</strong>
              <span style={{ background: '#eef', padding: '2px 8px', borderRadius: 12 }}>{t.estado}</span>
            </div>
            <small style={{ color: '#666' }}>{t.fecha || 'Sin fecha'} · {t.departamento}</small>
            <div style={{ fontSize: 14 }}>{t.descripcion}</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <button onClick={() => setForm(t)} className="btn secondary">Editar</button>
              <button onClick={() => del(t.id)} className="btn secondary" style={{ color: '#b91c1c' }}>
                Borrar
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function Editor({
  form,
  setForm,
  onSave,
  onCancel
}: {
  form: Tarea
  setForm: React.Dispatch<React.SetStateAction<Tarea>>
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        <label>
          Título
          <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
        </label>
        <label>
          Fecha
          <input type="date" value={form.fecha || ''} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
        </label>
        <label>
          Estado
          <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value as any })}>
            {['Pendiente', 'En curso', 'Hecho'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          Departamento
          <select
            value={form.departamento}
            onChange={(e) => setForm({ ...form, departamento: e.target.value as any })}
          >
            {['comercial', 'tecnico', 'envios', 'administracion'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label style={{ gridColumn: '1 / -1' }}>
          Descripción
          <input
            value={form.descripcion || ''}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
        <button onClick={onCancel} className="btn secondary">
          Cancelar
        </button>
        <button onClick={onSave} className="btn">
          Guardar
        </button>
      </div>
    </div>
  )
}
