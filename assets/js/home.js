(() => {
  const CATEGORY_NAMES = {
    economy: "经济与金融",
    investment: "投资与合作",
    construction: "建设与基础设施",
    industry: "工业与制造业",
    energy: "能源与矿业",
    transport: "交通与物流",
    law: "法律与监管",
    government: "政府决策",
    procurement: "招标与采购",
    china_kz: "中哈合作",
  };

  const feed = document.querySelector("#news-feed");
  const status = document.querySelector("#news-status");
  const tenderFeed = document.querySelector("#tender-feed");
  let allNews = [];

  function escapeHtml(value = "") {
    return String(value).replace(
      /[&<>'"]/g,
      (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          "'": "&#39;",
          '"': "&quot;",
        })[character],
    );
  }

  function formatDate(value) {
    if (!value) return "日期待核验";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "日期待核验";
    return new Intl.DateTimeFormat("zh-CN", {
      timeZone: "Asia/Almaty",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  }

  function newsCard(item) {
    const category = CATEGORY_NAMES[item.category] || "综合信息";
    const source =
      item.sourceNameZh || item.sourceName || item.sourceId || "来源待核验";
    return `<article class="news-card">
      <div class="news-card-meta">
        <span class="category-label">${escapeHtml(category)}</span>
        <time datetime="${escapeHtml(item.publishedAt || "")}">${escapeHtml(formatDate(item.publishedAt))}</time>
        <span class="news-source">${escapeHtml(source)}</span>
      </div>
      <div class="news-card-body">
        <h3><a href="news-detail.html?id=${encodeURIComponent(item.id)}">${escapeHtml(item.titleZh || item.titleOriginal || "暂无中文翻译")}</a></h3>
        <p>${escapeHtml(item.summaryZh || "暂无中文翻译，请查看原文。")}</p>
      </div>
      <a class="news-card-arrow" href="news-detail.html?id=${encodeURIComponent(item.id)}" aria-label="阅读：${escapeHtml(item.titleZh || item.titleOriginal || "")}">→</a>
    </article>`;
  }

  function emptyNews(message = "未找到符合条件的信息。") {
    return `<div class="empty-state"><span>讯</span><p><strong>${escapeHtml(message)}</strong><small>完成首次自动同步后，已核验的中文摘要将在此显示。</small></p></div>`;
  }

  function renderNews(items) {
    if (!feed) return;
    feed.setAttribute("aria-busy", "false");
    feed.innerHTML = items.length
      ? items.slice(0, 6).map(newsCard).join("")
      : emptyNews();
  }

  function renderTenders(items) {
    if (!tenderFeed || !items.length) return;
    tenderFeed.innerHTML = items
      .slice(0, 3)
      .map(
        (item) => `<article class="tender-row">
      <div><h3><a href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.titleZh)}</a></h3><p>${escapeHtml(item.customer || "")}</p></div>
      <dl><dt>地区</dt><dd>${escapeHtml(item.regionNameZh || item.regionId || "—")}</dd></dl>
      <dl><dt>截止日期</dt><dd>${escapeHtml(formatDate(item.deadline))}</dd></dl>
      <a class="news-card-arrow" href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noopener noreferrer" aria-label="查看官方标讯">↗</a>
    </article>`,
      )
      .join("");
  }

  function updateBoard(meta = {}) {
    const stamp = meta.lastSuccessfulUpdate || meta.newsUpdatedAt || null;
    const date = stamp ? new Date(stamp) : new Date();
    const day = document.querySelector("#board-day");
    const month = document.querySelector("#board-month");
    const year = document.querySelector("#board-year");
    const updated = document.querySelector("#last-update");
    const badge = document.querySelector("#freshness-badge");

    if (day)
      day.textContent = new Intl.DateTimeFormat("zh-CN", {
        timeZone: "Asia/Almaty",
        day: "2-digit",
      }).format(date);
    if (month)
      month.textContent = new Intl.DateTimeFormat("zh-CN", {
        timeZone: "Asia/Almaty",
        month: "long",
      }).format(date);
    if (year)
      year.textContent = `${new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Almaty", year: "numeric" }).format(date)} · ALMATY`;
    if (updated)
      updated.textContent = stamp
        ? `最后更新：${formatDate(stamp)}`
        : "最后更新：等待首次自动同步";
    if (badge) {
      badge.classList.remove("is-loading");
      if (!stamp) {
        badge.textContent = "待首次同步";
        badge.classList.add("is-stale");
        return;
      }
      const ageHours = (Date.now() - date.getTime()) / 3_600_000;
      badge.textContent = ageHours <= 48 ? "数据正常" : "数据较旧";
      badge.classList.toggle("is-stale", ageHours > 48);
    }
  }

  async function fetchJson(url) {
    const response = await fetch(url, {
      headers: { accept: "application/json" },
    });
    if (!response.ok) throw new Error(`${url}: ${response.status}`);
    return response.json();
  }

  async function loadHome() {
    const [newsResult, metaResult, tenderResult] = await Promise.allSettled([
      fetchJson("data/news/latest.json"),
      fetchJson("data/meta/build.json"),
      fetchJson("data/tenders/latest.json"),
    ]);

    if (newsResult.status === "fulfilled") {
      allNews = Array.isArray(newsResult.value)
        ? newsResult.value
        : newsResult.value.items || [];
      renderNews(allNews);
      if (status)
        status.textContent = allNews.length
          ? `已加载 ${allNews.length} 条已核验信息`
          : "系统正常 · 等待首次新闻同步";
    } else {
      if (feed) feed.innerHTML = emptyNews("暂时无法加载数据，请稍后重试。");
      if (status) status.textContent = "数据读取暂时不可用";
      document.querySelector("#freshness-badge")?.classList.add("is-error");
    }

    updateBoard(metaResult.status === "fulfilled" ? metaResult.value : {});
    if (tenderResult.status === "fulfilled") {
      const items = Array.isArray(tenderResult.value)
        ? tenderResult.value
        : tenderResult.value.items || [];
      renderTenders(items);
    }
  }

  document.querySelectorAll("[data-news-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      document
        .querySelectorAll("[data-news-filter]")
        .forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      const category = button.dataset.newsFilter;
      renderNews(
        category === "all"
          ? allNews
          : allNews.filter((item) => item.category === category),
      );
    });
  });

  loadHome();
})();
