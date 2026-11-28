(() => {
  const root = document.querySelector("#news-detail");
  if (!root) return;
  const id = new URLSearchParams(location.search).get("id");
  const names = {
    economy: "经济与金融",
    investment: "投资与合作",
    construction: "建设与基础设施",
    industry: "工业与制造业",
    energy: "能源与矿业",
    transport: "交通与物流",
    law: "法律与监管",
    government: "政府决策",
    procurement: "采购与招标",
    china_kz: "中哈合作",
    other: "其他",
  };
  const text = (tag, value, className) => {
    const node = document.createElement(tag);
    node.textContent = value || "";
    if (className) node.className = className;
    return node;
  };
  const date = (value) =>
    value
      ? new Intl.DateTimeFormat("zh-CN", {
          timeZone: "Asia/Almaty",
          dateStyle: "long",
        }).format(new Date(value))
      : "日期待核验";
  function listSection(title, items) {
    if (!Array.isArray(items) || !items.length) return null;
    const section = document.createElement("section");
    section.className = "article-section";
    section.append(text("h2", title));
    const ul = document.createElement("ul");
    ul.className = "fact-list";
    for (const item of items) ul.append(text("li", item));
    section.append(ul);
    return section;
  }
  function render(item) {
    document.title = `${item.titleZh || item.titleOriginal}｜丝路译讯`;
    const article = document.createElement("article");
    const head = document.createElement("header");
    head.className = "article-head";
    const kicker = document.createElement("div");
    kicker.className = "article-kicker";
    kicker.append(
      text("span", names[item.category] || "商业资讯", "category-label"),
      text("time", date(item.publishedAt)),
      text("span", item.regionZh || "哈萨克斯坦"),
    );
    head.append(
      kicker,
      text("h1", item.titleZh || item.titleOriginal),
      text("p", item.summaryZh || "暂无中文摘要。", "article-summary"),
    );
    article.append(head);
    for (const section of [
      listSection("关键事实", item.keyFactsZh),
      listSection("对中国企业的影响", item.businessImpactZh),
    ])
      if (section) article.append(section);
    const sourceNote = document.createElement("section");
    sourceNote.className = "article-section";
    sourceNote.append(
      text("h2", "原文标题"),
      text("p", item.titleOriginal || "原文标题未提供"),
    );
    article.append(sourceNote);
    const aside = document.createElement("aside");
    aside.className = "article-side";
    const info = document.createElement("div");
    info.className = "info-box";
    info.append(text("h2", "来源记录"));
    const dl = document.createElement("dl");
    for (const [key, value] of [
      ["来源", item.sourceNameZh || item.sourceName],
      ["发布时间", date(item.publishedAt)],
      ["处理时间", date(item.translatedAt || item.updatedAt)],
      ["翻译状态", "AI 辅助翻译"],
    ]) {
      const wrap = document.createElement("div");
      wrap.append(text("dt", key), text("dd", value || "待核验"));
      dl.append(wrap);
    }
    info.append(dl);
    const link = text("a", "查看原始来源 ↗", "source-button");
    link.href = item.sourceUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    info.append(link);
    const warning = document.createElement("div");
    warning.className = "info-box";
    warning.append(
      text("h2", "使用提示"),
      text(
        "p",
        "机器翻译可能存在误差。投资、法律、税务与投标决定请以原文和专业意见为准。",
      ),
    );
    aside.append(info, warning);
    root.replaceChildren(article, aside);
  }
  fetch("data/news/latest.json", { cache: "no-store" })
    .then((r) => {
      if (!r.ok) throw new Error();
      return r.json();
    })
    .then((data) => {
      const item = (data.items || []).find(
        (entry) => String(entry.id) === String(id),
      );
      if (!item) throw new Error("not-found");
      render(item);
    })
    .catch(() => {
      root.replaceChildren();
      const article = document.createElement("article");
      article.className = "empty-state";
      article.append(
        text("span", "404"),
        text("h1", "未找到这条已发布信息"),
        text("p", "它可能尚未通过翻译校验，或链接已经更新。"),
      );
      const back = text("a", "返回新闻列表 →", "hero-action");
      back.href = "news.html";
      article.append(back);
      root.append(article);
    });
})();
