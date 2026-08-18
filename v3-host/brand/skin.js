(() => {
  const TITLE = "Perry";
  const WORDMARK = `
    <text x="2" y="17.5" fill="currentColor" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
      font-size="16" font-weight="650" letter-spacing="-0.04em">Perry</text>
  `;

  const setTitle = () => {
    if (document.title !== TITLE) document.title = TITLE;
  };

  const restyle = (root = document) => {
    setTitle();
    root.querySelectorAll?.('svg[viewBox="0 0 182 24"]').forEach((svg) => {
      if (svg.dataset.perryWordmark) return;
      svg.dataset.perryWordmark = "1";
      svg.setAttribute("width", String((24 * 72) / 24));
      svg.innerHTML = WORDMARK;
    });
  };

  setTitle();
  restyle();
  new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === "childList") restyle(m.target);
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
