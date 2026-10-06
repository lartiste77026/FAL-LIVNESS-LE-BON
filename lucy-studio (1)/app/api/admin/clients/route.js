import { db } from '@/lib/db';
import { session, hash, newToken } from '@/lib/auth';
const deny = () => new Response('no', { status: 403 });
export async function GET() {
  if (session()?.role !== 'admin') return deny();
  return Response.json(db.prepare('select id,username,balance,revoked,last_beat,created from clients order by id desc').all());
}
export async function POST(req) {
  if (session()?.role !== 'admin') return deny();
  const b = await req.json(), now = Date.now();
  const led = (id, d, r) => db.prepare('insert into ledger(client_id,delta,reason,at) values(?,?,?,?)').run(id, d, r, now);
  try {
    if (b.action === 'create') {
      const r = db.prepare('insert into clients(username,pass,balance,obs_token,created) values(?,?,?,?,?)').run(b.username.trim(), hash(b.password), +b.minutes || 0, newToken(), now);
      led(r.lastInsertRowid, +b.minutes || 0, 'création');
    } else if (b.action === 'minutes') { // ajoute ou retire ; le solde ne descend pas sous 0
      const c = db.prepare('select balance from clients where id=?').get(b.id);
      const nb = Math.max(0, c.balance + +b.delta);
      db.prepare('update clients set balance=? where id=?').run(nb, b.id); led(b.id, nb - c.balance, 'admin');
    } else if (b.action === 'revoke') db.prepare('update clients set revoked=?, last_beat=null where id=?').run(b.value ? 1 : 0, b.id);
    else if (b.action === 'password') db.prepare('update clients set pass=? where id=?').run(hash(b.password), b.id);
    else if (b.action === 'delete') db.prepare('delete from clients where id=?').run(b.id);
  } catch (e) { return Response.json({ error: String(e.message) }, { status: 400 }); }
  return Response.json({ ok: 1 });
}
