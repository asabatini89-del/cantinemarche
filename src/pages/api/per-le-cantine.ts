import type { APIRoute } from 'astro';
import { insertContactRequest, wineryIdBySlug } from '../../lib/db';
import { backTo, ipHash, isBot, newId, rateLimited, text, validateContact } from '../../lib/forms';

const PAGE = '/per-le-cantine';

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  if (isBot(form)) return backTo(PAGE, { ok: true });
  const error = validateContact(form);
  if (error) return backTo(PAGE, { error });

  const kind = form.get('motivo') === 'info' ? 'info' : 'claim';
  const slug = text(form, 'cantina', 120);
  const winery = slug ? await wineryIdBySlug(slug) : null;
  const wineryText = text(form, 'cantina_nome', 160);
  if (kind === 'claim' && !winery && !wineryText) return backTo(PAGE, { error: 'cantina' });

  const hash = await ipHash(request);
  if (await rateLimited(hash)) return backTo(PAGE, { error: 'troppe' });

  await insertContactRequest({
    id: newId(),
    kind,
    winery_id: winery?.id ?? null,
    winery_text: winery ? null : wineryText,
    name: text(form, 'nome')!,
    email: text(form, 'email')!.toLowerCase(),
    phone: text(form, 'telefono', 40),
    role: text(form, 'ruolo', 80),
    message: text(form, 'messaggio', 2000),
    ip_hash: hash,
  });
  return backTo(PAGE, { ok: true });
};
