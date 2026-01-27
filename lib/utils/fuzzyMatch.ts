/**
 * Simple fuzzy matching algorithm for tag suggestions.
 * Returns a score between 0 and 1, where 1 is a perfect match.
 */
export function fuzzyMatch(query: string, target: string): number {
  const q = query.toLowerCase();
  const t = target.toLowerCase();

  // Exact match
  if (q === t) return 1;

  // Target starts with query
  if (t.startsWith(q)) return 0.9;

  // Target contains query
  if (t.includes(q)) return 0.7;

  // Check for character sequence match (fuzzy)
  let qIndex = 0;
  let consecutiveBonus = 0;
  let lastMatchIndex = -2;

  for (let tIndex = 0; tIndex < t.length && qIndex < q.length; tIndex++) {
    if (t[tIndex] === q[qIndex]) {
      // Bonus for consecutive matches
      if (tIndex === lastMatchIndex + 1) {
        consecutiveBonus += 0.1;
      }
      lastMatchIndex = tIndex;
      qIndex++;
    }
  }

  // All characters found in order
  if (qIndex === q.length) {
    const baseScore = q.length / t.length;
    return Math.min(0.6, baseScore * 0.5 + consecutiveBonus);
  }

  return 0;
}

/**
 * Get tag suggestions sorted by relevance.
 */
export function getTagSuggestions(
  query: string,
  allTags: string[],
  maxResults: number = 5
): string[] {
  if (!query.trim()) return [];

  const scored = allTags
    .map((tag) => ({ tag, score: fuzzyMatch(query, tag) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, maxResults).map(({ tag }) => tag);
}

/**
 * Count occurrences of each tag across all posts.
 */
export function getTagCounts(
  posts: { categories: string[] }[]
): Map<string, number> {
  const counts = new Map<string, number>();

  posts.forEach((post) => {
    post.categories.forEach((tag) => {
      const normalizedTag = tag.toLowerCase();
      counts.set(normalizedTag, (counts.get(normalizedTag) || 0) + 1);
    });
  });

  return counts;
}

/**
 * Get all unique tags from posts, preserving original casing from first occurrence.
 */
export function getAllUniqueTags(
  posts: { categories: string[] }[]
): string[] {
  const tagMap = new Map<string, string>(); // lowercase -> original

  posts.forEach((post) => {
    post.categories.forEach((tag) => {
      const lower = tag.toLowerCase();
      if (!tagMap.has(lower)) {
        tagMap.set(lower, tag);
      }
    });
  });

  return Array.from(tagMap.values()).sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  );
}
