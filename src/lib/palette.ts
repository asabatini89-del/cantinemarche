// Copertine pastello: una per provincia e una per territorio (classi Tailwind statiche).
export const PROVINCE_COVER: Record<string, { bg: string; fill: string }> = {
  PU: { bg: 'bg-salvia', fill: 'fill-salvia' },
  AN: { bg: 'bg-ocra', fill: 'fill-ocra' },
  MC: { bg: 'bg-celeste', fill: 'fill-celeste' },
  FM: { bg: 'bg-cipria', fill: 'fill-cipria' },
  AP: { bg: 'bg-glicine', fill: 'fill-glicine' },
};

export const TERRITORY_COVER: Record<string, string> = {
  'castelli-di-jesi': 'bg-pistacchio',
  conero: 'bg-celeste',
  matelica: 'bg-salvia',
  piceno: 'bg-glicine',
  metauro: 'bg-ocra',
  'morro-d-alba': 'bg-cipria',
  maceratese: 'bg-albicocca',
};

export const coverFor = (territoryId: string | null | undefined) =>
  (territoryId && TERRITORY_COVER[territoryId]) || 'bg-carta-2';

/** Numero di catalogo: N° 007 */
export const catalogNo = (n: number) => `N° ${String(n).padStart(3, '0')}`;

/**
 * Nome per i titoli: i nomi interamente in maiuscolo (ragioni sociali copiate dai
 * registri) diventano "Az. Agr. Colleluce di Malavolta Franca". Le sigle con il
 * punto (S.S., S.R.L.) restano maiuscole. Il nome originale resta nei dati e nel JSON-LD.
 */
const LOWER = new Set(['di', 'del', 'della', 'dei', 'delle', 'de', 'e', 'in', 'a', 'al', 'alla', 'da', 'dal', 'sul', 'sulla']);
export function displayName(name: string) {
  const letters = name.replace(/[^\p{L}]/gu, '');
  if (!letters || letters !== letters.toUpperCase()) return name;
  return name
    .toLowerCase()
    .split(/(\s+)/)
    .map((w, i) => {
      if (/^\s+$/.test(w)) return w;
      if (/^([a-z]\.){2,}[a-z]?\.?$/i.test(w) || /^(srl|snc|sas|spa|ss)$/i.test(w.replace(/[.,]/g, ''))) return w.toUpperCase();
      if (i > 0 && LOWER.has(w)) return w;
      return w.replace(/^(\p{L})|(['’]\p{L})/gu, (m) => m.toUpperCase());
    })
    .join('');
}
