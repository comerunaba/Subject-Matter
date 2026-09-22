(() => {
  const makeButton = (label, className) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    return button;
  };

  const aiRewrite = (text) => text
    .replace(/\bwe don't just serve ads\b/gi, "The service provides advertising placements")
    .replace(/\bwe don't just\b/gi, "")
    .replace(/\b(best|top|largest|biggest|most|unique|exceptional|unprecedented|advanced)\b/gi, "")
    .replace(/\bpinpoints\b/gi, "helps identify")
    .replace(/\bright audience\b/gi, "relevant audience")
    .replace(/\bmoments that matter most\b/gi, "relevant moments")
    .replace(/\bhigh-intent users\b/gi, "users showing relevant intent")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .trim();

  const makeAdCard = (item) => {
    const article = document.createElement("article");
    article.className = "source-card";
    const head = document.createElement("div");
    head.className = "source-card-head";
    head.innerHTML = '<span class="mini-label">ORIGINAL AD → SUGGESTED AD</span>';
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
    source.textContent = item.source_title + " — Advertiser: " + item.advertiser;
    article.append(source);

    const review = document.createElement("div");
    review.className = "ad-review";

    const controls = document.createElement("div");
    controls.className = "ad-controls";
    const editButton = makeButton("✎ Edit suggestion", "review-action edit-action");
    const rerunButton = makeButton("↻ Re-run", "review-action rerun-action");
    const approveButton = makeButton("✓ Approve", "review-action approve-action");
    const status = document.createElement("span");
    status.className = "part-status";
    controls.append(editButton, rerunButton, approveButton, status);
    review.append(controls);

    const originalBox = document.createElement("section");
    originalBox.className = "whole-ad original-ad";
    originalBox.innerHTML = '<div class="whole-ad-label">Original advertisement — unchanged</div>';
    const originalText = document.createElement("p");
    originalText.textContent = item.original_ad;
    originalBox.append(originalText);
    review.append(originalBox);

    const suggestedBox = document.createElement("section");
    suggestedBox.className = "whole-ad suggested-ad";
    suggestedBox.innerHTML = '<div class="whole-ad-label">Suggested version</div>';
    const suggestedText = document.createElement("p");
    suggestedText.textContent = item.suggested_ad;
    suggestedBox.append(suggestedText);

    const editor = document.createElement("div");
    editor.className = "whole-ad-editor";
    editor.hidden = true;
    const textarea = document.createElement("textarea");
    textarea.className = "original-editor-input";
    textarea.value = item.suggested_ad;
    textarea.setAttribute("aria-label", "Edit suggested advertisement");
    const submitButton = makeButton("Submit to AI", "review-action save-edit-action");
    editor.append(textarea, submitButton);
    suggestedBox.append(editor);
    review.append(suggestedBox);

    const note = document.createElement("div");
    note.className = "whole-ad-note";
    note.innerHTML = '<strong>Why this change:</strong> ';
    const noteText = document.createElement("span");
    noteText.textContent = item.review_note;
    note.append(noteText);
    review.append(note);
    article.append(review);

    let rerunIndex = 0;
    const variants = [item.suggested_ad].concat(Array.isArray(item.rerun_variants) ? item.rerun_variants : []);
    rerunButton.addEventListener("click", () => {
      if (rerunIndex >= variants.length - 1) {
        status.textContent = "↻ Last suggestion reached";
        rerunButton.disabled = true;
        return;
      }
      rerunIndex += 1;
      suggestedText.textContent = variants[rerunIndex];
      textarea.value = variants[rerunIndex];
      status.textContent = "↻ New suggestion " + (rerunIndex + 1);
      article.classList.remove("approved-part");
      article.classList.add("rerun-part");
    });
    editButton.addEventListener("click", () => {
      editor.hidden = !editor.hidden;
      if (!editor.hidden) textarea.focus();
    });
    submitButton.addEventListener("click", () => {
      const edited = textarea.value.trim();
      if (!edited) return;
      const rewritten = aiRewrite(edited);
      suggestedText.textContent = rewritten;
      textarea.value = rewritten;
      editor.hidden = false;
      status.textContent = "↻ AI reworked your edit";
      article.classList.remove("approved-part");
      article.classList.add("rerun-part");
    });
    approveButton.addEventListener("click", () => {
      status.textContent = "✓ Approved";
      article.classList.add("approved-part");
      article.classList.remove("rerun-part");
    });
    return article;
  };

  async function loadSourceDemo() {
    const root = document.getElementById("sourceDemoGrid");
    if (!root) return;
    try {
      const response = await fetch("/docs/demo-source-dataset.json?v=real-ads-edit-submit-20260922", { credentials: "same-origin", cache: "no-store" });
      if (!response.ok) throw new Error("Dataset unavailable");
      const items = await response.json();
      root.replaceChildren(...items.map(makeAdCard));
    } catch (error) {
      root.innerHTML = '<p class="preview-empty">The demonstration dataset is temporarily unavailable.</p>';
    }
  }
  loadSourceDemo();
})();