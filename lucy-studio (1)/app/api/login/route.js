import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { check, mk } from '@/lib/auth';
const set = (o) => cookies().set('s', mk({ ...o, exp: Date.now() + 12 * 3600e3 }), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 12 * 3600 });
export async function POST(req) {
  const { username, password } = await req.json();
  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASSWORD) { set({ role: 'admin' }); return Response.json({ role: 'admin' }); }
  const c = db.prepare('select * from clients where username=?').get(username || '');
  if (!c || c.revoked || !check(password || '', c.pass)) return Response.json({ error: 'Identifiants invalides ou accès révoqué' }, { status: 401 });
  set({ role: 'client', id: c.id }); return Response.json({ role: 'client' });
}
export async function DELETE() { cookies().delete('s'); return Response.json({ ok: 1 }); }
