import React,{useEffect,useState} from 'react'
import { supabase } from './supabaseClient'
import SignIn from './views/SignIn'
import Home from './views/Home'
export default function RouterApp(){const [loading,setLoading]=useState(true);const [session,setSession]=useState<any>(null);useEffect(()=>{supabase.auth.getSession().then(({data})=>{setSession(data.session||null);setLoading(false)});const {data:sub}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s));return()=>sub.subscription.unsubscribe()},[]);if(loading)return <div style={{padding:24}}>Cargando…</div>;return session?<Home/>:<SignIn/>}
