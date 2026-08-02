const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");

test("home page is a Chinese data-driven news workspace", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

  assert.match(html, /<html[^>]+lang="zh-CN"/);
  assert.match(html, /id="news-feed"/);
  assert.match(html, /id="news-status"/);
  assert.match(html, /assets\/js\/home\.js/);
  assert.doesNotMatch(html, /托卡耶夫主持经济现代化会议/);
  assert.doesNotMatch(html, /铁路货运枢纽设备采购与安装/);

  const script = fs.readFileSync(
    path.join(root, "assets", "js", "home.js"),
    "utf8",
  );
  assert.match(script, /data\/news\/latest\.json/);
  assert.match(script, /未找到符合条件的信息/);
});
