'use client';
import { useEffect, useState, useCallback } from 'react';
const api = (b) => fetch('/api/admin/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }).then((r) => r.json());
export default function Admin() {
  const [rows, setRows] = useState([]), [f, setF] = useState({ username: '', password: '', minutes: 60 }), [err, setErr] = useState('');
  const load = useCallback(() => fetch('/api/admin/clients').then((r) => (r.ok ? r.json() : (location.href = '/'))).then((d) => d && setRows(d)), []);
  useEffect(() => { load(); const i = setInterval(load, 4000); return () => clearInterval(i); }, [load]);
  const act = async (b) => { const d = await api(b); setErr(d.error || ''); load(); };
  const adj = (id) => { const v = prompt('Minutes à ajouter (négatif pour retirer)'); if (v && !isNaN(+v)) act({ action: 'minutes', id, delta: +v }); };
  const live = (r) => r.last_beat && Date.now() - r.last_beat < 15000;
  return <main><div className="row" style={{ justifyContent: 'space-between' }}><h1>Clients</h1>
    <button className="alt" onClick={() => fetch('/api/login', { method: 'DELETE' }).then(() => (location.href = '/'))}>Déconnexion</button></div>
    <h2>Nouveau client</h2>
    <div className="row"><input placeholder="Identifiant" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} />
      <input placeholder="Mot de passe" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
      <input type="number" style={{ width: 100 }} value={f.minutes} onChange={(e) => setF({ ...f, minutes: e.target.value })} aria-label="Minutes allouées" />
      <button className="ok" onClick={() => f.username && f.password && act({ action: 'create', ...f })}>Créer</button></div>
    {err && <p style={{ color: 'var(--bad)' }}>{err}</p>}
    <h2>Comptes</h2>
    <div style={{ overflowX: 'auto' }}><table><thead><tr><th>Client</th><th>Solde</th><th>État</th><th>Actions</th></tr></thead><tbody>
      {rows.map((r) => <tr key={r.id}><td>{r.username}</td><td>{r.balance.toFixed(1)} min</td>
        <td>{r.revoked ? <span className="tag rev">Révoqué</span> : live(r) ? <span className="tag live">En direct</span> : <span className="tag">Hors ligne</span>}</td>
        <td className="row">
          <button className="alt" onClick={() => act({ action: 'minutes', id: r.id, delta: 15 })}>+15</button>
          <button className="alt" onClick={() => act({ action: 'minutes', id: r.id, delta: 60 })}>+60</button>
          <button className="alt" onClick={() => act({ action: 'minutes', id: r.id, delta: -15 })}>−15</button>
          <button className="alt" onClick={() => adj(r.id)}>±…</button>
          <button className={r.revoked ? 'ok' : 'bad'} onClick={() => act({ action: 'revoke', id: r.id, value: !r.revoked })}>{r.revoked ? 'Réactiver' : 'Révoquer'}</button>
          <button className="alt" onClick={() => { const p = prompt('Nouveau mot de passe'); p && act({ action: 'password', id: r.id, password: p }); }}>Mot de passe</button>
          <button className="alt" onClick={() => confirm('Supprimer ' + r.username + ' ?') && act({ action: 'delete', id: r.id })}>Supprimer</button>
        </td></tr>)}
      {!rows.length && <tr><td colSpan="4" className="mut">Aucun client. Créez le premier ci-dessus.</td></tr>}
    </tbody></table></div></main>;
}
