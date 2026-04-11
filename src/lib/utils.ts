import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Strip HTML tags and decode common entities – returns plain text. */
export function stripHtml(html: string): string {
  if (!html) return "";
  const text = html.replace(/<[^>]*>/g, "");
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Normalize string for accent-insensitive search (remove accents + lowercase + collapse spaces). */
export function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Synonym/alias map – keys are normalized forms, values are normalized canonical terms. */
const SYNONYMS: Record<string, string[]> = {
  "barra de jacuipe": ["barra do jacuipe"],
  "vilas": ["villas"],
  "vilas do jacuipe": ["villas do jacuipe"],
  "vila do jacuipe": ["villas do jacuipe"],
  "vila": ["villas"],
};

/** Expand a normalized query using the synonym table. Returns the original + any synonyms. */
export function expandQuery(normalizedQuery: string): string[] {
  const variants = [normalizedQuery];
  for (const [alias, targets] of Object.entries(SYNONYMS)) {
    if (normalizedQuery.includes(alias)) {
      targets.forEach((t) => variants.push(normalizedQuery.replace(alias, t)));
    }
  }
  // Also check if any synonym target matches and add the alias direction
  for (const [alias, targets] of Object.entries(SYNONYMS)) {
    for (const t of targets) {
      if (normalizedQuery.includes(t)) {
        variants.push(normalizedQuery.replace(t, alias));
      }
    }
  }
  return [...new Set(variants)];
}

/** Simple fuzzy match: checks if query chars appear in order within text (with tolerance for 1 char difference). */
export function fuzzyMatch(text: string, query: string): { match: boolean; score: number } {
  const t = normalizeText(text);
  const q = normalizeText(query);
  if (!q) return { match: false, score: 0 };

  // Exact substring = best score
  if (t.includes(q)) return { match: true, score: 100 };

  // Check expanded synonyms
  const expanded = expandQuery(q);
  for (const variant of expanded) {
    if (variant !== q && t.includes(variant)) return { match: true, score: 95 };
  }

  // Starts-with on any word
  const words = t.split(" ");
  if (words.some((w) => w.startsWith(q))) return { match: true, score: 90 };

  // Levenshtein-based fuzzy for short queries (≤12 chars) against each word
  if (q.length >= 3 && q.length <= 12) {
    for (const w of words) {
      const d = levenshtein(w.slice(0, q.length + 2), q);
      if (d <= Math.max(1, Math.floor(q.length / 4))) return { match: true, score: 70 - d * 5 };
    }
  }

  return { match: false, score: 0 };
}

/** Levenshtein distance between two strings. */
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/* ────────── Intent Detection ────────── */

export interface SearchIntent {
  /** The cleaned query with intent keywords removed */
  cleanQuery: string;
  /** Detected transaction type intent, if any */
  transactionType: 'venda' | 'temporada' | null;
  /** Human-readable label for the intent */
  intentLabel: string | null;
}

const INTENT_KEYWORDS: { keywords: string[]; type: 'venda' | 'temporada'; label: string }[] = [
  { keywords: ['temporada', 'aluguel', 'alugar', 'diaria', 'diarias', 'ferias', 'veraneio'], type: 'temporada', label: 'Temporada' },
  { keywords: ['venda', 'comprar', 'compra', 'a venda', 'avenda', 'investir', 'investimento'], type: 'venda', label: 'Venda' },
];

/** Parse a search query to extract intent (venda/temporada) and return the cleaned query. */
export function parseSearchIntent(rawQuery: string): SearchIntent {
  const normalized = normalizeText(rawQuery);
  let transactionType: 'venda' | 'temporada' | null = null;
  let intentLabel: string | null = null;
  let cleanNormalized = normalized;

  for (const group of INTENT_KEYWORDS) {
    for (const kw of group.keywords) {
      // Match as whole word or at boundaries
      const regex = new RegExp(`\\b${kw}\\b`, 'g');
      if (regex.test(cleanNormalized)) {
        transactionType = group.type;
        intentLabel = group.label;
        cleanNormalized = cleanNormalized.replace(regex, '').replace(/\s+/g, ' ').trim();
        break;
      }
    }
    if (transactionType) break;
  }

  // Rebuild a clean query from original preserving casing roughly
  // We just strip intent keywords from the original query
  let cleanQuery = rawQuery;
  if (transactionType) {
    for (const group of INTENT_KEYWORDS) {
      if (group.type !== transactionType) continue;
      for (const kw of group.keywords) {
        const regex = new RegExp(`\\b${kw}\\b`, 'gi');
        cleanQuery = cleanQuery.replace(regex, '').replace(/\s+/g, ' ').trim();
      }
    }
  }

  return { cleanQuery, transactionType, intentLabel };
}
