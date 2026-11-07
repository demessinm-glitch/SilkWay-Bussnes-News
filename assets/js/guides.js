(() => {
  const root = document.querySelector("#guide-catalog");
  if (!root) return;
  let items = [];
  let active = "all";
  const text = (tag, value, className) => {
    const node = document.createElement(tag);
    node.textContent = value || "";
    if (className) node.className = className;
    return node;
  };
  function render() {
    root.replaceChildren();
    const visible = items.filter(
      (item) => active === "all" || item.category === active,
    );
    for (const guide of visible) {
      const article = document.createElement("article");
      article.className = "guide-card";
      article.append(text("span", guide.icon || "指", "guide-icon"));
      const body = document.createElement("div");
      const h2 = document.createElement("h2");
      const link = text("a", guide.titleZh);
      link.href = `guide-detail.html?id=${encodeURIComponent(guide.id)}`;
      h2.append(link);
      body.append(
        h2,
        text("p", guide.summaryZh),
        text(
          "small",
          guide.verificationStatus === "verified" ? "已核验" : "待办理前复核",
        ),
      );
      article.append(body, text("b", "↗"));
      root.append(article);
    }
    if (!visible.length) {
      const box = document.createElement("div");
      box.className = "empty-state";
      box.append(text("h3", "此类别暂时没有指南"));
      root.append(box);
    }
  }
  document.querySelectorAll("[data-guide-filter]").forEach((button) =>
    button.addEventListener("click", () => {
      active = button.dataset.guideFilter;
      document
        .querySelectorAll("[data-guide-filter]")
        .forEach((item) => item.classList.toggle("is-active", item === button));
      render();
    }),
  );
  fetch("data/guides/index.json", { cache: "no-store" })
    .then((r) => {
      if (!r.ok) throw new Error();
      return r.json();
    })
    .then((data) => {
      items = data.items || [];
      render();
    })
    .catch(() => {
      root.replaceChildren();
      const box = document.createElement("div");
      box.className = "empty-state";
      box.append(text("span", "!"), text("h3", "指南目录暂时不可用"));
      root.append(box);
    })
    .finally(() => root.setAttribute("aria-busy", "false"));
})();
