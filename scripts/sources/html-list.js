const cheerio = require("cheerio");

function normalizeText(value = "") {
  return String(value)
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDate(value) {
  const text = normalizeText(value);
  if (!text) return null;
  if (/^\d{4}-\d{2}-\d{2}T/.test(text)) {
    return Number.isNaN(new Date(text).getTime()) ? null : text;
  }

  const numeric = text.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (numeric) {
    const [, day, month, year] = numeric;
    return `${year}-${month}-${day}T00:00:00+05:00`;
  }

  const months = {
    января: "01",
    февраля: "02",
    марта: "03",
    апреля: "04",
    мая: "05",
    июня: "06",
    июля: "07",
    августа: "08",
    сентября: "09",
    октября: "10",
    ноября: "11",
    декабря: "12",
  };
  const russian = text.match(
    /^(?:(\d{1,2}):(\d{2}),?\s*)?(\d{1,2})\s+([а-яё]+)\s+(\d{4})(?:\s+года)?(?:,\s*(\d{1,2}):(\d{2}))?$/iu,
  );
  if (!russian || !months[russian[4].toLowerCase()]) return null;
  const hour = russian[1] || russian[6] || "0";
  const minute = russian[2] || russian[7] || "0";
  return `${russian[5]}-${months[russian[4].toLowerCase()]}-${String(russian[3]).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+05:00`;
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

    const dateElement = $(element).find(selectors.date).first();
    const dateValue = selectors.dateAttr
      ? dateElement.attr(selectors.dateAttr)
      : dateElement.text();
    items.push({
      sourceId: source.id,
      sourceName: source.name,
      sourceNameZh: source.nameZh,
      sourceUrl: new URL(href, source.baseUrl || source.url).href,
      titleOriginal,
      summaryOriginal: normalizeText(
        $(element).find(selectors.summary).first().text(),
      ),
      publishedAt: parseDate(dateValue),
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
