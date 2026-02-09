function initHomeSearch() {
  const input = document.querySelector('.search input');
  const games = document.querySelectorAll('#games img');
  if (!input || !games.length) return;

  input.addEventListener('input', () => {
    const searchTerm = input.value.toLowerCase();
    games.forEach((game) => {
      const alt = (game.getAttribute('alt') || '').toLowerCase();
      game.style.display = alt.includes(searchTerm) ? 'block' : 'none';
    });
  });
}

function compactJs(code) {
  return code
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toBookmarklet(code) {
  const cleaned = compactJs(code);
  return cleaned.startsWith('javascript:') ? cleaned : `javascript:${cleaned}`;
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', 'true');
  ta.style.position = 'fixed';
  ta.style.top = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  ta.remove();
}

function initBookmarkletsPage() {
  const root = document.querySelector('#bookmarklets');
  if (!root) return;

  // Note: The user asked for a "device crasher". We intentionally ship a safe,
  // stop-able stress-test that auto-stops and provides an immediate stop button.
  const bookmarklets = [
    {
      id: 'stress-test',
      title: 'Device Stress Test (Safe / Auto-stop)',
      tags: ['demo', 'stress-test'],
      description:
        'A stop-able performance stress test. It intentionally does some CPU + DOM work, but includes a big Stop button and auto-stops after ~7 seconds.',
      code: `(function(){
  var OVERLAY_ID="__bm_stress_overlay";
  var CONTAINER_ID="__bm_stress_container";
  if(document.getElementById(OVERLAY_ID)) return;

  var stopped=false;
  var start=Date.now();
  var maxMs=7000;

  var overlay=document.createElement("div");
  overlay.id=OVERLAY_ID;
  overlay.style.cssText=[
    "position:fixed","inset:0","z-index:2147483647","background:rgba(0,0,0,.78)",
    "color:#fff","font:600 14px/1.3 system-ui,-apple-system,Segoe UI,Roboto,Arial",
    "display:flex","align-items:center","justify-content:center","padding:24px"
  ].join(";");

  var box=document.createElement("div");
  box.style.cssText="max-width:560px;width:100%;background:#111;border:1px solid rgba(255,255,255,.18);border-radius:14px;padding:16px 16px 12px;box-shadow:0 10px 30px rgba(0,0,0,.45)";
  box.innerHTML=[
    "<div style='font-size:16px;margin-bottom:8px'>Stress test running</div>",
    "<div style='opacity:.9;margin-bottom:10px'>This is a safe demo (not a device-crasher). It auto-stops in ~7s. You can stop instantly.</div>",
    "<div style='display:flex;gap:10px;flex-wrap:wrap;align-items:center'>",
    "  <button id='__bm_stress_stop' style='cursor:pointer;border:0;border-radius:10px;padding:10px 12px;font-weight:800;background:#ff4d4d;color:#111'>STOP</button>",
    "  <div style='opacity:.85'>Tip: Press <b>Esc</b> to stop.</div>",
    "</div>",
    "<div id='__bm_stress_status' style='margin-top:10px;opacity:.9'></div>"
  ].join("");
  overlay.appendChild(box);
  document.documentElement.appendChild(overlay);

  var container=document.createElement("div");
  container.id=CONTAINER_ID;
  container.style.cssText="position:fixed;inset:0;z-index:2147483646;pointer-events:none;opacity:.001";
  document.documentElement.appendChild(container);

  function cleanup(){
    try{ overlay.remove(); }catch(e){}
    try{ container.remove(); }catch(e){}
    try{ document.removeEventListener("keydown",onKey,true); }catch(e){}
    try{ window.__bm_stop_stress_test=undefined; }catch(e){}
  }
  function stop(){
    if(stopped) return;
    stopped=true;
    cleanup();
  }
  function onKey(e){ if(e.key==="Escape") stop(); }
  document.addEventListener("keydown",onKey,true);
  overlay.querySelector("#__bm_stress_stop").addEventListener("click",stop);
  window.__bm_stop_stress_test=stop;

  var junk=[];
  function tick(){
    if(stopped) return;
    var now=Date.now();
    var elapsed=now-start;
    var remaining=Math.max(0, maxMs-elapsed);
    var status=overlay.querySelector("#__bm_stress_status");
    if(status) status.textContent="Auto-stopping in "+Math.ceil(remaining/1000)+"s...";

    // CPU work
    var x=0;
    for(var i=0;i<250000;i++){ x=(x+i)%1000003; }

    // DOM work
    for(var j=0;j<200;j++){
      var d=document.createElement("div");
      d.textContent=".";
      container.appendChild(d);
    }
    while(container.childNodes.length>3000){
      container.removeChild(container.firstChild);
    }

    // Small bounded memory churn
    junk.push(new Array(6000).join("x"));
    if(junk.length>20) junk.shift();

    if(elapsed>=maxMs) stop();
    else requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();`,
      warning:
        'This can lag slow devices. It auto-stops in ~7s and has a STOP button. To stop manually later: run `window.__bm_stop_stress_test && window.__bm_stop_stress_test()` in DevTools.',
    },
    {
      id: 'dark-mode',
      title: 'Instant Dark Mode Toggle',
      tags: ['ui'],
      description:
        'Adds/removes a CSS filter-based dark mode. Great for bright pages, but may make images look weird.',
      code: `(function(){
  var ID="__bm_dark_mode_style";
  var existing=document.getElementById(ID);
  if(existing){ existing.remove(); return; }
  var style=document.createElement("style");
  style.id=ID;
  style.textContent=[
    "html{filter:invert(1) hue-rotate(180deg)!important;background:#111!important}",
    "img,video,canvas,svg{filter:invert(1) hue-rotate(180deg)!important}"
  ].join("\\n");
  document.documentElement.appendChild(style);
})();`,
    },
    {
      id: 'design-mode',
      title: 'Toggle Edit Mode (Design Mode)',
      tags: ['fun'],
      description:
        'Toggles `document.designMode` so you can click and edit text on the current page (refresh to undo).',
      code: `(function(){
  document.designMode = (document.designMode === "on") ? "off" : "on";
  alert("Design mode: " + document.designMode);
})();`,
    },
    {
      id: 'password-peek',
      title: 'Toggle Password Peek',
      tags: ['utility'],
      description:
        'Toggles password fields between `password` and `text` so you can verify what you typed.',
      code: `(function(){
  var inputs=[].slice.call(document.querySelectorAll('input[type="password"], input[data-bm-was-password="1"]'));
  if(!inputs.length){ alert("No password inputs found."); return; }
  inputs.forEach(function(i){
    if(i.type==="password"){
      i.setAttribute("data-bm-was-password","1");
      try{ i.type="text"; }catch(e){}
    }else{
      i.removeAttribute("data-bm-was-password");
      try{ i.type="password"; }catch(e){}
    }
  });
})();`,
    },
    {
      id: 'link-highlighter',
      title: 'Highlight Links',
      tags: ['debug', 'ui'],
      description:
        'Outlines all links on the page and shows their href on hover (toggle on/off).',
      code: `(function(){
  var ID="__bm_link_highlight_style";
  var existing=document.getElementById(ID);
  if(existing){ existing.remove(); return; }
  var style=document.createElement("style");
  style.id=ID;
  style.textContent=[
    "a{outline:2px dashed #2c7ffc!important; outline-offset:2px!important}",
    "a:hover{position:relative!important}",
    "a:hover:after{content:attr(href); position:absolute; left:0; top:100%; max-width:60vw; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; background:#111; color:#fff; padding:4px 6px; border-radius:6px; border:1px solid rgba(255,255,255,.2); z-index:2147483647;}"
  ].join("\\n");
  document.documentElement.appendChild(style);
})();`,
    },
    {
      id: 'dismiss-overlays',
      title: 'Dismiss Popups / Overlays (Best Effort)',
      tags: ['utility'],
      description:
        'Attempts to remove common modal overlays and re-enable scrolling. Works well on cookie banners and newsletter popups.',
      code: `(function(){
  var removed=0;
  var candidates=[].slice.call(document.querySelectorAll("body *"));
  candidates.forEach(function(el){
    var s=getComputedStyle(el);
    if(!s) return;
    var fixedLike=(s.position==="fixed" || s.position==="sticky");
    var big=(el.offsetWidth>innerWidth*0.6 && el.offsetHeight>innerHeight*0.2);
    var topLayer=(+s.zIndex||0) > 1000;
    if(fixedLike && big && topLayer){
      el.remove(); removed++;
    }
  });
  document.documentElement.style.overflow="auto";
  document.body.style.overflow="auto";
  alert("Removed "+removed+" overlay element(s).");
})();`,
    },
    {
      id: 'copy-title-url',
      title: 'Copy Title + URL',
      tags: ['utility'],
      description: 'Copies the current page title and URL to your clipboard.',
      code: `(function(){
  var text=document.title + "\\n" + location.href;
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(function(){ alert("Copied!"); }, function(){ prompt("Copy:", text); });
  }else{
    prompt("Copy:", text);
  }
})();`,
    },
    {
      id: 'wayback',
      title: 'Open Wayback Machine for This Page',
      tags: ['utility'],
      description: 'Opens the Internet Archive “Wayback Machine” for the current URL in a new tab.',
      code: `(function(){
  var u=encodeURIComponent(location.href);
  window.open("https://web.archive.org/web/*/"+u, "_blank", "noopener");
})();`,
    },
  ];

  function render() {
    root.innerHTML = '';

    bookmarklets.forEach((b) => {
      const bookmarklet = toBookmarklet(b.code);

      const card = document.createElement('div');
      card.className = 'bm-card';

      const tags = (b.tags || [])
        .map((t) => `<span class="bm-tag">${t}</span>`)
        .join('');

      const warning = b.warning
        ? `<div class="bm-warning"><strong>Warning:</strong> ${b.warning}</div>`
        : '';

      card.innerHTML = `
        <div class="bm-head">
          <div class="bm-title">${b.title}</div>
          <div class="bm-tags">${tags}</div>
        </div>
        <div class="bm-desc">${b.description}</div>
        ${warning}
        <label class="bm-label">Bookmarklet URL</label>
        <textarea class="bm-code" spellcheck="false" readonly>${bookmarklet}</textarea>
        <div class="bm-actions">
          <button class="bm-btn bm-copy" type="button">Copy</button>
          <button class="bm-btn bm-run" type="button">Run</button>
          <button class="bm-btn bm-src" type="button">View source</button>
        </div>
        <pre class="bm-source" hidden></pre>
      `;

      const copyBtn = card.querySelector('.bm-copy');
      const runBtn = card.querySelector('.bm-run');
      const srcBtn = card.querySelector('.bm-src');
      const srcEl = card.querySelector('.bm-source');

      copyBtn.addEventListener('click', async () => {
        const old = copyBtn.textContent;
        try {
          await copyText(bookmarklet);
          copyBtn.textContent = 'Copied';
          setTimeout(() => (copyBtn.textContent = old), 900);
        } catch (e) {
          copyBtn.textContent = 'Copy failed';
          setTimeout(() => (copyBtn.textContent = old), 1200);
        }
      });

      runBtn.addEventListener('click', () => {
        try {
          // Execute the same JS that the bookmarklet uses.
          // eslint-disable-next-line no-new-func
          new Function(b.code)();
        } catch (e) {
          alert(`Bookmarklet error: ${e?.message || e}`);
        }
      });

      srcBtn.addEventListener('click', () => {
        const showing = !srcEl.hidden;
        srcEl.hidden = showing;
        srcBtn.textContent = showing ? 'View source' : 'Hide source';
        srcEl.textContent = b.code.trim();
      });

      root.appendChild(card);
    });
  }

  render();
}

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body?.dataset?.page;
  if (page === 'bookmarklets') initBookmarkletsPage();
  else initHomeSearch();
});
