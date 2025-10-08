import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';       // ⬅️ NUEVO
import './styles.css';                               // ⬅️ NUEVO

import {
  Plus, ClipboardList, Users, RefreshCw, LogOut,
  Search, Calendar, Edit3, Trash2, CheckCircle2, Building2, Phone, Mail
} from 'lucide-react';

// ⬇️ Corrige la ruta de supabase (está en src/)
import { supabase } from './supabaseClient';         // ⬅️ ANTES decía ../supabaseClient

import React, { useEffect, useMemo, useState } from 'react';

import {
  Plus, ClipboardList, Users, RefreshCw, LogOut,
  Search, Calendar, Edit3, Trash2, CheckCircle2, Building2, Phone, Mail
} from 'lucide-react';
import { supabase } from '../supabaseClient';

// ===== Tipos que mapean las tablas =====
type TaskRow = {
  id: string;
  titulo: string;
  fecha: string | null;           // ISO date string (YYYY-MM-DD) o null
  estado: string | null;          // 'pendiente' | 'en progreso' | 'hecha' | null
  departamento: string | null;    // 'comercial' | 'técnico' | 'envíos' | 'pedidos' | 'administración' | null
  descripcion: string | null;
  created_at?: string | null;
};

type ClientRow = {
  id: string;
  empresa: string;
  contacto?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  notas?: string | null;
  created_at?: string | null;
};




// =============================== App Shell ================================
type Tab = 'tareas' | 'clientes';
// ====== Hook de TAREAS + CRUD (Supabase) ======
function useTasks() {
  const [tasks, setTasks] = React.useState<TaskRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('tareas')
      .select('*')
      .order('fecha', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) setError(error.message);
    setTasks((data || []) as TaskRow[]);
    setLoading(false);
  };

  React.useEffect(() => { load(); }, []);

  return { tasks, loading, error, refresh: load, setTasks };
}

// CRUD helpers
async function createTask(payload: Omit<TaskRow, 'id'>) {
  const { data, error } = await supabase
    .from('tareas')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as TaskRow;
}

async function setTaskDone(id: string) {
  const { data, error } = await supabase
    .from('tareas')
    .update({ estado: 'hecha' })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as TaskRow;
}

async function deleteTask(id: string) {
  const { error } = await supabase.from('tareas').delete().eq('id', id);
  if (error) throw error;
}

export default function MainApp() {
  const [tab, setTab] = useState<Tab>('tareas');

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
  <div className="app-content" style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:16}}>
    <div className="brand">
      <img src="/logotipo-mondise.png" alt="Mondise CRM" />
      <strong>MONDISE CRM</strong>
    </div>
    <nav className="tabs">
      <button
        className={`tab-btn ${tab === 'tareas' ? 'active' : ''}`}
        onClick={() => setTab('tareas')}
      >
        🗂️ Tareas
      </button>
      <button
        className={`tab-btn ${tab === 'clientes' ? 'active' : ''}`}
        onClick={() => setTab('clientes')}
      >
        👥 Clientes
      </button>
    </nav>
  </div>
</header>


      {/* Contenido */}
      <main className="app-content">
        {tab === 'tareas' ? <TasksView /> : <ClientsView />}
      </main>

      {/* FAB para crear nuevo */}
      <button className="fab" title="Nueva">
        <Plus size={22} />
      </button>

      {/* Bottom nav (estético; si tienes router, puedes enlazar) */}
      <nav className="bottom-nav">
        <div
          className={`nav-item ${tab === 'tareas' ? 'active' : ''}`}
          onClick={() => setTab('tareas')}
        >
          <ClipboardList size={18} />
          <span className="nav-label">Tareas</span>
        </div>
        <div
          className={`nav-item ${tab === 'clientes' ? 'active' : ''}`}
          onClick={() => setTab('clientes')}
        >
          <Users size={18} />
          <span className="nav-label">Clientes</span>
        </div>
      </nav>
    </div>
  );
}

// =============================== VISTA: Tareas ===============================
function TasksView() {
  const { tasks, loading, error, refresh, setTasks } = useTasks();

  const [q, setQ] = React.useState('');
  const filtered = React.useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return tasks;
    return tasks.filter(x =>
      x.titulo.toLowerCase().includes(t) ||
      (x.departamento || '').toLowerCase().includes(t) ||
      (x.estado || '').toLowerCase().includes(t)
    );
  }, [q, tasks]);

  const [titulo, setTitulo] = React.useState('');
  const [fecha, setFecha] = React.useState<string>('');
  const [estado, setEstado] = React.useState('pendiente');
  const [departamento, setDepartamento] = React.useState('comercial');
  const [descripcion, setDescripcion] = React.useState('');

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        titulo,
        fecha: fecha || null,
        estado,
        departamento,
        descripcion: descripcion || null,
      };
      const newRow = await createTask(payload);
      setTasks(prev => [newRow, ...prev]);
      setTitulo(''); setFecha(''); setEstado('pendiente'); setDepartamento('comercial'); setDescripcion('');
    } catch (err: any) {
      alert('Error creando tarea: ' + err.message);
    }
  };

  const onDone = async (id: string) => {
    try {
      const updated = await setTaskDone(id);
      setTasks(prev => prev.map(t => t.id === id ? updated : t));
    } catch (err: any) {
      alert('Error marcando como hecha: ' + err.message);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm('¿Borrar esta tarea?')) return;
    try {
      await deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err: any) {
      alert('Error borrando: ' + err.message);
    }
  };

  return (
    <>
      <div className="panel">
        <div className="search">
          <Search size={18} />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar tarea, estado o departamento…"
          />
          <button className="icon-btn" title="Refrescar" onClick={refresh}><RefreshCw size={16}/></button>
        </div>
        {loading && <div className="meta" style={{marginTop:8}}>Cargando…</div>}
        {error && <div className="meta" style={{marginTop:8, color:'#ff9b9b'}}>Error: {error}</div>}
      </div>

      <div className="grid">
        {filtered.map(t => (
          <article key={t.id} className="card">
            <div className="meta">
              <span className={`badge ${t.estado === 'hecha' ? 'ok' : t.estado === 'pendiente' ? 'warn' : ''}`}>
                {t.estado || 'pendiente'}
              </span>
              {t.departamento && <span className="badge">{t.departamento}</span>}
              {t.fecha && (
                <span className="meta" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={14} /> {t.fecha}
                </span>
              )}
            </div>
            <h4>{t.titulo}</h4>
            {t.descripcion && <div className="meta">{t.descripcion}</div>}

            <div className="row-actions">
              <button className="btn ok" onClick={() => onDone(t.id)}>
                <CheckCircle2 size={16} /> Hecha
              </button>
              <button className="btn danger" onClick={() => onDelete(t.id)}>
                <Trash2 size={16} /> Borrar
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <h4 style={{ marginTop: 0, marginBottom: 12 }}>Nueva tarea</h4>
        <form className="form" onSubmit={onCreate}>
          <div className="row">
            <input className="input" placeholder="Título" required value={titulo} onChange={e=>setTitulo(e.target.value)} />
            <input className="input" type="date" value={fecha} onChange={e=>setFecha(e.target.value)} />
          </div>
          <div className="row">
            <select className="select" value={estado} onChange={e=>setEstado(e.target.value)}>
              <option value="pendiente">Pendiente</option>
              <option value="en progreso">En progreso</option>
              <option value="hecha">Hecha</option>
            </select>
            <select className="select" value={departamento} onChange={e=>setDepartamento(e.target.value)}>
              <option value="comercial">Comercial</option>
              <option value="técnico">Técnico</option>
              <option value="envíos">Envíos</option>
              <option value="pedidos">Pedidos</option>
              <option value="administración">Administración</option>
            </select>
          </div>
          <textarea className="textarea" placeholder="Descripción" value={descripcion} onChange={e=>setDescripcion(e.target.value)} />
          <div className="row-actions">
            <button className="btn ok" type="submit">
              <Plus size={16} /> Guardar
            </button>
          </div>
        </form>
      </div>
    </>
  );
}


// ============================== VISTA: Clientes ==============================
function ClientsView(){
  // ⚠️ Sustituye MOCK_CLIENTS por tus datos (Supabase)
  const clients = MOCK_CLIENTS;

  const [q, setQ] = useState('');
  const filtered = useMemo(()=> {
    const t = q.trim().toLowerCase();
    if(!t) return clients;
    return clients.filter(c =>
      c.empresa.toLowerCase().includes(t) ||
      (c.contacto || '').toLowerCase().includes(t)
    );
  }, [q, clients]);

  return (
    <>
      <div className="panel">
        <div className="search">
          <Search size={18} />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar cliente, contacto…"
          />
        </div>
      </div>

      <div className="grid">
        {filtered.map((c)=>(
          <article key={c.id} className="card">
            <div className="meta">
              <span className="badge"><Building2 size={14}/> Cliente</span>
            </div>
            <h4>{c.empresa}</h4>
            {c.contacto && <div className="meta"><Users size={14}/> {c.contacto}</div>}
            <div className="meta" style={{display:'grid', gap:6}}>
              {c.telefono && <span style={{display:'inline-flex', alignItems:'center', gap:6}}><Phone size={14}/> {c.telefono}</span>}
              {c.email && <span style={{display:'inline-flex', alignItems:'center', gap:6}}><Mail size={14}/> {c.email}</span>}
              {c.direccion && <span>{c.direccion}</span>}
            </div>
            {c.notas && <div className="meta">{c.notas}</div>}

            <div className="row-actions">
              <button className="btn"> <Edit3 size={16}/> Editar</button>
              <button className="btn danger"><Trash2 size={16}/> Borrar</button>
            </div>
          </article>
        ))}
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <h4 style={{ marginTop: 0, marginBottom: 12 }}>Nuevo cliente</h4>
        <form className="form" onSubmit={(e)=>{e.preventDefault(); /* TODO: crear en Supabase */}}>
          <div className="row">
            <input className="input" placeholder="Empresa" required />
            <input className="input" placeholder="Contacto" />
          </div>
          <div className="row">
            <input className="input" placeholder="Teléfono" />
            <input className="input" placeholder="Email" type="email" />
          </div>
          <input className="input" placeholder="Dirección" />
          <textarea className="textarea" placeholder="Notas" />
          <div className="row-actions">
            <button className="btn ok" type="submit"><Plus size={16}/> Guardar</button>
          </div>
        </form>
      </div>
    </>
  );
}
// ===== Montar la App (Vite/React) =====
const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<MainApp />);
}


