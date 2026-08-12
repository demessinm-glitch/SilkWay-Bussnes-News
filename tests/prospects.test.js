const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createAjv } = require("../scripts/validate-data");

const root = path.join(__dirname, "..");
const navigationPages = [
  "index.html",
  "news.html",
  "news-detail.html",
  "tenders.html",
  "officials.html",
  "official-detail.html",
  "guides.html",
  "guide-detail.html",
  "sources.html",
  "about.html",
  "services.html",
  "thanks.html",
  "prospects.html",
];

function relativeLuminance(hex) {
  const channels = hex
    .match(/[a-f\d]{2}/gi)
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    );
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground, background) {
  const values = [
    relativeLuminance(foreground),
    relativeLuminance(background),
  ].sort((left, right) => right - left);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test("business prospects route is available from every primary navigation", () => {
  const prospectsPath = path.join(root, "prospects.html");
  assert.ok(fs.existsSync(prospectsPath), "prospects.html is missing");
  assert.match(
    fs.readFileSync(prospectsPath, "utf8"),
    /<html[^>]+lang="zh-CN"/,
  );

  for (const filename of navigationPages) {
    const html = fs.readFileSync(path.join(root, filename), "utf8");
    const nav =
      html.match(/<nav class="primary-nav"[\s\S]*?<\/nav>/)?.[0] || "";
    assert.match(
      nav,
      /href="prospects\.html"[^>]*>商业前景<\/a\s*>[\s\S]*href="services\.html"[^>]*>企业服务<\/a\s*>/,
      `${filename} is missing the ordered prospects navigation item`,
    );
  }

  const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
  assert.match(sitemap, /https:\/\/oguz\.kz\/prospects\.html/);
});

test("prospects map data covers all current top-level administrative units with sourced metrics", () => {
  const dataPath = path.join(root, "data", "prospects", "regions.json");
  const schemaPath = path.join(
    root,
    "data",
    "schemas",
    "prospects.schema.json",
  );
  assert.ok(fs.existsSync(dataPath), "regional prospects data is missing");
  assert.ok(fs.existsSync(schemaPath), "regional prospects schema is missing");

  const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
  const validate = createAjv().compile(schema);
  assert.equal(validate(data), true, JSON.stringify(validate.errors, null, 2));

  assert.equal(data.items.length, 20);
  assert.equal(data.items.filter((item) => item.type === "region").length, 17);
  assert.equal(data.items.filter((item) => item.type === "city").length, 3);
  assert.deepEqual(
    new Set(data.items.map((item) => item.id)).size,
    data.items.length,
    "administrative unit ids must be unique",
  );

  for (const id of ["abay", "zhetisu", "ulytau"]) {
    assert.ok(
      data.items.some((item) => item.id === id),
      `${id} is missing`,
    );
  }

  for (const item of data.items) {
    assert.ok(item.population.value > 0);
    assert.equal(item.population.period, "2026-01-01");
    assert.match(item.population.sourceUrl, /^https:\/\/stat\.gov\.kz\//);
    assert.ok(item.averageMonthlyWage.value > 0);
    assert.equal(item.averageMonthlyWage.period, "2026-Q1");
    assert.match(
      item.averageMonthlyWage.sourceUrl,
      /^https:\/\/stat\.gov\.kz\//,
    );
    assert.ok(item.higherEducation.institutions >= 1);
    assert.ok(item.higherEducation.students >= 1);
    assert.equal(item.higherEducation.period, "2025-2026");
    assert.equal(item.higherEducation.kind, "talent-pool-proxy");
    assert.match(item.higherEducation.sourceUrl, /^https:\/\/stat\.gov\.kz\//);
    assert.ok(item.promisingSectors.length >= 2);
    assert.ok(item.resources.length >= 1);
  }

  const regions = data.items.filter((item) => item.type === "region");
  assert.ok(regions.every((item) => item.map.path.startsWith("M ")));
  assert.match(data.mapSource.license, /MIT/);
  assert.match(data.mapSource.url, /new_qazaqstan_GeoJSON/);
});

test("prospects page exposes an accessible interactive regional map", () => {
  const html = fs.readFileSync(path.join(root, "prospects.html"), "utf8");
  assert.match(html, /data-prospects-map/);
  assert.match(html, /data-region-map/);
  assert.match(html, /data-region-selector/);
  assert.match(html, /data-region-detail[^>]+aria-live="polite"/);
  assert.match(html, /data-map-status[^>]+role="status"/);
  assert.match(html, /assets\/js\/prospects\.js/);
  assert.match(html, /数据按行政单位统计/);

  const scriptPath = path.join(root, "assets", "js", "prospects.js");
  assert.ok(fs.existsSync(scriptPath), "prospects.js is missing");
  const script = fs.readFileSync(scriptPath, "utf8");
  assert.match(script, /fetch\("data\/prospects\/regions\.json"\)/);
  assert.match(script, /createElementNS\(SVG_NS, "path"\)/);
  assert.match(script, /setAttribute\("tabindex", "0"\)/);
  assert.match(script, /setAttribute\("role", "button"\)/);
  assert.match(script, /path\.setAttribute\("aria-hidden", "true"\)/);
  assert.match(script, /wirePointer\(path, item\)/);
  assert.match(script, /addEventListener\("pointerenter"/);
  assert.match(script, /addEventListener\("focus"/);
  assert.match(script, /addEventListener\("keydown"/);
  assert.match(script, /event\.key === "Enter" \|\| event\.key === " "/);
  assert.match(script, /catch \(error\)/);
  assert.match(script, /地图数据暂时无法加载/);
  assert.match(script, /教育基础设施代理指标/);
  assert.doesNotMatch(script, /非居民学历比例/);
});

test("prospects normal-size accents meet WCAG AA contrast", () => {
  const css = fs.readFileSync(
    path.join(root, "assets", "css", "pages.css"),
    "utf8",
  );
  const darkGold = "#765606";
  const lightGold = "#f2c94c";
  const ink = "#10272d";
  const prospectsMuted = "#5b7075";

  assert.ok(contrastRatio(darkGold, "#fffdf8") >= 4.5);
  assert.ok(contrastRatio(darkGold, "#f4f1e9") >= 4.5);
  assert.ok(contrastRatio(lightGold, "#0b4f61") >= 4.5);
  assert.ok(contrastRatio(ink, "#d4a017") >= 4.5);
  assert.ok(contrastRatio(prospectsMuted, "#f4f1e9") >= 4.5);
  assert.ok(contrastRatio(prospectsMuted, "#f8f7f3") >= 4.5);

  assert.match(css, /\.prospects-page\s*\{[^}]*--muted: #5b7075;/);

  assert.match(
    css,
    /\.region-detail-kicker,[\s\S]*?\.prospects-card-conclusion strong\s*\{[^}]*color: #765606;/,
  );
  assert.match(
    css,
    /\.prospects-advantage-featured \.prospects-card-conclusion strong,[\s\S]*?\.business-idea-number\s*\{[^}]*color: #f2c94c;/,
  );
  assert.match(
    css,
    /\.prospects-page \.section-index,[\s\S]*?\.prospects-page \.idea-flow li > span\s*\{[^}]*color: #765606;/,
  );
  assert.match(
    css,
    /\.prospects-page \.idea-flow li:not\(:last-child\)::after\s*\{[^}]*color: #765606;/,
  );
  assert.match(
    css,
    /\.prospects-page \.idea-list-block li::marker\s*\{[^}]*color: #765606;/,
  );
  assert.match(
    css,
    /\.prospects-page \.prospects-corridor-section \.section-index\s*\{[^}]*color: #f2c94c;/,
  );
  assert.match(css, /\.future-idea-slot a\s*\{[^}]*color: var\(--ink\);/);
});

test("market advantages separate sourced facts from business interpretation", () => {
  const html = fs.readFileSync(path.join(root, "prospects.html"), "utf8");
  assert.match(html, /20,286,084/);
  assert.match(html, /20,495,974/);
  assert.match(html, /\+1\.03%/);
  assert.match(html, /2025年1月1日/);
  assert.match(html, /2026年1月1日/);
  assert.match(html, /哈萨克斯坦国家统计局/);
  assert.match(html, /欧亚经济联盟/);
  assert.match(html, /亚美尼亚、白俄罗斯、哈萨克斯坦、吉尔吉斯斯坦和俄罗斯/);
  assert.match(html, /阿塞拜疆/);
  assert.match(html, /格鲁吉亚/);
  assert.match(html, /伊朗/);
  assert.match(html, /西欧—中国西部/);
  assert.match(html, /并不等同于自动免税或无条件市场准入/);
  assert.match(html, /中哈跨里海国际运输路线/);
  assert.match(html, /哈萨克斯坦—土库曼斯坦—伊朗铁路/);
  assert.match(html, /data-transport-legend/);

  const script = fs.readFileSync(
    path.join(root, "assets", "js", "prospects.js"),
    "utf8",
  );
  assert.match(script, /transport-road/);
  assert.match(script, /transport-rail/);
  assert.match(script, /transport-sea/);
  assert.match(script, /createTransportLayer/);
});

test("business ideas use an extensible validated scenario model", () => {
  const dataPath = path.join(root, "data", "prospects", "ideas.json");
  const schemaPath = path.join(
    root,
    "data",
    "schemas",
    "prospect-ideas.schema.json",
  );
  assert.ok(fs.existsSync(dataPath), "business ideas data is missing");
  assert.ok(fs.existsSync(schemaPath), "business ideas schema is missing");

  const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
  const validate = createAjv().compile(schema);
  assert.equal(validate(data), true, JSON.stringify(validate.errors, null, 2));
  assert.ok(data.items.length >= 2);
  assert.deepEqual(
    new Set(data.items.map((item) => item.id)).size,
    data.items.length,
  );
  for (const idea of data.items) {
    assert.ok(idea.hypothesis.length > 20);
    assert.ok(idea.targetCustomers.length >= 2);
    assert.ok(idea.validationSteps.length >= 3);
    assert.ok(idea.risks.length >= 2);
    assert.equal(idea.chart.kind, "scenario-not-forecast");
    assert.ok(idea.chart.series.length >= 2);
    assert.ok(idea.flow.length >= 3);
  }
  const languageIdea = data.items.find(
    (item) => item.id === "chinese-language-university-pathway",
  );
  assert.ok(languageIdea);
  assert.match(languageIdea.titleZh, /中文/);
  assert.match(languageIdea.hypothesis, /中国高校/);

  const html = fs.readFileSync(path.join(root, "prospects.html"), "utf8");
  assert.match(html, /data-business-ideas/);
  assert.match(html, /未来可继续添加/);
  assert.match(html, /情景假设，不是收益预测/);
  const script = fs.readFileSync(
    path.join(root, "assets", "js", "prospects.js"),
    "utf8",
  );
  assert.match(script, /fetch\("data\/prospects\/ideas\.json"\)/);
  assert.match(script, /renderIdeas/);
  assert.match(script, /idea-scenario-chart/);
  assert.match(script, /idea-flow/);
});
