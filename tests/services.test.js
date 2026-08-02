const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

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
];

test("Chinese service route is the final primary navigation destination", () => {
  const servicePath = path.join(root, "services.html");
  assert.ok(fs.existsSync(servicePath), "services.html is missing");

  for (const filename of navigationPages) {
    const html = fs.readFileSync(path.join(root, filename), "utf8");
    const nav =
      html.match(/<nav class="primary-nav"[\s\S]*?<\/nav>/)?.[0] || "";
    assert.match(nav, /href="services\.html"[^>]*>企业服务<\/a>\s*<\/nav>$/);
  }

  const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
  assert.match(sitemap, /https:\/\/oguz\.kz\/services\.html/);
});

test("service page presents all fifteen Kazakhstan market support directions", () => {
  const html = fs.readFileSync(path.join(root, "services.html"), "utf8");
  assert.equal((html.match(/data-service-category/g) || []).length, 15);

  for (const heading of [
    "市场进入",
    "公司设立与运营",
    "招投标全程支持",
    "合法行政协调",
    "文件翻译与认证",
    "许可、资质与通知",
    "签证、移民与中国员工",
    "会计与税务协调",
    "进出口、物流与海关",
    "中国产品认证",
    "建设与基础设施项目",
    "合作伙伴寻找与尽调",
    "销售与本地推广",
    "投资项目落地",
    "商业信息与持续监测",
  ]) {
    assert.match(html, new RegExp(heading));
  }
});

test("service page offers five ready-to-start engagement packages", () => {
  const html = fs.readFileSync(path.join(root, "services.html"), "utf8");
  assert.equal((html.match(/data-service-package/g) || []).length, 5);
  for (const packageName of [
    "哈萨克斯坦第一步",
    "企业注册全包",
    "投标全程包",
    "哈萨克斯坦本地代表",
    "长期综合支持",
  ]) {
    assert.match(html, new RegExp(packageName));
  }
});

test("service page exposes direct contacts and a regulated-service boundary", () => {
  const html = fs.readFileSync(path.join(root, "services.html"), "utf8");
  assert.match(html, /href="tel:\+8617800510472"/);
  assert.match(html, /href="tel:\+77056124666"/);
  assert.match(html, /Megan17800510472/);
  assert.match(html, /href="mailto:agent@oguz\.kz"/);
  assert.match(html, /持牌专业人士和合作伙伴/);

  for (const officialUrl of [
    "https://egov.kz/cms/ru/services/pass042com_mu",
    "https://www.goszakup.gov.kz/",
    "https://elicense.kz/",
    "https://invest.gov.kz/invest-guide/",
  ]) {
    assert.ok(html.includes(officialUrl), `${officialUrl} is missing`);
  }
});
