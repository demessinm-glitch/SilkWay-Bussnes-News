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
  assert.match(html, /href="mailto:demessinm@gmail\.com"/);
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

test("service inquiry form posts to the same-origin handler with polished inline feedback", () => {
  const html = fs.readFileSync(path.join(root, "services.html"), "utf8");
  const form =
    html.match(/<form[^>]*data-service-inquiry[\s\S]*?<\/form>/)?.[0] || "";

  assert.match(form, /method="post"/);
  assert.match(form, /action="contact\.php"/);
  assert.match(form, /name="company"[^>]*required/);
  assert.match(form, /name="name"[^>]*required/);
  assert.match(form, /name="contact"[^>]*required/);
  assert.match(form, /name="service"/);
  assert.match(form, /name="message"[^>]*required/);
  assert.match(form, /name="consent"[^>]*required/);
  assert.match(form, /name="_honey"/);
  assert.match(form, /name="_honey"[^>]*aria-hidden="true"/);
  assert.match(form, /data-contact-submit/);
  assert.match(form, /data-form-status[^>]*role="status"/);
  assert.match(html, /assets\/js\/contact-form\.js/);
  assert.match(form, /demessinm@gmail\.com/);
  assert.match(form, /1227353115@qq\.com/);
  assert.match(form, /请勿在此发送护照、银行卡或其他敏感资料/);
  assert.doesNotMatch(form, /FormSubmit|formsubmit\.co/i);
});

test("contact handler validates submissions and delivers to both requested mailboxes", () => {
  const handlerPath = path.join(root, "contact.php");
  assert.ok(fs.existsSync(handlerPath), "contact.php is missing");
  const handler = fs.readFileSync(handlerPath, "utf8");

  assert.match(handler, /demessinm@gmail\.com/);
  assert.match(handler, /1227353115@qq\.com/);
  assert.match(handler, /contact@oguz\.kz/);
  assert.match(handler, /mail\s*\(/);
  assert.match(handler, /function_exists\s*\(\s*["']mail["']\s*\)/);
  assert.match(handler, /FILTER_VALIDATE_EMAIL/);
  assert.match(handler, /hash\s*\(\s*["']sha256["']/);
  assert.match(handler, /\b429\b/);
  assert.match(handler, /\b502\b/);
  assert.match(handler, /json_encode/);
  assert.match(handler, /postedText\s*\(\s*["']_honey["']\s*\)/);
  assert.match(handler, /header\s*\(\s*["']Location:/);
  assert.doesNotMatch(handler, /FormSubmit|formsubmit\.co/i);
  assert.doesNotMatch(
    handler,
    /:\s*never\b|str_starts_with\s*\(|str_contains\s*\(/,
  );
});

test("every visible service phone matches its click-to-call target", () => {
  const html = fs.readFileSync(path.join(root, "services.html"), "utf8");
  const phoneLinks = [
    ...html.matchAll(/<a href="tel:([^"]+)"[^>]*>([\s\S]*?)<\/a>/g),
  ];

  assert.equal(phoneLinks.length, 5);
  for (const [, target, content] of phoneLinks) {
    const targetDigits = target.replace(/\D/g, "");
    const visibleDigits = content.replace(/<[^>]+>/g, "").replace(/\D/g, "");
    assert.doesNotMatch(target, /\*/);
    assert.ok(targetDigits.endsWith(visibleDigits));
  }
});

test("service page presents the supplied company, team, clients, and project experience", () => {
  const html = fs.readFileSync(path.join(root, "services.html"), "utf8");

  assert.match(html, /SilkWayBrief 有限责任合伙企业/);
  assert.match(html, /2022\s+年/);
  for (const office of ["阿斯塔纳总部", "上海办公室", "阿拉木图办公室"]) {
    assert.match(html, new RegExp(office));
  }

  assert.equal((html.match(/data-team-member/g) || []).length, 3);
  for (const contact of [
    "Кочейев Михайл",
    "ЯнМингЧин",
    "Демесин Мухаммед",
    "tel:+77056124666",
    "mailto:rossur@gmail.com",
    "tel:+8617800510472",
    "mailto:1227353115@qq.com",
    "tel:+77078969805",
    "mailto:demessinm@gmail.com",
  ]) {
    assert.ok(html.includes(contact), `${contact} is missing`);
  }

  for (const client of [
    "LongJiang",
    "LeHu",
    "BrothersWindows",
    "ShangHaiConstraction",
  ]) {
    assert.match(html, new RegExp(client));
  }

  for (const experience of [
    "克孜勒奥尔达—杰兹卡兹甘公路",
    "科克萨赖大坝",
    "铝合金窗生产项目",
    "咨询、翻译与文件递交",
  ]) {
    assert.match(html, new RegExp(experience));
  }
});

test("service page uses an image-free trust design without stock impersonation", () => {
  const html = fs.readFileSync(path.join(root, "services.html"), "utf8");
  const imagePaths = [
    "assets/images/services/team-meeting-pexels-7652246.jpg",
    "assets/images/services/modern-office-pexels-7534178.jpg",
  ];

  for (const imagePath of imagePaths) {
    assert.equal(fs.existsSync(path.join(root, imagePath)), false);
    assert.ok(!html.includes(imagePath), `${imagePath} must not be rendered`);
  }
  assert.doesNotMatch(html, /data-stock-image|pexels\.com/i);

  const memberCards =
    html.match(
      /<article class="service-team-card" data-team-member>[\s\S]*?<\/article>/g,
    ) || [];
  assert.equal(memberCards.length, 3);
  assert.ok(memberCards.every((card) => !card.includes("<img")));
});

test("successful inquiries return to a private Chinese confirmation page", () => {
  const confirmationPath = path.join(root, "thanks.html");
  assert.ok(fs.existsSync(confirmationPath), "thanks.html is missing");

  const html = fs.readFileSync(confirmationPath, "utf8");
  assert.match(html, /name="robots" content="noindex,follow"/);
  assert.match(html, /您的项目需求已发送/);
  assert.match(html, /我们会通过您留下的联系方式回复/);
  assert.match(html, /href="services\.html"/);
});
