function canonicalizeUrl(value) {
  const url = new URL(value);
  const trackingKeys = new Set([
    "fbclid",
    "gclid",
    "yclid",
    "ref",
    "source",
    "utm_campaign",
    "utm_content",
    "utm_medium",
    "utm_source",
    "utm_term",
  ]);

  for (const key of [...url.searchParams.keys()]) {
    if (
      trackingKeys.has(key.toLowerCase()) ||
      key.toLowerCase().startsWith("utm_")
    ) {
      url.searchParams.delete(key);
    }
  }

  url.hash = "";
  url.hostname = url.hostname.toLowerCase();
  url.pathname = url.pathname.replace(/\/{2,}/g, "/").replace(/\/$/, "") || "/";
  const query = url.searchParams.toString();
  return `${url.protocol}//${url.host}${url.pathname === "/" ? "" : url.pathname}${query ? `?${query}` : ""}`;
}

function normalizedTitle(value = "") {
  return String(value)
    .toLocaleLowerCase("ru")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function recordQuality(item) {
  return String(item.text || item.summary || "").length;
}

function deduplicateArticles(items) {
  const byUrl = new Map();
  const byTitle = new Map();

  for (const item of items) {
    let canonicalUrl;
    try {
      canonicalUrl = canonicalizeUrl(
        item.canonicalUrl || item.sourceUrl || item.url,
      );
    } catch {
      continue;
    }

    const candidate = { ...item, canonicalUrl };
    const titleKey = normalizedTitle(item.titleOriginal || item.title || "");
    const existing =
      byUrl.get(canonicalUrl) || (titleKey ? byTitle.get(titleKey) : null);

    if (!existing || recordQuality(candidate) > recordQuality(existing)) {
      if (existing) {
        byUrl.delete(existing.canonicalUrl);
        const oldTitle = normalizedTitle(
          existing.titleOriginal || existing.title || "",
        );
        if (oldTitle) byTitle.delete(oldTitle);
      }
      byUrl.set(canonicalUrl, candidate);
      if (titleKey) byTitle.set(titleKey, candidate);
    }
  }

  return [...byUrl.values()];
}

module.exports = { canonicalizeUrl, deduplicateArticles, normalizedTitle };
