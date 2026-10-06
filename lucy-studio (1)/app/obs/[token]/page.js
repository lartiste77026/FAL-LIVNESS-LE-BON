'use client';
import { useEffect, useRef } from 'react';
// Page lue par OBS : lecture seule, aucun appel à fal, fond transparent.
export default function Obs({ params }) {
  const v = useRef();
  useEffect(() => {
    const url = '/api/obs/signal?token=' + params.token; let pc, alive = true, connected = false;
    const send = (msg) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ msg }) });
    const mkpc = () => { pc?.close(); pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      pc.ontrack = (e) => { v.current.srcObject = e.streams[0]; connected = true; };
      pc.onicecandidate = (e) => e.candidate && send({ type: 'ice', c: e.candidate }); };
    const tick = async () => {
      const r = await fetch(url); if (!r.ok) { if (v.current) v.current.srcObject = null; connected = false; return; }
      for (const m of (await r.json()).msgs) {
        if (m.type === 'offer') { mkpc(); await pc.setRemoteDescription(m.sdp); await pc.setLocalDescription(await pc.createAnswer()); send({ type: 'answer', sdp: pc.localDescription }); }
        else if (m.type === 'ice') try { await pc?.addIceCandidate(m.c); } catch {}
      }
    };
    const i = setInterval(() => alive && tick(), 600);
    const h = setInterval(() => { if (!connected || pc?.connectionState === 'failed' || pc?.connectionState === 'disconnected') { connected = false; send({ type: 'hello' }); } }, 2000);
    return () => { alive = false; clearInterval(i); clearInterval(h); pc?.close(); };
  }, [params.token]);
  return <><style>{'html,body{background:transparent!important;margin:0;overflow:hidden}main{padding:0;max-width:none}'}</style>
    <video ref={v} autoPlay muted playsInline style={{ width: '100vw', height: '100vh', objectFit: 'contain', background: 'transparent', borderRadius: 0 }} /></>;
}
