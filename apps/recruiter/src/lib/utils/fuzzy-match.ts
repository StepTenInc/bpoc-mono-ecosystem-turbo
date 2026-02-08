/**
 * Fuzzy matching utilities for client names
 * Handles variations like "ShoreAgents Inc" vs "Shore Agents INC"
 */

/**
 * Normalize company name for comparison
 * Removes common suffixes, punctuation, extra spaces, and lowercases
 */
export function normalizeCompanyName(name: string): string {
  if (!name) return '';

  return name
    .toLowerCase()
    .trim()
    // Remove common suffixes
    .replace(/\b(inc|llc|ltd|corp|corporation|company|co|pty|limited)\b\.?/gi, '')
    // Remove punctuation
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
    // Remove ALL whitespace (so "Shore Agents" matches "ShoreAgents")
    .replace(/\s+/g, '')
    .trim();
}

/**
 * Calculate similarity score between two company names (0-100)
 * Uses Levenshtein distance for fuzzy matching
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const norm1 = normalizeCompanyName(str1);
  const norm2 = normalizeCompanyName(str2);

  // Exact match after normalization
  if (norm1 === norm2) return 100;

  // Calculate Levenshtein distance
  const distance = levenshteinDistance(norm1, norm2);
  const maxLength = Math.max(norm1.length, norm2.length);

  // Convert distance to similarity percentage
  const similarity = maxLength === 0 ? 100 : ((maxLength - distance) / maxLength) * 100;

  return Math.round(similarity);
}

/**
 * Levenshtein distance algorithm
 * Measures the minimum number of edits needed to change one string into another
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  // Create a 2D array for dynamic programming
  const matrix: number[][] = [];

  // Initialize first column
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  // Initialize first row
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,       // deletion
        matrix[i][j - 1] + 1,       // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Find best matching company from a list
 * Returns the match with highest similarity above threshold
 */
export function findBestMatch(
  searchName: string,
  candidates: Array<{ id: string; name: string; email?: string | null }>,
  options: {
    minSimilarity?: number;
    matchEmail?: string;
  } = {}
): { match: any; similarity: number } | null {
  const { minSimilarity = 85, matchEmail } = options;

  let bestMatch: any = null;
  let bestSimilarity = 0;

  for (const candidate of candidates) {
    // Email match takes priority
    if (matchEmail && candidate.email &&
        candidate.email.toLowerCase() === matchEmail.toLowerCase()) {
      return { match: candidate, similarity: 100 };
    }

    // Name similarity
    const similarity = calculateSimilarity(searchName, candidate.name);

    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestMatch = candidate;
    }
  }

  // Only return if above threshold
  if (bestSimilarity >= minSimilarity) {
    return { match: bestMatch, similarity: bestSimilarity };
  }

  return null;
}
