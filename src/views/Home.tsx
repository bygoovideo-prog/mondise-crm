import React,{useEffect,useState} from 'react'
import Clientes from './clientes/Clientes'
import Tareas from './tareas/Tareas'
import { supabase } from '../supabaseClient'
export default function Home(){const [tab,setTab]=useState<'Clientes'|'Tareas'>('Clientes');const [perfil,setPerfil]=useState<any>(null);useEffect(()=>{supabase.from('mi_perfil').select('*').single().then(({data})=>setPerfil(data)).catch(()=>setPerfil(null))},[]);return(<div style={{maxWidth:1100,margin:'1rem auto',padding:'0 1rem 2rem'}}><header style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}><div style={{display:'flex',alignItems:'center',gap:10}}>
  <img src='/logo-mondise.png' alt='MONDISE CRM' style={{height:32}}/>
</div><div style={{fontSize:14,color:'#555'}}>{perfil?<>Conectado como <b>{perfil?.nombre||'usuario'}</b> · <i>{perfil?.rol}</i></>:'Sin perfil (admin puede crearlo)'}</div></header><nav style={{display:'flex',gap:8,marginTop:12}}>{['Clientes','Tareas'].map(t=>(<button key={t} onClick={()=>setTab(t as any)} className='btn secondary' style={{background:tab===t?'#0f172a':'#fff',color:tab===t?'#fff':'#111',borderColor:tab===t?'#0f172a':'#ddd'}}>{t}</button>))}<div style={{flex:1}}/><button onClick={()=>supabase.auth.signOut()} className='btn secondary'>Salir</button></nav>{tab==='Clientes'&&<Clientes/>}{tab==='Tareas'&&<Tareas/>}</div>)}
