import { db } from '@/lib/db';
import { session } from '@/lib/auth';
// Appelé toutes les 5 s par la page studio : le serveur décompte le temps, pas le navigateur.
export async function POST(req) {
  const s = session(); if (s?.role !== 'client') return Response.json({ stop: true, minutes: 0 });
  const body = await req.json().catch(() => ({})); const c = s.client, now = Date.now();
  const dt = body.start || !c.last_beat ? 0 : Math.min((now - c.last_beat) / 1000, 15);
  const bal = Math.max(0, c.balance - dt / 60), stop = bal <= 0;
  db.prepare('update clients set balance=?, last_beat=? where id=?').run(bal, stop ? null : now, c.id);
  return Response.json({ stop, minutes: bal });
}
