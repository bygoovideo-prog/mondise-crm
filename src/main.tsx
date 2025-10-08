import React, { useMemo, useState } from 'react';
import {
  Plus, ClipboardList, Users, RefreshCw, LogOut,
  Search, Calendar, Edit3, Trash2, CheckCircle2, Building2, Phone, Mail
} from 'lucide-react';

// ================ Mock de datos (sustituye con Supabase) =================
type Task = {
  id: string;
  titulo: string;
  fecha?: string;
  estado: 'pendiente' | 'en progreso' | 'hecha';
  departamento: 'comercial' | 'técnico' | 'envíos' | 'pedidos' | 'administración';
  descripcion?: string;
};
type Client = {
  id: string;
  empresa: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  notas?: string;
};

const MOCK_TASKS: Task[] = [
  { id: 't1', titulo: 'Llamar a Hotel Demo', estado: 'pendiente', departamento: 'comercial', fecha: '2025-10-07', descripcion: 'Confirmar oferta y fecha de instalación' },
  { id: 't2', titulo: 'Revisar cerradura TTLock', estado: 'pendiente', departamento: 'técnico', fecha: '2025-10-07', descripcion: 'Comprobar firmware y logs' },
  { id: 't3', titulo: 'Emitir factura Hotel Demo', estado: 'pendiente', departamento: 'administración', fecha: '2025-10-08', descripcion: 'Proforma tras confirmación' },
  { id: 't4', titulo: 'Enviar paquetes semana', estado: 'en progreso', departamento: 'envíos' },
];

const MOCK_CLIENTS: Client[] = [
  { id: 'c1', empresa: 'Hotel Demo', contacto: 'María Pérez', telefono: '+34 600 111 222', email: 'maria@hotel.demo', direccion: 'C/ Sol 10, Sevilla', notas: 'Cliente de prueba' },
  { id: 'c2', empresa: 'Hostal Centro', contacto: 'J. Gómez', telefono: '+34 655 000 111', email: 'info@hostalcentro.es', direccion: 'Av. Libertad 22, Málaga' },
];

// =============================== App Shell ================================
type Tab = 'tareas' | 'clientes';

export default function MainApp() {
  const [tab, setTab] = useState<Tab>('tareas');

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-inner">
          <div className="brand">
            <div className="brand-logo" />
            <div className="brand-title">MONDISE CRM</div>
          </div>

          <div className="header-actions">
            <button className="icon-btn" title="Refrescar">
              <RefreshCw size={18} />
            </button>
            <button className="icon-btn" title="Salir">
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
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
  // ⚠️ Aquí sustituye MOCK_TASKS por tus datos desde Supabase:
  const tasks = MOCK_TASKS;

  // Búsqueda simple (puedes enlazar a tu estado)
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return tasks;
    return tasks.filter(x =>
      x.titulo.toLowerCase().includes(t) ||
      x.departamento.toLowerCase().includes(t)
    );
  }, [q, tasks]);

  return (
    <>
      {/* Buscador */}
      <div className="panel">
        <div className="search">
          <Search size={18} />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar tarea, departamento..."
          />
        </div>
      </div>

      {/* Grid de tarjetas */}
      <div className="grid">
        {filtered.map(t => (
          <article key={t.id} className="card">
            <div className="meta">
              <span className={`badge ${badgeByEstado(t.estado)}`}>
                {labelEstado(t.estado)}
              </span>
              <span className="badge">{t.departamento}</span>
              {t.fecha && (
                <span className="meta" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={14} /> {t.fecha}
                </span>
              )}
            </div>
            <h4>{t.titulo}</h4>
            {t.descripcion && <div className="meta">{t.descripcion}</div>}

            <div className="row-actions">
              <button className="btn ok" title="Marcar hecha">
                <CheckCircle2 size={16} /> Hecha
              </button>
              <button className="btn" title="Editar">
                <Edit3 size={16} /> Editar
              </button>
              <button className="btn danger" title="Borrar">
                <Trash2 size={16} /> Borrar
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Formulario (ejemplo) */}
      <div className="panel" style={{ marginTop: 16 }}>
        <h4 style={{ marginTop: 0, marginBottom: 12 }}>Nueva tarea</h4>
        <form className="form" onSubmit={(e)=>{e.preventDefault(); /* TODO: crear en Supabase */}}>
          <div className="row">
            <input className="input" placeholder="Título" required />
            <input className="input" type="date" />
          </div>
          <div className="row">
            <select className="select" defaultValue="pendiente">
              <option value="pendiente">Pendiente</option>
              <option value="en progreso">En progreso</option>
              <option value="hecha">Hecha</option>
            </select>
            <select className="select" defaultValue="comercial">
              <option value="comercial">Comercial</option>
              <option value="técnico">Técnico</option>
              <option value="envíos">Envíos</option>
              <option value="pedidos">Pedidos</option>
              <option value="administración">Administración</option>
            </select>
          </div>
          <textarea className="textarea" placeholder="Descripción" />
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
function labelEstado(e: Task['estado']){
  if(e==='pendiente') return 'Pendiente';
  if(e==='en progreso') return 'En progreso';
  return 'Hecha';
}
function badgeByEstado(e: Task['estado']){
  if(e==='pendiente') return 'warn';
  if(e==='en progreso') return '';
  return 'ok';
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
