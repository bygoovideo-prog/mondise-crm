// ==== CABECERA LIMPIA DE src/main.tsx ====
import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

import {
  Plus, ClipboardList, Users, RefreshCw, LogOut,
  Search, Calendar, Edit3, Trash2, CheckCircle2, Building2, Phone, Mail
} from 'lucide-react';

import { supabase } from './supabaseClient';

// ===== Tipos que mapean las tablas =====
type TaskRow = {
  id: string;
  titulo: string;
  fecha: string | null;           // YYYY-MM-DD o null
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

// ===== Hook de TAREAS + CRUD =====
function useTasks() {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => { load(); }, []);

  return { tasks, loading, error, refresh: load, setTasks };
}

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

// ===== Hook de CLIENTES + CRUD =====
function useClients() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('empresa', { ascending: true });
    if (error) setError(error.message);
    setClients((data || []) as ClientRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return { clients, loading, error, refresh: load, setClients };
}

async function createClient(payload: Omit<ClientRow, 'id'>) {
  const { data, error } = await supabase
    .from('clientes')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as ClientRow;
}

async function deleteClient(id: string) {
  const { error } = await supabase.from('clientes').delete().eq('id', id);
  if (error) throw error;
}

// ===================== SHELL PRINCIPAL =====================
export default function MainApp() {
  const [tab, setTab] = useState<'tareas' | 'clientes'>('tareas');

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="app-header">
        <div className="header-inner">
          <div className="brand">
            <img
              src="/logo-mondise-white.png"   // asegúrate de tenerlo en /public/
              alt="MONDISE CRM"
              className="brand-logo"
            />
            <strong className="brand-title">MONDISE CRM</strong>
          </div>

          <div className="header-actions">
            <button className="icon-btn" title="Refrescar" onClick={() => window.location.reload()}>
              <RefreshCw size={18} />
            </button>
            <button className="icon-btn" title="Salir">
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Tabs superiores (escritorio) */}
        <div className="tabs hide-mobile">
          <button
            className={`tab ${tab === 'tareas' ? 'active' : ''}`}
            onClick={() => setTab('tareas')}
          >
            <ClipboardList size={18} /> Tareas
          </button>
          <button
            className={`tab ${tab === 'clientes' ? 'active' : ''}`}
            onClick={() => setTab('clientes')}
          >
            <Users size={18} /> Clientes
          </button>
        </div>
      </header>

      {/* Contenido */}
      <main className="main-scroll">
        <div className="app-content" style={{ paddingTop: 16 }}>
          {tab === 'tareas' ? <TasksView /> : <ClientsView />}
        </div>
      </main>

      {/* FAB (solo en Tareas) */}
      {tab === 'tareas' && (
        <button
          className="fab only-mobile"
          onClick={() => window.dispatchEvent(new CustomEvent('new-task'))}
          aria-label="Nueva tarea"
        >
          <Plus size={22} />
        </button>
      )}

      {/* Bottom nav móvil */}
      <nav className="bottom-nav only-mobile" role="navigation" aria-label="Navegación inferior">
        <button
          className={`nav-btn ${tab === 'tareas' ? 'active' : ''}`}
          onClick={() => setTab('tareas')}
        >
          <ClipboardList size={20} />
          <span className="nav-label">Tareas</span>
        </button>
        <button
          className={`nav-btn ${tab === 'clientes' ? 'active' : ''}`}
          onClick={() => setTab('clientes')}
        >
          <Users size={20} />
          <span className="nav-label">Clientes</span>
        </button>
      </nav>
    </div>
  );
}

// ===================== VISTA: TAREAS =====================
function TasksView() {
  const { tasks, loading, error, refresh, setTasks } = useTasks();

  // búsqueda
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return tasks;
    return tasks.filter(x =>
      x.titulo.toLowerCase().includes(t) ||
      (x.departamento || '').toLowerCase().includes(t) ||
      (x.estado || '').toLowerCase().includes(t)
    );
  }, [q, tasks]);

  // form nueva tarea
  const [titulo, setTitulo] = useState('');
  const [fecha, setFecha] = useState<string>('');
  const [estado, setEstado] = useState('pendiente');
  const [departamento, setDepartamento] = useState('comercial');
  const [descripcion, setDescripcion] = useState('');

  // Escuchar FAB móvil
  useEffect(() => {
    const handler = () => {
      const el = document.getElementById('titulo-input');
      if (el) (el as HTMLInputElement).focus();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('new-task', handler);
    return () => window.removeEventListener('new-task', handler);
  }, []);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Omit<TaskRow,'id'> = {
        titulo,
        fecha: fecha || null,
        estado,
        departamento,
        descripcion: descripcion || null
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
      {/* Buscador */}
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

      {/* Grid */}
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

      {/* Form nueva tarea */}
      <div className="panel" style={{ marginTop: 16 }}>
        <h4 style={{ marginTop: 0, marginBottom: 12 }}>Nueva tarea</h4>
        <form className="form" onSubmit={onCreate}>
          <div className="row">
            <input id="titulo-input" className="input" placeholder="Título" required value={titulo} onChange={e=>setTitulo(e.target.value)} />
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

// ===================== VISTA: CLIENTES =====================
function ClientsView(){
  const { clients, loading, error, refresh, setClients } = useClients();
  const [q, setQ] = useState('');

  const filtered = useMemo(()=> {
    const t = q.trim().toLowerCase();
    if(!t) return clients;
    return clients.filter(c =>
      c.empresa.toLowerCase().includes(t) ||
      (c.contacto || '').toLowerCase().includes(t) ||
      (c.email || '').toLowerCase().includes(t)
    );
  }, [q, clients]);

  // form nuevo cliente
  const [empresa, setEmpresa] = useState('');
  const [contacto, setContacto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [notas, setNotas] = useState('');

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Omit<ClientRow,'id'> = {
        empresa,
        contacto: contacto || null,
        telefono: telefono || null,
        email: email || null,
        direccion: direccion || null,
        notas: notas || null
      };
      const newRow = await createClient(payload);
      setClients(prev => [newRow, ...prev]);
      setEmpresa(''); setContacto(''); setTelefono(''); setEmail(''); setDireccion(''); setNotas('');
    } catch (err: any) {
      alert('Error creando cliente: ' + err.message);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm('¿Borrar este cliente?')) return;
    try{
      await deleteClient(id);
      setClients(prev => prev.filter(c => c.id !== id));
    } catch (err:any){
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
            placeholder="Buscar cliente, contacto o email…"
          />
          <button className="icon-btn" title="Refrescar" onClick={refresh}><RefreshCw size={16}/></button>
        </div>
        {loading && <div className="meta" style={{marginTop:8}}>Cargando…</div>}
        {error && <div className="meta" style={{marginTop:8, color:'#ff9b9b'}}>Error: {error}</div>}
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
              {/* TODO: editar si quieres */}
              <button className="btn danger" onClick={()=>onDelete(c.id)}><Trash2 size={16}/> Borrar</button>
            </div>
          </article>
        ))}
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <h4 style={{ marginTop: 0, marginBottom: 12 }}>Nuevo cliente</h4>
        <form className="form" onSubmit={onCreate}>
          <div className="row">
            <input className="input" placeholder="Empresa" required value={empresa} onChange={e=>setEmpresa(e.target.value)} />
            <input className="input" placeholder="Contacto" value={contacto} onChange={e=>setContacto(e.target.value)} />
          </div>
          <div className="row">
            <input className="input" placeholder="Teléfono" value={telefono} onChange={e=>setTelefono(e.target.value)} />
            <input className="input" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
          </div>
          <input className="input" placeholder="Dirección" value={direccion} onChange={e=>setDireccion(e.target.value)} />
          <textarea className="textarea" placeholder="Notas" value={notas} onChange={e=>setNotas(e.target.value)} />
          <div className="row-actions">
            <button className="btn ok" type="submit"><Plus size={16}/> Guardar</button>
          </div>
        </form>
      </div>
    </>
  );
}

// ===== MONTAJE DE LA APP =====
const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<MainApp />);
}



