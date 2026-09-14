/* دکتر ابزار — app shell: theme, i18n, router, search, render */
(function () {
"use strict";

/* ---------------- icons (inline, no CDN) ---------------- */
const P = (d, extra) => `<path d="${d}"${extra||""}/>`;
const ICONS = {
  wrench: P("M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"),
  send: P("M22 2 11 13") + P("M22 2 15 22l-4-9-9-4 20-7z"),
  sparkles: P("M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z") + P("M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"),
  braces: P("M8 3H7a2 2 0 0 0-2 2v4a2 2 0 0 1-2 2 2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h1") + P("M16 3h1a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2 2 2 0 0 0-2 2v4a2 2 0 0 1-2 2h-1"),
  code: P("M16 18l6-6-6-6") + P("M8 6l-6 6 6 6"),
  link: P("M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7") + P("M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"),
  hash: P("M4 9h16") + P("M4 15h16") + P("M10 3 8 21") + P("M16 3l-2 18"),
  fingerprint: P("M12 10a2 2 0 0 0-2 2c0 1.5.5 3-.5 5") + P("M12 6a6 6 0 0 1 6 6c0 2-.5 4-1.5 6") + P("M12 2a10 10 0 0 1 10 10c0 1.5-.2 3-.7 4.5") + P("M6.5 6.5A8 8 0 0 0 4 12c0 3 .8 5.5 1.5 7.5") + P("M8.5 8.5A5 5 0 0 0 7 12c0 2.5.6 4.5 1.2 6.4"),
  key: P("M21 2l-2 2m-7.6 7.6a5.5 5.5 0 1 1-7.8 7.8 5.5 5.5 0 0 1 7.8-7.8zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3"),
  clock: '<circle cx="12" cy="12" r="9"/>' + P("M12 7v5l3.5 2"),
  asterisk: P("M12 5v14") + P("M5 8.5l14 7") + P("M19 8.5l-14 7"),
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/>' + P("M8 10V7a4 4 0 0 1 8 0v3"),
  alignleft: P("M4 5h16") + P("M4 10h10") + P("M4 15h16") + P("M4 20h10"),
  droplet: P("M12 2.7l5.3 5.3a7.5 7.5 0 1 1-10.6 0L12 2.7z"),
  contrast: '<circle cx="12" cy="12" r="9"/>' + P("M12 3a9 9 0 0 1 0 18z", ' fill="currentColor" stroke="none"'),
  blend: '<circle cx="9" cy="10" r="5.5"/>' + '<circle cx="15" cy="10" r="5.5"/>' + '<circle cx="12" cy="15" r="5.5"/>',
  qr: P("M3 3h7v7H3z") + P("M14 3h7v7h-7z") + P("M3 14h7v7H3z") + P("M14 14h3v3h-3z") + P("M19 19h2v2h-2z") + P("M14 19h2M19 14h2", 'stroke-width="1.6"'),
  type: P("M4 7V5h16v2") + P("M12 5v14") + P("M8 19h8"),
  caseconv: '<text x="3.5" y="17" font-size="13" font-weight="bold" fill="currentColor" stroke="none" font-family="Arial">Aa</text>',
  swap: P("M7 16H3m0 0l4-4m-4 4l4 4") + P("M17 8h4m0 0l-4-4m4 4l-4 4"),
  digits: '<text x="2.5" y="16" font-size="11" font-weight="bold" fill="currentColor" stroke="none" font-family="monospace">01</text>',
  table: '<rect x="3" y="4" width="18" height="16" rx="2"/>' + P("M3 10h18M9 4v16M15 4v16"),
  bot: '<rect x="4" y="8" width="16" height="12" rx="3"/>' + P("M12 8V4m0 0h3") + '<circle cx="9" cy="14" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="14" r="1" fill="currentColor" stroke="none"/>',
  arrow: P("M5 12h14m-6-6l6 6-6 6"),
  x: P("M6 6l12 12M18 6L6 18"),
  check: P("M4.5 12.5l5 5L20 7"),
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/>' + P("M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"),
  download: P("M12 3v12m0 0l-4-4m4 4l4-4") + P("M4 21h16"),
  refresh: P("M21 12a9 9 0 1 1-2.6-6.3M21 3v6h-6"),
  shield: P("M12 2.5l8 3.5v5c0 5-3.5 8.5-8 10.5C7.5 19.5 4 16 4 11V6l8-3.5z") + P("M9 11.5l2.2 2.2L15.5 9"),
  zap: P("M13 2 4 14h6l-1 8 9-12h-6l1-8z"),
  search: '<circle cx="11" cy="11" r="7"/>' + P("M20 20l-3.2-3.2"),
  globe: '<circle cx="12" cy="12" r="9"/>' + P("M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18"),
  star: P("M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8 6.6 19.7l1.1-6.1L3.2 9.4l6.1-.8L12 3z"),
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/>' + P("M8 3v4M16 3v4M3 10h18"),
  activity: P("M22 12h-4l-3 8L9 4l-3 8H2"),
  filetext: P("M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6z") + P("M14 3v6h6M9 14h6M9 17h6"),
  home: P("M4 11l8-7 8 7") + P("M6 9.5V20h12V9.5"),
  grid: '<rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5"/><rect x="13" y="3.5" width="7.5" height="7.5" rx="1.5"/><rect x="3.5" y="13" width="7.5" height="7.5" rx="1.5"/><rect x="13" y="13" width="7.5" height="7.5" rx="1.5"/>',
  eye: '<path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.8"/>',
  percent: '<line x1="19" y1="5" x2="5" y2="19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
  calc: '<rect x="4" y="2.5" width="16" height="19" rx="2"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="12" x2="8" y2="12.01"/><line x1="12" y1="12" x2="12" y2="12.01"/><line x1="16" y1="12" x2="16" y2="12.01"/><line x1="8" y1="16" x2="8" y2="16.01"/><line x1="12" y1="16" x2="12" y2="16.01"/><line x1="16" y1="16" x2="16" y2="16.01"/><line x1="8" y1="19.5" x2="8" y2="19.51"/><line x1="12" y1="19.5" x2="12" y2="19.51"/>',
  wifi: P("M5 12.5a10 10 0 0 1 14 0") + P("M8.5 15.5a5 5 0 0 1 7 0") + '<circle cx="12" cy="19" r="1" fill="currentColor" stroke="none"/>',
  list: P("M8 6h13M8 12h13M8 18h13") + '<circle cx="3.5" cy="6" r="1.2" fill="currentColor" stroke="none"/><circle cx="3.5" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="3.5" cy="18" r="1.2" fill="currentColor" stroke="none"/>',
  repeat: P("M17 2l4 4-4 4") + P("M3 11V9a4 4 0 0 1 4-4h14") + P("M7 22l-4-4 4-4") + P("M21 13v2a4 4 0 0 1-4 4H3"),
  shuffle: P("M16 3h5v5") + P("M4 20L21 3") + P("M21 16v5h-5") + P("M15 15l6 6") + P("M4 4l5 5"),
  plus: P("M12 5v14M5 12h14"),
  minus: P("M5 12h14"),
  filter: P("M22 3H2l8 9.5V19l4 2v-8.5L22 3z"),
  sort: P("M8 6h13M8 12h10M8 18h7") + P("M3.5 6l1.5-1.5L6.5 6M5 4.5V9M3.5 12l1.5-1.5L6.5 12M5 10.5V18"),
  tag: P("M20.6 13.4 12 22l-9-9V3h10l7.6 7.6a2 2 0 0 1 0 2.8z") + '<circle cx="7.5" cy="7.5" r="1.3"/>',
  rulers: P("M7 3l10 18") + P("M4 7l4 4") + P("M13 2l4 4") + P("M9 12l4 4") + P("M20 7l-4 4"),
  corner: P("M4 4v8a8 8 0 0 0 8 8h8") + P("M4 8V4h4"),
  palette: P("M12 3a9 9 0 0 0 0 18h1.5a1.5 1.5 0 0 0 0-3H12a1 1 0 0 1 0-2h4a4 4 0 0 0 4-4c0-5-4-9-8-9z") + '<circle cx="7.5" cy="10" r="1.1" fill="currentColor" stroke="none"/><circle cx="12" cy="7.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="16.5" cy="10" r="1.1" fill="currentColor" stroke="none"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/>',
  server: '<rect x="3" y="3.5" width="18" height="7" rx="2"/><rect x="3" y="13.5" width="18" height="7" rx="2"/><circle cx="7" cy="7" r="1" fill="currentColor" stroke="none"/><circle cx="7" cy="17" r="1" fill="currentColor" stroke="none"/>',
};
function icon(name, cls) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" class="i ${cls || ""}">${ICONS[name] || ICONS.wrench}</svg>`;
}

/* ---------------- state ---------------- */
const LS_LANG = "drt-lang", LS_THEME = "drt-theme";
const state = {
  lang: localStorage.getItem(LS_LANG) || "fa",
  theme: localStorage.getItem(LS_THEME) || "light",
  route: { name: "home", param: null },
  activeCat: "all",
};
const t = (k) => (window.I18N[state.lang] && window.I18N[state.lang][k]) || window.I18N.en[k] || k;

/* ---------------- dom helpers ---------------- */
function el(tag, attrs, children) {
  const node = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k === "text") node.textContent = v;
    else if (k === "dataset") Object.assign(node.dataset, v);
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2).toLowerCase(), v);
    else node.setAttribute(k, v);
  }
  (Array.isArray(children) ? children : children != null ? [children] : [])
    .forEach((c) => c != null && node.append(typeof c === "string" ? document.createTextNode(c) : c));
  return node;
}
const $ = (s) => document.querySelector(s);

async function copyText(txt) {
  try { await navigator.clipboard.writeText(txt); toast(t("c.copied"), "check"); }
  catch {
    const ta = el("textarea", { value: txt, style: "position:fixed;opacity:0" });
    document.body.append(ta); ta.select();
    try { document.execCommand("copy"); toast(t("c.copied"), "check"); }
    catch { toast(t("c.copyFail"), "x"); }
    ta.remove();
  }
}
function download(name, content, mime) {
  const a = el("a", { href: URL.createObjectURL(new Blob([content], { type: mime || "text/plain;charset=utf-8" })), download: name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
function toast(msg, iconName) {
  const wrap = $("#toastWrap");
  const node = el("div", { class: "toast", html: icon(iconName || "check") + "<span></span>" });
  node.querySelector("span").textContent = msg;
  wrap.append(node);
  setTimeout(() => { node.classList.add("out"); setTimeout(() => node.remove(), 320); }, 2200);
}

/* ---------------- shared builder API for tools ---------------- */
const API = {
  t, el, icon, copy: copyText, toast, download,
  get lang() { return state.lang; },
  field(labelKey, control) {
    return el("div", { class: "field" }, [el("label", { text: t(labelKey) }), control]);
  },
  input(attrs) { return el("input", Object.assign({ class: "input", type: "text", autocomplete: "off", spellcheck: "false" }, attrs)); },
  textarea(attrs) { return el("textarea", Object.assign({ class: "textarea", placeholder: t("c.pasteHere"), spellcheck: "false" }, attrs)); },
  select(options, attrs) {
    const s = el("select", Object.assign({ class: "select" }, attrs));
    options.forEach(([v, label]) => s.append(el("option", { value: v, text: label })));
    return s;
  },
  check(labelKey, checked) {
    const inp = el("input", { type: "checkbox" }); inp.checked = !!checked;
    return { node: el("label", { class: "check" }, [inp, el("span", { text: t(labelKey) })]), input: inp };
  },
  outputBar(labelKey) {
    const out = el("pre", { class: "output" });
    const copyB = el("button", { class: "btn btn-ghost btn-sm", html: icon("copy") + `<span>${t("c.copy")}</span>`, onclick: () => copyText(out.textContent || "") });
    const bar = el("div", { class: "output-bar" }, [el("span", { class: "kicker", text: t(labelKey) }), el("div", { class: "output-actions" }, [copyB])]);
    return { node: el("div", { class: "output-wrap" }, [bar, out]), out, copyB };
  },
  note(key) { return el("p", { class: "hint", html: t(key) }); },
};
// proper btn (the one above had a broken trick) — redefine cleanly
API.btn = function (labelKey, cls, onclick, iconNm) {
  const b = el("button", { class: "btn " + (cls || "btn-ghost"), type: "button", onclick });
  b.innerHTML = (iconNm ? icon(iconNm) : "") + `<span>${typeof labelKey === "string" && t(labelKey) !== labelKey ? t(labelKey) : labelKey}</span>`;
  return b;
};

/* ---------------- categories: groups → leaf cats ---------------- */
const GROUPS = [
  { id: "developer", icon: "code" },
  { id: "security", icon: "shield" },
  { id: "network", icon: "globe" },
  { id: "ai", icon: "sparkles" },
  { id: "design", icon: "droplet" },
  { id: "calculator", icon: "digits" },
  { id: "converter", icon: "swap" },
  { id: "generator", icon: "zap" },
  { id: "text", icon: "type" },
  { id: "telegram", icon: "send" },
  { id: "misc", icon: "grid" },
];
const CATS = [
  { id: "json", group: "developer", icon: "braces" },
  { id: "xml", group: "developer", icon: "code" },
  { id: "regex", group: "developer", icon: "asterisk" },
  { id: "encoding", group: "developer", icon: "link" },
  { id: "hash", group: "developer", icon: "hash" },
  { id: "jwt", group: "developer", icon: "key" },
  { id: "security", group: "security", icon: "shield" },
  { id: "network", group: "network", icon: "globe" },
  { id: "ai", group: "ai", icon: "sparkles" },
  { id: "color", group: "design", icon: "droplet" },
  { id: "css", group: "design", icon: "blend" },
  { id: "math", group: "calculator", icon: "digits" },
  { id: "date", group: "calculator", icon: "clock" },
  { id: "convert", group: "converter", icon: "swap" },
  { id: "generator", group: "generator", icon: "zap" },
  { id: "text", group: "text", icon: "type" },
  { id: "telegram", group: "telegram", icon: "send" },
  { id: "misc", group: "misc", icon: "grid" },
];
const catById = (id) => CATS.find((c) => c.id === id);
const groupOf = (catId) => (catById(catId) || { group: "misc" }).group;
const isGroupId = (id) => GROUPS.some((g) => g.id === id);
const catName = (id) => (isGroupId(id) ? t("grp." + id) : t("cat." + id));
const catDesc = (id) => (isGroupId(id) ? t("grp." + id + ".desc") : t("cat." + id + ".desc"));
const catIconOf = (id) => (isGroupId(id) ? (GROUPS.find((g) => g.id === id) || {}).icon : (catById(id) || {}).icon);
/* map legacy flat cats onto the new tree */
const CAT_REMAP = {
  "tg-webhook": "telegram", "tg-send": "telegram",
  "prompt-builder": "ai", "token-estimator": "ai",
  "json-formatter": "json",
  "base64": "encoding", "url-codec": "encoding",
  "hash": "hash", "jwt": "jwt", "regex": "regex",
  "timestamp": "date",
  "uuid": "generator", "password": "generator",
  "lorem": "text", "word-counter": "text", "case-converter": "text",
  "color": "color", "contrast": "color",
  "gradient": "css", "qr": "misc",
  "unit": "convert", "base-converter": "convert", "csv-json": "convert",
};
const TOOLS = (window.DRT_TOOLS || []).map((x) => { x.cat = CAT_REMAP[x.id] || x.cat; return x; });
const toolById = (id) => TOOLS.find((x) => x.id === id);
/* link builders */
const LH = {
  home: "/",
  cat: (id) => "/cat/" + id,
  tool: (id) => "/tools/" + id,
};

/* ---------------- chrome (header / footer) ---------------- */
function renderChrome() {
  document.documentElement.lang = state.lang;
  document.documentElement.dir = state.lang === "fa" ? "rtl" : "ltr";
  $("#brandName").textContent = t("brand");
  $("#searchLabel").textContent = t("search.label");
  $("#langBtn .lang-face").textContent = state.lang === "fa" ? "EN" : "فا";
  const nav = $("#mainNav"); nav.innerHTML = "";
  [[LH.home, "nav.home", "home"], [LH.cat("all"), "nav.tools", "tools"]].forEach(([href, key, id]) => {
    const a = el("a", { href, text: t(key) });
    if ((id === "home" && state.route.name === "home") || (id === "tools" && state.route.name === "cat")) a.classList.add("active");
    nav.append(a);
  });
  const fc = $("#footerCols"); fc.innerHTML = "";
  const catsCol = el("div", {}, [el("h4", { text: t("footer.cats") })]);
  GROUPS.forEach((g) => catsCol.append(el("a", { href: LH.cat(g.id), text: t("grp." + g.id) })));
  const linksCol = el("div", {}, [el("h4", { text: t("footer.links") }),
    el("a", { href: LH.home, text: t("nav.home") }),
    el("a", { href: LH.cat("all"), text: t("nav.tools") }),
    el("a", { href: LH.tool("tg-webhook"), text: t("tool.tg-webhook.name") })]);
  const aboutCol = el("div", {}, [el("h4", { text: t("footer.about") }), el("p", { class: "muted", style: "font-size:13px;margin:0", text: t("footer.aboutText") })]);
  fc.append(catsCol, linksCol, aboutCol);
  $("#footerTag").textContent = t("footer.tag");
  $("#footerCopy").textContent = t("footer.copy");
  $("#footerCredit").innerHTML = t("footer.credit") + ' — <a href="https://codemoon.ir" target="_blank" rel="noopener">codemoon.ir</a>';
  $("#footerPrivacy").innerHTML = icon("shield") + "<span>" + t("footer.privacy") + "</span>";
}

/* ---------------- home view ---------------- */
function toolCard(tool, i) {
  const a = el("a", { class: "tool-card reveal", href: LH.tool(tool.id), dataset: { cat: tool.cat, group: groupOf(tool.cat) } });
  a.style.animationDelay = Math.min(i * 45, 500) + "ms";
  a.innerHTML = `
    <div class="tc-top"><span class="tc-icon">${icon(tool.icon)}</span><span class="tc-arrow">${icon("arrow")}</span></div>
    <h3 class="tc-name">${t("tool." + tool.id + ".name")}</h3>
    <p class="tc-desc">${t("tool." + tool.id + ".desc")}</p>
    <div class="tc-foot"><span class="tc-cat">${t("cat." + tool.cat)}</span><span class="tc-tag">${t("tool.open")} ↗</span></div>`;
  return a;
}
function renderHome() {
  const app = $("#app"); app.innerHTML = "";
  const popular = ["tg-webhook", "json-formatter", "password", "timestamp", "qr", "base64"];
  const hero = el("section", { class: "hero" });
  hero.innerHTML = `
    <div class="container hero-grid">
      <div>
        <p class="kicker reveal">${icon("wrench")} ${t("hero.kicker")}</p>
        <h1 class="reveal" style="animation-delay:.06s">${t("hero.title.a")}<span class="grad">${t("hero.title.grad")}</span></h1>
        <p class="lead reveal" style="animation-delay:.12s">${t("hero.lead")}</p>
        <div class="hero-cta reveal" style="animation-delay:.18s">
          <a class="btn btn-primary" href="${LH.cat("all")}">${icon("grid")}<span>${t("hero.cta1")}</span></a>
          <a class="btn btn-ghost" href="${LH.tool("tg-webhook")}">${icon("send")}<span>${t("hero.cta2")}</span></a>
        </div>
        <div class="hero-stats reveal" style="animation-delay:.24s">
          <div><b>${TOOLS.length}<em>+</em></b><span>${t("hero.stat.tools")}</span></div>
          <div><b>${GROUPS.length}</b><span>${t("hero.stat.cats")}</span></div>
          <div><b><em>100%</em></b><span>${t("hero.stat.free")}</span></div>
          <div><b><em>0</em></b><span>${t("hero.stat.priv")}</span></div>
        </div>
      </div>
      <aside class="hero-rx" aria-hidden="true">
        <div class="rx-slip">
          <div class="rx-top"><span class="rx-r">℞</span><span class="rx-date">${t("rx.title")}<br>${t("rx.date")}</span></div>
          <ul><li>${t("rx.l1")}</li><li>${t("rx.l2")}</li><li>${t("rx.l3")}</li></ul>
          <div class="rx-sig"><span>${t("rx.sig")}</span><i>${t("rx.sigby")}</i></div>
        </div>
      </aside>
    </div>`;
  app.append(hero);

  const sec = el("section", { class: "container section" });
  const chips = el("div", { class: "chips" });
  ch([["all", "grp.all", "grid"]].concat(GROUPS.map((g) => [g.id, "grp." + g.id, g.icon])), chips, "group");
  sec.append(el("div", { class: "section-head" }, [
    el("div", {}, [el("p", { class: "kicker", text: t("sec.categories") }), el("h2", { text: t("sec.tools") })]),
    chips]));
  const list = state.activeCat === "all" || !state.activeCat ? TOOLS : TOOLS.filter((x) => groupOf(x.cat) === state.activeCat);
  const grid = el("div", { class: "tools-grid", dataset: { group: state.activeCat || "all" } });
  if (!list.length) grid.append(el("div", { class: "empty", html: icon("search") + "<p>" + t("tool.empty") + "</p>" }));
  list.forEach((tool, i) => grid.append(toolCard(tool, i)));
  sec.append(grid);
  app.append(sec);
}

/* ---------------- tool view ---------------- */
function renderTool(id) {
  const tool = toolById(id);
  const app = $("#app"); app.innerHTML = "";
  if (!tool) { go(LH.home); return; }
  const page = el("div", { class: "tool-page container" });
  page.append(el("nav", { class: "breadcrumb", html:
    `<a href="${LH.home}">${t("tool.home")}</a><span class="sep">/</span><a href="${LH.cat(groupOf(tool.cat))}">${t("grp." + groupOf(tool.cat))}</a><span class="sep">/</span><a href="${LH.cat(tool.cat)}">${t("cat." + tool.cat)}</a><span class="sep">/</span><span class="current">${t("tool." + tool.id + ".name")}</span>` }));
  page.append(el("div", { class: "tool-head reveal" }, [
    el("span", { class: "tc-icon", html: icon(tool.icon) }),
    el("div", {}, [el("h1", { text: t("tool." + tool.id + ".name") }), el("p", { text: t("tool." + tool.id + ".desc") })])]));
  const body = el("div", { class: "tool-card-rx reveal", style: "animation-delay:.08s" });
  const inner = el("div", { class: "tool-body" });
  body.append(inner);
  page.append(body);
  const related = TOOLS.filter((x) => x.cat === tool.cat && x.id !== tool.id).slice(0, 4);
  if (related.length) {
    const rel = el("div", { class: "related" }, [el("h3", { text: t("tool.related") })]);
    const rg = el("div", { class: "related-grid" });
    related.forEach((r) => rg.append(el("a", { class: "related-link", href: LH.tool(r.id), html: icon(r.icon) + `<span>${t("tool." + r.id + ".name")}</span>` })));
    rel.append(rg); page.append(rel);
  }
  app.append(page);
  try { tool.render(inner, API); }
  catch (e) { inner.innerHTML = `<p class="hint" style="color:var(--danger)">Tool error: ${e.message}</p>`; console.error(e); }
  setMeta(t("tool." + tool.id + ".name") + " | " + t("brand"), t("tool." + tool.id + ".desc"), LH.tool(tool.id), tool.icon, t("grp." + groupOf(tool.cat)));
}

/* ---------------- router ---------------- */
function parseHash() {
  const h = location.hash.replace(/^#\/?/, "");
  const path = location.pathname.replace(/^\/+/, "").replace(/\/+$/, "");
  if (!h && !path) return { name: "home" };
  const m = h.match(/^(tool|cat)\/(.+)$/);
  if (m) return { name: m[1], param: m[2] };
  const pm = path.match(/^(tools)\/(.+)$/);
  if (pm) return { name: "tool", param: pm[2] };
  const cm = path.match(/^(cat)\/(.+)$/);
  if (cm) return { name: "cat", param: cm[2] };
  return { name: "home" };
}
function go(path) {
  history.pushState({}, "", path);
  render();
}
function setMeta(title, desc, canonical, ic, catName) {
  document.title = title;
  let m = document.querySelector('meta[name="description"]');
  if (m) m.content = desc;
  const url = location.origin + canonical;
  let cl = document.querySelector('link[rel="canonical"]');
  if (cl) cl.href = url;
  const setOg = (prop, content) => {
    let og = document.querySelector('meta[property="og:' + prop + '"]');
    if (og) og.content = content;
  };
  setOg("title", title); setOg("description", desc); setOg("url", url); setOg("type", "website");
  let ld = document.getElementById("toolJsonLd");
  if (ld) ld.textContent = JSON.stringify({
    "@context": "https://schema.org", "@type": "WebApplication",
    name: title, description: desc, url, applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    ...(catName ? { genre: catName } : {})
  });
}
function render() {
  state.route = parseHash();
  if (state.route.name === "cat") state.activeCat = state.route.param || "all";
  else if (state.route.name === "home") state.activeCat = "all";
  renderChrome();
  if (state.route.name === "tool") renderTool(state.route.param);
  else if (state.route.name === "cat") renderCategory(state.route.param);
  else renderHome();
  if (state.route.name !== "tool") {
    const cid = state.route.name === "cat" ? state.route.param : null;
    const isAll = !cid || cid === "all";
    const nm = isAll ? t("grp.all") : catName(cid);
    const dc = isAll ? t("seo.desc") : catDesc(cid);
    const can = isAll ? LH.home : LH.cat(cid);
    const ic = isAll ? "grid" : (catIconOf(cid) || "grid");
    setMeta((isAll ? t("brand") : nm) + " | dr-tools.ir", dc, can, ic, isAll ? t("grp.all") : nm);
  }
  window.scrollTo({ top: 0 });
}
function renderCategory(id) {
  const app = $("#app"); app.innerHTML = "";
  const isAll = id === "all";
  const isGrp = isGroupId(id);
  const isCat = !isGrp && catById(id);
  if (!isAll && !isGrp && !isCat) { go(LH.home); return; }
  const page = el("div", { class: "tool-page container" });
  const nameKey = isAll ? "grp.all" : (isGrp ? "grp." + id : "cat." + id);
  const name = t(nameKey);
  const desc = isAll ? t("seo.desc") : catDesc(id);
  const icn = isAll ? "grid" : (catIconOf(id) || "grid");
  let crumb = `<a href="${LH.home}">${t("tool.home")}</a><span class="sep">/</span><a href="${LH.cat("all")}">${t("nav.tools")}</a>`;
  if (isCat) crumb += `<span class="sep">/</span><a href="${LH.cat(groupOf(id))}">${t("grp." + groupOf(id))}</a>`;
  crumb += `<span class="sep">/</span><span class="current">${name}</span>`;
  page.append(el("nav", { class: "breadcrumb", html: crumb }));
  page.append(el("div", { class: "tool-head reveal" }, [
    el("span", { class: "tc-icon", html: icon(icn) }),
    el("div", {}, [el("h1", { text: name }), el("p", { text: desc })])]));
  const body = el("div", { class: "tool-card-rx reveal", style: "animation-delay:.08s" });
  const inner = el("div", { class: "tool-body" });
  body.append(inner);
  page.append(body);
  /* chips: groups for "all", sub-cats for group, sibling cats for leaf cat */
  const chips = el("div", { class: "chips", style: "margin:18px 0 6px" });
  if (isAll) ch([["all", "grp.all", "grid"]].concat(GROUPS.map((g) => [g.id, "grp." + g.id, g.icon])), chips, "group");
  else if (isGrp) CATS.filter((c) => c.group === id).forEach((c) => chips.append(el("a", { class: "chip", href: LH.cat(c.id), html: icon(c.icon) + `<span>${t("cat." + c.id)}</span>` })));
  else CATS.filter((c) => c.group === groupOf(id)).forEach((c) => chips.append(el("a", { class: "chip" + (c.id === id ? " active" : ""), href: LH.cat(c.id), html: icon(c.icon) + `<span>${t("cat." + c.id)}</span>` })));
  inner.append(chips);
  const grid = el("div", { class: "tools-grid" });
  const list = isAll ? TOOLS : (isGrp ? TOOLS.filter((x) => groupOf(x.cat) === id) : TOOLS.filter((x) => x.cat === id));
  if (!list.length) grid.append(el("div", { class: "empty", html: icon("search") + "<p>" + t("tool.empty") + "</p>" }));
  list.forEach((tool, i) => grid.append(toolCard(tool, i)));
  inner.append(grid);
  app.append(page);
}
/* chips builder helper */
function ch(items, wrap, kind) {
  items.forEach(([id, key, ic]) => {
    const a = el("a", { class: "chip" + (state.activeCat === id ? " active" : ""), href: kind === "group" ? LH.cat(id === "all" ? "all" : id) : LH.cat(id), html: icon(ic) + `<span>${t(key)}</span>` });
    wrap.append(a);
  });
}

/* ---------------- theme & lang ---------------- */
function applyTheme() {
  document.documentElement.dataset.theme = state.theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = state.theme === "dark" ? "#0C1210" : "#0E7C66";
}
function setLang(l) {
  state.lang = l; localStorage.setItem(LS_LANG, l); render();
}
function setTheme(th) {
  state.theme = th; localStorage.setItem(LS_THEME, th); applyTheme();
}

/* ---------------- search palette ---------------- */
let paletteSel = 0, paletteList = [];
function openPalette() {
  const bd = $("#paletteBackdrop");
  bd.classList.remove("hidden");
  const inp = $("#paletteInput");
  inp.value = ""; inp.placeholder = t("search.placeholder");
  fillPalette("");
  setTimeout(() => inp.focus(), 30);
}
function closePalette() { $("#paletteBackdrop").classList.add("hidden"); }
function fillPalette(q) {
  const ql = q.trim().toLowerCase();
  paletteList = TOOLS.filter((tool) => {
    if (!ql) return true;
    const hay = [t("tool." + tool.id + ".name"), t("tool." + tool.id + ".desc"), t("cat." + tool.cat), ...(tool.keywords || [])].join(" ").toLowerCase();
    return ql.split(/\s+/).every((w) => hay.includes(w));
  }).slice(0, 9);
  paletteSel = 0;
  const ul = $("#paletteResults"); ul.innerHTML = "";
  if (!paletteList.length) { ul.append(el("li", { class: "palette-empty", text: t("search.empty") })); return; }
  paletteList.forEach((tool, i) => {
    const li = el("li", { class: i === 0 ? "sel" : "", html: icon(tool.icon) + `<span>${t("tool." + tool.id + ".name")}</span><small>${t("grp." + groupOf(tool.cat))} · ${t("cat." + tool.cat)}</small>`,
      onclick: () => { go(LH.tool(tool.id)); closePalette(); } });
    li.dataset.idx = i;
    ul.append(li);
  });
}
function movePalette(d) {
  const items = [...$("#paletteResults").querySelectorAll("li:not(.palette-empty)")];
  if (!items.length) return;
  items[paletteSel]?.classList.remove("sel");
  paletteSel = (paletteSel + d + items.length) % items.length;
  items[paletteSel].classList.add("sel");
  items[paletteSel].scrollIntoView({ block: "nearest" });
}

/* ---------------- boot ---------------- */
document.addEventListener("DOMContentLoaded", () => {
  applyTheme();
  $("#themeBtn").addEventListener("click", () => setTheme(state.theme === "light" ? "dark" : "light"));
  $("#langBtn").addEventListener("click", () => setLang(state.lang === "fa" ? "en" : "fa"));
  $("#searchOpen").addEventListener("click", openPalette);
  $("#paletteBackdrop").addEventListener("mousedown", (e) => { if (e.target === e.currentTarget) closePalette(); });
  $("#paletteInput").addEventListener("input", (e) => fillPalette(e.target.value));
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openPalette(); return; }
    const open = !$("#paletteBackdrop").classList.contains("hidden");
    if (!open) return;
    if (e.key === "Escape") closePalette();
    else if (e.key === "ArrowDown") { e.preventDefault(); movePalette(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); movePalette(-1); }
    else if (e.key === "Enter" && paletteList[paletteSel]) { go(LH.tool(paletteList[paletteSel].id)); closePalette(); }
  });
  window.addEventListener("popstate", render);
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute("href") || "";
    if (href.startsWith("//") || /^https?:|^mailto:|^tel:|^#/.test(href)) return;
    if (href.startsWith("/")) { e.preventDefault(); go(href); }
  });
  render();
});

/* expose for tools.js if needed */
window.DRT = { t: () => t, el, icon, state };
})();
