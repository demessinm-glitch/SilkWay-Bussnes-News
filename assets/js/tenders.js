(() => {
  const root = document.querySelector("#tender-results");
  if (!root) return;
  const search = document.querySelector("#tender-search");
  const statusFilter = document.querySelector("#tender-status");
  const region = document.querySelector("#tender-region");
  const count = document.querySelector("#tender-count");
  const copy = document.querySelector("#tender-status-copy");
  let items = [];
  const text = (tag, value, className) => {
    const node = document.createElement(tag);
    node.textContent = value || "";
    if (className) node.className = className;
    return node;
  };
  function statusOf(item) {
    if (item.status) return item.status;
    const deadline = new Date(item.deadline).getTime();
    if (!deadline) return "open";
    if (deadline < Date.now()) return "closed";
    if (deadline - Date.now() < 3 * 86400000) return "closing";
    return "open";
  }
  function empty(message) {
    root.replaceChildren();
    const box = document.createElement("div");
    box.className = "empty-state";
    box.append(
      text("span", "○"),
      text("h3", message),
      text(
        "p",
        "系统不会用虚构项目填充列表。请从原始采购平台核对任何投标机会。",
      ),
    );
    root.append(box);
  }
  function render() {
    const q = search.value.trim().toLocaleLowerCase("zh-CN");
    const filtered = items.filter((item) => {
      const hay =
        `${item.titleZh || ""} ${item.buyerZh || ""}`.toLocaleLowerCase(
          "zh-CN",
        );
      return (
        (!q || hay.includes(q)) &&
        (!statusFilter.value || statusOf(item) === statusFilter.value) &&
        (!region.value || item.regionZh === region.value)
      );
    });
    count.textContent = String(filtered.length);
    root.replaceChildren();
    if (!filtered.length) {
      empty(items.length ? "没有符合筛选条件的公告" : "暂无已核验的标讯公告");
      return;
    }
    for (const item of filtered) {
      const article = document.createElement("article");
      article.className = "tender-card";
      article.append(
        text(
          "span",
          statusOf(item) === "open"
            ? "接受投标"
            : statusOf(item) === "closing"
              ? "即将截止"
              : "已截止",
          "tender-status",
        ),
        text("h3", item.titleZh),
        text("p", item.buyerZh || "采购方待核验"),
      );
      const dl = document.createElement("dl");
      for (const [key, value] of [
        ["预算", item.budgetTextZh || "以原公告为准"],
        ["地区", item.regionZh || "哈萨克斯坦"],
        [
          "截止时间",
          item.deadline
            ? new Date(item.deadline).toLocaleString("zh-CN", {
                timeZone: "Asia/Almaty",
              })
            : "以原公告为准",
        ],
      ]) {
        const wrap = document.createElement("div");
        wrap.append(text("dt", key), text("dd", value));
        dl.append(wrap);
      }
      article.append(dl);
      const link = text("a", "查看原始公告 ↗", "source-button");
      link.href = item.sourceUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      article.append(link);
      root.append(article);
    }
  }
  for (const field of [search, statusFilter, region])
    field.addEventListener(field === search ? "input" : "change", render);
  document.querySelector("#reset-tenders").addEventListener("click", () => {
    search.value = "";
    statusFilter.value = "";
    region.value = "";
    render();
  });
  fetch("data/tenders/latest.json", { cache: "no-store" })
    .then((r) => {
      if (!r.ok) throw new Error();
      return r.json();
    })
    .then((data) => {
      items = data.items || [];
      for (const value of [
        ...new Set(items.map((item) => item.regionZh).filter(Boolean)),
      ]) {
        const option = text("option", value);
        option.value = value;
        region.append(option);
      }
      copy.textContent = data.generatedAt
        ? `更新：${new Date(data.generatedAt).toLocaleString("zh-CN", { timeZone: "Asia/Almaty" })}`
        : "等待稳定采购来源";
      render();
    })
    .catch(() => {
      copy.textContent = "数据暂时不可用";
      empty("标讯数据加载失败");
    })
    .finally(() => root.setAttribute("aria-busy", "false"));
})();
