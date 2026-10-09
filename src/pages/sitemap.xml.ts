import type { APIRoute } from 'astro';
import { allSlugs } from '../lib/db';

export const GET: APIRoute = async ({ site }) => {
  const { wineries, territories, denominations } = await allSlugs();
  const url = (path: string, lastmod?: string) =>
    `<url><loc>${new URL(path, site).href}</loc>${lastmod ? `<lastmod>${lastmod.slice(0, 10)}</lastmod>` : ''}</url>`;
  const body = [
    url('/'), url('/cantine'), url('/territori'), url('/denominazioni'), url('/per-le-cantine'), url('/privacy'),
    ...territories.map((t) => url(`/territori/${t.slug}`)),
    ...denominations.map((d) => url(`/denominazioni/${d.slug}`)),
    ...wineries.map((w) => url(`/cantine/${w.slug}`, w.updated_at)),
  ].join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
};
