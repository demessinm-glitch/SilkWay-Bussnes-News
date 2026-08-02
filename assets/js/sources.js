(() => {
  const root = document.querySelector("#source-grid");
  if (!root) return;
  const sync = document.querySelector("#source-sync-time");
  const typeNames = {
    official: "官方来源",
    business_media: "商业媒体",
    legal_database: "法规数据库",
  };
  const text = (tag, value, className) => {
    const node = document.createElement(tag);
    node.textContent = value || "";
    if (className) node.className = className;
    return node;
  };
  Promise.all([
    fetch("data/config/sources.json", { cache: "no-store" }).then((r) => {
      if (!r.ok) throw new Error();
      return r.json();
    }),
    fetch("data/meta/build.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
  ])
    .then(([sources, build]) => {
      root.replaceChildren();
      for (const source of sources.filter((item) => item.enabled)) {
        const article = document.createElement("article");
        article.className = "source-card";
        article.append(
          text("span", typeNames[source.type] || source.type, "source-type"),
          text("h2", source.nameZh || source.name),
          text(
            "p",
            `获取方式：${source.adapter === "rss" ? "RSS 订阅" : "公开 HTML 列表"}。只索引标题、日期、摘要和原始链接。`,
          ),
        );
        const link = text("a", "访问来源 ↗");
        link.href = source.homeUrl || source.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        article.append(link);
        root.append(article);
      }
      sync.textContent = build?.lastSuccessfulUpdate
        ? `最近成功更新：${new Date(build.lastSuccessfulUpdate).toLocaleString("zh-CN", { timeZone: "Asia/Almaty" })}`
        : "等待首次完整发布";
    })
    .catch(() => {
      root.replaceChildren();
      const box = document.createElement("div");
      box.className = "empty-state";
      box.append(text("span", "!"), text("h3", "来源登记册暂时不可用"));
      root.append(box);
      sync.textContent = "更新状态不可用";
    });
})();
