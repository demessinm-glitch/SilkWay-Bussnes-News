(() => {
  const root = document.querySelector("#official-profile");
  if (!root) return;
  const query = new URLSearchParams(location.search);
  const region = query.get("region") || "almaty";
  const id = query.get("id");
  const files = {
    almaty: "data/almaty-people.json",
    astana: "data/astana-structure.json",
    shymkent: "data/shymkent-people.json",
  };
  const text = (tag, value, className) => {
    const node = document.createElement(tag);
    node.textContent = value || "";
    if (className) node.className = className;
    return node;
  };
  const safeName = (p) =>
    p.nameZh && !/[А-Яа-яӘІҢҒҮҰҚӨҺ]/.test(p.nameZh)
      ? p.nameZh
      : p.name || "姓名待核验";
  function render(person, data) {
    document.title = `${safeName(person)}｜丝路译讯`;
    const side = document.createElement("aside");
    side.className = "profile-side";
    const photo = document.createElement("div");
    photo.className = "profile-photo";
    if (person.photo) {
      const img = document.createElement("img");
      img.src = person.photo;
      img.alt = safeName(person);
      img.referrerPolicy = "no-referrer";
      photo.append(img);
    }
    const contact = document.createElement("div");
    contact.className = "profile-contact info-box";
    contact.append(text("h2", "官方公开联系信息"));
    const dl = document.createElement("dl");
    for (const [key, value] of [
      ["电话", person.phone || person.receptionPhone],
      ["电子邮箱", person.email],
      [
        "数据更新",
        data.syncedAt
          ? new Date(data.syncedAt).toLocaleString("zh-CN", {
              timeZone: "Asia/Almaty",
            })
          : "待核验",
      ],
    ]) {
      if (!value) continue;
      const wrap = document.createElement("div");
      wrap.append(text("dt", key), text("dd", value));
      dl.append(wrap);
    }
    contact.append(dl);
    if (person.biographyUrl) {
      const link = text("a", "打开 gov.kz 原始资料 ↗", "source-button");
      link.href = person.biographyUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      contact.append(link);
    }
    side.append(photo, contact);
    const main = document.createElement("article");
    main.className = "profile-main";
    main.append(
      text("p", "OFFICIAL PROFILE", "section-index"),
      text("h1", safeName(person)),
      text("p", person.name || "", "official-original"),
      text(
        "p",
        person.positionZh || person.position || "职务待核验",
        "profile-role",
      ),
    );
    const scope = document.createElement("section");
    scope.className = "article-section";
    scope.append(
      text("h2", "工作范围"),
      text(
        "p",
        person.workScopeZh || "官方页面未提供单独的中文工作范围。",
        "profile-copy",
      ),
    );
    const career = document.createElement("section");
    career.className = "article-section";
    career.append(
      text("h2", "公开履历"),
      text(
        "p",
        person.detailZh ||
          person.careerHistoryZh ||
          person.generalInfoZh ||
          "暂无已核验的中文履历。",
        "profile-copy",
      ),
    );
    const note = document.createElement("section");
    note.className = "article-section";
    note.append(
      text("h2", "翻译说明"),
      text(
        "p",
        person.translationNote || "中文内容整理自官方公开页面，仅供参考。",
      ),
    );
    main.append(scope, career, note);
    root.replaceChildren(side, main);
  }
  fetch(files[region] || files.almaty, { cache: "no-store" })
    .then((r) => {
      if (!r.ok) throw new Error();
      return r.json();
    })
    .then((data) => {
      const people = data.people || [];
      const person = people.find(
        (entry, index) => String(entry.id ?? index) === String(id),
      );
      if (!person) throw new Error("not-found");
      render(person, data);
    })
    .catch(() => {
      root.replaceChildren();
      const box = document.createElement("div");
      box.className = "empty-state";
      box.append(text("span", "404"), text("h1", "未找到这条官员资料"));
      const link = text("a", "返回政府机构目录 →", "hero-action");
      link.href = `officials.html?region=${region}`;
      box.append(link);
      root.append(box);
    });
})();
