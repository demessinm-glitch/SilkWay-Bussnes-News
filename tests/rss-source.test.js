const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { parseRss } = require("../scripts/sources/rss");

test("RSS adapter extracts clean metadata without full article content", async () => {
  const xml = fs.readFileSync(
    path.join(__dirname, "fixtures", "business-feed.xml"),
    "utf8",
  );
  const source = {
    id: "business",
    name: "Business",
    nameZh: "商业媒体",
    type: "business_media",
    language: "ru",
    maxItemsPerRun: 10,
    copyrightMode: "metadata_summary_link",
  };

  const items = await parseRss(xml, source);

  assert.equal(items.length, 1);
  assert.equal(items[0].externalId, "news-42");
  assert.equal(
    items[0].titleOriginal,
    "Казахстан обновил правила для инвесторов",
  );
  assert.equal(
    items[0].summaryOriginal,
    "Краткое описание нормативного изменения.",
  );
  assert.equal(items[0].copyrightMode, "metadata_summary_link");
  assert.ok(!Object.hasOwn(items[0], "fullText"));
});

test("RSS adapter trims whitespace around source URLs", async () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0"><channel><item>
      <guid>vlast-42</guid><title>Инвестиции в инфраструктуру</title>
      <link>\nhttps://vlast.kz/novosti/42-investicii.html\n</link>
      <description>Деловая новость.</description>
      <pubDate>Fri, 31 Jul 2026 08:00:00 GMT</pubDate>
    </item></channel></rss>`;
  const [item] = await parseRss(xml, {
    id: "vlast-kz",
    name: "Vlast.kz",
    language: "ru",
  });

  assert.equal(item.sourceUrl, "https://vlast.kz/novosti/42-investicii.html");
});
