import { session } from '@/lib/auth';
const APP = 'decart/lucy-2-5/realtime';
// Jeton fal de 10 s : sans solde ou si révoqué, aucun nouveau jeton n'est émis.
export async function POST() {
  const s = session(); if (s?.role !== 'client' || s.client.balance <= 0) return new Response('denied', { status: 403 });
  const r = await fetch('https://rest.alpha.fal.ai/tokens/', { method: 'POST',
    headers: { Authorization: 'Key ' + process.env.FAL_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ allowed_apps: [APP], token_expiration: 10 }) }); // VERIFY: format allowed_apps dans la doc fal
  if (!r.ok) return new Response('fal error', { status: 502 });
  return new Response((await r.text()).replace(/"/g, ''));
}
