(() => {
  const root = document.querySelector("#official-grid");
  if (!root) return;
  const regions = {
    almaty: {
      name: "阿拉木图",
      file: "data/almaty-people.json",
      legacy: "almaty-json.html",
    },
    astana: {
      name: "阿斯塔纳",
      file: "data/astana-structure.json",
      legacy: "astana-json.html",
    },
    shymkent: {
      name: "奇姆肯特",
      file: "data/shymkent-people.json",
      legacy: "shymkent-json.html",
    },
  };
  const meta = document.querySelector("#officials-meta");
  const legacy = document.querySelector("#legacy-link");
  let active = "almaty";
  const text = (tag, value, className) => {
    const node = document.createElement(tag);
    node.textContent = value || "";
    if (className) node.className = className;
    return node;
  };
  const fallbackName = (person) =>
    person.nameZh && !/[А-Яа-яӘІҢҒҮҰҚӨҺ]/.test(person.nameZh)
      ? person.nameZh
      : person.name || "姓名待核验";
  function card(person, index) {
    const article = document.createElement("article");
    article.className = "official-card";
    const media = document.createElement("div");
    media.className = "official-photo";
    if (person.photo) {
      const img = document.createElement("img");
      img.src = person.photo;
      img.alt = fallbackName(person);
      img.loading = "lazy";
      img.referrerPolicy = "no-referrer";
      media.append(img);
    }
    media.append(text("span", "官方资料"));
    const body = document.createElement("div");
    body.className = "official-body";
    body.append(
      text("h2", fallbackName(person)),
      text("p", person.name || "", "official-original"),
      text(
        "p",
        person.positionZh || person.position || "职务待核验",
        "official-role",
      ),
      text(
        "p",
        person.workScopeZh || "工作范围以官方页面为准。",
        "official-scope",
      ),
    );
    const link = text("a", "查看公开资料 →", "official-link");
    link.href = `official-detail.html?region=${active}&id=${encodeURIComponent(person.id ?? index)}`;
    body.append(link);
    article.append(media, body);
    return article;
  }
  async function load(region) {
    active = region;
    root.setAttribute("aria-busy", "true");
    root.replaceChildren();
    meta.textContent = `正在加载${regions[region].name}官方结构…`;
    legacy.href = regions[region].legacy;
    document
      .querySelectorAll(".region-tab")
      .forEach((button) =>
        button.classList.toggle("is-active", button.dataset.region === region),
      );
    history.replaceState(null, "", `officials.html?region=${region}`);
    try {
      const response = await fetch(regions[region].file, { cache: "no-store" });
      if (!response.ok) throw new Error();
      const data = await response.json();
      const people = Array.isArray(data.people) ? data.people : [];
      root.append(...people.map(card));
      const synced = data.syncedAt
        ? new Intl.DateTimeFormat("zh-CN", {
            timeZone: "Asia/Almaty",
            dateStyle: "long",
            timeStyle: "short",
          }).format(new Date(data.syncedAt))
        : "待核验";
      meta.textContent = `${regions[region].name} · ${people.length} 条公开资料 · 更新 ${synced}`;
    } catch {
      const box = document.createElement("div");
      box.className = "empty-state";
      box.append(
        text("span", "!"),
        text("h3", "暂时无法读取官方目录"),
        text("p", "请稍后重试，或使用右侧原有城市页面。"),
      );
      root.append(box);
      meta.textContent = "目录加载失败";
    } finally {
      root.setAttribute("aria-busy", "false");
    }
  }
  document
    .querySelectorAll(".region-tab")
    .forEach((button) =>
      button.addEventListener("click", () => load(button.dataset.region)),
    );
  const initial = new URLSearchParams(location.search).get("region");
  load(regions[initial] ? initial : "almaty");
})();
