(() => {
  const categoryNames = {
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
  const form = document.querySelector("#news-filters");
  if (!form) return;
  const search = document.querySelector("#news-search");
  const category = document.querySelector("#news-category");
  const source = document.querySelector("#news-source");
  const period = document.querySelector("#news-period");
  const results = document.querySelector("#news-results");
  const count = document.querySelector("#result-count");
  const status = document.querySelector("#archive-status");
  const pagination = document.querySelector("#news-pagination");
  let allItems = [];
  let page = 1;
  const pageSize = 10;

  const formatDate = (value) =>
    value
      ? new Intl.DateTimeFormat("zh-CN", {
          timeZone: "Asia/Almaty",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date(value))
      : "日期待核验";
  const addText = (node, text) => {
    node.textContent = text || "";
    return node;
  };
  const empty = (message) => {
    results.replaceChildren();
    const box = document.createElement("div");
    box.className = "empty-state";
    const mark = addText(document.createElement("span"), "○");
    const title = addText(document.createElement("h3"), message);
    const copy = addText(
      document.createElement("p"),
      "自动任务成功发布内容后，这里会显示可追溯的中文摘要。",
    );
    box.append(mark, title, copy);
    results.append(box);
  };
  function card(item) {
    const article = document.createElement("article");
    article.className = "news-card";
    const meta = document.createElement("div");
    meta.className = "news-card-meta";
    meta.append(
      addText(document.createElement("time"), formatDate(item.publishedAt)),
      addText(document.createElement("span"), item.regionZh || "哈萨克斯坦"),
    );
    const body = document.createElement("div");
    body.className = "news-card-body";
    const row = document.createElement("div");
    row.className = "news-card-label-row";
    const label = addText(
      document.createElement("span"),
      categoryNames[item.category] || "商业资讯",
    );
    label.className = "category-label";
    row.append(
      label,
      addText(
        document.createElement("span"),
        item.sourceNameZh || item.sourceName || "公开来源",
      ),
    );
    const h2 = document.createElement("h3");
    const link = addText(
      document.createElement("a"),
      item.titleZh || item.titleOriginal,
    );
    link.href = `news-detail.html?id=${encodeURIComponent(item.id)}`;
    h2.append(link);
    const summary = addText(
      document.createElement("p"),
      item.summaryZh || "摘要待补充。",
    );
    body.append(row, h2, summary);
    const arrow = addText(document.createElement("a"), "↗");
    arrow.className = "news-card-arrow";
    arrow.href = link.href;
    arrow.setAttribute("aria-label", `阅读：${link.textContent}`);
    article.append(meta, body, arrow);
    return article;
  }
  function syncUrl() {
    const params = new URLSearchParams();
    if (search.value.trim()) params.set("q", search.value.trim());
    if (category.value) params.set("category", category.value);
    if (source.value) params.set("source", source.value);
    if (period.value) params.set("period", period.value);
    const query = params.toString();
    history.replaceState(
      null,
      "",
      `${location.pathname}${query ? `?${query}` : ""}`,
    );
  }
  function render() {
    const q = search.value.trim().toLocaleLowerCase("zh-CN");
    const days = Number(period.value || 0);
    const cutoff = days ? Date.now() - days * 86400000 : 0;
    const filtered = allItems.filter((item) => {
      const haystack =
        `${item.titleZh || ""} ${item.titleOriginal || ""} ${item.summaryZh || ""}`.toLocaleLowerCase(
          "zh-CN",
        );
      return (
        (!q || haystack.includes(q)) &&
        (!category.value || item.category === category.value) &&
        (!source.value || item.sourceId === source.value) &&
        (!cutoff || new Date(item.publishedAt).getTime() >= cutoff)
      );
    });
    const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
    page = Math.min(page, pages);
    count.textContent = String(filtered.length);
    results.replaceChildren();
    if (!filtered.length)
      empty(allItems.length ? "没有符合筛选条件的信息" : "暂无已发布新闻");
    else
      results.append(
        ...filtered.slice((page - 1) * pageSize, page * pageSize).map(card),
      );
    pagination.replaceChildren();
    if (pages > 1) {
      const prev = addText(document.createElement("button"), "←");
      prev.disabled = page === 1;
      prev.addEventListener("click", () => {
        page -= 1;
        render();
        scrollTo({ top: form.offsetTop - 90, behavior: "smooth" });
      });
      pagination.append(prev);
      for (let index = 1; index <= pages; index += 1) {
        const button = addText(document.createElement("button"), String(index));
        if (index === page) button.className = "is-active";
        button.addEventListener("click", () => {
          page = index;
          render();
        });
        pagination.append(button);
      }
      const next = addText(document.createElement("button"), "→");
      next.disabled = page === pages;
      next.addEventListener("click", () => {
        page += 1;
        render();
      });
      pagination.append(next);
    }
    syncUrl();
  }
  for (const field of [search, category, source, period])
    field.addEventListener(field === search ? "input" : "change", () => {
      page = 1;
      render();
    });
  document.querySelector("#reset-filters").addEventListener("click", () => {
    form.reset();
    page = 1;
    render();
  });
  const params = new URLSearchParams(location.search);
  search.value = params.get("q") || "";
  category.value = params.get("category") || "";
  period.value = params.get("period") || "";
  fetch("data/news/latest.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((data) => {
      allItems = Array.isArray(data.items) ? data.items : [];
      const sources = [
        ...new Map(
          allItems.map((item) => [
            item.sourceId,
            item.sourceNameZh || item.sourceName,
          ]),
        ).entries(),
      ];
      for (const [value, labelText] of sources) {
        const option = addText(document.createElement("option"), labelText);
        option.value = value;
        source.append(option);
      }
      source.value = params.get("source") || "";
      status.textContent = data.generatedAt
        ? `最后更新：${formatDate(data.generatedAt)}`
        : "等待首次翻译发布";
      render();
    })
    .catch(() => {
      status.textContent = "数据暂时不可用";
      empty("新闻数据加载失败");
    })
    .finally(() => results.setAttribute("aria-busy", "false"));
})();
