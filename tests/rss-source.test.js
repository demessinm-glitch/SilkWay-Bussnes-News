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
