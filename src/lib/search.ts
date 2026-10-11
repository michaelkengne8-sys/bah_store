/**
 * Fuzzy Search Utility with Relevance Scoring
 *
 * Features:
 * - Levenshtein distance for fuzzy matching (handles typos)
 * - Relevance scoring: title > category > brand > description
 * - Prefix matching gets higher scores
 * - Exact matches get maximum score
 * - Autocomplete suggestions from product data
 */

import { useMemo } from 'react';

export interface SearchResult<T> {
  item: T;
  score: number;
  matches: SearchMatch[];
}

export interface SearchMatch {
  field: string;
  value: string;
  score: number;
}

export interface SearchOptions<T> {
  /** Fields to search, in priority order (first = highest priority) */
  fields: SearchField<T>[];
  /** Minimum score threshold (0-100) */
  threshold?: number;
  /** Maximum results to return */
  limit?: number;
  /** Enable fuzzy matching (Levenshtein distance) */
  fuzzy?: boolean;
  /** Maximum edit distance for fuzzy matching */
  maxEditDistance?: number;
  /** Boost exact matches */
  exactMatchBoost?: number;
  /** Boost prefix matches */
  prefixMatchBoost?: number;
}

export interface SearchField<T> {
  /** Field name for identification */
  name: string;
  /** Function to extract searchable text from item */
  getValue: (item: T) => string;
  /** Weight multiplier for this field's score (higher = more important) */
  weight?: number;
  /** Whether to enable fuzzy matching for this field */
  fuzzy?: boolean;
}

export interface AutocompleteOption {
  text: string;
  type: 'query' | 'product' | 'category' | 'brand';
  productId?: string;
  categoryId?: string;
}

/**
 * Calculate Levenshtein distance between two strings
 * Optimized with early exit when distance exceeds maxDistance
 */
function levenshteinDistance(str1: string, str2: string, maxDistance = Infinity): number {
  const len1 = str1.length;
  const len2 = str2.length;

  // Quick checks
  if (Math.abs(len1 - len2) > maxDistance) return maxDistance + 1;
  if (len1 === 0) return len2;
  if (len2 === 0) return len1;

  // Use two rows for space optimization
  let prevRow = new Array(len2 + 1);
  let currRow = new Array(len2 + 1);

  for (let j = 0; j <= len2; j++) {
    prevRow[j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    currRow[0] = i;
    let minInRow = i;

    const start = Math.max(1, i - maxDistance);
    const end = Math.min(len2, i + maxDistance);

    for (let j = start; j <= end; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      currRow[j] = Math.min(
        prevRow[j] + 1,        // deletion
        currRow[j - 1] + 1,    // insertion
        prevRow[j - 1] + cost  // substitution
      );
      minInRow = Math.min(minInRow, currRow[j]);
    }

    // Early exit if minimum in row exceeds maxDistance
    if (minInRow > maxDistance) return maxDistance + 1;

    [prevRow, currRow] = [currRow, prevRow];
  }

  return prevRow[len2];
}

/**
 * Calculate similarity score (0-100) between query and text
 */
function calculateSimilarity(query: string, text: string, options: {
  fuzzy: boolean;
  maxEditDistance: number;
  exactMatchBoost: number;
  prefixMatchBoost: number;
}): number {
  const q = query.toLowerCase().trim();
  const t = text.toLowerCase().trim();

  if (!q || !t) return 0;

  // Exact match - highest score
  if (q === t) return 100 * options.exactMatchBoost;

  // Prefix match - high score
  if (t.startsWith(q)) return 90 * options.prefixMatchBoost;

  // Word boundary prefix match (e.g., "wireless" matches "wireless headphones")
  const wordPrefixRegex = new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
  if (wordPrefixRegex.test(t)) return 80 * options.prefixMatchBoost;

  // Contains match
  if (t.includes(q)) return 70;

  // Fuzzy matching using Levenshtein distance
  if (options.fuzzy && q.length >= 2) {
    const distance = levenshteinDistance(q, t, options.maxEditDistance);
    if (distance <= options.maxEditDistance) {
      // Score based on edit distance (lower distance = higher score)
      const maxLen = Math.max(q.length, t.length);
      const similarity = 1 - distance / maxLen;
      return Math.round(50 * similarity);
    }
  }

  return 0;
}

/**
 * Generate autocomplete suggestions from product data
 */
export function generateAutocompleteSuggestions(
  products: Array<{ id: string; title: string; category: string }>,
  brands: string[],
  categories: Array<{ id: string; name: string }>,
  query: string,
  limit = 8
): AutocompleteOption[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const suggestions: Map<string, AutocompleteOption> = new Map();

  // 1. Product title suggestions (highest priority)
  for (const product of products) {
    const title = product.title.toLowerCase();
    if (title.includes(q)) {
      // Extract matching phrase from title
      const words = title.split(' ');
      for (let i = 0; i < words.length; i++) {
        for (let j = i + 1; j <= words.length && j - i <= 4; j++) {
          const phrase = words.slice(i, j).join(' ');
          if (phrase.includes(q) && phrase.length >= q.length && phrase.length <= 30) {
            const key = `product:${phrase}`;
            if (!suggestions.has(key)) {
              suggestions.set(key, {
                text: phrase,
                type: 'product',
                productId: product.id,
              });
            }
          }
        }
      }
      // Also add full title if it matches well
      if (title.startsWith(q) || title.includes(` ${q}`)) {
        const key = `product:full:${product.id}`;
        if (!suggestions.has(key)) {
          suggestions.set(key, {
            text: product.title,
            type: 'product',
            productId: product.id,
          });
        }
      }
    }
  }

  // 2. Category suggestions
  for (const cat of categories) {
    const name = cat.name.toLowerCase();
    if (name.includes(q)) {
      suggestions.set(`category:${cat.id}`, {
        text: cat.name,
        type: 'category',
        categoryId: cat.id,
      });
    }
  }

  // 3. Brand suggestions
  for (const brand of brands) {
    if (brand.toLowerCase().includes(q)) {
      suggestions.set(`brand:${brand}`, {
        text: brand,
        type: 'brand',
      });
    }
  }

  // 4. Query suggestions (common search patterns)
  const queryPatterns = [
    'wireless',
    'bluetooth',
    'smart',
    'pro',
    'mini',
    'max',
    'ultra',
    'premium',
    'budget',
    'sale',
    'new',
    'best',
  ];
  for (const pattern of queryPatterns) {
    if (pattern.includes(q) && !q.includes(pattern)) {
      suggestions.set(`query:${pattern}`, {
        text: pattern,
        type: 'query',
      });
    }
  }

  // Sort by relevance: exact prefix > contains > type priority
  const sorted = Array.from(suggestions.values()).sort((a, b) => {
    const aStarts = a.text.toLowerCase().startsWith(q);
    const bStarts = b.text.toLowerCase().startsWith(q);
    if (aStarts !== bStarts) return aStarts ? -1 : 1;

    const typePriority = { product: 0, category: 1, brand: 2, query: 3 };
    return typePriority[a.type] - typePriority[b.type];
  });

  return sorted.slice(0, limit);
}

/**
 * Main fuzzy search function with relevance scoring
 */
export function fuzzySearch<T>(
  items: T[],
  query: string,
  options: SearchOptions<T>
): SearchResult<T>[] {
  const {
    fields,
    threshold = 10,
    limit = 20,
    fuzzy = true,
    maxEditDistance = 2,
    exactMatchBoost = 1.5,
    prefixMatchBoost = 1.2,
  } = options;

  if (!query || !query.trim()) return [];

  const q = query.toLowerCase().trim();
  const results: SearchResult<T>[] = [];

  for (const item of items) {
    const matches: SearchMatch[] = [];
    let totalScore = 0;
    let maxFieldScore = 0;

    for (const field of fields) {
      const value = field.getValue(item);
      if (!value) continue;

      const fieldFuzzy = field.fuzzy ?? fuzzy;
      const score = calculateSimilarity(q, value, {
        fuzzy: fieldFuzzy,
        maxEditDistance,
        exactMatchBoost,
        prefixMatchBoost,
      });

      if (score > 0) {
        const weightedScore = score * (field.weight ?? 1);
        matches.push({
          field: field.name,
          value,
          score: weightedScore,
        });
        totalScore += weightedScore;
        maxFieldScore = Math.max(maxFieldScore, weightedScore);
      }
    }

    // Only include if meets threshold
    if (totalScore >= threshold && matches.length > 0) {
      // Boost score if multiple fields match
      const fieldMatchBonus = matches.length > 1 ? 1.1 : 1;
      results.push({
        item,
        score: Math.round(totalScore * fieldMatchBonus),
        matches,
      });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, limit);
}

/**
 * Create search options for Product search
 */
export function createProductSearchOptions(): SearchOptions<{
  id: string;
  title: string;
  description: string;
  category: string;
  brand?: string;
}> {
  return {
    fields: [
      { name: 'title', getValue: (p) => p.title, weight: 3.0, fuzzy: true },
      { name: 'category', getValue: (p) => p.category, weight: 2.0, fuzzy: true },
      { name: 'brand', getValue: (p) => p.brand ?? '', weight: 1.5, fuzzy: true },
      { name: 'description', getValue: (p) => p.description, weight: 1.0, fuzzy: true },
    ],
    threshold: 15,
    limit: 20,
    fuzzy: true,
    maxEditDistance: 2,
    exactMatchBoost: 1.5,
    prefixMatchBoost: 1.3,
  };
}

/**
 * Create search options for category search
 */
export function createCategorySearchOptions(): SearchOptions<{
  id: string;
  name: string;
  tagline: string;
}> {
  return {
    fields: [
      { name: 'name', getValue: (c) => c.name, weight: 3.0, fuzzy: true },
      { name: 'tagline', getValue: (c) => c.tagline, weight: 1.0, fuzzy: true },
    ],
    threshold: 10,
    limit: 10,
    fuzzy: true,
    maxEditDistance: 2,
  };
}

/**
 * Highlight matched text in search results
 */
export function highlightMatch(text: string, query: string): string {
  if (!text || !query || !query.trim()) return text;

  const terms = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (terms.length === 0) return text;

  const regex = new RegExp(`(${terms.join('|')})`, 'gi');
  return text.replace(regex, '<mark class="bg-accent-500/30 text-accent-100 px-0.5 rounded">$1</mark>');
}

/**
 * Search Analytics Types
 */
export interface SearchAnalyticsEvent {
  type: 'search' | 'click_result' | 'select_suggestion' | 'no_results' | 'refine';
  query: string;
  timestamp: number;
  resultCount?: number;
  clickedResultId?: string;
  suggestionType?: 'product' | 'category' | 'brand' | 'query';
  filters?: Record<string, string>;
}

export interface SearchAnalytics {
  totalSearches: number;
  totalClicks: number;
  totalNoResults: number;
  topQueries: Array<{ query: string; count: number }>;
  topNoResultQueries: Array<{ query: string; count: number }>;
  clickThroughRate: number;
  averageResultsPerSearch: number;
}

/**
 * Search Analytics Manager - tracks search interactions for analytics
 */
class SearchAnalyticsManager {
  private static STORAGE_KEY = 'bah-store-search-analytics';
  private static MAX_EVENTS = 500;
  private static TOP_QUERIES_LIMIT = 20;

  private events: SearchAnalyticsEvent[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(SearchAnalyticsManager.STORAGE_KEY);
      if (stored) {
        this.events = JSON.parse(stored);
      }
    } catch {
      this.events = [];
    }
  }

  private saveToStorage(): void {
    try {
      // Keep only the most recent events
      const eventsToSave = this.events.slice(-SearchAnalyticsManager.MAX_EVENTS);
      localStorage.setItem(SearchAnalyticsManager.STORAGE_KEY, JSON.stringify(eventsToSave));
    } catch {
      // Ignore storage errors
    }
  }

  trackSearch(query: string, resultCount: number, filters?: Record<string, string>): void {
    this.events.push({
      type: 'search',
      query: query.toLowerCase().trim(),
      timestamp: Date.now(),
      resultCount,
      filters,
    });
    this.saveToStorage();
  }

  trackClickResult(query: string, resultId: string): void {
    this.events.push({
      type: 'click_result',
      query: query.toLowerCase().trim(),
      timestamp: Date.now(),
      clickedResultId: resultId,
    });
    this.saveToStorage();
  }

  trackSelectSuggestion(query: string, suggestionType: 'product' | 'category' | 'brand' | 'query'): void {
    this.events.push({
      type: 'select_suggestion',
      query: query.toLowerCase().trim(),
      timestamp: Date.now(),
      suggestionType,
    });
    this.saveToStorage();
  }

  trackNoResults(query: string, filters?: Record<string, string>): void {
    this.events.push({
      type: 'no_results',
      query: query.toLowerCase().trim(),
      timestamp: Date.now(),
      filters,
    });
    this.saveToStorage();
  }

  trackRefine(query: string, filters: Record<string, string>): void {
    this.events.push({
      type: 'refine',
      query: query.toLowerCase().trim(),
      timestamp: Date.now(),
      filters,
    });
    this.saveToStorage();
  }

  getAnalytics(days = 30): SearchAnalytics {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const recentEvents = this.events.filter(e => e.timestamp >= cutoff);

    const searches = recentEvents.filter(e => e.type === 'search');
    const clicks = recentEvents.filter(e => e.type === 'click_result');
    const noResults = recentEvents.filter(e => e.type === 'no_results');

    // Top queries by search count
    const queryCounts = new Map<string, number>();
    for (const e of searches) {
      queryCounts.set(e.query, (queryCounts.get(e.query) || 0) + 1);
    }
    const topQueries = Array.from(queryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, SearchAnalyticsManager.TOP_QUERIES_LIMIT)
      .map(([query, count]) => ({ query, count }));

    // Top no-result queries
    const noResultCounts = new Map<string, number>();
    for (const e of noResults) {
      noResultCounts.set(e.query, (noResultCounts.get(e.query) || 0) + 1);
    }
    const topNoResultQueries = Array.from(noResultCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, SearchAnalyticsManager.TOP_QUERIES_LIMIT)
      .map(([query, count]) => ({ query, count }));

    const totalSearches = searches.length;
    const totalClicks = clicks.length;
    const totalResults = searches.reduce((sum, s) => sum + (s.resultCount || 0), 0);

    return {
      totalSearches,
      totalClicks,
      totalNoResults: noResults.length,
      topQueries,
      topNoResultQueries,
      clickThroughRate: totalSearches > 0 ? totalClicks / totalSearches : 0,
      averageResultsPerSearch: totalSearches > 0 ? totalResults / totalSearches : 0,
    };
  }

  clearAnalytics(): void {
    this.events = [];
    this.saveToStorage();
  }
}

// Singleton instance
let analyticsInstance: SearchAnalyticsManager | null = null;

export function getSearchAnalytics(): SearchAnalyticsManager {
  if (!analyticsInstance) {
    analyticsInstance = new SearchAnalyticsManager();
  }
  return analyticsInstance;
}

/**
 * Hook for React components to use search analytics
 */
export function useSearchAnalytics() {
  return useMemo(() => {
    const analytics = getSearchAnalytics();

    return {
      trackSearch: analytics.trackSearch.bind(analytics),
      trackClickResult: analytics.trackClickResult.bind(analytics),
      trackSelectSuggestion: analytics.trackSelectSuggestion.bind(analytics),
      trackNoResults: analytics.trackNoResults.bind(analytics),
      trackRefine: analytics.trackRefine.bind(analytics),
      getAnalytics: analytics.getAnalytics.bind(analytics),
      clearAnalytics: analytics.clearAnalytics.bind(analytics),
    };
  }, []);
}

/**
 * Recent Searches Manager - stores and retrieves recent search queries
 */
class RecentSearchesManager {
  private static STORAGE_KEY = 'bah-store-recent-searches';
  private static MAX_SEARCHES = 10;

  getRecentSearches(): string[] {
    try {
      const stored = localStorage.getItem(RecentSearchesManager.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore errors
    }
    return [];
  }

  addRecentSearch(query: string): void {
    const trimmed = query.trim();
    if (!trimmed) return;

    const recent = this.getRecentSearches();
    // Remove if already exists
    const filtered = recent.filter(q => q.toLowerCase() !== trimmed.toLowerCase());
    // Add to front
    filtered.unshift(trimmed);
    // Keep only max
    const updated = filtered.slice(0, RecentSearchesManager.MAX_SEARCHES);
    try {
      localStorage.setItem(RecentSearchesManager.STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore errors
    }
  }

  removeRecentSearch(query: string): void {
    const recent = this.getRecentSearches();
    const filtered = recent.filter(q => q.toLowerCase() !== query.toLowerCase());
    try {
      localStorage.setItem(RecentSearchesManager.STORAGE_KEY, JSON.stringify(filtered));
    } catch {
      // Ignore errors
    }
  }

  clearRecentSearches(): void {
    try {
      localStorage.removeItem(RecentSearchesManager.STORAGE_KEY);
    } catch {
      // Ignore errors
    }
  }
}

let recentSearchesInstance: RecentSearchesManager | null = null;

export function getRecentSearchesManager(): RecentSearchesManager {
  if (!recentSearchesInstance) {
    recentSearchesInstance = new RecentSearchesManager();
  }
  return recentSearchesInstance;
}

export function useRecentSearches() {
  return useMemo(() => {
    const manager = getRecentSearchesManager();

    return {
      getRecentSearches: manager.getRecentSearches.bind(manager),
      addRecentSearch: manager.addRecentSearch.bind(manager),
      removeRecentSearch: manager.removeRecentSearch.bind(manager),
      clearRecentSearches: manager.clearRecentSearches.bind(manager),
    };
  }, []);
}