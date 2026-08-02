const PRIORITY_GROUPS = [
  new Set(["construction"]),
  new Set(["economy", "investment"]),
  new Set(["law", "government"]),
];

function scoreArticle(item, now = new Date()) {
  let score = Number(item.relevanceScore) || 0;
  if (item.sourceType === "official" || item.sourceType === "legal")
    score += 10;
  const published = new Date(item.publishedAt);
  if (
    !Number.isNaN(published.getTime()) &&
    now.getTime() - published.getTime() <= 12 * 60 * 60 * 1000
  )
    score += 5;
  if (item.category === "china_kz") score += 8;
  if (PRIORITY_GROUPS.some((group) => group.has(item.category))) score += 4;
  return score;
}

function selectDaily(items, options = {}) {
  const max = Math.max(1, Number(options.max) || 12);
  const now = options.now || new Date();
  const eligible = items
    .filter(
      (item) => item.status !== "rejected" && Number(item.relevanceScore) >= 65,
    )
    .map((item) => ({ ...item, rank: scoreArticle(item, now) }))
    .sort(
      (a, b) =>
        b.rank - a.rank || new Date(b.publishedAt) - new Date(a.publishedAt),
    );

  const selected = [];
  const selectedIds = new Set();
  for (const group of PRIORITY_GROUPS) {
    const candidate = eligible.find(
      (item) => group.has(item.category) && !selectedIds.has(item.id),
    );
    if (candidate && selected.length < max) {
      selected.push(candidate);
      selectedIds.add(candidate.id);
    }
  }
  for (const item of eligible) {
    if (selected.length >= max) break;
    if (!selectedIds.has(item.id)) {
      selected.push(item);
      selectedIds.add(item.id);
    }
  }
  return selected;
}

module.exports = { PRIORITY_GROUPS, scoreArticle, selectDaily };
