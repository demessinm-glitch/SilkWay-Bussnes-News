(() => {
  const regionRoot = document.querySelector("#regional-directory");
  const cityRoot = document.querySelector("#city-directory");
  const organizationRoot = document.querySelector("#business-directory");
  if (!regionRoot || !cityRoot || !organizationRoot) return;

  const regionSearch = document.querySelector("#regional-directory-search");
  const cityTabs = document.querySelector("#major-city-tabs");
  const cityWebsite = document.querySelector("#major-city-website");
  const regionMeta = document.querySelector("#regional-directory-meta");
  const cityMeta = document.querySelector("#city-directory-meta");
  const organizationMeta = document.querySelector("#business-directory-meta");
  let regions = [];
  let cities = [];
  let organizations = [];
  let activeCityId = "";
  let activeOrganizationGroup = "all";
  const asciiEmailPattern =
    /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

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

  function cityOfficialCard(official) {
    const article = document.createElement("article");
    article.className = "official-card city-official-card";

    const photo = document.createElement("div");
    photo.className = "official-photo";
    const image = document.createElement("img");
    image.src = official.photoUrl;
    image.alt = `${official.nameZh}，${official.positionZh}`;
    image.width = 800;
    image.height = 480;
    image.loading = "lazy";
    image.decoding = "async";
    image.referrerPolicy = "no-referrer";
    image.addEventListener("error", () => {
      image.hidden = true;
      photo.classList.add("is-unavailable");
      photo.prepend(text("strong", "照片暂不可用", "official-photo-fallback"));
    });
    photo.append(image, text("span", "GOV.KZ", "official-photo-source"));

    const body = document.createElement("div");
    body.className = "official-body";
    body.append(
      text("h2", official.nameZh),
      text("p", official.nameOriginal, "official-original"),
      text("p", official.positionZh, "official-role"),
      text("p", official.positionOriginal, "official-scope"),
    );

    const contacts = document.createElement("div");
    contacts.className = "official-contacts";
    if (official.phone) {
      const phone = text("a", official.phoneOriginal || official.phone);
      phone.href = `tel:${official.phone}`;
      phone.setAttribute("aria-label", `致电 ${official.nameZh}`);
      contacts.append(phone);
    }
    if (official.email) {
      if (asciiEmailPattern.test(official.email)) {
        const email = text("a", official.email);
        email.href = `mailto:${official.email}`;
        contacts.append(email);
      } else {
        contacts.append(
          text("span", `官网原文：${official.email}`, "official-email-source"),
        );
      }
    }
    if (contacts.childElementCount) body.append(contacts);
    body.append(
      externalLink(
        "查看 GOV.KZ 官方资料 →",
        official.profileSourceUrl,
        "official-link",
      ),
    );
    article.append(photo, body);
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

  function hideCityWebsite() {
    cityWebsite.hidden = true;
    cityWebsite.removeAttribute("href");
    cityWebsite.removeAttribute("aria-label");
  }

  function renderCities() {
    const item = cities.find((city) => city.id === activeCityId);
    if (!item) {
      hideCityWebsite();
      cityRoot.append(
        text("p", "重点城市资料暂时不可用。", "empty-state-inline"),
      );
      return;
    }
    cityRoot.replaceChildren(...item.officials.map(cityOfficialCard));
    const verified = new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(item.verifiedAt));
    cityMeta.textContent = `${item.cityZh}（${item.cityOriginal}）· ${item.officials.length} 位官员 · 核验于 ${verified}`;
    cityWebsite.href = item.websiteUrl;
    cityWebsite.setAttribute("aria-label", `打开${item.cityZh}市政府官方网站`);
    cityWebsite.hidden = false;
    cityRoot.setAttribute("aria-labelledby", `major-city-tab-${item.id}`);
  }

  function renderCityTabs(focusActive = false) {
    const tabs = cities.map((item) => {
      const tab = text("button", item.cityZh, "region-tab");
      const active = item.id === activeCityId;
      tab.type = "button";
      tab.id = `major-city-tab-${item.id}`;
      tab.dataset.city = item.id;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-controls", "city-directory");
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = item.id === activeCityId ? 0 : -1;
      tab.classList.toggle("is-active", active);
      tab.addEventListener("click", () => {
        activeCityId = item.id;
        renderCityTabs(true);
        renderCities();
      });
      return tab;
    });
    cityTabs.replaceChildren(...tabs);
    if (focusActive) {
      const selectedTab = cityTabs.querySelector('[aria-selected="true"]');
      selectedTab?.focus();
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
  cityTabs.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const currentIndex = cities.findIndex((item) => item.id === activeCityId);
    if (currentIndex < 0) return;
    event.preventDefault();
    let nextIndex = currentIndex;
    if (event.key === "ArrowLeft")
      nextIndex = (currentIndex - 1 + cities.length) % cities.length;
    if (event.key === "ArrowRight")
      nextIndex = (currentIndex + 1) % cities.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = cities.length - 1;
    activeCityId = cities[nextIndex].id;
    renderCityTabs(true);
    renderCities();
  });
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
      activeCityId = cities[0]?.id || "";
      renderCityTabs();
      renderCities();
    })
    .catch(() => {
      hideCityWebsite();
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
