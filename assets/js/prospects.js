(() => {
  const root = document.querySelector("[data-prospects-map]");
  if (!root) return;

  const SVG_NS = "http://www.w3.org/2000/svg";
  const map = root.querySelector("[data-region-map]");
  const selector = root.querySelector("[data-region-selector]");
  const detail = root.querySelector("[data-region-detail]");
  const status = root.querySelector("[data-map-status]");
  const ideasRoot = document.querySelector("[data-business-ideas]");
  const ideasStatus = document.querySelector("[data-ideas-status]");
  const number = new Intl.NumberFormat("zh-CN");
  let items = [];
  let activeId = "";

  const text = (tag, value, className) => {
    const node = document.createElement(tag);
    node.textContent = value;
    if (className) node.className = className;
    return node;
  };

  const externalLink = (label, href, className = "region-source-link") => {
    const link = text("a", label, className);
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    return link;
  };

  const metric = (label, value, meta, sourceUrl) => {
    const article = document.createElement("article");
    article.className = "region-metric";
    article.append(
      text("span", label),
      text("strong", value),
      text("small", meta),
    );
    article.append(externalLink("官方来源 ↗", sourceUrl));
    return article;
  };

  const tagList = (title, values, className) => {
    const section = document.createElement("section");
    section.className = className;
    const list = document.createElement("ul");
    values.forEach((value) => list.append(text("li", value)));
    section.append(text("h4", title), list);
    return section;
  };

  function renderDetail(item) {
    const direction = item.population.annualChangePct >= 0 ? "+" : "";
    const heading = document.createElement("div");
    heading.className = "region-detail-head";
    heading.append(
      text(
        "p",
        item.type === "city"
          ? "直辖市"
          : `${item.administrativeCenter.nameZh} · 州级数据`,
        "region-detail-kicker",
      ),
      text("h3", item.nameZh),
      text("p", item.nameOriginal, "region-detail-original"),
    );

    const metrics = document.createElement("div");
    metrics.className = "region-metric-grid";
    metrics.append(
      metric(
        "常住人口",
        number.format(item.population.value),
        `人 · 2026-01-01 · 同比 ${direction}${item.population.annualChangePct.toFixed(2)}%`,
        item.population.sourceUrl,
      ),
      metric(
        "平均月工资",
        `${number.format(item.averageMonthlyWage.value)} ₸`,
        "坚戈/月 · 2026年第一季度 · 不含从事经营活动的小型企业",
        item.averageMonthlyWage.sourceUrl,
      ),
      metric(
        "高校人才池",
        `${number.format(item.higherEducation.students)} 名学生`,
        `${item.higherEducation.institutions} 所高校 · 2025/26学年 · 教育基础设施代理指标`,
        item.higherEducation.sourceUrl,
      ),
      metric(
        "城镇人口占比",
        `${item.population.urbanSharePct.toFixed(1)}%`,
        "占本行政单位常住人口 · 2026-01-01",
        item.population.sourceUrl,
      ),
    );

    const editorial = document.createElement("div");
    editorial.className = "region-editorial-note";
    editorial.append(
      text("strong", "编辑判断"),
      text("p", item.editorialNoteZh),
    );
    const investmentLink = externalLink(
      "查看 KAZAKH INVEST 区域资料 →",
      item.investmentProfileUrl,
      "region-investment-link",
    );

    detail.replaceChildren(
      heading,
      metrics,
      tagList("资源与区位信号", item.resources, "region-tag-block"),
      tagList(
        "值得进一步验证的行业",
        item.promisingSectors,
        "region-tag-block region-tag-block-accent",
      ),
      editorial,
      investmentLink,
    );
  }

  function updateMapState() {
    map.querySelectorAll("[data-unit-id]").forEach((node) => {
      const active = node.dataset.unitId === activeId;
      node.classList.toggle("is-active", active);
      if (node.getAttribute("role") === "button") {
        node.setAttribute("aria-pressed", String(active));
      }
    });
  }

  function selectItem(id) {
    const item = items.find((candidate) => candidate.id === id);
    if (!item) return;
    activeId = id;
    selector.value = id;
    updateMapState();
    renderDetail(item);
    status.textContent = `已选择${item.nameZh}；数据单位和日期见右侧卡片。`;
  }

  function wireInteractive(node, item) {
    node.dataset.unitId = item.id;
    node.setAttribute("tabindex", "0");
    node.setAttribute("role", "button");
    node.setAttribute("aria-label", `查看${item.nameZh}商业指标`);
    node.setAttribute("aria-pressed", "false");
    node.addEventListener("pointerenter", () => selectItem(item.id));
    node.addEventListener("focus", () => selectItem(item.id));
    node.addEventListener("click", () => selectItem(item.id));
    node.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectItem(item.id);
      }
    });
  }

  function wirePointer(node, item) {
    node.dataset.unitId = item.id;
    node.addEventListener("pointerenter", () => selectItem(item.id));
    node.addEventListener("click", () => selectItem(item.id));
  }

  function createTransportLayer() {
    const layer = document.createElementNS(SVG_NS, "g");
    layer.setAttribute("class", "transport-layer");
    layer.setAttribute("aria-hidden", "true");
    const routes = [
      {
        className: "transport-road",
        points:
          "600,225 520,250 457,267 369,280 320,273 250,236 141,132 48,117",
      },
      {
        className: "transport-rail",
        points: "600,205 505,111 444,84 410,142 365,102 308,177 250,236 49,279",
      },
      {
        className: "transport-rail transport-rail-south",
        points: "444,84 365,102 341,293 285,335",
      },
      {
        className: "transport-sea",
        points: "49,279 5,255 -25,235",
      },
    ];
    routes.forEach((route) => {
      const line = document.createElementNS(SVG_NS, "polyline");
      line.setAttribute("class", route.className);
      line.setAttribute("points", route.points);
      layer.append(line);
    });
    return layer;
  }

  function renderMap() {
    const pathLayer = document.createElementNS(SVG_NS, "g");
    pathLayer.setAttribute("class", "region-map-layer");
    items.forEach((item) => {
      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", item.map.path);
      path.setAttribute("class", `region-map-shape region-map-${item.type}`);
      path.setAttribute("aria-hidden", "true");
      wirePointer(path, item);
      pathLayer.append(path);
    });

    const markerLayer = document.createElementNS(SVG_NS, "g");
    markerLayer.setAttribute("class", "region-marker-layer");
    items.forEach((item) => {
      const marker = document.createElementNS(SVG_NS, "g");
      marker.setAttribute(
        "class",
        `region-map-marker region-map-marker-${item.type}`,
      );
      marker.setAttribute(
        "transform",
        `translate(${item.map.markerX} ${item.map.markerY})`,
      );
      wireInteractive(marker, item);
      const halo = document.createElementNS(SVG_NS, "circle");
      halo.setAttribute("r", item.type === "city" ? "7" : "5");
      halo.setAttribute("class", "region-marker-halo");
      const dot = document.createElementNS(SVG_NS, "circle");
      dot.setAttribute("r", item.type === "city" ? "3.3" : "2.4");
      dot.setAttribute("class", "region-marker-dot");
      const label = document.createElementNS(SVG_NS, "text");
      label.setAttribute("x", "7");
      label.setAttribute("y", "-5");
      label.textContent = item.administrativeCenter.nameZh;
      marker.append(halo, dot, label);
      markerLayer.append(marker);
    });
    map.replaceChildren(pathLayer, createTransportLayer(), markerLayer);
  }

  function renderSelector() {
    const placeholder = text("option", "选择行政单位");
    placeholder.value = "";
    placeholder.disabled = true;
    const options = items.map((item) => {
      const option = text(
        "option",
        `${item.nameZh} · ${item.type === "city" ? "直辖市" : item.administrativeCenter.nameZh}`,
      );
      option.value = item.id;
      return option;
    });
    selector.replaceChildren(placeholder, ...options);
    selector.disabled = false;
    selector.addEventListener("change", () => selectItem(selector.value));
  }

  function ideaList(title, values, ordered = false) {
    const section = document.createElement("section");
    section.className = "idea-list-block";
    const list = document.createElement(ordered ? "ol" : "ul");
    values.forEach((value) => list.append(text("li", value)));
    section.append(text("h4", title), list);
    return section;
  }

  function renderScenarioChart(chart) {
    const figure = document.createElement("figure");
    figure.className = "idea-scenario-chart";
    const caption = document.createElement("figcaption");
    caption.append(
      text("strong", chart.titleZh),
      text("span", "情景假设，不是收益预测"),
    );
    const legend = document.createElement("div");
    legend.className = "idea-chart-legend";
    chart.series.forEach((series, index) => {
      const item = text("span", series.nameZh);
      item.dataset.series = String(index + 1);
      legend.append(item);
    });
    const plot = document.createElement("div");
    plot.className = "idea-chart-plot";
    const maxima = chart.series.map((series) => Math.max(...series.values, 1));
    chart.labels.forEach((label, labelIndex) => {
      const group = document.createElement("div");
      group.className = "idea-chart-group";
      group.append(text("span", label, "idea-chart-label"));
      const bars = document.createElement("div");
      bars.className = "idea-chart-bars";
      chart.series.forEach((series, seriesIndex) => {
        const value = series.values[labelIndex];
        const bar = document.createElement("div");
        bar.className = `idea-chart-bar idea-chart-bar-${seriesIndex + 1}`;
        bar.style.setProperty(
          "--bar-height",
          `${Math.max(4, (value / maxima[seriesIndex]) * 100)}%`,
        );
        bar.setAttribute(
          "aria-label",
          `${label} ${series.nameZh}：${number.format(value)}`,
        );
        bar.append(text("span", number.format(value)));
        bars.append(bar);
      });
      group.prepend(bars);
      plot.append(group);
    });
    figure.append(
      caption,
      legend,
      plot,
      text("p", chart.assumptionsZh, "idea-chart-assumption"),
    );
    return figure;
  }

  function renderFlow(flow) {
    const section = document.createElement("section");
    section.className = "idea-flow-section";
    section.append(text("h4", "验证与交付路径"));
    const list = document.createElement("ol");
    list.className = "idea-flow";
    flow.forEach((step, index) => {
      const item = document.createElement("li");
      item.append(
        text("span", String(index + 1).padStart(2, "0")),
        text("strong", step.titleZh),
        text("small", step.detailZh),
      );
      list.append(item);
    });
    section.append(list);
    return section;
  }

  function renderIdeas(data) {
    if (!ideasRoot) return;
    const cards = data.items.map((idea) => {
      const card = document.createElement("article");
      card.className = "business-idea-card";
      card.id = idea.id;
      const header = document.createElement("header");
      header.append(
        text("p", idea.number, "business-idea-number"),
        text("h3", idea.titleZh),
        text("p", idea.subtitleZh, "business-idea-subtitle"),
      );
      const hypothesis = document.createElement("section");
      hypothesis.className = "idea-hypothesis";
      hypothesis.append(
        text("strong", "待验证假设"),
        text("p", idea.hypothesis),
      );
      const cta = text("a", `${idea.ctaZh} →`, "business-idea-cta");
      cta.href = "services.html#contact";
      cta.dataset.inquirySubject = idea.ctaSubject;
      card.append(
        header,
        hypothesis,
        ideaList("目标客户", idea.targetCustomers),
        ideaList("最小验证步骤", idea.validationSteps, true),
        renderScenarioChart(idea.chart),
        renderFlow(idea.flow),
        ideaList("关键风险", idea.risks),
        cta,
      );
      return card;
    });
    ideasRoot.replaceChildren(...cards);
    if (ideasStatus)
      ideasStatus.textContent = `已加载 ${cards.length} 个可测试商业方案。`;
  }

  async function loadIdeas() {
    if (!ideasRoot) return;
    try {
      const response = await fetch("data/prospects/ideas.json");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      renderIdeas(await response.json());
    } catch (error) {
      console.error("Unable to load business ideas", error);
      ideasRoot.replaceChildren(
        text("p", "商业创意暂时无法加载，请稍后重试。", "empty-state-inline"),
      );
      if (ideasStatus) ideasStatus.textContent = "商业创意数据暂时无法加载。";
    }
  }

  async function loadMapData() {
    try {
      const response = await fetch("data/prospects/regions.json");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      items = data.items;
      renderMap();
      renderSelector();
      selectItem("almaty");
    } catch (error) {
      console.error("Unable to load prospects map", error);
      map.replaceChildren();
      selector.disabled = true;
      status.textContent = "地图数据暂时无法加载，请稍后重试。";
      detail.replaceChildren(
        text("p", "地图数据暂时无法加载。", "empty-state-inline"),
      );
    }
  }

  loadMapData();
  loadIdeas();
})();
