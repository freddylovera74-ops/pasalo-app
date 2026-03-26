/**
 * geminiService.ts
 * Todas las llamadas a Gemini pasan por Cloud Functions para proteger la API key.
 * La API key NUNCA se expone al navegador.
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../lib/firebase';

const functions = getFunctions(app, 'us-central1');

export const enhanceListingDescription = async (title: string, currentDesc: string): Promise<string> => {
  try {
    const fn = httpsCallable<{ title: string; description: string }, { result: string }>(
      functions, 'geminiEnhanceDescription'
    );
    const res = await fn({ title, description: currentDesc });
    return res.data.result || currentDesc;
  } catch (error) {
    console.error('geminiEnhanceDescription error:', error);
    return currentDesc;
  }
};

export const suggestPrice = async (title: string, category: string): Promise<{ min: number; max: number; average: number } | null> => {
  try {
    const fn = httpsCallable<{ title: string; category: string }, { min: number; max: number; average: number }>(
      functions, 'geminiSuggestPrice'
    );
    const res = await fn({ title, category });
    return res.data;
  } catch (error) {
    console.error('geminiSuggestPrice error:', error);
    return null;
  }
};

export const getLiveActivityFeed = async (location: string): Promise<string[]> => {
  try {
    const fn = httpsCallable<{ location: string }, string[]>(functions, 'geminiLiveActivity');
    const res = await fn({ location });
    return Array.isArray(res.data) ? res.data : [];
  } catch {
    return ['Alguien acaba de negociar un artículo', 'Nueva venta en tu zona', 'Tendencia en Electrónica'];
  }
};

export const getSellerAIInsights = async (stats: { views: number; avgTime: number; topCategory: string }): Promise<string> => {
  try {
    const fn = httpsCallable<typeof stats, { result: string }>(functions, 'geminiSellerInsights');
    const res = await fn(stats);
    return res.data.result || '¡Tus artículos están destacando!';
  } catch {
    return '¡Tus artículos están destacando. Sigue publicando!';
  }
};
