(() => {
  const regionRoot = document.querySelector("#regional-directory");
  const organizationRoot = document.querySelector("#business-directory");
  if (!regionRoot || !organizationRoot) return;

  const regionSearch = document.querySelector("#regional-directory-search");
  const regionMeta = document.querySelector("#regional-directory-meta");
  const organizationMeta = document.querySelector("#business-directory-meta");
  let regions = [];

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

  function organizationCard(item) {
    const article = document.createElement("article");
    article.className = "contact-card business-contact-card";
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

  regionSearch.addEventListener("input", renderRegions);

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
      const items = data.items || [];
      organizationRoot.replaceChildren(...items.map(organizationCard));
      organizationMeta.textContent = `已核验 ${items.length} 个企业服务机构联系渠道`;
    })
    .catch(() => {
      organizationMeta.textContent = "企业服务机构目录暂时不可用";
      organizationRoot.append(text("p", "请稍后重试。", "empty-state-inline"));
    })
    .finally(() => organizationRoot.setAttribute("aria-busy", "false"));
})();
