(() => {
  const TITLE = "Perry";
  const WORDMARK = `
    <text x="0" y="26" fill="currentColor"
      font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
      font-size="26" font-weight="650" letter-spacing="-0.045em">Perry</text>
  `;

  const setTitle = () => {
    if (document.title !== TITLE) document.title = TITLE;
  };

  const restyleWordmark = (root = document) => {
    root.querySelectorAll?.('svg[viewBox="0 0 182 24"], svg[data-perry-wordmark]').forEach((svg) => {
      if (!svg.dataset.perryWordmark) {
        svg.dataset.perryWordmark = "1";
        svg.setAttribute("viewBox", "0 0 92 32");
        svg.setAttribute("width", "92");
        svg.setAttribute("height", "32");
        svg.innerHTML = WORDMARK;
      }
    });
  };

  const cleanHero = (root = document) => {
    root.querySelectorAll?.('svg[viewBox="0 0 23.16 17.04"]').forEach((svg) => {
      const box = svg.closest('[class*="_fishHitbox"]') || svg;
      box.style.display = "none";
    });
    root.querySelectorAll?.('[class*="_previewBadge"], [class*="_headlineText"], [class*="_headline"]').forEach((el) => {
      el.style.display = "none";
    });
  };

  const tick = (root) => {
    setTitle();
    restyleWordmark(root);
    cleanHero(root);
  };

  tick(document);
  new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === "childList") tick(m.target);
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
