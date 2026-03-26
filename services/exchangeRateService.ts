/**
 * exchangeRateService.ts
 * Obtiene el tipo de cambio USD/VES del mercado paralelo venezolano.
 * Fuente: ve.dolarapi.com  (gratuita, sin auth)
 * Cache local de 1 hora para no saturar la API.
 */

const CACHE_KEY = 'pasalo_exchange_rate';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora
const FALLBACK_RATE = 36.5; // Valor por defecto si la API falla
const API_URL = 'https://ve.dolarapi.com/v1/dolares/paralelo';

interface CachedRate {
  rate: number;
  fetchedAt: number;
}

function loadCachedRate(): CachedRate | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: CachedRate = JSON.parse(raw);
    return parsed;
  } catch {
    return null;
  }
}

function saveRateToCache(rate: number) {
  const entry: CachedRate = { rate, fetchedAt: Date.now() };
  localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
}

/**
 * Devuelve el tipo de cambio USD→VES vigente.
 * Primero intenta el cache local; si expiró o no existe, llama a la API.
 * Si la API falla, devuelve el fallback.
 */
export async function getExchangeRate(): Promise<number> {
  const cached = loadCachedRate();
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.rate;
  }

  try {
    const res = await fetch(API_URL, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    const data = await res.json();
    // La API devuelve { promedio: number, ... }
    const rate = data.promedio ?? data.paralelo ?? FALLBACK_RATE;
    saveRateToCache(rate);
    return rate;
  } catch (err) {
    console.warn('Exchange rate fetch failed, using fallback:', err);
    // Si hay un valor en cache aunque sea viejo, úsalo
    if (cached) return cached.rate;
    return FALLBACK_RATE;
  }
}

/**
 * Convierte USD a VES usando el tipo de cambio actual.
 */
export async function usdToVes(usd: number): Promise<number> {
  const rate = await getExchangeRate();
  return usd * rate;
}
