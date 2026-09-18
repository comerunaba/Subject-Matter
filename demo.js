(() => {
  const escapeHtml = (value) => String(value).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
  async function loadSourceDemo() {
    const root = document.getElementById("sourceDemoGrid");
    if (!root) return;
    try {
      const response = await fetch("/docs/demo-source-dataset.json", { credentials: "same-origin" });
      if (!response.ok) throw new Error("Dataset unavailable");
      const items = await response.json();
      root.innerHTML = items.map((item) => `
        <article class="source-card">
          <div class="source-card-head"><span class="mini-label">SOURCE → MODIFIED</span><a href="${escapeHtml(item.source_url)}" target="_blank" rel="noreferrer">Open source ↗</a></div>
          <h3>${escapeHtml(item.subject)}</h3>
          <p class="source-title">${escapeHtml(item.source_title)}</p>
          <div class="source-columns"><div><small>Original</small><p>${escapeHtml(item.original_excerpt)}</p></div><div class="modified-copy"><small>Subject Matter version</small><p><strong>${escapeHtml(item.modified_subject)}</strong></p><p>${escapeHtml(item.modified_description)}</p></div></div>
          <div class="role-notes">${item.role_notes.map((note) => `<span>✓ ${escapeHtml(note)}</span>`).join("")}</div>
        </article>
      `).join("");
    } catch (error) {
      root.innerHTML = "<p class=\"preview-empty\">The demonstration dataset is temporarily unavailable.</p>";
    }
  }
  loadSourceDemo();
})();