import { db } from '@/lib/db';
import { session } from '@/lib/auth';
const Q = (globalThis.__sig ||= {}); // boîtes aux lettres en mémoire : 1 seul processus Node
function who(req) {
  const t = new URL(req.url).searchParams.get('token');
  if (t) { const c = db.prepare('select * from clients where obs_token=?').get(t); return c && !c.revoked && c.balance > 0 ? { c, side: 'obs' } : null; }
  const s = session(); return s?.role === 'client' ? { c: s.client, side: 'studio' } : null;
}
export async function GET(req) {
  const w = who(req); if (!w) return new Response('no', { status: 403 });
  const q = (Q[w.c.id] ||= { studio: [], obs: [] }); return Response.json({ msgs: q[w.side].splice(0) });
}
export async function POST(req) {
  const w = who(req); if (!w) return new Response('no', { status: 403 });
  const { msg } = await req.json(); const q = (Q[w.c.id] ||= { studio: [], obs: [] });
  const dst = q[w.side === 'obs' ? 'studio' : 'obs']; dst.push(msg); if (dst.length > 100) dst.shift();
  return Response.json({ ok: 1 });
}
