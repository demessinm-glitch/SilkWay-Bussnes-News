(() => {
  const regionRoot = document.querySelector("#regional-directory");
  const cityRoot = document.querySelector("#city-directory");
  const organizationRoot = document.querySelector("#business-directory");
  if (!regionRoot || !cityRoot || !organizationRoot) return;

  const regionSearch = document.querySelector("#regional-directory-search");
  const citySearch = document.querySelector("#city-directory-search");
  const regionMeta = document.querySelector("#regional-directory-meta");
  const cityMeta = document.querySelector("#city-directory-meta");
  const organizationMeta = document.querySelector("#business-directory-meta");
  let regions = [];
  let cities = [];
  let organizations = [];
  let activeOrganizationGroup = "all";

  const text = (tag, value, className) => {
    const node = document.createElement(tag);
    node.textContent = value || "";
    if (className) node.className = className;
    return node;
  };

  const externalLink = (label, href, className = "contact-link") => {
    const link = text("a", label, className);
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    return link;
  };

  const contactRow = (label, value, href) => {
    const row = document.createElement("div");
    row.className = "contact-row";
    row.append(text("dt", label));
    const detail = document.createElement("dd");
    if (href) {
      const link = text("a", value);
      link.href = href;
      detail.append(link);
    } else {
      detail.textContent = value;
    }
    row.append(detail);
    return row;
  };

  function regionCard(item) {
    const article = document.createElement("article");
    article.className = "contact-card region-contact-card";
    article.append(
      text("p", `${item.capitalZh} · 州政府`, "contact-kicker"),
      text("h3", item.nameZh),
      text("p", item.nameOriginal, "contact-original"),
    );
    const leader = document.createElement("div");
    leader.className = "contact-leader";
    leader.append(
      text("span", item.positionZh),
      text("strong", item.akimNameZh),
      text("small", item.akimName),
    );
    const details = document.createElement("dl");
    details.append(
      contactRow("地址", item.addressZh),
      contactRow(
        "电话",
        item.phone,
        `tel:${item.phone.replace(/[^+\d]/g, "")}`,
      ),
    );
    const actions = document.createElement("div");
    actions.className = "contact-actions";
    actions.append(
      externalLink("州政府网站 ↗", item.websiteUrl),
      externalLink("州长官方资料 ↗", item.sourceUrl),
    );
    article.append(leader, details, actions);
    return article;
  }

  function cityCard(item) {
    const article = document.createElement("article");
    article.className = "contact-card city-contact-card";
    article.append(
      text("p", "重点城市 · 市政府", "contact-kicker"),
      text("h3", item.cityZh),
      text("p", item.cityOriginal, "contact-original"),
    );
    const leader = document.createElement("div");
    leader.className = "contact-leader";
    leader.append(
      text("span", item.positionZh),
      text("strong", item.akimNameZh),
      text("small", item.akimName),
    );
    const details = document.createElement("dl");
    details.append(
      contactRow("地址", item.addressZh),
      contactRow(
        "电话",
        item.phone,
        `tel:${item.phone.replace(/[^+\d]/g, "")}`,
      ),
    );
    if (item.email)
      details.append(contactRow("邮箱", item.email, `mailto:${item.email}`));
    const actions = document.createElement("div");
    actions.className = "contact-actions";
    actions.append(
      externalLink("市政府网站 ↗", item.websiteUrl),
      externalLink("市长官方资料 ↗", item.profileSourceUrl),
    );
    article.append(leader, details, actions);
    return article;
  }

  function renderRegions() {
    const query = regionSearch.value.trim().toLocaleLowerCase("zh-CN");
    const filtered = regions.filter((item) =>
      [
        item.nameZh,
        item.nameOriginal,
        item.capitalZh,
        item.akimNameZh,
        item.akimName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("zh-CN")
        .includes(query),
    );
    regionRoot.replaceChildren(...filtered.map(regionCard));
    regionMeta.textContent = `已核验 ${filtered.length} / ${regions.length} 个州级政府联系渠道`;
    if (!filtered.length) {
      const empty = text(
        "p",
        "没有符合搜索条件的州政府。",
        "empty-state-inline",
      );
      regionRoot.append(empty);
    }
  }

  function renderCities() {
    const query = citySearch.value.trim().toLocaleLowerCase("zh-CN");
    const filtered = cities.filter((item) =>
      [item.cityZh, item.cityOriginal, item.akimNameZh, item.akimName]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("zh-CN")
        .includes(query),
    );
    cityRoot.replaceChildren(...filtered.map(cityCard));
    cityMeta.textContent = `已核验 ${filtered.length} / ${cities.length} 个重点城市联系渠道`;
    if (!filtered.length) {
      cityRoot.append(
        text("p", "没有符合搜索条件的城市。", "empty-state-inline"),
      );
    }
  }

  function organizationCard(item) {
    const article = document.createElement("article");
    article.className = "contact-card business-contact-card";
    article.dataset.group = item.group;
    article.append(
      text("p", item.categoryZh, "contact-kicker"),
      text("h3", item.nameZh),
      text("p", item.nameOriginal, "contact-original"),
      text("p", item.scopeZh, "contact-scope"),
    );
    const details = document.createElement("dl");
    details.append(
      contactRow("地址", item.addressZh || item.addressOriginal),
      contactRow(
        "电话",
        item.phone,
        `tel:${item.phone.replace(/[^+\d]/g, "")}`,
      ),
    );
    if (item.email)
      details.append(contactRow("邮箱", item.email, `mailto:${item.email}`));
    article.append(
      details,
      externalLink("打开官方网站 ↗", item.websiteUrl, "source-button"),
    );
    return article;
  }

  function renderOrganizations() {
    const filtered = organizations.filter(
      (item) =>
        activeOrganizationGroup === "all" ||
        item.group === activeOrganizationGroup,
    );
    organizationRoot.replaceChildren(...filtered.map(organizationCard));
    organizationMeta.textContent = `已显示 ${filtered.length} / ${organizations.length} 个经核验机构`;
    if (!filtered.length) {
      organizationRoot.append(
        text("p", "该分类暂无已核验机构。", "empty-state-inline"),
      );
    }
  }

  regionSearch.addEventListener("input", renderRegions);
  citySearch.addEventListener("input", renderCities);
  document.querySelectorAll("[data-institution-filter]").forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(button.classList.contains("is-active")),
    );
    button.addEventListener("click", () => {
      activeOrganizationGroup = button.dataset.institutionFilter;
      document.querySelectorAll("[data-institution-filter]").forEach((item) => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      renderOrganizations();
    });
  });

  fetch("data/directory/cities.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error();
      return response.json();
    })
    .then((data) => {
      cities = data.items || [];
      renderCities();
    })
    .catch(() => {
      cityMeta.textContent = "重点城市目录暂时不可用";
      cityRoot.append(text("p", "请稍后重试。", "empty-state-inline"));
    })
    .finally(() => cityRoot.setAttribute("aria-busy", "false"));

  fetch("data/directory/regions.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error();
      return response.json();
    })
    .then((data) => {
      regions = data.items || [];
      renderRegions();
    })
    .catch(() => {
      regionMeta.textContent = "州政府目录暂时不可用";
      regionRoot.append(text("p", "请稍后重试。", "empty-state-inline"));
    })
    .finally(() => regionRoot.setAttribute("aria-busy", "false"));

  fetch("data/directory/organizations.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error();
      return response.json();
    })
    .then((data) => {
      organizations = data.items || [];
      renderOrganizations();
    })
    .catch(() => {
      organizationMeta.textContent = "企业服务机构目录暂时不可用";
      organizationRoot.append(text("p", "请稍后重试。", "empty-state-inline"));
    })
    .finally(() => organizationRoot.setAttribute("aria-busy", "false"));
})();
