(() => {
  const root = document.querySelector("#guide-detail");
  if (!root) return;
  const id = new URLSearchParams(location.search).get("id");
  const text = (tag, value, className) => {
    const node = document.createElement(tag);
    node.textContent = value || "";
    if (className) node.className = className;
    return node;
  };
  function render(guide, disclaimer) {
    document.title = `${guide.titleZh}｜丝路译讯`;
    const article = document.createElement("article");
    const head = document.createElement("header");
    head.className = "article-head";
    const kicker = document.createElement("div");
    kicker.className = "article-kicker";
    kicker.append(
      text(
        "span",
        guide.verificationStatus === "verified" ? "已核验" : "待办理前复核",
        "category-label",
      ),
      text("span", `最后复核：${guide.lastReviewedAt || "未记录"}`),
    );
    head.append(
      kicker,
      text("h1", guide.titleZh),
      text("p", guide.summaryZh, "article-summary"),
    );
    article.append(head);
    const steps = document.createElement("section");
    steps.className = "article-section";
    steps.append(text("h2", "办理步骤"));
    const ol = document.createElement("ol");
    ol.className = "step-list";
    for (const step of guide.steps || []) {
      const li = document.createElement("li");
      const body = document.createElement("div");
      body.append(text("strong", step.titleZh), text("p", step.descriptionZh));
      li.append(body);
      ol.append(li);
    }
    steps.append(ol);
    const docs = document.createElement("section");
    docs.className = "article-section";
    docs.append(text("h2", "准备材料"));
    const ul = document.createElement("ul");
    ul.className = "document-list";
    for (const documentName of guide.documents || [])
      ul.append(text("li", documentName));
    docs.append(ul);
    article.append(steps, docs);
    const aside = document.createElement("aside");
    aside.className = "article-side";
    const info = document.createElement("div");
    info.className = "info-box";
    info.append(text("h2", "主管与来源"));
    const dl = document.createElement("dl");
    for (const [key, value] of [
      ["主管体系", guide.authorityZh],
      ["来源", guide.sourceName],
      [
        "状态",
        guide.verificationStatus === "verified" ? "已核验" : "待办理前复核",
      ],
    ]) {
      const wrap = document.createElement("div");
      wrap.append(text("dt", key), text("dd", value));
      dl.append(wrap);
    }
    info.append(dl);
    const link = text("a", "打开官方来源 ↗", "source-button");
    link.href = guide.sourceUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    info.append(link);
    const warning = document.createElement("div");
    warning.className = "info-box";
    warning.append(text("h2", "重要提示"), text("p", disclaimer));
    aside.append(info, warning);
    root.replaceChildren(article, aside);
  }
  fetch("data/guides/index.json", { cache: "no-store" })
    .then((r) => {
      if (!r.ok) throw new Error();
      return r.json();
    })
    .then((data) => {
      const guide = (data.items || []).find((item) => item.id === id);
      if (!guide) throw new Error("not-found");
      render(guide, data.disclaimerZh);
    })
    .catch(() => {
      root.replaceChildren();
      const box = document.createElement("div");
      box.className = "empty-state";
      box.append(text("span", "404"), text("h1", "未找到这份指南"));
      const link = text("a", "返回办事指南 →", "hero-action");
      link.href = "guides.html";
      box.append(link);
      root.append(box);
    });
})();
