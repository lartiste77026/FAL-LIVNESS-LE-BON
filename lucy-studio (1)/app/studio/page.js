'use client';
import { useEffect, useRef, useState } from 'react';
import { fal } from '@fal-ai/client';
const APP = 'decart/lucy-2-5/realtime';
const post = (u, b) => fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b || {}) }).then((r) => r.json());

export default function Studio() {
  const [me, setMe] = useState(null), [min, setMin] = useState(0), [on, setOn] = useState(false);
  const [prompt, setPrompt] = useState(''), [ref, setRef] = useState(null), [msg, setMsg] = useState('');
  const camEl = useRef(), outEl = useRef(), R = useRef({});

  useEffect(() => { fetch('/api/me').then((r) => (r.ok ? r.json() : (location.href = '/'))).then((d) => { if (d) { setMe(d); setMin(d.minutes); } }); return () => stop(); }, []);

  // Le flux traité par Lucy arrive ici : aperçu local + relais vers la page OBS.
  function attachOut(stream) { R.current.stream = stream; if (outEl.current) outEl.current.srcObject = stream; }

  async function onSig(m) {
    const s = R.current.stream;
    if (m.type === 'hello' && s) {
      R.current.pc?.close();
      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }); R.current.pc = pc;
      s.getTracks().forEach((t) => pc.addTrack(t, s));
      pc.onicecandidate = (e) => e.candidate && post('/api/obs/signal', { msg: { type: 'ice', c: e.candidate } });
      await pc.setLocalDescription(await pc.createOffer());
      post('/api/obs/signal', { msg: { type: 'offer', sdp: pc.localDescription } });
    } else if (m.type === 'answer') await R.current.pc?.setRemoteDescription(m.sdp);
    else if (m.type === 'ice') try { await R.current.pc?.addIceCandidate(m.c); } catch {}
  }

  async function start() {
    setMsg('');
    try {
      const cs = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720, frameRate: 30 }, audio: false });
      camEl.current.srcObject = cs; R.current.cam = cs;
      await post('/api/heartbeat', { start: true });
      R.current.beat = setInterval(async () => { const d = await post('/api/heartbeat'); setMin(d.minutes ?? 0); if (d.stop) { stop(); setMsg('Temps épuisé ou accès révoqué.'); } }, 5000);
      R.current.poll = setInterval(async () => { const r = await fetch('/api/obs/signal'); if (r.ok) for (const m of (await r.json()).msgs) onSig(m); }, 600);
      R.current.conn = fal.realtime.connect(APP, {
        onResult: (res) => {
          // TODO(VERIFY): récupérer ici le MediaStream renvoyé par Lucy puis appeler attachOut(stream).
          // Voir le code du playground : https://fal.ai/models/decart/lucy-2-5/realtime/playground
        },
        onError: (e) => setMsg(String(e?.message || e)),
        tokenProvider: async () => { const r = await fetch('/api/fal/realtime-token', { method: 'POST' }); if (!r.ok) throw new Error('Accès refusé'); return r.text(); },
        tokenExpirationSeconds: 10,
      });
      // TODO(VERIFY): comment attacher `cs` (caméra) à la connexion et noms exacts des champs (prompt, image de référence).
      R.current.conn.send({ prompt, reference_image: ref });
      setOn(true);
    } catch (e) { setMsg(e.message); stop(); }
  }

  function stop() {
    const r = R.current; clearInterval(r.beat); clearInterval(r.poll);
    try { r.conn?.close?.(); } catch {} r.pc?.close(); r.cam?.getTracks().forEach((t) => t.stop());
    R.current = {}; setOn(false);
  }

  function pick(e) { const f = e.target.files[0]; if (!f) return; const fr = new FileReader(); fr.onload = () => { setRef(fr.result); R.current.conn?.send({ reference_image: fr.result }); }; fr.readAsDataURL(f); }
  async function regen() { setMe(await fetch('/api/me', { method: 'POST' }).then((r) => r.json())); }

  if (!me) return <main className="mut">Chargement…</main>;
  return <main>
    <div className="row" style={{ justifyContent: 'space-between' }}><div><h1>Studio</h1><span className="mut">{me.username}</span></div>
      <div><div className="big">{min.toFixed(1)} min</div><span className="mut">temps restant</span></div></div>
    <div className="grid" style={{ marginTop: 16 }}>
      <div><h2>Caméra</h2><video ref={camEl} autoPlay muted playsInline /></div>
      <div><h2>Résultat Lucy</h2><video ref={outEl} autoPlay muted playsInline /></div>
    </div>
    <h2>Réglages</h2>
    <div className="row"><textarea rows="2" style={{ flex: 1, minWidth: 260 }} placeholder="Décrivez la modification à appliquer" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      <button className="alt" disabled={!on} onClick={() => R.current.conn?.send({ prompt })}>Appliquer le prompt</button></div>
    <div className="row" style={{ marginTop: 10 }}><label>Photo de référence : <input type="file" accept="image/*" onChange={pick} /></label>
      {ref && <img src={ref} alt="Référence" height="48" style={{ borderRadius: 4 }} />}</div>
    <div className="row" style={{ marginTop: 16 }}>{on ? <button className="bad" onClick={stop}>Arrêter</button> : <button className="ok" disabled={min <= 0} onClick={start}>Démarrer</button>}
      <button className="alt" onClick={() => fetch('/api/login', { method: 'DELETE' }).then(() => (location.href = '/'))}>Déconnexion</button></div>
    {msg && <p style={{ color: 'var(--bad)' }}>{msg}</p>}
    <h2>OBS</h2>
    <p className="mut">Dans OBS : Sources, Navigateur, collez cette URL, taille 1280×720 ou 1920×1080. Gardez cette page ouverte pendant la diffusion.</p>
    <div className="row"><input readOnly value={me.obsUrl} style={{ flex: 1, minWidth: 260 }} onFocus={(e) => e.target.select()} />
      <button className="alt" onClick={() => navigator.clipboard.writeText(me.obsUrl)}>Copier</button>
      <button className="alt" onClick={() => confirm("L'ancienne URL cessera de fonctionner. Continuer ?") && regen()}>Régénérer</button></div>
  </main>;
}
