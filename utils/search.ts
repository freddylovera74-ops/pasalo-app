
/**
 * Motor de Búsqueda Inteligente PASALO.app
 * Optimizado para jerga venezolana y errores comunes de teclado.
 */

const SYNONYMS_MAP: Record<string, string[]> = {
  'telefono': ['celular', 'movil', 'smartphone', 'equipo', 'aifon', 'iphone', 'android'],
  'celular': ['telefono', 'movil', 'smartphone', 'equipo', 'aifon', 'iphone', 'android'],
  'computadora': ['laptop', 'pc', 'ordenador', 'canaima', 'macbook'],
  'laptop': ['computadora', 'pc', 'ordenador', 'canaima', 'macbook'],
  'zapatos': ['calzado', 'gomas', 'tenis', 'pinta', 'sneakers'],
  'ropa': ['vestimenta', 'pinta', 'trapo', 'camisa', 'pantalon'],
  'carro': ['vehiculo', 'auto', 'camioneta', 'nave', 'trasto'],
  'nevera': ['refrigerador', 'congelador', 'frio'],
  'televisor': ['tv', 'pantalla', 'monitor', 'smart tv']
};

/**
 * Normaliza strings: quita acentos, minúsculas y limpia espacios
 */
export const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Quitar tildes
    .trim();
};

/**
 * Calcula la distancia de Levenshtein entre dos palabras
 * Retorna el número de cambios mínimos para convertir 'a' en 'b'
 */
export const getLevenshteinDistance = (a: string, b: string): number => {
  const tmp = [];
  for (let i = 0; i <= a.length; i++) tmp[i] = [i];
  for (let j = 0; j <= b.length; j++) tmp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[a.length][b.length];
};

/**
 * Lógica principal de búsqueda Fuzzy + Sinónimos
 */
export const fuzzyMatch = (query: string, target: string): boolean => {
  const normalizedQuery = normalizeText(query);
  const normalizedTarget = normalizeText(target);

  if (normalizedTarget.includes(normalizedQuery)) return true;

  // Dividir en palabras para análisis profundo
  const queryWords = normalizedQuery.split(/\s+/);
  const targetWords = normalizedTarget.split(/\s+/);

  return queryWords.every(qWord => {
    // 1. Check exacto o inclusión
    if (targetWords.some(tWord => tWord.includes(qWord))) return true;

    // 2. Check Sinónimos
    for (const [key, synonyms] of Object.entries(SYNONYMS_MAP)) {
      if (qWord === key || synonyms.includes(qWord)) {
        // Si la palabra clave o sus sinónimos están en el target
        if (targetWords.some(tWord => tWord.includes(key) || synonyms.some(s => tWord.includes(s)))) {
          return true;
        }
      }
    }

    // 3. Check Levenshtein (Fuzzy)
    // Para palabras de más de 3 letras, permitimos distancia de hasta 1 o 2
    if (qWord.length > 3) {
      const threshold = qWord.length > 6 ? 2 : 1;
      if (targetWords.some(tWord => getLevenshteinDistance(qWord, tWord) <= threshold)) {
        return true;
      }
    }

    return false;
  });
};
