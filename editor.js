(()=> {
  const modal=document.getElementById("modalBackdrop");
  const content=document.getElementById("modalContent");
  const esc=v=>String(v??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const show=html=>{content.innerHTML=html;modal.hidden=false};
  const editor=async()=>{
    try { const r=await fetch("/api/auth/me",{credentials:"same-origin"}); if(!r.ok) throw Error(); }
    catch { if(window.login) return window.login(); return; }
    show(`<div class="editor-shell">
      <div class="editor-head"><div><p class="eyebrow">Contributor workspace</p><h2>Prepare a subject</h2></div><span class="role-pill">Contributor</span></div>
      <p class="editor-intro">Write once, preview every format, then ask the selected model to audit the draft.</p>
      <form id="smEditorForm" class="editor-form">
        <div class="editor-main">
          <label>Subject title<input name="title" required minlength="5" placeholder="What is the subject?"></label>
          <div class="editor-row"><label>Content type<select name="type"><option>Subject</option><option>Question</option><option>Resource</option><option>Offer</option><option>Request</option></select></label>
          <label>Category<select name="category"><option>Learning</option><option>Technology</option><option>Business</option><option>Community</option></select></label></div>
          <label>Content<textarea id="smEditorText" name="description" required minlength="20" placeholder="Describe the subject without naming or analysing a person..."></textarea></label>
          <div class="model-bar"><span>Audit model</span><select name="model" aria-label="Choose audit model"><option>Contributor default</option><option>OpenAI-compatible endpoint</option><option>Local open-source model</option></select></div><div class="editor-actions"><button type="button" class="button button-primary" id="smReview">Review with AI</button><button type="submit" class="button button-ghost">Save private draft</button></div>
        </div>
        <aside class="preview-panel"><div class="preview-head"><strong>Live preview</strong><select id="smPreviewMode"><option value="rendered">Rendered</option><option value="plain">Plain text</option></select></div><div id="smPreview" class="preview-copy"><span class="preview-empty">Your subject preview appears here.</span></div></aside>
      </form>
      <section id="smReviewPanel" class="review-panel" hidden></section>
    </div>`);
    const form=document.getElementById("smEditorForm"), textArea=document.getElementById("smEditorText"), preview=document.getElementById("smPreview");
    const update=()=>{const text=textArea.value;preview.innerHTML=text?text.split(/\n\n+/).map(p=>`<p>${esc(p).replace(/\n/g,"<br>")}</p>`).join(""):"<span class=\"preview-empty\">Your subject preview appears here.</span>"};
    textArea.addEventListener("input",update); document.getElementById("smPreviewMode").addEventListener("change",e=>{preview.classList.toggle("plain-preview",e.target.value==="plain");update()});
    let draftId=null;
    document.getElementById("smReview").addEventListener("click",async()=>{
      const panel=document.getElementById("smReviewPanel"), raw=textArea.value.trim();
      let serverSuggestions=null;
      try { const body=Object.fromEntries(new FormData(form)); body.location="Online"; body.language="English"; body.plan="free";
        if(!draftId){const created=await fetch("/api/my/listings",{method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},body:JSON.stringify(body)});if(!created.ok)throw Error("Save the draft before review");draftId=(await created.json()).listing.id;}
        const checked=await fetch("/api/my/listings/"+draftId+"/review",{method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},body:JSON.stringify({model:body.model})});
        const review=await checked.json();if(!checked.ok)throw Error(review.error||"Review failed");serverSuggestions=review.review.suggestions;
      } catch(err) { alert(err.message); return; }
      const suggestions=serverSuggestions||[];
      if(!serverSuggestions && raw.length<80) suggestions.push({role:"Clarity",before:raw||"Add more detail",after:(raw||"This subject")+" — include scope, audience, and the outcome a reader should expect."});
      if(/\b(he|she|they|person|people|someone)\b/i.test(raw)) suggestions.push({role:"Subject policy",before:"Identity reference",after:"Keep the subject and remove personal identity references."});
      if(!serverSuggestions && !suggestions.length) suggestions.push({role:"Safety",before:"No blocking issue detected",after:"Ready for contributor decision. Confirm the preview before submitting."});
      panel.innerHTML=`<div class="review-head"><div><p class="eyebrow">AI audit · draft only</p><h3>Role-aware suggestions</h3></div><span class="audit-status">Contributor decides</span></div>${suggestions.map((s,i)=>`<article class="suggestion" data-index="${i}"><div class="suggestion-meta"><span class="suggestion-role">${esc(s.role)}</span><span>Suggested change</span></div><div class="diff"><del>${esc(s.before)}</del><ins>${esc(s.after)}</ins></div><div class="suggestion-actions"><button type="button" class="button button-ghost accept-suggestion">Accept</button><button type="button" class="button button-ghost reject-suggestion">Keep original</button><button type="button" class="button button-ghost edit-suggestion">Edit</button></div></article>`).join("")}`;
      panel.hidden=false;
      panel.querySelectorAll(".accept-suggestion").forEach((b,i)=>b.onclick=()=>{textArea.value=suggestions[i].after;update();b.closest(".suggestion").classList.add("accepted")});
      panel.querySelectorAll(".reject-suggestion").forEach(b=>b.onclick=()=>b.closest(".suggestion").classList.add("rejected"));
      panel.querySelectorAll(".edit-suggestion").forEach(b=>b.onclick=()=>{textArea.focus();textArea.setSelectionRange(textArea.value.length,textArea.value.length)});
    });
    form.addEventListener("submit",async e=>{e.preventDefault();try{const body=Object.fromEntries(new FormData(form));body.location="Online";body.language="English";body.plan="free";const r=await fetch("/api/my/listings",{method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},body:JSON.stringify(body)});if(!r.ok) throw Error("Could not save draft");modal.hidden=true;alert("Private draft saved.");}catch(err){alert(err.message)}});
    update();
  };
  document.addEventListener("click",e=>{const b=e.target.closest('[data-action="post"]');if(b){e.preventDefault();e.stopImmediatePropagation();editor()}},true);
})();