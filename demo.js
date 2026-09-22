(() => {
  const escapeHtml = (value) => String(value).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
  const makeButton = (label, className) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    return button;
  };
  const regenerated = (source, current) => {
    const neutral = source.replace(/\b(best|most|safest|smartest|leading|famous|unbeatable|unmatched|complete|total|world's|number-one)\b/gi, "").replace(/\s{2,}/g, " ").trim();
    return [neutral, current[1] || neutral, current[2] || neutral, current[3] || neutral].slice(0, 4);
  };
  const makePart = (original, modified, note, variants, index) => {
    const part = document.createElement("div");
    part.className = "review-part";
    const originalRow = document.createElement("div");
    originalRow.className = "review-line original-line";
    originalRow.innerHTML = '<span class="line-number">' + (index + 1) + '</span><span class="review-label">Original</span>';
    const originalText = document.createElement("span");
    originalText.className = "review-line-text";
    originalText.textContent = original;
    originalRow.append(originalText);
    part.append(originalRow);
    const list = document.createElement("div");
    list.className = "suggestion-list";
    part.append(list);
    const suggestionNote = document.createElement("div");
    suggestionNote.className = "part-suggestion";
    suggestionNote.innerHTML = '<span class="suggestion-label">Review note</span>';
    const noteText = document.createElement("span");
    noteText.textContent = note || "Review the four alternatives and approve one.";
    suggestionNote.append(noteText);
    part.append(suggestionNote);
    const controls = document.createElement("div");
    controls.className = "part-controls";
    const editButton = makeButton("✎ Edit original", "review-action edit-action");
    const status = document.createElement("span");
    status.className = "part-status";
    controls.append(editButton, status);
    part.append(controls);
    const editor = document.createElement("div");
    editor.className = "original-editor";
    editor.hidden = true;
    const textarea = document.createElement("textarea");
    textarea.value = original;
    textarea.className = "original-editor-input";
    const saveButton = makeButton("Generate 4 suggestions", "review-action save-edit-action");
    editor.append(textarea, saveButton);
    part.append(editor);
    let candidates = [modified].concat(Array.isArray(variants) ? variants : []).slice(0, 4);
    const renderCandidates = () => {
      list.replaceChildren(...candidates.map((candidate, candidateIndex) => {
        const option = document.createElement("div");
        option.className = "suggestion-option";
        const line = document.createElement("div");
        line.className = "review-line modified-line";
        line.innerHTML = '<span class="line-number">' + (index + 1) + '</span><span class="review-label">Suggestion ' + (candidateIndex + 1) + '</span>';
        const candidateText = document.createElement("span");
        candidateText.className = "review-line-text";
        candidateText.textContent = candidate;
        line.append(candidateText);
        const approve = makeButton("✓ Approve", "review-action approve-action");
        approve.addEventListener("click", () => {
          status.textContent = "✓ Approved suggestion " + (candidateIndex + 1);
          part.classList.add("approved-part");
          part.classList.remove("rerun-part");
          list.querySelectorAll(".suggestion-option").forEach((item) => item.classList.remove("chosen-suggestion"));
          option.classList.add("chosen-suggestion");
        });
        option.append(line, approve);
        return option;
      }));
    };
    editButton.addEventListener("click", () => {
      editor.hidden = !editor.hidden;
      if (!editor.hidden) textarea.focus();
    });
    saveButton.addEventListener("click", () => {
      const updated = textarea.value.trim();
      if (!updated) return;
      originalText.textContent = updated;
      candidates = regenerated(updated, candidates);
      renderCandidates();
      status.textContent = "↻ 4 new suggestions generated";
      part.classList.remove("approved-part");
      part.classList.add("rerun-part");
    });
    renderCandidates();
    return part;
  };
  const makeCard = (item) => {
    const article = document.createElement("article");
    article.className = "source-card";
    const head = document.createElement("div");
    head.className = "source-card-head";
    head.innerHTML = '<span class="mini-label">ORIGINAL → 4 SUGGESTIONS</span>';
    const link = document.createElement("a");
    link.href = item.source_url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = "Open source ↗";
    head.append(link);
    article.append(head);
    const title = document.createElement("h3");
    title.textContent = item.subject;
    article.append(title);
    const source = document.createElement("p");
    source.className = "source-title";
    source.textContent = item.source_title + (item.advertiser ? " — Advertiser: " + item.advertiser : "");
    article.append(source);
    const pane = document.createElement("div");
    pane.className = "diff-pane combined-pane";
    const label = document.createElement("div");
    label.className = "diff-label";
    label.textContent = "Review each part";
    pane.append(label);
    const variants = item.rerun_variants || [];
    item.original_lines.forEach((line, index) => pane.append(makePart(line, item.modified_lines[index] || "", (item.review_notes || []).find((entry) => entry.line === index + 1)?.text, variants[index] || [], index)));
    article.append(pane);
    const notes = document.createElement("div");
    notes.className = "role-notes";
    (item.role_notes || []).forEach((note) => {
      const tag = document.createElement("span");
      tag.textContent = "✓ " + note;
      notes.append(tag);
    });
    article.append(notes);
    return article;
  };
  async function loadSourceDemo() {
    const root = document.getElementById("sourceDemoGrid");
    if (!root) return;
    try {
      const response = await fetch("/docs/demo-source-dataset.json", { credentials: "same-origin", cache: "no-store" });
      if (!response.ok) throw new Error("Dataset unavailable");
      const items = await response.json();
      root.replaceChildren(...items.map(makeCard));
    } catch (error) {
      root.innerHTML = '<p class="preview-empty">The demonstration dataset is temporarily unavailable.</p>';
    }
  }
  loadSourceDemo();
})();