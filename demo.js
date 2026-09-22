(() => {
  const makeButton = (label, className) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    return button;
  };

  const makePart = (original, modified, note, variants, index) => {
    const part = document.createElement("div");
    part.className = "review-part";
    const controls = document.createElement("div");
    controls.className = "part-controls";
    const editButton = makeButton("✎ Edit suggestion", "review-action edit-action");
    const rerunButton = makeButton("↻ Re-run", "review-action rerun-action");
    const approveButton = makeButton("✓ Approve", "review-action approve-action");
    const status = document.createElement("span");
    status.className = "part-status";
    controls.append(editButton, rerunButton, approveButton, status);
    part.append(controls);

    const originalRow = document.createElement("div");
    originalRow.className = "review-line original-line";
    originalRow.innerHTML = '<span class="line-number">' + (index + 1) + '</span><span class="review-label">Original</span>';
    const originalText = document.createElement("span");
    originalText.className = "review-line-text";
    originalText.textContent = original;
    originalRow.append(originalText);
    part.append(originalRow);

    const suggestionRow = document.createElement("div");
    suggestionRow.className = "review-line modified-line";
    suggestionRow.innerHTML = '<span class="line-number">' + (index + 1) + '</span><span class="review-label">Suggestion</span>';
    const suggestionText = document.createElement("span");
    suggestionText.className = "review-line-text";
    suggestionText.textContent = modified;
    suggestionRow.append(suggestionText);
    part.append(suggestionRow);

    const suggestionNote = document.createElement("div");
    suggestionNote.className = "part-suggestion";
    suggestionNote.innerHTML = '<span class="suggestion-label">Review note</span>';
    const noteText = document.createElement("span");
    noteText.textContent = note || "Review the identity, evidence, and subject wording.";
    suggestionNote.append(noteText);
    part.append(suggestionNote);

    const editor = document.createElement("div");
    editor.className = "original-editor";
    editor.hidden = true;
    const textarea = document.createElement("textarea");
    textarea.value = modified;
    textarea.className = "original-editor-input";
    const saveButton = makeButton("Save suggestion", "review-action save-edit-action");
    editor.append(textarea, saveButton);
    part.append(editor);

    let rerunIndex = 0;
    const allVariants = [modified].concat(Array.isArray(variants) ? variants : []);
    const rerun = () => {
      if (rerunIndex >= allVariants.length - 1) {
        status.textContent = "↻ Last suggestion reached";
        rerunButton.disabled = true;
        return;
      }
      rerunIndex += 1;
      suggestionText.textContent = allVariants[rerunIndex];
      status.textContent = "↻ New suggestion " + (rerunIndex + 1);
      part.classList.remove("approved-part");
      part.classList.add("rerun-part");
    };

    rerunButton.addEventListener("click", rerun);
    editButton.addEventListener("click", () => {
      editor.hidden = !editor.hidden;
      if (!editor.hidden) textarea.focus();
    });
    saveButton.addEventListener("click", () => {
      const updated = textarea.value.trim();
      if (!updated) return;
      suggestionText.textContent = updated;
      status.textContent = "Edited suggestion";
      editor.hidden = true;
      part.classList.remove("approved-part");
      part.classList.add("rerun-part");
    });
    approveButton.addEventListener("click", () => {
      status.textContent = "✓ Approved";
      part.classList.add("approved-part");
      part.classList.remove("rerun-part");
    });
    return part;
  };

  const makeCard = (item) => {
    const article = document.createElement("article");
    article.className = "source-card";
    const head = document.createElement("div");
    head.className = "source-card-head";
    head.innerHTML = '<span class="mini-label">ORIGINAL → REVIEW ONE BLOCK AT A TIME</span>';
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
    label.textContent = "Each block starts with one suggestion";
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
      const response = await fetch("/docs/demo-source-dataset.json?v=university-long-20260922", { credentials: "same-origin", cache: "no-store" });
      if (!response.ok) throw new Error("Dataset unavailable");
      const items = await response.json();
      root.replaceChildren(...items.map(makeCard));
    } catch (error) {
      root.innerHTML = '<p class="preview-empty">The demonstration dataset is temporarily unavailable.</p>';
    }
  }
  loadSourceDemo();
})();