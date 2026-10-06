'use client';
import { useState } from 'react';
export default function Login() {
  const [u, setU] = useState(''), [p, setP] = useState(''), [e, setE] = useState('');
  async function go(ev) {
    ev.preventDefault();
    const r = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u, password: p }) });
    const d = await r.json(); if (!r.ok) return setE(d.error);
    location.href = d.role === 'admin' ? '/admin' : '/studio';
  }
  return <main style={{ maxWidth: 380 }}><h1>Lucy Studio</h1><p className="mut">Connectez-vous avec l'identifiant fourni.</p>
    <form onSubmit={go} className="row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
      <input placeholder="Identifiant" value={u} onChange={(x) => setU(x.target.value)} autoComplete="username" />
      <input placeholder="Mot de passe" type="password" value={p} onChange={(x) => setP(x.target.value)} autoComplete="current-password" />
      <button className="ok">Se connecter</button>{e && <span style={{ color: 'var(--bad)' }}>{e}</span>}
    </form></main>;
}
