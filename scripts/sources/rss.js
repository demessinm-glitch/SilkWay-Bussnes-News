const Parser = require("rss-parser");
const cheerio = require("cheerio");

const parser = new Parser({ timeout: 15_000 });

function textFromHtml(value = "") {
  const $ = cheerio.load(String(value));
  $("script, style, form, iframe, noscript").remove();
  return $.root()
    .text()
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function parseRss(xml, source) {
  const feed = await parser.parseString(xml);
  return (feed.items || [])
    .slice(0, source.maxItemsPerRun || 30)
    .map((item) => ({
      sourceId: source.id,
      sourceName: source.name,
      sourceNameZh: source.nameZh,
      sourceType: source.type,
      sourceUrl: String(item.link || "").trim(),
      externalId: String(item.guid || item.id || item.link || "").trim(),
      titleOriginal: String(item.title || "").trim(),
      summaryOriginal: textFromHtml(
        item.contentSnippet ||
          item.summary ||
          item.content ||
          item.description ||
          "",
      ),
      publishedAt:
        item.isoDate ||
        (item.pubDate ? new Date(item.pubDate).toISOString() : null),
      languageOriginal: source.language || "ru",
      copyrightMode: source.copyrightMode,
    }))
    .filter((item) => item.sourceUrl && item.titleOriginal);
}

async function collect(source, { fetchImpl = fetch, signal } = {}) {
  const response = await fetchImpl(source.url, {
    signal,
    headers: {
      accept: "application/rss+xml,application/xml,text/xml;q=0.9,*/*;q=0.5",
      "accept-language": `${source.language || "ru"},ru;q=0.9,en;q=0.7`,
      "user-agent":
        "SilkRoadInfoSync/2.0 (+https://yangmingqing0301-max.github.io/kazakhstan-official-info/)",
    },
  });
  if (!response.ok) throw new Error(`${source.id}: HTTP ${response.status}`);
  return parseRss(await response.text(), source);
}

module.exports = { collect, parseRss, textFromHtml };
