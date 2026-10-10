import type { APIRoute } from 'astro';
import { insertVisitRequest, wineryIdBySlug } from '../../lib/db';
import { backTo, ipHash, isBot, newId, rateLimited, text, validateContact } from '../../lib/forms';

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const slug = text(form, 'cantina', 120) ?? '';
  const winery = await wineryIdBySlug(slug);
  if (!winery) return new Response('Cantina non trovata', { status: 404 });
  const page = `/cantine/${slug}`;

  if (isBot(form)) return backTo(page, { ok: true }, 'visita'); // al bot diciamo che è andata bene
  const error = validateContact(form);
  if (error) return backTo(page, { error }, 'visita');

  const date = text(form, 'data', 10);
  if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < new Date().toISOString().slice(0, 10))) {
    return backTo(page, { error: 'data' }, 'visita');
  }
  const hash = await ipHash(request);
  if (await rateLimited(hash)) return backTo(page, { error: 'troppe' }, 'visita');

  const guests = Math.min(Math.max(Number.parseInt(String(form.get('persone') ?? '2'), 10) || 2, 1), 50);
  await insertVisitRequest({
    id: newId(),
    winery_id: winery.id,
    // L'esperienza scelta viene verificata nella query: deve essere pubblicata e della stessa cantina.
    experience_id: text(form, 'esperienza', 200),
    name: text(form, 'nome')!,
    email: text(form, 'email')!.toLowerCase(),
    phone: text(form, 'telefono', 40),
    preferred_date: date,
    guests,
    message: text(form, 'messaggio', 2000),
    ip_hash: hash,
  });
  return backTo(page, { ok: true }, 'visita');
};
