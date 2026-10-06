import { db } from '@/lib/db';
import { session, newToken } from '@/lib/auth';
const out = (c, req) => Response.json({ username: c.username, minutes: c.balance, obsUrl: (process.env.APP_URL || new URL(req.url).origin) + '/obs/' + c.obs_token });
export async function GET(req) { const s = session(); if (s?.role !== 'client') return new Response('no', { status: 401 }); return out(s.client, req); }
export async function POST(req) { // régénère l'URL OBS : l'ancienne meurt immédiatement
  const s = session(); if (s?.role !== 'client') return new Response('no', { status: 401 });
  const t = newToken(); db.prepare('update clients set obs_token=? where id=?').run(t, s.client.id);
  return out({ ...s.client, obs_token: t }, req);
}
