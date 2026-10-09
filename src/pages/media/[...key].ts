import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

// Immagini da R2: chiavi immutabili (contengono l'hash del contenuto).
export const GET: APIRoute = async ({ params, request }) => {
  const key = params.key ?? '';
  if (!/^(wineries|wines|uploads)\/[\w./-]+\.(webp|jpg|jpeg|png|avif)$/.test(key) || key.includes('..')) {
    return new Response('Not found', { status: 404 });
  }
  const obj = await env.MEDIA.get(key, { onlyIf: request.headers });
  if (!obj) return new Response('Not found', { status: 404 });
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  if (!('body' in obj)) return new Response(null, { status: 304, headers });
  return new Response(obj.body, { headers });
};
