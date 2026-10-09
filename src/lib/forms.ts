// Form pubblici senza JavaScript: POST → validazione → redirect 303 con esito nell'URL.
import { recentRequestsFrom } from './db';

export const MAX_REQUESTS_PER_HOUR = 5;
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,}$/i;

export type FormErrorCode = 'campi' | 'email' | 'consenso' | 'troppe' | 'cantina' | 'data';

export const FORM_ERRORS: Record<FormErrorCode, string> = {
  campi: 'Mancano dei campi obbligatori: nome ed email.',
  email: 'L’indirizzo email non sembra valido.',
  consenso: 'Serve il consenso al trattamento dei dati per poterti rispondere.',
  troppe: 'Abbiamo ricevuto troppe richieste da questa connessione. Riprova tra un’ora.',
  cantina: 'Indica la cantina che vuoi rivendicare.',
  data: 'La data deve essere da oggi in poi.',
};

export const text = (form: FormData, key: string, max = 200) => {
  const v = String(form.get(key) ?? '').trim().slice(0, max);
  return v || null;
};

/** Valida i campi comuni. Ritorna un codice errore oppure null. */
export function validateContact(form: FormData): FormErrorCode | null {
  const name = text(form, 'nome');
  const email = text(form, 'email');
  if (!name || !email) return 'campi';
  if (!EMAIL.test(email)) return 'email';
  if (form.get('consenso') !== 'si') return 'consenso';
  return null;
}

/** Honeypot: il campo "sito_web" è nascosto agli umani; se compilato è un bot. */
export const isBot = (form: FormData) => Boolean(String(form.get('sito_web') ?? '').trim());

/** Hash dell'IP (non salviamo l'indirizzo in chiaro): cambia ogni giorno. */
export async function ipHash(request: Request) {
  const ip = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? 'local';
  const day = new Date().toISOString().slice(0, 10);
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`cdm:${day}:${ip}`));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

export async function rateLimited(hash: string) {
  return (await recentRequestsFrom(hash)) >= MAX_REQUESTS_PER_HOUR;
}

/** Redirect 303 verso la pagina del form con l'esito (?inviata=1 oppure ?errore=codice). */
export function backTo(path: string, result: { ok: true } | { error: FormErrorCode }, anchor = 'modulo') {
  const url = new URL(path, 'http://x');
  if ('ok' in result) url.searchParams.set('inviata', '1');
  else url.searchParams.set('errore', result.error);
  return new Response(null, { status: 303, headers: { Location: `${url.pathname}${url.search}#${anchor}` } });
}

export const newId = () => crypto.randomUUID();
