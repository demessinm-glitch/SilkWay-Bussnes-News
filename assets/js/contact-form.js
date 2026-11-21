(() => {
  const form = document.querySelector("[data-service-inquiry]");
  if (!form || typeof window.fetch !== "function") return;

  const submit = form.querySelector("[data-contact-submit]");
  const submitLabel = submit?.querySelector("span");
  const status = form.querySelector("[data-form-status]");
  const defaultLabel = submitLabel?.textContent || "发送项目需求";

  function showStatus(kind, message) {
    status.hidden = false;
    status.className = `service-form-status is-${kind}`;
    status.textContent = message;
  }

  function setPending(pending) {
    form.setAttribute("aria-busy", String(pending));
    if (!submit) return;
    submit.disabled = pending;
    submit.classList.toggle("is-pending", pending);
    if (submitLabel)
      submitLabel.textContent = pending ? "正在安全发送…" : defaultLabel;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    status.hidden = true;
    setPending(true);

    try {
      const response = await fetch(form.action, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new window.FormData(form),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.success !== true) {
        throw new Error(payload.message || "发送失败，请稍后重试。");
      }

      form.reset();
      showStatus(
        "success",
        payload.message || "项目需求已发送，我们会尽快联系您。",
      );
    } catch (error) {
      showStatus(
        "error",
        error instanceof Error
          ? error.message
          : "邮件服务暂时不可用，请直接发送邮件联系我们。",
      );
    } finally {
      setPending(false);
    }
  });
})();
