(() => {
  const escapeHtml = (value) => String(value).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
  const lines = (items, className) => items.map((line, index) => `<div class="diff-line ${className}"><span class="line-number">${index + 1}</span><span>${escapeHtml(line)}</span></div>`).join("");
  async function loadSourceDemo() {
    const root = document.getElementById("sourceDemoGrid");
    if (!root) return;
    try {
      const response = await fetch("/docs/demo-source-dataset.json", { credentials: "same-origin" });
      if (!response.ok) throw new Error("Dataset unavailable");
      const items = await response.json();
      root.innerHTML = items.map((item) => `
        <article class="source-card">
          <div class="source-card-head"><span class="mini-label">ORIGINAL → MODIFIED</span><a href="${escapeHtml(item.source_url)}" target="_blank" rel="noreferrer">Open source ↗</a></div>
          <h3>${escapeHtml(item.subject)}</h3><p class="source-title">${escapeHtml(item.source_title)}</p>
          <div class="diff-columns"><div class="diff-pane original-pane"><div class="diff-label">Original source</div>${lines(item.original_lines, "diff-removed")}</div><div class="diff-pane modified-pane"><div class="diff-label">Modified subject</div>${lines(item.modified_lines, "diff-added")}</div></div>
          <div class="role-notes">${item.role_notes.map((note) => `<span>✓ ${escapeHtml(note)}</span>`).join("")}</div>
        </article>
      `).join("");
    } catch (error) { root.innerHTML = "<p class=\"preview-empty\">The demonstration dataset is temporarily unavailable.</p>"; }
  }
  loadSourceDemo();
})();