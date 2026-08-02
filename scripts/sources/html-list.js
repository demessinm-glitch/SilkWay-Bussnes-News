const cheerio = require("cheerio");

function normalizeText(value = "") {
  return String(value)
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDate(value) {
  const text = normalizeText(value);
  const match = text.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month}-${day}T00:00:00+05:00`;
}

function resolveLink($, element, selector) {
  if (selector === "closest:a") return $(element).closest("a").attr("href");
  return $(element)
    .find(selector || "a")
    .first()
    .attr("href");
}

function parseHtmlList(html, source) {
  const $ = cheerio.load(html);
  const selectors = source.selectors || {};
  const items = [];

  $(selectors.item).each((_, element) => {
    const titleOriginal = normalizeText(
      $(element).find(selectors.title).first().text(),
    );
    const href = resolveLink($, element, selectors.link);
    if (!titleOriginal || !href) return;

    items.push({
      sourceId: source.id,
      sourceName: source.name,
      sourceNameZh: source.nameZh,
      sourceUrl: new URL(href, source.baseUrl || source.url).href,
      titleOriginal,
      summaryOriginal: normalizeText(
        $(element).find(selectors.summary).first().text(),
      ),
      publishedAt: parseDate($(element).find(selectors.date).first().text()),
      languageOriginal: source.language || "ru",
      sourceType: source.type,
      copyrightMode: source.copyrightMode,
    });
  });

  return items.slice(0, source.maxItemsPerRun || 30);
}

async function collect(source, { fetchImpl = fetch, signal } = {}) {
  const response = await fetchImpl(source.url, {
    signal,
    headers: {
      accept: "text/html,application/xhtml+xml",
      "accept-language": `${source.language || "ru"},ru;q=0.9,en;q=0.7`,
      "user-agent":
        "SilkRoadInfoSync/2.0 (+https://yangmingqing0301-max.github.io/kazakhstan-official-info/)",
    },
  });
  if (!response.ok) throw new Error(`${source.id}: HTTP ${response.status}`);
  return parseHtmlList(await response.text(), source);
}

module.exports = { collect, normalizeText, parseDate, parseHtmlList };
