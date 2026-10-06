import crypto from 'crypto';
import { cookies } from 'next/headers';
import { db } from './db';
export const hash = (p) => { const s = crypto.randomBytes(16).toString('hex'); return s + ':' + crypto.scryptSync(p, s, 32).toString('hex'); };
export const check = (p, h) => { const [s, k] = h.split(':'); const a = Buffer.from(crypto.scryptSync(p, s, 32).toString('hex')); const b = Buffer.from(k); return a.length === b.length && crypto.timingSafeEqual(a, b); };
const sign = (v) => crypto.createHmac('sha256', process.env.SESSION_SECRET).update(v).digest('base64url');
export const mk = (o) => { const v = Buffer.from(JSON.stringify(o)).toString('base64url'); return v + '.' + sign(v); };
export const newToken = () => crypto.randomBytes(32).toString('hex');
// Relit la base à CHAQUE requête : un client révoqué est refusé immédiatement.
export function session() {
  const c = cookies().get('s')?.value; if (!c) return null;
  const [v, m] = c.split('.'); if (!m) return null;
  const e = sign(v); if (e.length !== m.length || !crypto.timingSafeEqual(Buffer.from(e), Buffer.from(m))) return null;
  const o = JSON.parse(Buffer.from(v, 'base64url').toString()); if (o.exp < Date.now()) return null;
  if (o.role === 'admin') return { role: 'admin' };
  const cl = db.prepare('select * from clients where id=?').get(o.id);
  return cl && !cl.revoked ? { role: 'client', client: cl } : null;
}
