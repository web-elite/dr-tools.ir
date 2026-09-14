/* دکتر ابزار — tool implementations (all client-side) */
(function () {
"use strict";

/* ================= shared helpers ================= */
function setOut(out, text, cls) { out.textContent = text; out.className = "output" + (cls ? " " + cls : ""); }
function escapeXml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function trunc(s, n) { s = String(s); return s.length > n ? s.slice(0, n) + "…" : s; }
function isObj(v) { return v !== null && typeof v === "object" && !Array.isArray(v); }
function mkEl(tag, txt) { const e = document.createElement(tag); e.textContent = txt; return e; }

/* ================= MD5 (public-domain table algorithm, UTF-8 safe) ================= */
const md5 = (() => {
  function add32(x, y) { const lsw = (x & 0xffff) + (y & 0xffff); const msw = (x >> 16) + (y >> 16) + (lsw >> 16); return ((msw & 0xffff) << 16) | (lsw & 0xffff); }
  function rol(v, c) { return (v << c) | (v >>> (32 - c)); }
  const S = [7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
  const K = [];
  for (let i = 0; i < 64; i++) K.push(Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) & 0xffffffff);
  function words(s) {
    const enc = new TextEncoder().encode(s);
    const bitLen = enc.length * 8;
    const total = (Math.floor((enc.length + 8) / 64) + 1) * 64;
    const padded = new Uint8Array(total);
    padded.set(enc);
    padded[enc.length] = 0x80;
    const dv = new DataView(padded.buffer);
    dv.setUint32(total - 8, bitLen >>> 0, true);
    dv.setUint32(total - 4, Math.floor(bitLen / 4294967296), true);
    const out = [];
    for (let i = 0; i < total / 4; i++) out.push(dv.getUint32(i * 4, true));
    return out;
  }
  return function run(s) {
    const w = words(String(s));
    const blocks = w.length / 16;
    let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
    for (let blk = 0; blk < blocks; blk++) {
      let A = a0, B = b0, C = c0, D = d0;
      const M = w.slice(blk * 16, blk * 16 + 16);
      for (let i = 0; i < 64; i++) {
        let F, g;
        if (i < 16) { F = (B & C) | (~B & D); g = i; }
        else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
        else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
        else { F = C ^ (B | ~D); g = (7 * i) % 16; }
        F = add32(add32(add32(F, A), M[g]), K[i]);
        A = D; D = C; C = B; B = add32(B, rol(F, S[i]));
      }
      a0 = add32(a0, A); b0 = add32(b0, B); c0 = add32(c0, C); d0 = add32(d0, D);
    }
    return [a0, b0, c0, d0].map((n) =>
      [(n & 0xff), ((n >>> 8) & 0xff), ((n >>> 16) & 0xff), ((n >>> 24) & 0xff)]
        .map((b) => b.toString(16).padStart(2, "0")).join("")
    ).join("");
  };
})();

/* ================= Jalaali calendar (jalaali-js algorithm) ================= */
const jal = (() => {
  const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
  function div(a, b) { return ~~(a / b); }
  function mod(a, b) { return a - ~~(a / b) * b; }
  function g2d(gy, gm, gd) {
    let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408;
    d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
    return d;
  }
  function d2g(jdn) {
    const j = 4 * jdn + 139361631;
    const j2 = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
    const i = div(mod(j, 1461), 4) * 5 + 308;
    const gd = div(mod(i, 153), 5) + 1;
    const gm = mod(div(i, 153), 12) + 1;
    const gy = div(j2, 1461) - 100100 + div(8 - gm, 6);
    return { gy, gm, gd };
  }
  function jalCal(jy, withoutLeap) {
    const bl = breaks.length;
    const gy = jy + 621;
    let leapJ = -14, jp = breaks[0], jm, jump, leap, leapG, march, n, i;
    if (jy < jp || jy >= breaks[bl - 1]) throw new Error("Invalid Jalaali year " + jy);
    for (i = 1; i < bl; i += 1) {
      jm = breaks[i]; jump = jm - jp;
      if (jy < jm) break;
      leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
      jp = jm;
    }
    n = jy - jp;
    leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
    if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
    leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
    march = 20 + leapJ - leapG;
    if (!withoutLeap) {
      if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
      leap = mod(mod(n + 1, 33) - 1, 4);
      if (leap === -1) leap = 4;
    }
    return { leap, gy, march };
  }
  function d2j(jdn) {
    const gy = d2g(jdn).gy;
    let jy = gy - 621;
    const r = jalCal(jy, false);
    const jdn1f = g2d(gy, 3, r.march);
    let k = jdn - jdn1f, jm, jd;
    if (k >= 0) {
      if (k <= 185) { jm = div(k, 31) + 1; jd = mod(k, 31) + 1; return { jy, jm, jd }; }
      else k -= 186;
    } else {
      jy -= 1;
      k += 179;
      if (r.leap === 1) k += 1;
    }
    jm = 7 + div(k, 30);
    jd = mod(k, 30) + 1;
    return { jy, jm, jd };
  }
  function toJalaali(gy, gm, gd) { return d2j(g2d(gy, gm, gd)); }
  function toGregorian(jy, jm, jd) { return d2g(j2d(jy, jm, jd)); }
  function j2d(jy, jm, jd) {
    const r = jalCal(jy, false);
    return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
  }
  return { toJalaali, toGregorian };
})();

/* ================= color helpers ================= */
function hexToRgb(hex) {
  let h = String(hex).trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function rgbToHex(r, g, b) {
  const c = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return "#" + c(r) + c(g) + c(b);
}
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}
function hslToRgb(h, s, l) {
  h = (((h % 360) + 360) % 360) / 360; s /= 100; l /= 100;
  if (s === 0) { const v = l * 255; return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hu = (t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [hu(h + 1 / 3) * 255, hu(h) * 255, hu(h - 1 / 3) * 255];
}
function lum(r, g, b) {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrastRatio(c1, c2) {
  const l1 = lum(c1[0], c1[1], c1[2]), l2 = lum(c2[0], c2[1], c2[2]);
  const a = Math.max(l1, l2), b = Math.min(l1, l2);
  return (a + 0.05) / (b + 0.05);
}

/* ================= unit conversion tables ================= */
const UNIT_CATS = {
  length: { units: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.34, yd: 0.9144, ft: 0.3048, in: 0.0254 }, cat: "un.length" },
  weight: { units: { kg: 1, g: 0.001, mg: 1e-6, lb: 0.453592, oz: 0.0283495, t: 1000 }, cat: "un.weight" },
  temp: { special: true, cat: "un.temp" },
  area: { units: { "m²": 1, "km²": 1e6, "cm²": 1e-4, ha: 10000, acre: 4046.86, "ft²": 0.092903 }, cat: "un.area" },
  volume: { units: { l: 1, ml: 0.001, m3: 1000, gal: 3.78541, cup: 0.236588, floz: 0.0295735, pt: 0.473176 }, cat: "un.volume" },
  speed: { units: { "m/s": 1, "km/h": 0.277778, mph: 0.44704, kn: 0.514444, "ft/s": 0.3048 }, cat: "un.speed" },
};
const TEMP_UNITS = ["C", "F", "K"];
function tempToC(v, from) { if (from === "C") return v; if (from === "F") return (v - 32) * 5 / 9; return v - 273.15; }
function tempFromC(v, to) { if (to === "C") return v; if (to === "F") return v * 9 / 5 + 32; return v + 273.15; }

/* ================= Telegram request ================= */
async function tgRequest(token, method, params, asPost) {
  const url = "https://api.telegram.org/bot" + token + "/" + method;
  if (asPost) {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(params || {}) });
    return { status: res.status, data: await res.json().catch(() => null) };
  }
  let qs = "";
  if (params) {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== "" && v != null) sp.set(k, v); });
    qs = "?" + sp.toString();
  }
  const res = await fetch(url + qs);
  return { status: res.status, data: await res.json().catch(() => null) };
}

/* ================================================================
   TOOLS
================================================================ */
const DRT_TOOLS = [];
function define(id, cat, icon, keywords, render) { DRT_TOOLS.push({ id, cat, icon, keywords, render }); }

/* ---------- telegram: tg-webhook (flagship) ---------- */
define("tg-webhook", "telegram", "send", ["telegram", "bot", "webhook", "setwebhook", "ربات", "وب هوک", "وب‌هوک"], function (root, api) {
  const t = api.t;
  root.append(api.note("tg.intro"));
  const tokenI = api.input({ placeholder: t("tg.token.ph"), dir: "ltr" });
  const urlI = api.input({ placeholder: t("tg.webhook.ph"), dir: "ltr" });
  const secretI = api.input({ placeholder: t("tg.secret.ph"), dir: "ltr" });
  const maxI = api.input({ type: "number", min: "1", max: "100", placeholder: "40" });
  const dropC = api.check("tg.drop", false);
  root.append(api.field("tg.token", tokenI));
  root.append(api.field("tg.webhook", urlI));
  root.append(api.el("div", { class: "row" }, [api.field("tg.secret", secretI), api.field("tg.maxconn", maxI)]));
  root.append(dropC.node);

  const urlBox = api.outputBar("tg.urlPreview");
  root.append(urlBox.node);
  const resp = api.outputBar("tg.response");
  root.append(resp.node);

  function preview() {
    const token = tokenI.value.trim(), url = urlI.value.trim();
    let s = "";
    if (token) {
      s = "https://api.telegram.org/bot" + token + "/setWebhook?url=" + encodeURIComponent(url || "{WEBHOOK_URL}");
      const extra = [];
      if (secretI.value.trim()) extra.push("secret_token=" + encodeURIComponent(secretI.value.trim()));
      if (maxI.value) extra.push("max_connections=" + maxI.value.trim());
      if (dropC.input.checked) extra.push("drop_pending_updates=true");
      if (extra.length) s += "&" + extra.join("&");
    }
    setOut(urlBox.out, s || t("c.invalidInput"), s ? "" : "err");
  }
  [tokenI, urlI, secretI, maxI].forEach((el) => el.addEventListener("input", preview));
  dropC.input.addEventListener("change", preview);
  preview();

  async function show(tag) {
    const token = tokenI.value.trim();
    if (!token) { api.toast(t("tg.errToken"), "x"); return; }
    let params = null, post = false;
    if (tag === "setWebhook") {
      const url = urlI.value.trim();
      if (!/^https:\/\/\S+$/i.test(url)) { api.toast(t("tg.errUrl"), "x"); return; }
      params = { url };
      if (secretI.value.trim()) params.secret_token = secretI.value.trim();
      if (maxI.value) params.max_connections = Number(maxI.value);
      if (dropC.input.checked) params.drop_pending_updates = true;
    }
    if (tag === "deleteWebhook") { params = { drop_pending_updates: dropC.input.checked }; post = true; }
    setOut(resp.out, t("c.wait"), "");
    try {
      const r = await tgRequest(token, tag, params, post);
      setOut(resp.out, JSON.stringify(r.data, null, 2).slice(0, 12000), r.data && r.data.ok ? "ok" : "err");
      if (r.data && r.data.ok) api.toast(t("c.success"), "check");
      else api.toast(t("c.error"), "x");
    } catch (e) {
      setOut(resp.out, t("c.error") + ": " + e.message, "err");
      api.toast(t("c.error"), "x");
    }
  }
  root.append(api.el("div", { class: "btn-row" }, [
    api.btn("tg.register", "btn-primary", () => show("setWebhook"), "send"),
    api.btn("tg.info", "btn-ghost", () => show("getWebhookInfo"), "activity"),
    api.btn("tg.delete", "btn-danger", () => show("deleteWebhook"), "x"),
    api.btn("tg.me", "btn-ghost", () => show("getMe"), "bot"),
  ]));
  root.append(api.el("p", { class: "hint", html: t("tg.security") }));
});

/* ---------- telegram: tg-send ---------- */
define("tg-send", "telegram", "bot", ["telegram", "send", "message", "ربات", "ارسال", "پیام"], function (root, api) {
  const t = api.t;
  root.append(api.note("tg.intro"));
  const tokenI = api.input({ placeholder: t("tg.token.ph"), dir: "ltr" });
  const chatI = api.input({ placeholder: t("tg.chatId.ph"), dir: "ltr" });
  const textI = api.textarea({});
  textI.style.minHeight = "140px";
  const parseS = api.select([["", t("tg.parse") + " —"], ["HTML", "HTML"], ["Markdown", "Markdown"]], {});
  root.append(api.field("tg.token", tokenI));
  root.append(api.field("tg.chatId", chatI));
  root.append(api.field("tg.parse", parseS));
  root.append(api.field("tg.text", textI));
  const resp = api.outputBar("tg.response");
  root.append(resp.node);
  root.append(api.btn("tg.send", "btn-primary", async function () {
    const token = tokenI.value.trim(), chat_id = chatI.value.trim(), text = textI.value;
    if (!token || !chat_id || !text) { api.toast(t("c.emptyErr"), "x"); return; }
    setOut(resp.out, t("c.wait"), "");
    try {
      const ps = { chat_id, text };
      if (parseS.value) ps.parse_mode = parseS.value;
      const r = await tgRequest(token, "sendMessage", ps, true);
      setOut(resp.out, JSON.stringify(r.data, null, 2).slice(0, 12000), r.data && r.data.ok ? "ok" : "err");
      if (r.data && r.data.ok) api.toast(t("tg.sent"), "check");
      else api.toast(t("c.error"), "x");
    } catch (e) { setOut(resp.out, t("c.error") + ": " + e.message, "err"); }
  }, "send"));
});

/* ---------- ai: prompt-builder ---------- */
define("prompt-builder", "ai", "sparkles", ["ai", "prompt", "chatgpt", "claude", "پرامپت", "هوش مصنوعی"], function (root, api) {
  const t = api.t;
  root.append(api.note("pb.title.note"));
  const roleI = api.input({ placeholder: t("pb.role.ph") });
  const taskI = api.textarea({ placeholder: t("pb.task.ph") });
  taskI.style.minHeight = "90px";
  const ctxI = api.textarea({ placeholder: t("pb.context.ph") });
  ctxI.style.minHeight = "80px";
  const rulesI = api.input({ placeholder: t("pb.rules.ph") });
  const fmtI = api.input({ placeholder: t("pb.format.ph") });
  root.append(api.field("pb.role", roleI));
  root.append(api.field("pb.task", taskI));
  root.append(api.field("pb.context", ctxI));
  root.append(api.field("pb.rules", rulesI));
  root.append(api.field("pb.format", fmtI));
  const out = api.outputBar("pb.yourPrompt");
  root.append(out.node);
  root.append(api.btn("pb.build", "btn-primary", function () {
    const parts = [];
    if (roleI.value.trim()) parts.push(t("pb.role") + ": " + roleI.value.trim());
    if (taskI.value.trim()) parts.push(t("pb.task") + ": " + taskI.value.trim());
    if (ctxI.value.trim()) parts.push(t("pb.context") + ": " + ctxI.value.trim());
    if (rulesI.value.trim()) parts.push(t("pb.rules") + ": " + rulesI.value.trim());
    if (fmtI.value.trim()) parts.push(t("pb.format") + ": " + fmtI.value.trim());
    if (!parts.length) { api.toast(t("c.emptyErr"), "x"); return; }
    setOut(out.out, parts.join("\n\n"), "ok");
  }, "zap"));
});

/* ---------- ai: token-estimator ---------- */
define("token-estimator", "ai", "activity", ["ai", "token", "word", "count", "توکن", "کلمه", "آمار"], function (root, api) {
  const t = api.t;
  root.append(api.note("te.note"));
  const ta = api.textarea({});
  ta.style.minHeight = "180px";
  const stats = api.el("div", { class: "stat-grid" });
  root.append(api.field("c.input", ta));
  root.append(stats);
  function tick() {
    const s = ta.value || "";
    const words = (s.trim().match(/\S+/g) || []).length;
    const chars = Array.from(s).length;
    const noSpace = Array.from(s.replace(/\s+/g, "")).length;
    const sentences = (s.match(/[.!?؟…]+/g) || []).length || (s.trim() ? 1 : 0);
    const lines = s ? s.split(/\r?\n/).length : 0;
    const tokens = Math.round(chars / 4) || 0;
    const mins = words / 180;
    stats.innerHTML = "";
    const rows = [
      [words, t("te.words")], [chars, t("te.chars")], [noSpace, t("te.noSpace")],
      [sentences, t("te.sentences")], [lines, t("te.lines")], [tokens, t("te.tokens")],
      [mins < 1 ? "<1" : Math.ceil(mins * 10) / 10, t("te.read") + " (" + t("te.min") + ")"],
    ];
    rows.forEach(function (row) {
      stats.append(api.el("div", { class: "stat" }, [mkEl("b", row[0]), mkEl("span", row[1])]));
    });
  }
  ta.addEventListener("input", tick);
  tick();
});

/* ---------- dev: json-formatter ---------- */
define("json-formatter", "dev", "braces", ["json", "format", "minify", "pretty", "فرمت", "جیسون"], function (root, api) {
  const t = api.t;
  root.append(api.note("jf.note"));
  const ta = api.textarea({ dir: "ltr" });
  ta.style.minHeight = "170px";
  const indentS = api.select([["2", "2"], ["4", "4"], ["tab", "Tab"]], {});
  const msg = api.el("p", { class: "hint", text: "" });
  const out = api.outputBar("c.output");
  const info = api.el("div", {});
  root.append(api.field("c.input", ta));
  root.append(api.field("jf.indent", indentS));
  root.append(msg);
  root.append(api.el("div", { class: "btn-row" }, [
    api.btn("c.format", "btn-primary", function () { run("format"); }, "braces"),
    api.btn("c.minify", "btn-ghost", function () { run("minify"); }, "zap"),
    api.btn("c.validate", "btn-ghost", function () { run("validate"); }, "check"),
  ]));
  root.append(out.node);
  root.append(info);
  function run(mode) {
    const raw = ta.value.trim();
    if (!raw) { api.toast(t("c.emptyErr"), "x"); return; }
    info.innerHTML = "";
    let data;
    try { data = JSON.parse(raw); }
    catch (e) {
      msg.textContent = t("jf.invalid") + " " + e.message;
      msg.style.color = "var(--danger)";
      setOut(out.out, e.message, "err");
      return;
    }
    msg.textContent = t("jf.valid");
    msg.style.color = "var(--ok)";
    if (mode === "minify") setOut(out.out, JSON.stringify(data), "ok");
    else setOut(out.out, JSON.stringify(data, null, indentS.value === "tab" ? "\t" : +indentS.value), "ok");
    if (isObj(data)) {
      const p = mkEl("p", t("jf.stats") + ": Object{" + Object.keys(data).length + "}");
      p.className = "hint";
      info.append(p);
      const tb = document.createElement("table");
      tb.className = "tbl";
      tb.innerHTML = "<tr><th>" + escapeXml(t("jf.keys")) + "</th><th>" + escapeXml(t("jf.type")) + "</th><th>" + escapeXml(t("jf.value")) + "</th></tr>";
      Object.entries(data).slice(0, 30).forEach(function (e) {
        const k = e[0], v = e[1];
        const tv = Array.isArray(v) ? "Array[" + v.length + "]" : v === null ? "null" : typeof v;
        const tr = document.createElement("tr");
        tr.innerHTML = '<td class="mono">' + escapeXml(k) + "</td><td>" + escapeXml(tv) + '</td><td class="mono">' + escapeXml(trunc(typeof v === "string" ? v : JSON.stringify(v), 70)) + "</td>";
        tb.append(tr);
      });
      info.append(tb);
    } else if (Array.isArray(data)) {
      const p = mkEl("p", t("jf.stats") + ": Array[" + data.length + "]");
      p.className = "hint";
      info.append(p);
    } else {
      const p = mkEl("p", t("jf.stats") + ": " + typeof data + " — " + String(data));
      p.className = "hint";
      info.append(p);
    }
  }
});

/* ---------- dev: base64 ---------- */
define("base64", "dev", "code", ["base64", "encode", "decode", "انکود", "دکد"], function (root, api) {
  const t = api.t;
  root.append(api.note("b64.note"));
  const ta = api.textarea({ dir: "ltr" });
  ta.style.minHeight = "150px";
  const safeC = api.check("b64.urlSafe", false);
  const out = api.outputBar("b64.encoded");
  root.append(api.field("c.input", ta));
  root.append(safeC.node);
  root.append(api.el("div", { class: "btn-row" }, [
    api.btn("c.encode", "btn-primary", function () {
      if (!ta.value) { api.toast(t("c.emptyErr"), "x"); return; }
      setOut(out.out, b64enc(ta.value, safeC.input.checked), "ok");
    }, "code"),
    api.btn("c.decode", "btn-ghost", function () {
      if (!ta.value) { api.toast(t("c.emptyErr"), "x"); return; }
      try { setOut(out.out, b64dec(ta.value, safeC.input.checked), ""); }
      catch (e) { setOut(out.out, t("c.invalidInput") + ": " + e.message, "err"); api.toast(t("c.invalidInput"), "x"); }
    }, "refresh"),
  ]));
  root.append(out.node);
  function b64enc(str, urlSafe) {
    const bytes = new TextEncoder().encode(str);
    let bin = "";
    bytes.forEach(function (b) { bin += String.fromCharCode(b); });
    let s = btoa(bin);
    if (urlSafe) s = s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    return s;
  }
  function b64dec(str, urlSafe) {
    let s = String(str).trim().replace(/\s+/g, "");
    if (urlSafe) s = s.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    const bin = atob(s);
    const bytes = Uint8Array.from(bin, function (c) { return c.charCodeAt(0); });
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  }
});

/* ---------- dev: url-codec ---------- */
define("url-codec", "dev", "link", ["url", "encode", "query", "parser", "لینک", "کوئری"], function (root, api) {
  const t = api.t;
  root.append(api.note("uc.note"));
  const ta = api.input({ placeholder: t("uc.url"), dir: "ltr" });
  const out = api.outputBar("c.output");
  const paramsBox = api.el("div", {});
  root.append(api.field("uc.url", ta));
  root.append(api.el("div", { class: "btn-row" }, [
    api.btn("c.encode", "btn-primary", function () { setOut(out.out, encodeURIComponent(ta.value), "ok"); }, "code"),
    api.btn("c.decode", "btn-ghost", function () {
      try { setOut(out.out, decodeURIComponent(ta.value), ""); }
      catch (e) { setOut(out.out, t("c.invalidInput") + ": " + e.message, "err"); api.toast(t("c.invalidInput"), "x"); }
    }, "refresh"),
  ]));
  root.append(out.node);
  root.append(paramsBox);
  function renderParams() {
    paramsBox.innerHTML = "";
    const q = ta.value.split("?")[1];
    if (!q) return;
    const sp = new URLSearchParams(q);
    const tb = document.createElement("table");
    tb.className = "tbl";
    tb.innerHTML = "<tr><th>" + escapeXml(t("uc.name")) + "</th><th>" + escapeXml(t("uc.value")) + "</th></tr>";
    for (const [k, v] of sp) {
      const tr = document.createElement("tr");
      tr.innerHTML = '<td class="mono">' + escapeXml(k) + '</td><td class="mono">' + escapeXml(trunc(v, 80)) + "</td>";
      tb.append(tr);
    }
    const p = mkEl("p", t("uc.params") + ": " + Array.from(sp.keys()).length);
    p.className = "hint";
    paramsBox.append(p, tb);
  }
  ta.addEventListener("input", renderParams);
  renderParams();
});

/* ---------- dev: hash ---------- */
define("hash", "dev", "hash", ["md5", "sha1", "sha256", "hash", "هش", "امضا"], function (root, api) {
  const t = api.t;
  root.append(api.note("hs.note"));
  const algS = api.select([["MD5", "MD5"], ["SHA-1", "SHA-1"], ["SHA-256", "SHA-256"], ["SHA-384", "SHA-384"], ["SHA-512", "SHA-512"]], {});
  const ta = api.textarea({ dir: "ltr" });
  ta.style.minHeight = "120px";
  const upperC = api.check("hs.upper", false);
  const out = api.outputBar("hs.digest");
  root.append(api.field("c.input", ta));
  root.append(api.field("hs.digest", algS));
  root.append(upperC.node);
  root.append(out.node);
  async function tick() {
    if (!ta.value) { setOut(out.out, t("c.emptyErr"), "err"); return; }
    const algo = algS.value;
    let digest;
    if (algo === "MD5") digest = md5(ta.value);
    else {
      const buf = await crypto.subtle.digest(algo, new TextEncoder().encode(ta.value));
      digest = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    setOut(out.out, upperC.input.checked ? digest.toUpperCase() : digest, "ok");
  }
  ta.addEventListener("input", tick);
  algS.addEventListener("change", tick);
  upperC.input.addEventListener("change", tick);
  tick();
  root.append(api.el("p", { class: "hint", html: t("hs.md5note") }));
});

/* ---------- dev: uuid ---------- */
define("uuid", "dev", "fingerprint", ["uuid", "guid", "id", "generator", "یوآیدی", "آیدی"], function (root, api) {
  const t = api.t;
  root.append(api.note("uu.note"));
  const cntI = api.input({ type: "number", min: "1", max: "50", value: "1" });
  const upperC = api.check("uu.upper", false);
  const noHyphenC = api.check("uu.noHyphen", false);
  root.append(api.field("uu.count", cntI));
  root.append(upperC.node);
  root.append(noHyphenC.node);
  const out = api.outputBar("c.output");
  root.append(out.node);
  root.append(api.btn("c.generate", "btn-primary", function () {
    const n = Math.max(1, Math.min(50, parseInt(cntI.value, 10) || 1));
    const list = [];
    for (let i = 0; i < n; i++) {
      const b = crypto.getRandomValues(new Uint8Array(16));
      b[6] = (b[6] & 0x0f) | 0x40;
      b[8] = (b[8] & 0x3f) | 0x80;
      const hex = Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");
      let s = noHyphenC.input.checked
        ? hex
        : hex.slice(0, 8) + "-" + hex.slice(8, 12) + "-" + hex.slice(12, 16) + "-" + hex.slice(16, 20) + "-" + hex.slice(20);
      list.push(upperC.input.checked ? s.toUpperCase() : s);
    }
    setOut(out.out, list.join("\n"), "ok");
  }, "zap"));
});

/* ---------- dev: jwt ---------- */
define("jwt", "dev", "key", ["jwt", "token", "decode", "jsonwebtoken", "جی دبلیو تی"], function (root, api) {
  const t = api.t;
  root.append(api.note("jwt.note"));
  const ta = api.textarea({ dir: "ltr" });
  ta.style.minHeight = "90px";
  root.append(api.field("c.input", ta));
  root.append(api.btn("jwt.decodeBtn", "btn-primary", function () {
    const raw = ta.value.trim();
    if (!raw) { api.toast(t("c.emptyErr"), "x"); return; }
    const parts = raw.split(".");
    if (parts.length !== 3) { api.toast(t("c.invalidInput"), "x"); return; }
    try {
      const head = JSON.parse(b64u(parts[0]));
      const pay = JSON.parse(b64u(parts[1]));
      setOut(headBox.out, JSON.stringify(head, null, 2), "ok");
      setOut(payBox.out, JSON.stringify(pay, null, 2), "ok");
      sigBox.out.textContent = parts[2];
      sigBox.out.className = "output";
      expInfo.innerHTML = "";
      if (pay.exp) {
        const d = new Date(pay.exp * 1000);
        const expired = d.getTime() < Date.now();
        const badge = document.createElement("span");
        badge.className = "badge " + (expired ? "err" : "ok");
        badge.textContent = (expired ? t("jwt.expired") + " · " : t("jwt.validUntil") + " ") + d.toLocaleString();
        expInfo.append(badge);
      } else {
        const badge = document.createElement("span");
        badge.className = "badge warn";
        badge.textContent = t("jwt.noexp");
        expInfo.append(badge);
      }
    } catch (e) { api.toast(t("c.invalidInput"), "x"); }
  }, "key"));
  const headBox = api.outputBar("jwt.header");
  const payBox = api.outputBar("jwt.payload");
  const sigBox = api.outputBar("jwt.sig");
  const expInfo = api.el("div", { class: "row" });
  root.append(headBox.node, payBox.node, expInfo, sigBox.node);
  function b64u(s) {
    let b = s.replace(/-/g, "+").replace(/_/g, "/");
    while (b.length % 4) b += "=";
    const bin = atob(b);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  }
});

/* ---------- dev: timestamp ---------- */
define("timestamp", "dev", "clock", ["timestamp", "unix", "epoch", "date", "تاریخ", "تایم استمپ"], function (root, api) {
  const t = api.t;
  root.append(api.note("ts.note"));
  const unixI = api.input({ type: "number", dir: "ltr", placeholder: "1700000000" });
  const dateI = api.input({ type: "datetime-local", dir: "ltr" });
  const out = api.outputBar("c.result");
  root.append(api.field("ts.unix", unixI));
  root.append(api.field("ts.date", dateI));
  root.append(api.btn("ts.now", "btn-ghost", function () { unixI.value = Math.floor(Date.now() / 1000); fromUnix(); }, "clock"));
  root.append(api.el("div", { class: "btn-row" }, [
    api.btn("ts.toUnix", "btn-primary", function () { toUnix(); }, "arrow"),
    api.btn("ts.fromUnix", "btn-ghost", function () { fromUnix(); }, "refresh"),
  ]));
  root.append(out.node);
  function fmtDate(d) {
    const j = jal.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
    const p = (n) => String(n).padStart(2, "0");
    return t("ts.greg") + ": " + d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes())
      + "  ·  " + t("ts.jalali") + ": " + j.jy + "/" + p(j.jm) + "/" + p(j.jd);
  }
  function toUnix() {
    if (!dateI.value) { api.toast(t("c.emptyErr"), "x"); return; }
    const d = new Date(dateI.value);
    if (isNaN(d)) { api.toast(t("c.invalidInput"), "x"); return; }
    const sec = Math.floor(d.getTime() / 1000);
    const line = [t("ts.unix") + ": " + sec, t("ts.local") + ": " + d.toLocaleString(), t("ts.utc") + ": " + d.toUTCString(), fmtDate(d)].join("\n");
    setOut(out.out, line, "ok");
  }
  function fromUnix() {
    const sec = parseInt(unixI.value, 10);
    if (isNaN(sec)) { api.toast(t("c.invalidInput"), "x"); return; }
    const d = new Date(sec * 1000);
    const line = [t("ts.local") + ": " + d.toLocaleString(), t("ts.utc") + ": " + d.toUTCString(), fmtDate(d)].join("\n");
    setOut(out.out, line, "ok");
  }
  unixI.addEventListener("keydown", (e) => { if (e.key === "Enter") fromUnix(); });
  dateI.addEventListener("change", toUnix);
  root.append(api.btn("ts.copy", "btn-ghost", function () { if (out.out.textContent) api.copy(out.out.textContent.split("\n")[0]); }, "copy"));
});

/* ---------- dev: regex ---------- */
define("regex", "dev", "asterisk", ["regex", "regexp", "pattern", "match", "ریجکس", "الگو"], function (root, api) {
  const t = api.t;
  root.append(api.note("re.note"));
  const patI = api.input({ placeholder: t("re.pattern"), dir: "ltr" });
  const flagI = api.input({ placeholder: t("re.flags") + " (gim)", dir: "ltr" });
  const textI = api.textarea({ placeholder: t("re.testText") });
  textI.style.minHeight = "110px";
  const replI = api.input({ placeholder: t("re.replaceWith"), dir: "ltr" });
  const out = api.outputBar("c.result");
  root.append(api.field("re.pattern", patI));
  root.append(api.field("re.flags", flagI));
  root.append(api.field("re.testText", textI));
  root.append(api.field("re.replaceWith", replI));
  root.append(api.el("div", { class: "btn-row" }, [
    api.btn("c.test", "btn-primary", function () { testRe(); }, "search"),
    api.btn("c.replace", "btn-ghost", function () { replaceRe(); }, "swap"),
  ]));
  root.append(out.node);
  function makeRe() {
    let flags = flagI.value.trim();
    if (!flags.includes("g")) flags = "g" + flags;
    return new RegExp(patI.value, flags);
  }
  function testRe() {
    if (!patI.value) { api.toast(t("c.emptyErr"), "x"); return; }
    try {
      const re = makeRe();
      const matches = textI.value.match(re) || [];
      setOut(out.out, t("re.matches") + ": " + matches.length + (matches.length ? "\n" + matches.slice(0, 50).join("\n") : "\n" + t("re.noMatch")), matches.length ? "ok" : "err");
    } catch (e) { setOut(out.out, t("re.badRegex") + ": " + e.message, "err"); }
  }
  function replaceRe() {
    if (!patI.value) { api.toast(t("c.emptyErr"), "x"); return; }
    try {
      const re = makeRe();
      setOut(out.out, textI.value.replace(re, replI.value || ""), "ok");
    } catch (e) { setOut(out.out, t("re.badRegex") + ": " + e.message, "err"); }
  }
  patI.addEventListener("keydown", (e) => { if (e.key === "Enter") testRe(); });
});

/* ---------- dev: password ---------- */
define("password", "dev", "lock", ["password", "random", "strong", "رمز", "گذرواژه"], function (root, api) {
  const t = api.t;
  root.append(api.note("pw.note"));
  const lenI = api.input({ type: "range", min: "4", max: "64", value: "16" });
  const lenVal = api.el("b", { class: "mono", text: "16" });
  const lenRow = api.el("div", { class: "row" }, [lenI, lenVal]);
  const sets = ["upper", "lower", "digits", "symbols"].map(function (k) {
    const c = api.check("pw." + k, ["upper", "digits", "symbols"].includes(k));
    return c;
  });
  const exclI = api.input({ placeholder: t("pw.excludePh") });
  const out = api.outputBar("c.output");
  const meter = api.el("div", { class: "meter" });
  const strengthL = api.el("span", { class: "hint", text: "" });
  root.append(api.field("pw.length", lenRow));
  sets.forEach(function (c) { root.append(c.node); });
  root.append(api.field("pw.exclude", exclI));
  root.append(meter);
  root.append(strengthL);
  root.append(out.node);
  root.append(api.btn("c.generate", "btn-primary", function () {
    const len = +lenI.value;
    const pools = { upper: "ABCDEFGHJKLMNPQRSTUVWXYZ", lower: "abcdefghijkmnpqrstuvwxyz", digits: "23456789", symbols: "!@#$%^&*()-_=+[]{};:,.?" };
    const wanted = sets.filter((c) => c.input.checked).map((c, i) => ["upper", "lower", "digits", "symbols"][i]);
    const active = sets.map((c, i) => (c.input.checked ? ["upper", "lower", "digits", "symbols"][i] : null)).filter(Boolean);
    if (!active.length) { api.toast(t("c.emptyErr"), "x"); return; }
    const exclude = new Set(exclI.value);
    const avail = {};
    active.forEach(function (k) { avail[k] = Array.from(pools[k]).filter((ch) => !exclude.has(ch)).join(""); });
    const all = active.map((k) => avail[k]).join("");
    if (!all) { api.toast(t("c.emptyErr"), "x"); return; }
    const rnd = new Uint32Array(len);
    crypto.getRandomValues(rnd);
    const chars = [];
    active.forEach(function (k, i) { if (avail[k]) chars.push(avail[k][rnd[i] % avail[k].length]); });
    for (let i = active.length; i < len; i++) chars.push(all[rnd[i] % all.length]);
    for (let i = chars.length - 1; i > 0; i--) { const j = rnd[i % rnd.length] % (i + 1); [chars[i], chars[j]] = [chars[j], chars[i]]; }
    const pw = chars.slice(0, len).join("");
    setOut(out.out, pw, "ok");
    const entropy = pw.length * Math.log2(all.length);
    const lbl = entropy >= 80 ? t("pw.veryStrong") : entropy >= 60 ? t("pw.strong") : entropy >= 40 ? t("pw.medium") : t("pw.weak");
    strengthL.textContent = t("pw.strength") + ": " + lbl + "  (" + Math.round(entropy) + " bit)";
    meter.style.setProperty("--v", Math.min(100, Math.round(entropy)) + "%");
    meter.style.background = entropy >= 60 ? "var(--ok)" : entropy >= 40 ? "var(--accent)" : "var(--danger)";
  }, "zap"));
  lenI.addEventListener("input", function () { lenVal.textContent = lenI.value; });
});

/* ---------- text: lorem ---------- */
define("lorem", "text", "filetext", ["lorem", "ipsum", "placeholder", "text", "متن آزمایشی"], function (root, api) {
  const t = api.t;
  root.append(api.note("lo.note"));
  const cntI = api.input({ type: "number", min: "1", max: "50", value: "3" });
  const unitS = api.select([["para", t("lo.para")], ["words", t("lo.words")], ["sents", t("lo.sents")]], {});
  const langS = api.select([["fa", t("lo.fa")], ["en", t("lo.en")]], {});
  root.append(api.field("lo.count", cntI));
  root.append(api.el("div", { class: "row" }, [api.field("lo.unit", unitS), api.field("lo.lang", langS)]));
  const out = api.outputBar("c.output");
  root.append(out.node);
  root.append(api.btn("c.generate", "btn-primary", function () { gen(); }, "zap"));
  const FA_WORDS = ["لورم", "ایپسوم", "متن", "ساختگی", "با", "تولید", "سادگی", "نامفهوم", "از", "صنعت", "چاپ", "و", "با", "استفاده", "از", "طراحان", "گرافیک", "است", "چاپگرها", "و", "متون", "بلکه", "روزنامه", "و", "مجله", "در", "ستون", "و", "سطر", "آنچنان", "که", "لازم", "است"];
  const EN_WORDS = ["lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore", "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud", "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex", "ea", "commodo", "consequat"];
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function sentence(words) {
    const n = 6 + Math.floor(Math.random() * 6);
    const w = [];
    for (let i = 0; i < n; i++) w.push(pick(words));
    return w.join(" ") + ".";
  }
  function gen() {
    const n = Math.max(1, Math.min(50, parseInt(cntI.value, 10) || 1));
    const words = langS.value === "fa" ? FA_WORDS : EN_WORDS;
    const unit = unitS.value;
    let outS = "";
    if (unit === "para") {
      for (let i = 0; i < n; i++) {
        const sents = 4 + Math.floor(Math.random() * 3);
        const arr = [];
        for (let j = 0; j < sents; j++) arr.push(sentence(words));
        outS += arr.join(" ") + "\n\n";
      }
    } else if (unit === "sents") {
      const arr = [];
      for (let i = 0; i < n; i++) arr.push(sentence(words));
      outS = arr.join(" ");
    } else {
      const arr = [];
      for (let i = 0; i < n; i++) arr.push(pick(words));
      outS = arr.join(" ");
    }
    setOut(out.out, outS.trim(), "ok");
  }
});

/* ---------- design: color ---------- */
define("color", "design", "droplet", ["color", "hex", "rgb", "hsl", "رنگ"], function (root, api) {
  const t = api.t;
  root.append(api.note("cl.note"));
  const pick = api.input({ type: "color", value: "#0E7C66" });
  const hexI = api.input({ placeholder: "#0E7C66", dir: "ltr" });
  const rgbI = api.input({ placeholder: "14, 124, 102", dir: "ltr" });
  const hslI = api.input({ placeholder: "172°, 80%, 27%", dir: "ltr" });
  const sw = api.el("div", { class: "swatch" });
  root.append(api.el("div", { class: "row" }, [sw, api.field("cl.pick", pick)]));
  root.append(api.field("cl.hex", hexI));
  root.append(api.field("cl.rgb", rgbI));
  root.append(api.field("cl.hsl", hslI));
  function fromHex() {
    const rgb = hexToRgb(hexI.value);
    if (!rgb) return;
    const [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
    pick.value = rgbToHex(rgb[0], rgb[1], rgb[2]);
    rgbI.value = rgb.join(", ");
    hslI.value = h + "°, " + s + "%, " + l + "%";
    sw.style.background = rgbToHex(rgb[0], rgb[1], rgb[2]);
  }
  function fromRgb() {
    const parts = rgbI.value.split(",").map((x) => parseInt(x.trim(), 10));
    if (parts.length !== 3 || parts.some((n) => isNaN(n))) return;
    const hex = rgbToHex(parts[0], parts[1], parts[2]);
    const [h, s, l] = rgbToHsl(parts[0], parts[1], parts[2]);
    pick.value = hex;
    hexI.value = hex;
    hslI.value = h + "°, " + s + "%, " + l + "%";
    sw.style.background = hex;
  }
  function fromHsl() {
    const m = hslI.value.match(/(-?\d+)\s*[,°]\s*(-?\d+)\s*%\s*[,°]\s*(-?\d+)\s*%/);
    if (!m) return;
    const [r, g, b] = hslToRgb(+m[1], +m[2], +m[3]);
    const hex = rgbToHex(r, g, b);
    pick.value = hex;
    hexI.value = hex;
    rgbI.value = Math.round(r) + ", " + Math.round(g) + ", " + Math.round(b);
    sw.style.background = hex;
  }
  pick.addEventListener("input", function () { hexI.value = pick.value; fromHex(); });
  hexI.addEventListener("input", fromHex);
  rgbI.addEventListener("input", fromRgb);
  hslI.addEventListener("input", fromHsl);
  fromHex();
  root.append(api.el("div", { class: "btn-row" }, [
    api.btn("c.copy", "btn-ghost", function () { api.copy(hexI.value); }, "copy"),
  ]));
});

/* ---------- design: contrast ---------- */
define("contrast", "design", "contrast", ["contrast", "wcag", "a11y", "accessibility", "کنتراست"], function (root, api) {
  const t = api.t;
  root.append(api.note("ct.note"));
  const fgI = api.input({ type: "color", value: "#111111" });
  const bgI = api.input({ type: "color", value: "#F4F2EA" });
  root.append(api.el("div", { class: "row" }, [api.field("ct.fg", fgI), api.field("ct.bg", bgI)]));
  const ratioP = api.el("p", { class: "hint", text: "" });
  const badges = api.el("div", { class: "row" });
  const sample = api.el("div", { class: "output", text: t("ct.sample") });
  sample.style.textAlign = "center";
  sample.style.fontWeight = "700";
  root.append(ratioP);
  root.append(badges);
  root.append(sample);
  function tick() {
    const f = hexToRgb(fgI.value), b = hexToRgb(bgI.value);
    const ratio = contrastRatio(f, b);
    ratioP.textContent = t("ct.ratio") + ": " + ratio.toFixed(2) + " : 1";
    sample.style.color = fgI.value;
    sample.style.background = bgI.value;
    badges.innerHTML = "";
    const checks = [
      [ct("ct.aa"), ratio >= 4.5], [ct("ct.aaLarge"), ratio >= 3],
      [ct("ct.aaa"), ratio >= 7], [ct("ct.aaaLarge"), ratio >= 4.5],
    ];
    checks.forEach(function (c) {
      const s = document.createElement("span");
      s.className = "badge " + (c[1] ? "ok" : "err");
      s.textContent = c[0] + ": " + (c[1] ? t("ct.pass") : t("ct.fail"));
      badges.append(s);
    });
  }
  function ct(k) { return t(k); }
  fgI.addEventListener("input", tick);
  bgI.addEventListener("input", tick);
  tick();
});

/* ---------- design: gradient ---------- */
define("gradient", "design", "blend", ["gradient", "css", "background", "گرادیان"], function (root, api) {
  const t = api.t;
  root.append(api.note("gr.note"));
  const typeS = api.select([["linear", t("gr.linear")], ["radial", t("gr.radial")]], {});
  const angleI = api.input({ type: "number", value: "135", min: "0", max: "360" });
  const c1I = api.input({ type: "color", value: "#0E7C66" });
  const c2I = api.input({ type: "color", value: "#D97706" });
  const c3I = api.input({ type: "color", value: "#111111" });
  const c3on = api.check("gr.c3", false);
  const preview = api.el("div", { class: "output", text: " " });
  preview.style.minHeight = "110px";
  preview.style.borderRadius = "10px";
  const out = api.outputBar("gr.css");
  root.append(api.field("gr.type", typeS));
  root.append(api.field("gr.angle", angleI));
  root.append(api.el("div", { class: "row" }, [api.field("gr.c1", c1I), api.field("gr.c2", c2I), c3on.node]));
  root.append(c3I);
  root.append(preview);
  root.append(out.node);
  root.append(api.btn("gr.random", "btn-ghost", function () {
    c1I.value = "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
    c2I.value = "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
    tick();
  }, "refresh"));
  function css() {
    const stops = [c1I.value, c2I.value];
    if (c3on.input.checked) stops.push(c3I.value);
    if (typeS.value === "linear") return "linear-gradient(" + angleI.value + "deg, " + stops.join(", ") + ")";
    return "radial-gradient(circle, " + stops.join(", ") + ")";
  }
  function tick() {
    const v = css();
    preview.style.background = v;
    setOut(out.out, v, "ok");
  }
  [typeS, angleI, c1I, c2I, c3I].forEach(function (el) { el.addEventListener("input", tick); });
  c3on.input.addEventListener("change", function () { c3I.style.display = c3on.input.checked ? "" : "none"; tick(); });
  c3I.style.display = "none";
  tick();
});

/* ---------- design: qr ---------- */
define("qr", "design", "qr", ["qr", "qrcode", "code", "کیو آر"], function (root, api) {
  const t = api.t;
  root.append(api.note("qr.note"));
  const textI = api.textarea({ placeholder: t("qr.text"), dir: "ltr" });
  textI.style.minHeight = "80px";
  const sizeS = api.select([["200", "200px"], ["300", "300px"], ["400", "400px"]], {});
  const fgI = api.input({ type: "color", value: "#0C1210" });
  const bgI = api.input({ type: "color", value: "#FFFFFF" });
  const qrWrap = api.el("div", { class: "output", style: "display:flex;align-items:center;justify-content:center;min-height:210px;padding:14px;background:#fff;border-radius:10px" });
  const emptyP = api.el("p", { class: "hint", text: t("qr.empty") });
  root.append(api.field("qr.text", textI));
  root.append(api.field("qr.size", sizeS));
  root.append(api.el("div", { class: "row" }, [api.field("qr.fg", fgI), api.field("qr.bg", bgI)]));
  root.append(qrWrap);
  root.append(emptyP);
  root.append(api.btn("qr.downloadPng", "btn-ghost", function () {
    const c = qrWrap.querySelector("canvas");
    if (!c) { api.toast(t("qr.empty"), "x"); return; }
    try {
      const b64 = c.toDataURL("image/png").split(",")[1];
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      api.download("qr.png", bytes, "image/png");
    } catch (e) { api.toast(t("c.error") + ": " + e.message, "x"); }
  }, "download"));
  let timer = null;
  function tick() {
    const txt = textI.value.trim();
    clearTimeout(timer);
    timer = setTimeout(function () {
      qrWrap.innerHTML = "";
      emptyP.textContent = "";
      if (!txt) { emptyP.textContent = t("qr.empty"); return; }
      try {
        const size = parseInt(sizeS.value, 10);
        new QRCode(qrWrap, { text: txt, width: size, height: size, colorDark: fgI.value, colorLight: bgI.value, correctLevel: QRCode.CorrectLevel.H });
      } catch (e) {
        emptyP.textContent = t("c.error") + ": " + e.message;
      }
    }, 250);
  }
  textI.addEventListener("input", tick);
  sizeS.addEventListener("change", tick);
  fgI.addEventListener("input", tick);
  bgI.addEventListener("input", tick);
  tick();
});

/* ---------- text: word-counter ---------- */
define("word-counter", "text", "type", ["word", "count", "counter", "character", "شمارش", "کاراکتر"], function (root, api) {
  const t = api.t;
  root.append(api.note("wc.note"));
  const ta = api.textarea({});
  ta.style.minHeight = "180px";
  const title = api.el("h3", { class: "hint", text: t("wc.title") });
  const stats = api.el("div", { class: "stat-grid" });
  root.append(api.field("c.input", ta));
  root.append(title);
  root.append(stats);
  function tick() {
    const s = ta.value || "";
    const words = (s.trim().match(/\S+/g) || []).length;
    const chars = Array.from(s).length;
    const noSpace = Array.from(s.replace(/\s+/g, "")).length;
    const sentences = (s.match(/[.!?؟…]+/g) || []).length || (s.trim() ? 1 : 0);
    const lines = s ? s.split(/\r?\n/).length : 0;
    const minutes = (words / 200) * 60;
    const readSec = Math.round(minutes);
    const readTxt = readSec < 60 ? readSec + " s" : Math.floor(readSec / 60) + ":" + String(readSec % 60).padStart(2, "0") + " min";
    stats.innerHTML = "";
    const rows = [
      [words, t("te.words")], [chars, t("te.chars")], [noSpace, t("te.noSpace")],
      [sentences, t("te.sentences")], [lines, t("te.lines")], [readTxt, t("te.read")],
    ];
    rows.forEach(function (r) {
      stats.append(api.el("div", { class: "stat" }, [mkEl("b", r[0]), mkEl("span", r[1])]));
    });
  }
  ta.addEventListener("input", tick);
  tick();
});

/* ---------- text: case-converter ---------- */
define("case-converter", "text", "caseconv", ["case", "upper", "lower", "title", "camel", "snake", "kebab", "تبدیل", "حروف"], function (root, api) {
  const t = api.t;
  root.append(api.note("cc.note"));
  const ta = api.textarea({});
  ta.style.minHeight = "140px";
  const out = api.outputBar("c.output");
  root.append(api.field("c.input", ta));
  root.append(out.node);
  function conv(kind) {
    const s = ta.value || "";
    let r = s;
    if (kind === "upper") r = s.toUpperCase();
    else if (kind === "lower") r = s.toLowerCase();
    else if (kind === "title") r = s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase());
    else if (kind === "sentence") r = s.replace(/(^\s*\w|[.!?]\s+\w)/g, (w) => w.toUpperCase());
    else if (kind === "camel") r = s.replace(/[^a-zA-Z0-9]+(.)/g, (m, c) => c.toUpperCase());
    else if (kind === "snake") r = s.replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/[^a-zA-Z0-9]+/g, "_").toLowerCase();
    else if (kind === "kebab") r = s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();
    else if (kind === "constant") r = s.replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/[^a-zA-Z0-9]+/g, "_").toUpperCase();
    setOut(out.out, r, "ok");
  }
  root.append(api.el("div", { class: "btn-row" }, [
    api.btn("cc.upper", "btn-ghost", () => conv("upper")),
    api.btn("cc.lower", "btn-ghost", () => conv("lower")),
    api.btn("cc.title", "btn-ghost", () => conv("title")),
    api.btn("cc.sentence", "btn-ghost", () => conv("sentence")),
    api.btn("cc.camel", "btn-ghost", () => conv("camel")),
    api.btn("cc.snake", "btn-ghost", () => conv("snake")),
    api.btn("cc.kebab", "btn-ghost", () => conv("kebab")),
    api.btn("cc.constant", "btn-ghost", () => conv("constant"), "caseconv"),
  ]));
});

/* ---------- convert: unit ---------- */
define("unit", "convert", "swap", ["unit", "convert", "length", "weight", "temperature", "واحد", "تبدیل"], function (root, api) {
  const t = api.t;
  root.append(api.note("un.note"));
  const catS = api.select([
    ["length", t("un.length")], ["weight", t("un.weight")], ["temp", t("un.temp")],
    ["area", t("un.area")], ["volume", t("un.volume")], ["speed", t("un.speed")],
  ], {});
  const fromS = api.select([], {});
  const toS = api.select([], {});
  const valI = api.input({ type: "number", value: "1", dir: "ltr" });
  const out = api.outputBar("c.result");
  root.append(api.field("un.category", catS));
  root.append(api.el("div", { class: "row" }, [api.field("un.from", fromS), api.field("un.to", toS)]));
  root.append(api.field("un.value", valI));
  root.append(out.node);
  function fillUnits() {
    const cat = catS.value;
    fromS.innerHTML = "";
    toS.innerHTML = "";
    const catDef = UNIT_CATS[cat];
    if (catDef.special) {
      TEMP_UNITS.forEach(function (u) {
        const o1 = document.createElement("option"); o1.value = u; o1.textContent = u + "°"; fromS.append(o1);
        const o2 = document.createElement("option"); o2.value = u; o2.textContent = u + "°"; toS.append(o2);
      });
      toS.value = "F";
    } else {
      Object.entries(catDef.units).forEach(function (e) {
        const o1 = document.createElement("option"); o1.value = e[0]; o1.textContent = e[0]; fromS.append(o1);
        const o2 = document.createElement("option"); o2.value = e[0]; o2.textContent = e[0]; toS.append(o2);
      });
      if (cat === "length") toS.value = "km";
      else if (cat === "weight") toS.value = "g";
      else if (cat === "area") toS.value = "cm²";
      else if (cat === "volume") toS.value = "gal";
      else if (cat === "speed") toS.value = "km/h";
    }
    convert();
  }
  function convert() {
    const v = parseFloat(valI.value);
    if (isNaN(v)) { setOut(out.out, "", ""); return; }
    const catDef = UNIT_CATS[catS.value];
    let r;
    if (catDef.special) {
      r = tempFromC(tempToC(v, fromS.value), toS.value);
    } else {
      r = (v * catDef.units[fromS.value]) / catDef.units[toS.value];
    }
    setOut(out.out, String(parseFloat(r.toPrecision(10))), "ok");
  }
  catS.addEventListener("change", fillUnits);
  fromS.addEventListener("change", convert);
  toS.addEventListener("change", convert);
  valI.addEventListener("input", convert);
  fillUnits();
});

/* ---------- convert: base-converter ---------- */
define("base-converter", "convert", "digits", ["base", "binary", "hex", "octal", "decimal", "مبنا", "عدد"], function (root, api) {
  const t = api.t;
  root.append(api.note("nb.note"));
  const valI = api.input({ placeholder: "255", dir: "ltr" });
  const fromS = api.select([["10", "10"], ["2", "2"], ["8", "8"], ["16", "16"]], {});
  const toS = api.select([["2", t("nb.bin")], ["8", t("nb.oct")], ["10", t("nb.dec")], ["16", t("nb.hex")]], {});
  const out = api.outputBar("c.result");
  root.append(api.field("nb.input", valI));
  root.append(api.el("div", { class: "row" }, [api.field("nb.base", fromS), api.field("nb.base", toS)]));
  root.append(out.node);
  function convert() {
    const raw = valI.value.trim();
    if (!raw) { setOut(out.out, "", ""); return; }
    const from = parseInt(fromS.value, 10);
    const re = from === 16 ? /^[0-9a-fA-F]+$/ : from === 2 ? /^[01]+$/ : from === 8 ? /^[0-7]+$/ : /^[0-9]+$/;
    if (!re.test(raw)) { setOut(out.out, t("nb.badDigit"), "err"); return; }
    const dec = parseInt(raw, from);
    if (isNaN(dec)) { setOut(out.out, t("c.invalidInput"), "err"); return; }
    const to = parseInt(toS.value, 10);
    setOut(out.out, dec.toString(to).toUpperCase(), "ok");
  }
  valI.addEventListener("input", convert);
  fromS.addEventListener("change", convert);
  toS.addEventListener("change", convert);
  convert();
});

/* ---------- convert: csv-json ---------- */
define("csv-json", "convert", "table", ["csv", "json", "convert", "سریال", "جیسون"], function (root, api) {
  const t = api.t;
  root.append(api.note("cj.note"));
  const csvTA = api.textarea({ dir: "ltr", placeholder: "name,age\nAli,30\nSara,25" });
  csvTA.style.minHeight = "120px";
  const delimS = api.select([["comma", t("cj.delim") + " (,)"], ["semicolon", t("cj.delim") + " (;)"], ["tab", t("cj.delim") + " (Tab)"]], {});
  const headC = api.check("cj.headers", true);
  const jsonTA = api.textarea({ dir: "ltr", placeholder: '[\n  { "name": "Ali", "age": 30 }\n]' });
  jsonTA.style.minHeight = "120px";
  root.append(api.field("cj.csv", csvTA));
  root.append(api.el("div", { class: "row" }, [api.field("cj.delim", delimS), headC.node]));
  root.append(api.btn("cj.toCsv", "btn-primary", function () { toCsv(); }, "arrow"));
  const out = api.outputBar("cj.json");
  root.append(out.node);
  root.append(api.field("cj.jsonInput", jsonTA));
  function parseCsv(text, delim) {
    const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
    return lines.map((l) => l.split(delim).map((c) => c.trim()));
  }
  function toCsv() {
    const raw = csvTA.value;
    if (!raw.trim()) { api.toast(t("c.emptyErr"), "x"); return; }
    const delim = delimS.value === "tab" ? "\t" : delimS.value === "semicolon" ? ";" : ",";
    const rows = parseCsv(raw, delim);
    if (!rows.length) { api.toast(t("c.emptyErr"), "x"); return; }
    const hasHeader = headC.input.checked;
    const headers = hasHeader ? rows[0] : rows[0].map((_, i) => "col" + (i + 1));
    const dataRows = hasHeader ? rows.slice(1) : rows;
    const arr = dataRows.map(function (r) {
      const o = {};
      r.forEach(function (v, i) { o[headers[i] || "col" + (i + 1)] = v; });
      return o;
    });
    setOut(out.out, JSON.stringify(arr, null, 2), "ok");
  }
  function fromJsonToCsv() {
    const raw = jsonTA.value.trim();
    if (!raw) { api.toast(t("c.emptyErr"), "x"); return; }
    let data;
    try { data = JSON.parse(raw); }
    catch (e) { api.toast(t("c.invalidInput"), "x"); return; }
    if (!Array.isArray(data) || data.length === 0 || !isObj(data[0])) { api.toast(t("c.invalidInput"), "x"); return; }
    const headers = Object.keys(data[0]);
    const lines = [headers.join(",")];
    data.forEach(function (row) {
      const cells = headers.map((h) => {
        const v = row[h];
        const s = v === null || v === undefined ? "" : String(v);
        return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      });
      lines.push(cells.join(","));
    });
    setOut(out.out, lines.join("\n"), "ok");
  }
  root.append(api.btn("cj.toCsv", "btn-ghost", fromJsonToCsv, "table"));
});

/* ============================================================================
   NEW TOOLS — developer / security / network / calculator / design / text
============================================================================ */

/* ---------- json: validator ---------- */
define("json-validator", "json", "braces", ["json", "validate", "check", "اعتبار سنجی", "جیسون"], function (root, api) {
  const t = api.t;
  root.append(api.note("jv.note"));
  const ta = api.textarea({ dir: "ltr", placeholder: '{ "name": "Ali", "age": 30 }' });
  ta.style.minHeight = "160px";
  const out = api.outputBar("c.result");
  const stats = api.el("div", { class: "stat-grid" });
  root.append(api.field("c.input", ta));
  root.append(api.btn("jv.btn", "btn-primary", validate, "check"));
  root.append(stats);
  root.append(out.node);
  function validate() {
    const raw = ta.value.trim();
    if (!raw) { api.toast(t("c.emptyErr"), "x"); return; }
    try {
      const v = JSON.parse(raw);
      stats.innerHTML = "";
      const type = Array.isArray(v) ? t("jv.array") : v === null ? "null" : typeof v;
      const rows = [[t("jv.valid"), "ok"], [t("jv.type"), type],
        [t("jv.keys"), Object.keys(v).length], [t("jv.bytes"), new TextEncoder().encode(raw).length]];
      rows.forEach((r) => stats.append(api.el("div", { class: "stat" }, [mkEl("b", r[1]), mkEl("span", r[0])])));
      setOut(out.out, t("jv.ok"), "ok");
    } catch (e) {
      stats.innerHTML = "";
      setOut(out.out, t("jv.err") + "\n" + e.message, "err");
    }
  }
});

/* ---------- json: minifier ---------- */
define("json-minifier", "json", "zap", ["json", "minify", "compact", "small", "فشرده", "جیسون"], function (root, api) {
  const t = api.t;
  root.append(api.note("jm.note"));
  const ta = api.textarea({ dir: "ltr", placeholder: '{ "a": 1, "b": [1, 2, 3] }' });
  ta.style.minHeight = "150px";
  const out = api.outputBar("c.output");
  const statsC = api.el("div", { class: "stat-grid" });
  root.append(api.field("c.input", ta));
  root.append(api.btn("jm.btn", "btn-primary", minify, "zap"));
  root.append(statsC);
  root.append(out.node);
  function minify() {
    const raw = ta.value.trim();
    if (!raw) { api.toast(t("c.emptyErr"), "x"); return; }
    try {
      const v = JSON.parse(raw);
      const min = JSON.stringify(v);
      setOut(out.out, min, "ok");
      statsC.innerHTML = "";
      const before = raw.length, after = min.length, save = Math.round((1 - after / before) * 100);
      [[t("jm.before"), before + " B"], [t("jm.after"), after + " B"], [t("jm.save"), save + "%"]]
        .forEach((r) => statsC.append(api.el("div", { class: "stat" }, [mkEl("b", r[1]), mkEl("span", r[0])])));
    } catch (e) { api.toast(t("jv.err") + " " + e.message, "x"); }
  }
});

/* ---------- json: to CSV ---------- */
define("json-to-csv", "json", "table", ["json", "csv", "convert", "تبدیل"], function (root, api) {
  const t = api.t;
  root.append(api.note("jc.note"));
  const ta = api.textarea({ dir: "ltr", placeholder: '[ { "name": "Ali", "age": 30 } ]' });
  ta.style.minHeight = "140px";
  const headC = api.check("cj.headers", true);
  const out = api.outputBar("c.output");
  root.append(api.field("c.input", ta));
  root.append(headC.node);
  root.append(api.btn("jc.btn", "btn-primary", toCsv, "table"));
  root.append(out.node);
  function toCsv() {
    const raw = ta.value.trim();
    if (!raw) { api.toast(t("c.emptyErr"), "x"); return; }
    let data;
    try { data = JSON.parse(raw); } catch (e) { api.toast(t("c.invalidInput"), "x"); return; }
    if (!Array.isArray(data) || !data.length || !isObj(data[0])) { api.toast(t("c.invalidInput"), "x"); return; }
    const headers = Object.keys(data[0]);
    const lines = [];
    if (headC.input.checked) lines.push(headers.map((h) => h.replace(/"/g, '""')).join(","));
    data.forEach((row) => {
      lines.push(headers.map((h) => {
        const s = row[h] === null || row[h] === undefined ? "" : String(row[h]);
        return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(","));
    });
    const csv = lines.join("\n");
    setOut(out.out, csv, "ok");
    root.append(api.btn("jc.dl", "btn-ghost", () => api.download("data.csv", csv, "text/csv;charset=utf-8"), "download"));
  }
});

/* ---------- json: to YAML ---------- */
define("json-to-yaml", "json", "code", ["json", "yaml", "convert", "yml", "تبدیل"], function (root, api) {
  const t = api.t;
  root.append(api.note("jy.note"));
  const ta = api.textarea({ dir: "ltr", placeholder: '{ "name": "Ali", "tags": ["a", "b"], "nested": { "x": 1 } }' });
  ta.style.minHeight = "140px";
  const out = api.outputBar("c.output");
  root.append(api.field("c.input", ta));
  root.append(api.btn("jy.btn", "btn-primary", toYaml, "code"));
  root.append(out.node);
  function toYaml() {
    const raw = ta.value.trim();
    if (!raw) { api.toast(t("c.emptyErr"), "x"); return; }
    let v;
    try { v = JSON.parse(raw); } catch (e) { api.toast(t("c.invalidInput"), "x"); return; }
    setOut(out.out, stringify(v, 0), "ok");
  }
  function stringify(v, indent) {
    const pad = "  ".repeat(indent);
    const isArr = Array.isArray(v);
    if (v === null) return "null";
    if (typeof v !== "object") return scalar(v);
    const keys = Object.keys(v);
    if (!keys.length) return isArr ? "[]" : "{}";
    return keys.map((k) => {
      const val = v[k];
      if (val !== null && typeof val === "object") {
        const sub = stringify(val, indent + 1).split("\n").map((l) => "  " + l).join("\n");
        return (isArr ? pad + "-" : pad + k + ":") + "\n" + sub;
      }
      return (isArr ? pad + "- " : pad + k + ": ") + scalar(val);
    }).join("\n");
  }
  function scalar(v) {
    if (typeof v === "string") {
      if (/^[\s:.#\[\]{},&*!|>'"%@`]|[:#]\s|\s$/.test(v) || v === "") return JSON.stringify(v);
      return v;
    }
    return String(v);
  }
});

/* ---------- xml: formatter ---------- */
define("xml-formatter", "xml", "code", ["xml", "format", "pretty", "beautify", "فرمت"], function (root, api) {
  const t = api.t;
  root.append(api.note("xf.note"));
  const ta = api.textarea({ dir: "ltr", placeholder: "<root><item id='1'>Hi</item></root>" });
  ta.style.minHeight = "150px";
  const out = api.outputBar("c.output");
  root.append(api.field("c.input", ta));
  root.append(api.btn("xf.btn", "btn-primary", format, "code"));
  root.append(out.node);
  function format() {
    const raw = ta.value.trim();
    if (!raw) { api.toast(t("c.emptyErr"), "x"); return; }
    const trimmed = raw.replace(/>\s+</g, "><");
    try {
      const doc = new DOMParser().parseFromString(trimmed, "application/xml");
      if (doc.querySelector("parsererror")) throw new Error("XMLParse");
      const out2 = pretty(doc.documentElement, 0);
      setOut(out.out, '<?xml version="1.0" encoding="UTF-8"?>\n' + out2, "ok");
    } catch (e) { setOut(out.out, t("xf.err"), "err"); }
  }
  function pretty(node, depth) {
    const pad = "  ".repeat(depth);
    const name = node.nodeName;
    if (!node.children.length) {
      const txt = (node.textContent || "").trim();
      if (txt) return pad + "<" + name + attrs(node) + ">" + escapeXml(txt) + "</" + name + ">";
      return pad + "<" + name + attrs(node) + "/>";
    }
    const open = pad + "<" + name + attrs(node) + ">";
    const kids = Array.from(node.children).map((c) => pretty(c, depth + 1)).join("\n");
    return open + "\n" + kids + "\n" + pad + "</" + name + ">";
  }
  function attrs(node) {
    return Array.from(node.attributes).map((a) => " " + a.name + '="' + escapeXml(a.value) + '"').join("");
  }
});

/* ---------- encoding: html encoder ---------- */
define("html-encoder", "encoding", "code", ["html", "encode", "decode", "escape", "entity", "کد"], function (root, api) {
  const t = api.t;
  root.append(api.note("he.note"));
  const ta = api.textarea({});
  ta.style.minHeight = "130px";
  const out = api.outputBar("c.output");
  root.append(api.field("c.input", ta));
  root.append(api.el("div", { class: "btn-row" }, [
    api.btn("he.encode", "btn-primary", () => setOut(out.out, escapeXml(ta.value), "ok"), "code"),
    api.btn("he.decode", "btn-ghost", () => {
      const div = document.createElement("div");
      div.innerHTML = ta.value;
      setOut(out.out, div.textContent || div.innerText || "", "ok");
    }, "refresh"),
  ]));
  root.append(out.node);
});

/* ---------- encoding: hex converter ---------- */
define("hex-converter", "encoding", "link", ["hex", "text", "convert", "encode", "decode", "هگز"], function (root, api) {
  const t = api.t;
  root.append(api.note("hx.note"));
  const ta = api.textarea({ dir: "ltr", placeholder: "hello" });
  ta.style.minHeight = "110px";
  const out = api.outputBar("c.output");
  root.append(api.field("c.input", ta));
  root.append(api.el("div", { class: "btn-row" }, [
    api.btn("hx.toHex", "btn-primary", () => {
      const bytes = new TextEncoder().encode(ta.value);
      setOut(out.out, Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join(" "), "ok");
    }, "arrow"),
    api.btn("hx.toText", "btn-ghost", () => {
      const hex = ta.value.replace(/\s+/g, "");
      if (!/^[0-9a-fA-F]*$/.test(hex) || hex.length % 2) { api.toast(t("c.invalidInput"), "x"); return; }
      const bytes = new Uint8Array(hex.match(/.{2}/g).map((h) => parseInt(h, 16)));
      setOut(out.out, new TextDecoder().decode(bytes), "ok");
    }, "swap"),
  ]));
  root.append(out.node);
});

/* ---------- hash: HMAC generator ---------- */
define("hmac-generator", "hash", "key", ["hmac", "sha", "hash", "signature", "secret", "هش"], function (root, api) {
  const t = api.t;
  root.append(api.note("hm.note"));
  const msgT = api.textarea({ dir: "ltr", placeholder: "message to sign" });
  msgT.style.minHeight = "90px";
  const secI = api.input({ dir: "ltr", placeholder: "secret key" });
  const algS = api.select([["SHA-256", "SHA-256"], ["SHA-384", "SHA-384"], ["SHA-512", "SHA-512"]], {});
  const out = api.outputBar("c.output");
  root.append(api.field("hm.msg", msgT));
  root.append(api.field("hm.secret", secI));
  root.append(api.field("hm.algo", algS));
  root.append(api.btn("hm.btn", "btn-primary", compute, "key"));
  root.append(out.node);
  async function compute() {
    if (!msgT.value) { api.toast(t("c.emptyErr"), "x"); return; }
    try {
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey("raw", enc.encode(secI.value || ""), { name: "HMAC", hash: algS.value }, false, ["sign"]);
      const sig = await crypto.subtle.sign("HMAC", key, enc.encode(msgT.value));
      const hex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
      const b64 = btoa(String.fromCharCode.apply(null, new Uint8Array(sig)));
      setOut(out.out, t("hm.hex") + ":\n" + hex + "\n\n" + t("hm.b64") + ":\n" + b64, "ok");
    } catch (e) { api.toast(t("c.invalidInput"), "x"); console.error(e); }
  }
});

/* ---------- jwt: validator ---------- */
define("jwt-validator", "jwt", "key", ["jwt", "token", "decode", "verify", "validate", "توکن"], function (root, api) {
  const t = api.t;
  root.append(api.note("jvv.note"));
  const tokT = api.textarea({ dir: "ltr", placeholder: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.signature" });
  tokT.style.minHeight = "90px";
  const secI = api.input({ dir: "ltr", placeholder: t("jvv.optionalSecret") });
  const out = api.outputBar("c.result");
  const stats = api.el("div", { class: "stat-grid" });
  root.append(api.field("jvv.token", tokT));
  root.append(api.field("jvv.secret", secI));
  root.append(api.btn("jvv.btn", "btn-primary", decode, "key"));
  root.append(stats);
  root.append(out.node);
  function b64url(s) {
    s = s.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    return atob(s);
  }
  async function decode() {
    const tok = tokT.value.trim();
    if (!tok) { api.toast(t("c.emptyErr"), "x"); return; }
    const parts = tok.split(".");
    if (parts.length !== 3) { setOut(out.out, t("jvv.bad"), "err"); return; }
    try {
      const header = JSON.parse(b64url(parts[0]));
      const payload = JSON.parse(b64url(parts[1]));
      stats.innerHTML = "";
      const exp = payload.exp ? new Date(payload.exp * 1000) : null;
      const now = Date.now();
      const expired = exp ? (exp.getTime() < now) : null;
      statusRow(t("jvv.alg"), header.alg || "?");
      statusRow(t("jvv.typ"), header.typ || "JWT");
      if (payload.iss) statusRow(t("jvv.iss"), payload.iss);
      if (payload.sub) statusRow(t("jvv.sub"), payload.sub);
      if (exp) { statusRow(t("jvv.exp"), exp.toLocaleString()); statusRow(t("jvv.status"), expired ? t("jvv.expired") : t("jvv.valid")); }
      if (header.alg === "HS256" && secI.value) {
        try {
          const enc = new TextEncoder();
          const key = await crypto.subtle.importKey("raw", enc.encode(secI.value), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
          const input = parts[0] + "." + parts[1];
          const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(input)));
          const expected = btoa(String.fromCharCode.apply(null, sig)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
          const match = expected === parts[2];
          statusRow(t("jvv.verify"), match ? t("jvv.match") : t("jvv.noMatch"));
        } catch (e) { statusRow(t("jvv.verify"), t("jvv.err")); }
      }
      setOut(out.out, JSON.stringify({ header, payload }, null, 2), expired ? "err" : "ok");
    } catch (e) { setOut(out.out, t("jvv.bad"), "err"); }
  }
  function statusRow(label, val) {
    stats.append(api.el("div", { class: "stat" }, [mkEl("b", String(val)), mkEl("span", label)]));
  }
});

/* ---------- jwt: generator (HS256) ---------- */
define("jwt-generator", "jwt", "key", ["jwt", "token", "generate", "hs256", "sign", "ساخت"], function (root, api) {
  const t = api.t;
  root.append(api.note("jwg.note"));
  const payloadT = api.textarea({ dir: "ltr", placeholder: '{ "sub": "123", "name": "Ali", "iat": 1700000000, "exp": 1731536000 }' });
  payloadT.style.minHeight = "130px";
  const secI = api.input({ dir: "ltr", placeholder: "secret" });
  const out = api.outputBar("c.output");
  root.append(api.field("jwg.payload", payloadT));
  root.append(api.field("jwg.secret", secI));
  root.append(api.btn("jwg.btn", "btn-primary", sign, "key"));
  root.append(out.node);
  function b64url(obj) { return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  async function sign() {
    let payload;
    try { payload = JSON.parse(payloadT.value); } catch (e) { api.toast(t("c.invalidInput"), "x"); return; }
    const header = { alg: "HS256", typ: "JWT" };
    const h = b64url(header), p = b64url(payload);
    const input = h + "." + p;
    try {
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey("raw", enc.encode(secI.value || ""), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(input)));
      const s = btoa(String.fromCharCode.apply(null, sig)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      setOut(out.out, input + "." + s, "ok");
    } catch (e) { api.toast(t("c.invalidInput"), "x"); }
  }
});

/* ---------- regex: escape ---------- */
define("regex-escape", "regex", "asterisk", ["regex", "escape", "literal", "pattern", "فرار"], function (root, api) {
  const t = api.t;
  root.append(api.note("rxe.note"));
  const ta = api.textarea({ dir: "ltr", placeholder: "(a+b)*c? [test]" });
  ta.style.minHeight = "90px";
  const out = api.outputBar("c.output");
  root.append(api.field("c.input", ta));
  root.append(api.btn("rxe.btn", "btn-primary", () => {
    setOut(out.out, ta.value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ok");
  }, "asterisk"));
  root.append(out.node);
});

/* ---------- generator: nanoid ---------- */
define("nanoid", "generator", "fingerprint", ["nanoid", "id", "generate", "random", "شناسه"], function (root, api) {
  const t = api.t;
  root.append(api.note("nid.note"));
  const lenI = api.input({ type: "number", dir: "ltr", value: "21" });
  const countI = api.input({ type: "number", dir: "ltr", value: "5" });
  const out = api.outputBar("c.output");
  root.append(api.el("div", { class: "row" }, [api.field("nid.len", lenI), api.field("nid.count", countI)]));
  root.append(api.btn("nid.btn", "btn-primary", gen, "fingerprint"));
  root.append(out.node);
  function gen() {
    const n = parseInt(lenI.value, 10) || 21, c = parseInt(countI.value, 10) || 5;
    const ALPH = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
    const ids = [];
    for (let k = 0; k < c; k++) {
      let s = "";
      const bytes = crypto.getRandomValues(new Uint8Array(n));
      for (let i = 0; i < n; i++) s += ALPH[bytes[i] & 63];
      ids.push(s);
    }
    setOut(out.out, ids.join("\n"), "ok");
  }
});

/* ---------- generator: ulid ---------- */
define("ulid", "generator", "list", ["ulid", "id", "generate", "random", "شناسه"], function (root, api) {
  const t = api.t;
  root.append(api.note("ul.note"));
  const countI = api.input({ type: "number", dir: "ltr", value: "5" });
  const upperC = api.check("ul.upper", false);
  const out = api.outputBar("c.output");
  root.append(api.field("ul.count", countI));
  root.append(upperC.node);
  root.append(api.btn("ul.btn", "btn-primary", gen, "list"));
  root.append(out.node);
  function gen() {
    const c = parseInt(countI.value, 10) || 5;
    const C = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
    const now = Date.now();
    const list = [];
    for (let k = 0; k < c; k++) {
      let t = now, ts = "";
      for (let i = 0; i < 10; i++) { ts = C.charAt(t % 32) + ts; t = Math.floor(t / 32); }
      let rand = "";
      for (let i = 0; i < 16; i++) rand += C.charAt(Math.floor(Math.random() * 32));
      let id = ts + rand;
      if (!upperC.input.checked) id = id.toLowerCase();
      list.push(id);
    }
    setOut(out.out, list.join("\n"), "ok");
  }
});

/* ---------- generator: random string ---------- */
define("random-string", "generator", "shuffle", ["random", "string", "generate", "password", "chars", "تصادفی"], function (root, api) {
  const t = api.t;
  root.append(api.note("rs.note"));
  const lenI = api.input({ type: "number", dir: "ltr", value: "16" });
  const countI = api.input({ type: "number", dir: "ltr", value: "4" });
  const upperC = api.check("rs.upper", true);
  const lowerC = api.check("rs.lower", true);
  const digitC = api.check("rs.digit", true);
  const symC = api.check("rs.sym", false);
  const out = api.outputBar("c.output");
  root.append(api.el("div", { class: "row" }, [api.field("rs.len", lenI), api.field("rs.count", countI)]));
  root.append(api.el("div", { class: "row-3" }, [upperC.node, lowerC.node, digitC.node, symC.node]));
  root.append(api.btn("rs.btn", "btn-primary", gen, "shuffle"));
  root.append(out.node);
  function gen() {
    const n = parseInt(lenI.value, 10) || 16, c = parseInt(countI.value, 10) || 4;
    let pool = "";
    if (upperC.input.checked) pool += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (lowerC.input.checked) pool += "abcdefghijklmnopqrstuvwxyz";
    if (digitC.input.checked) pool += "0123456789";
    if (symC.input.checked) pool += "!@#$%^&*()-_=+[]{};:,.?";
    if (!pool) { api.toast(t("c.emptyErr"), "x"); return; }
    const lines = [];
    for (let k = 0; k < c; k++) {
      let s = "";
      const bytes = crypto.getRandomValues(new Uint8Array(n));
      for (let i = 0; i < n; i++) s += pool[bytes[i] % pool.length];
      lines.push(s);
    }
    setOut(out.out, lines.join("\n"), "ok");
  }
});

/* ---------- generator: random number ---------- */
define("random-number", "generator", "digits", ["random", "number", "generate", "dice", "lottery", "عدد"], function (root, api) {
  const t = api.t;
  root.append(api.note("rn.note"));
  const minI = api.input({ type: "number", dir: "ltr", value: "1" });
  const maxI = api.input({ type: "number", dir: "ltr", value: "100" });
  const countI = api.input({ type: "number", dir: "ltr", value: "5" });
  const uniqC = api.check("rn.uniq", false);
  const out = api.outputBar("c.output");
  root.append(api.el("div", { class: "row" }, [api.field("rn.min", minI), api.field("rn.max", maxI), api.field("rn.count", countI)]));
  root.append(uniqC.node);
  root.append(api.btn("rn.btn", "btn-primary", gen, "digits"));
  root.append(out.node);
  function gen() {
    const min = parseInt(minI.value, 10), max = parseInt(maxI.value, 10), c = parseInt(countI.value, 10) || 1;
    if (isNaN(min) || isNaN(max) || max <= min) { api.toast(t("c.invalidInput"), "x"); return; }
    const range = max - min + 1;
    if (uniqC.input.checked && range < c) { api.toast(t("rn.supErr"), "x"); return; }
    const nums = [];
    while (nums.length < c) {
      const v = min + Math.floor(Math.random() * range);
      if (uniqC.input.checked && nums.includes(v)) continue;
      nums.push(v);
    }
    setOut(out.out, nums.join(", "), "ok");
  }
});

/* ---------- generator: api key ---------- */
define("api-key", "generator", "key", ["api", "key", "token", "generate", "secret", "کلید"], function (root, api) {
  const t = api.t;
  root.append(api.note("ak.note"));
  const prefixI = api.input({ dir: "ltr", value: "sk-live" });
  const bytesI = api.input({ type: "number", dir: "ltr", value: "24" });
  const countI = api.input({ type: "number", dir: "ltr", value: "3" });
  const out = api.outputBar("c.output");
  root.append(api.el("div", { class: "row" }, [api.field("ak.prefix", prefixI), api.field("ak.bytes", bytesI), api.field("ak.count", countI)]));
  root.append(api.btn("ak.btn", "btn-primary", gen, "key"));
  root.append(out.node);
  function gen() {
    const prefix = (prefixI.value || "").trim();
    const bytes = parseInt(bytesI.value, 10) || 24, c = parseInt(countI.value, 10) || 3;
    const lines = [];
    for (let k = 0; k < c; k++) {
      const rnd = crypto.getRandomValues(new Uint8Array(bytes));
      const b64 = btoa(String.fromCharCode.apply(null, rnd)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      lines.push((prefix ? prefix + "_" : "") + b64);
    }
    setOut(out.out, lines.join("\n"), "ok");
  }
});

/* ---------- security: password strength ---------- */
define("password-strength", "security", "shield", ["password", "strength", "entropy", "check", "رمز", "امنیت"], function (root, api) {
  const t = api.t;
  root.append(api.note("ps.note"));
  const pwI = api.input({ type: "password", dir: "ltr", autocomplete: "new-password" });
  const stats = api.el("div", { class: "stat-grid" });
  const bar = api.el("div", { class: "pstr-bar" });
  const out = api.outputBar("c.result");
  root.append(api.field("ps.pw", pwI));
  root.append(api.btn("ps.btn", "btn-primary", analyze, "shield"));
  root.append(bar);
  root.append(stats);
  root.append(out.node);
  function analyze() {
    const pw = pwI.value || "";
    if (!pw) { api.toast(t("c.emptyErr"), "x"); return; }
    const len = Array.from(pw).length;
    let pool = 0;
    if (/[a-z]/.test(pw)) pool += 26;
    if (/[A-Z]/.test(pw)) pool += 26;
    if (/[0-9]/.test(pw)) pool += 10;
    if (/[^a-zA-Z0-9]/.test(pw)) pool += 33;
    const entropy = Math.round(len * Math.log2(pool || 1));
    const score = Math.min(100, Math.round(entropy / 6.4));
    const label = score < 30 ? t("ps.weak") : score < 55 ? t("ps.fair") : score < 80 ? t("ps.good") : t("ps.strong");
    bar.innerHTML = '<div class="pstr-fill ' + (score < 30 ? "bad" : score < 55 ? "mid" : "good") + '" style="width:' + score + '%"></div><span>' + score + '%</span>';
    stats.innerHTML = "";
    [[t("ps.len"), len], [t("ps.entropy"), entropy + " bits"], [t("ps.pool"), pool + " chars"], [t("ps.score"), label]]
      .forEach((r) => stats.append(api.el("div", { class: "stat" }, [mkEl("b", r[1]), mkEl("span", r[0])])));
    setOut(out.out, t("ps.result") + ": " + label, score < 55 ? "err" : "ok");
  }
});

/* ---------- security: SRI hash ---------- */
define("sri-hash", "security", "shield", ["sri", "integrity", "hash", "sha", "security", "امنیت"], function (root, api) {
  const t = api.t;
  root.append(api.note("sri.note"));
  const ta = api.textarea({ dir: "ltr", placeholder: "<script>…content…</script>" });
  ta.style.minHeight = "80px";
  const algS = api.select([["SHA-384", "SHA-384 (recommended)"], ["SHA-256", "SHA-256"], ["SHA-512", "SHA-512"]], {});
  const out = api.outputBar("c.output");
  root.append(api.field("c.input", ta));
  root.append(api.field("sri.alg", algS));
  root.append(api.btn("sri.btn", "btn-primary", compute, "shield"));
  root.append(out.node);
  async function compute() {
    if (!ta.value.trim()) { api.toast(t("c.emptyErr"), "x"); return; }
    const bytes = new TextEncoder().encode(ta.value);
    const digest = await crypto.subtle.digest(algS.value, bytes);
    const b64 = btoa(String.fromCharCode.apply(null, new Uint8Array(digest)));
    setOut(out.out, algS.value + "-" + b64, "ok");
  }
});

/* ---------- network: ip validator ---------- */
define("ip-validator", "network", "globe", ["ip", "ipv4", "ipv6", "validate", "آدرس", "شبکه"], function (root, api) {
  const t = api.t;
  root.append(api.note("ipv.note"));
  const ipI = api.input({ dir: "ltr", placeholder: "192.168.1.1" });
  const out = api.outputBar("c.result");
  const stats = api.el("div", { class: "stat-grid" });
  root.append(api.field("ipv.ip", ipI));
  root.append(api.btn("ipv.btn", "btn-primary", check, "globe"));
  root.append(stats);
  root.append(out.node);
  function check() {
    const v = ipI.value.trim();
    if (!v) { api.toast(t("c.emptyErr"), "x"); return; }
    stats.innerHTML = "";
    if (isIPv4(v)) {
      const nums = v.split(".").map(Number);
      const bin = nums.map((n) => n.toString(2).padStart(8, "0")).join("");
      const cls = nums[0] < 128 ? "A" : nums[0] < 192 ? "B" : nums[0] < 224 ? "C" : nums[0] < 240 ? "D" : "E";
      const priv = nums[0] === 10 || (nums[0] === 172 && nums[1] >= 16 && nums[1] <= 31) || (nums[0] === 192 && nums[1] === 168);
      rows([[t("ipv.v4"), "✓"], [t("ipv.class"), cls], [t("ipv.binary"), bin], [t("ipv.priv"), priv ? "✓" : "—"]]);
      setOut(out.out, t("ipv.validV4"), "ok");
    } else if (isIPv6(v)) {
      rows([[t("ipv.v6"), "✓"], [t("ipv.groups"), v.split(":").filter((x) => x !== "").length]]);
      setOut(out.out, t("ipv.validV6"), "ok");
    } else {
      setOut(out.out, t("ipv.invalid"), "err");
    }
  }
  function rows(list) { list.forEach((r) => stats.append(api.el("div", { class: "stat" }, [mkEl("b", r[1]), mkEl("span", r[0])]))); }
  function isIPv4(s) { return /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.test(s) && s.split(".").every((o) => +o <= 255); }
  function isIPv6(s) {
    if (!/^[0-9a-fA-F:]+$/.test(s)) return false;
    const parts = s.split("::");
    if (parts.length > 2) return false;
    if (parts.length === 2) {
      const l = parts[0] ? parts[0].split(":") : [];
      const r = parts[1] ? parts[1].split(":") : [];
      if (l.length + r.length > 7) return false;
    } else {
      if (parts[0].split(":").length !== 8) return false;
    }
    return s.split(":").every((h) => h === "" || /^[0-9a-fA-F]{1,4}$/.test(h));
  }
});

/* ---------- network: cidr calculator ---------- */
define("cidr-calculator", "network", "target", ["cidr", "subnet", "network", "mask", "ip", "شبکه", "ماسک"], function (root, api) {
  const t = api.t;
  root.append(api.note("cidr.note"));
  const cidrI = api.input({ dir: "ltr", placeholder: "192.168.1.0/24" });
  const out = api.outputBar("c.result");
  const stats = api.el("div", { class: "stat-grid" });
  root.append(api.field("cidr.cidr", cidrI));
  root.append(api.btn("cidr.btn", "btn-primary", calc, "target"));
  root.append(stats);
  root.append(out.node);
  function calc() {
    const m = cidrI.value.trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/);
    if (!m) { setOut(out.out, t("c.invalidInput"), "err"); return; }
    const octs = [1, 2, 3, 4].map((i) => +m[i]).filter((o) => o <= 255);
    if (octs.length !== 4) { setOut(out.out, t("c.invalidInput"), "err"); return; }
    const bits = +m[5];
    if (bits > 32) { setOut(out.out, t("c.invalidInput"), "err"); return; }
    let ip = 0;
    octs.forEach((o) => { ip = (ip << 8) | o; });
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    const network = (ip & mask) >>> 0;
    const broadcast = (network | (~mask >>> 0)) >>> 0;
    const hosts = Math.max(0, Math.pow(2, 32 - bits) - 2);
    const wildcard = (~mask >>> 0) >>> 0;
    stats.innerHTML = "";
    rows([[t("cidr.network"), fmt(network)], [t("cidr.mask"), fmt(mask)], [t("cidr.wildcard"), fmt(wildcard)],
      [t("cidr.broadcast"), fmt(broadcast)], [t("cidr.hosts"), bits >= 31 ? "—" : hosts], [t("cidr.first"), bits >= 31 ? fmt(network) : fmt((network + 1) >>> 0)], [t("cidr.last"), bits >= 31 ? fmt(broadcast) : fmt((broadcast - 1) >>> 0)]]);
    setOut(out.out, t("cidr.range") + ": " + fmt(network) + " – " + fmt(broadcast), "ok");
  }
  function fmt(v) { return [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255].join("."); }
  function rows(list) { list.forEach((r) => stats.append(api.el("div", { class: "stat" }, [mkEl("b", r[1]), mkEl("span", r[0])]))); }
});

/* ---------- network: mac generator ---------- */
define("mac-generator", "network", "hash", ["mac", "address", "generate", "random", "مک"], function (root, api) {
  const t = api.t;
  root.append(api.note("mcg.note"));
  const fmtS = api.select([[":", "AA:BB:CC:DD:EE:FF"], ["-", "AA-BB-CC-DD-EE-FF"], [".", "AABB.CCDD.EEFF"]], {});
  const countI = api.input({ type: "number", dir: "ltr", value: "5" });
  const upperC = api.check("mcg.upper", true);
  const out = api.outputBar("c.output");
  root.append(api.el("div", { class: "row" }, [api.field("mcg.fmt", fmtS), api.field("mcg.count", countI)]));
  root.append(upperC.node);
  root.append(api.btn("mcg.btn", "btn-primary", gen, "hash"));
  root.append(out.node);
  function gen() {
    const c = parseInt(countI.value, 10) || 5;
    const sep = fmtS.value;
    const lines = [];
    for (let k = 0; k < c; k++) {
      const bytes = crypto.getRandomValues(new Uint8Array(6));
      bytes[0] = (bytes[0] & 0xfe) | 0x02; // locally administered, unicast
      let parts = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0"));
      if (!upperC.input.checked) parts = parts.map((p) => p.toLowerCase());
      lines.push(sep === "." ? parts[0] + parts[1] + "." + parts[2] + parts[3] + "." + parts[4] + parts[5] : parts.join(sep));
    }
    setOut(out.out, lines.join("\n"), "ok");
  }
});

/* ---------- math: percentage ---------- */
define("percentage", "math", "percent", ["percent", "percentage", "change", "increase", "decrease", "درصد"], function (root, api) {
  const t = api.t;
  root.append(api.note("pct.note"));
  const numI = api.input({ type: "number", dir: "ltr", value: "200" });
  const pctI = api.input({ type: "number", dir: "ltr", value: "15" });
  const fromI = api.input({ type: "number", dir: "ltr", value: "80" });
  const toI = api.input({ type: "number", dir: "ltr", value: "100" });
  const out = api.outputBar("c.result");
  const stats = api.el("div", { class: "stat-grid" });
  root.append(api.el("div", { class: "row" }, [api.field("pct.num", numI), api.field("pct.pct", pctI)]));
  root.append(api.el("div", { class: "row" }, [api.field("pct.from", fromI), api.field("pct.to", toI)]));
  root.append(api.btn("pct.btn", "btn-primary", calc, "percent"));
  root.append(stats);
  root.append(out.node);
  function calc() {
    const num = +numI.value, p = +pctI.value, from = +fromI.value, to = +toI.value;
    stats.innerHTML = "";
    if (!isNaN(num) && !isNaN(p)) rows([[t("pct.value"), num * p / 100], [t("pct.plus"), num + num * p / 100], [t("pct.minus"), num - num * p / 100]]);
    if (!isNaN(from) && !isNaN(to) && from !== 0) {
      const ch = ((to - from) / from) * 100;
      rows([[t("pct.change"), ch.toFixed(2) + "%"]]);
    }
    setOut(out.out, t("pct.done"), "ok");
  }
  function rows(list) { list.forEach((r) => stats.append(api.el("div", { class: "stat" }, [mkEl("b", r[1]), mkEl("span", r[0])]))); }
});

/* ---------- math: gcd lcm ---------- */
define("gcd-lcm", "math", "digits", ["gcd", "lcm", "greatest", "common", "divisor", "بزرگترین", "مقسوم"], function (root, api) {
  const t = api.t;
  root.append(api.note("gl.note"));
  const aI = api.input({ type: "number", dir: "ltr", value: "48" });
  const bI = api.input({ type: "number", dir: "ltr", value: "36" });
  const out = api.outputBar("c.result");
  const stats = api.el("div", { class: "stat-grid" });
  root.append(api.el("div", { class: "row" }, [api.field("gl.a", aI), api.field("gl.b", bI)]));
  root.append(api.btn("gl.btn", "btn-primary", calc, "digits"));
  root.append(stats);
  root.append(out.node);
  function calc() {
    const a = Math.abs(+aI.value | 0), b = Math.abs(+bI.value | 0);
    if (!a || !b) { api.toast(t("c.invalidInput"), "x"); return; }
    const g = gcd(a, b);
    stats.innerHTML = "";
    rows([[t("gl.gcd"), g], [t("gl.lcm"), a * b / g]]);
    setOut(out.out, t("gl.done"), "ok");
  }
  function gcd(x, y) { while (y) { const tmp = y; y = x % y; x = tmp; } return x; }
  function rows(list) { list.forEach((r) => stats.append(api.el("div", { class: "stat" }, [mkEl("b", r[1]), mkEl("span", r[0])]))); }
});

/* ---------- math: prime checker ---------- */
define("prime-checker", "math", "digits", ["prime", "factor", "check", "number", "اول", "تجزیه"], function (root, api) {
  const t = api.t;
  root.append(api.note("prm.note"));
  const nI = api.input({ type: "number", dir: "ltr", value: "97" });
  const out = api.outputBar("c.result");
  const stats = api.el("div", { class: "stat-grid" });
  root.append(api.field("prm.n", nI));
  root.append(api.btn("prm.btn", "btn-primary", check, "digits"));
  root.append(stats);
  root.append(out.node);
  function check() {
    const n = +nI.value | 0;
    if (n < 2) { setOut(out.out, t("prm.no"), "err"); return; }
    const prime = isPrime(n);
    const factors = factor(n);
    stats.innerHTML = "";
    rows([[t("prm.prime"), prime ? t("c.yes") : t("c.no")], [t("prm.divisors"), factors.length], [t("prm.factors"), factors.join(" × ")]]);
    setOut(out.out, prime ? t("prm.isPrime") : t("prm.notPrime"), prime ? "ok" : "err");
  }
  function isPrime(x) {
    if (x < 2) return false;
    for (let i = 2; i * i <= x; i++) if (x % i === 0) return false;
    return true;
  }
  function factor(x) {
    const f = [];
    for (let i = 2; i * i <= x; i++) while (x % i === 0) { f.push(i); x /= i; }
    if (x > 1) f.push(x);
    return f;
  }
  function rows(list) { list.forEach((r) => stats.append(api.el("div", { class: "stat" }, [mkEl("b", r[1]), mkEl("span", r[0])]))); }
});

/* ---------- date: age calculator ---------- */
define("age-calculator", "date", "calendar", ["age", "birthday", "calculate", "date", "سن", "تولد"], function (root, api) {
  const t = api.t;
  root.append(api.note("age.note"));
  const dI = api.input({ type: "date", dir: "ltr" });
  const jalC = api.check("age.jalali", false);
  const out = api.outputBar("c.result");
  const stats = api.el("div", { class: "stat-grid" });
  root.append(api.field("age.birth", dI));
  root.append(jalC.node);
  root.append(api.btn("age.btn", "btn-primary", calc, "calendar"));
  root.append(stats);
  root.append(out.node);
  function calc() {
    if (!dI.value) { api.toast(t("c.emptyErr"), "x"); return; }
    const parts = dI.value.split("-").map(Number);
    let by, bm, bd;
    if (jalC.input.checked) { // Jalali birth → convert to Gregorian
      const jd = jal.toGregorian(parts[0], parts[1], parts[2]);
      by = jd.gy; bm = jd.gm; bd = jd.gd;
    } else { by = parts[0]; bm = parts[1]; bd = parts[2]; }
    const now = new Date();
    let years = now.getFullYear() - by;
    let months = now.getMonth() + 1 - bm;
    let days = now.getDate() - bd;
    if (days < 0) { months--; const pm = new Date(now.getFullYear(), now.getMonth(), 0).getDate(); days += pm; }
    if (months < 0) { years--; months += 12; }
    stats.innerHTML = "";
    [[t("age.years"), years], [t("age.months"), months], [t("age.days"), days], [t("age.totalDays"), Math.floor((now - new Date(by, bm - 1, bd)) / 86400000)]]
      .forEach((r) => stats.append(api.el("div", { class: "stat" }, [mkEl("b", r[1]), mkEl("span", r[0])])));
    setOut(out.out, years + " " + t("age.yrs") + " " + months + " " + t("age.mos") + " " + days + " " + t("age.dys"), "ok");
  }
});

/* ---------- date: date diff ---------- */
define("date-diff", "date", "calendar", ["date", "diff", "days", "between", "weeks", "اختلاف", "تاریخ"], function (root, api) {
  const t = api.t;
  root.append(api.note("dd.note"));
  const fromI = api.input({ type: "date", dir: "ltr" });
  const toI = api.input({ type: "date", dir: "ltr" });
  const out = api.outputBar("c.result");
  const stats = api.el("div", { class: "stat-grid" });
  root.append(api.el("div", { class: "row" }, [api.field("dd.from", fromI), api.field("dd.to", toI)]));
  root.append(api.btn("dd.btn", "btn-primary", calc, "calendar"));
  root.append(stats);
  root.append(out.node);
  function calc() {
    if (!fromI.value || !toI.value) { api.toast(t("c.emptyErr"), "x"); return; }
    const from = new Date(fromI.value), to = new Date(toI.value);
    const ms = Math.abs(to - from);
    const days = Math.round(ms / 86400000);
    const weeks = Math.floor(days / 7);
    const remDays = days % 7;
    stats.innerHTML = "";
    [[t("dd.days"), days], [t("dd.weeks"), weeks + "w " + remDays + "d"], [t("dd.hours"), Math.round(ms / 3600000)], [t("dd.minutes"), Math.round(ms / 60000)]]
      .forEach((r) => stats.append(api.el("div", { class: "stat" }, [mkEl("b", r[1]), mkEl("span", r[0])])));
    setOut(out.out, days + " " + t("dd.day"), "ok");
  }
});

/* ---------- css: box shadow generator ---------- */
define("css-shadow", "css", "blend", ["css", "shadow", "box-shadow", "generator", "سایه"], function (root, api) {
  const t = api.t;
  root.append(api.note("csh.note"));
  const oxI = api.input({ type: "range", dir: "ltr", min: "-50", max: "50", value: "5" });
  const oyI = api.input({ type: "range", dir: "ltr", min: "-50", max: "50", value: "5" });
  const blI = api.input({ type: "range", dir: "ltr", min: "0", max: "100", value: "20" });
  const spI = api.input({ type: "range", dir: "ltr", min: "-20", max: "40", value: "0" });
  const opI = api.input({ type: "range", dir: "ltr", min: "0", max: "100", value: "40" });
  const colI = api.input({ type: "color", value: "#000000" });
  const insC = api.check("csh.inset", false);
  const preview = api.el("div", { class: "shadow-preview" });
  const out = api.outputBar("c.output");
  root.append(api.el("div", { class: "row" }, [api.field("csh.ox", oxI), api.field("csh.oy", oyI)]));
  root.append(api.el("div", { class: "row" }, [api.field("csh.blur", blI), api.field("csh.spread", spI)]));
  root.append(api.el("div", { class: "row" }, [api.field("csh.opacity", opI), api.field("csh.color", colI)]));
  root.append(insC.node);
  root.append(api.btn("csh.btn", "btn-primary", () => { const v = value(); setOut(out.out, v, "ok"); preview.style.boxShadow = v; }, "blend"));
  root.append(preview);
  root.append(out.node);
  function value() {
    const alpha = (+opI.value / 100);
    const col = colI.value;
    const c = "rgba(" + parseInt(col.substr(1, 2), 16) + "," + parseInt(col.substr(3, 2), 16) + "," + parseInt(col.substr(5, 2), 16) + "," + alpha + ")";
    return (insC.input.checked ? "inset " : "") + oxI.value + "px " + oyI.value + "px " + blI.value + "px " + spI.value + "px " + c;
  }
});

/* ---------- css: border radius generator ---------- */
define("border-radius", "css", "blend", ["css", "border", "radius", "corners", "generator", "گرد"], function (root, api) {
  const t = api.t;
  root.append(api.note("brd.note"));
  const tlI = api.input({ type: "range", dir: "ltr", min: "0", max: "200", value: "20" });
  const trI = api.input({ type: "range", dir: "ltr", min: "0", max: "200", value: "20" });
  const brI = api.input({ type: "range", dir: "ltr", min: "0", max: "200", value: "20" });
  const blI = api.input({ type: "range", dir: "ltr", min: "0", max: "200", value: "20" });
  const preview = api.el("div", { class: "shadow-preview brd-preview" });
  const out = api.outputBar("c.output");
  root.append(api.el("div", { class: "row" }, [api.field("brd.tl", tlI), api.field("brd.tr", trI)]));
  root.append(api.el("div", { class: "row" }, [api.field("brd.bl", blI), api.field("brd.br", brI)]));
  root.append(api.btn("brd.btn", "btn-primary", () => { const v = value(); setOut(out.out, v, "ok"); preview.style.borderRadius = v; }, "blend"));
  root.append(preview);
  root.append(out.node);
  function value() {
    return tlI.value + "px " + trI.value + "px " + brI.value + "px " + blI.value + "px";
  }
});

/* ---------- css: palette generator ---------- */
define("palette", "css", "blend", ["palette", "color", "tint", "shade", "css", "پالت"], function (root, api) {
  const t = api.t;
  root.append(api.note("pal.note"));
  const colI = api.input({ type: "color", value: "#4f46e5" });
  const out = api.outputBar("c.output");
  const sw = api.el("div", { class: "swatch-grid" });
  root.append(api.field("pal.base", colI));
  root.append(api.btn("pal.btn", "btn-primary", gen, "blend"));
  root.append(sw);
  root.append(out.node);
  function gen() {
    const rgb = hexToRgb(colI.value);
    if (!rgb) { api.toast(t("c.invalidInput"), "x"); return; }
    const [h, s] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
    sw.innerHTML = "";
    const arr = [];
    // 10 shades: 50→950 (light→dark) by sweeping lightness while keeping hue/saturation
    const ls = [95, 88, 80, 72, 64, 56, 48, 40, 32, 22];
    ls.forEach((l, i) => {
      const rr = hslToRgb(h, s, l);
      const hex = rgbToHex(rr[0], rr[1], rr[2]);
      const name = (i + 1) * 50;
      const cell = api.el("div", { class: "swatch" });
      cell.style.background = hex;
      cell.title = name + " " + hex;
      cell.append(mkEl("span", name + " " + hex));
      sw.append(cell);
      arr.push({ name, hex });
    });
    setOut(out.out, arr.map((x) => "--" + x.name + ": " + x.hex + ";").join("\n"), "ok");
  }
});

/* ---------- text: dedupe lines ---------- */
define("dedupe-lines", "text", "filter", ["dedupe", "duplicate", "unique", "lines", "remove", "تکراری"], function (root, api) {
  const t = api.t;
  root.append(api.note("ddl.note"));
  const ta = api.textarea({ placeholder: t("ddl.placeholder") });
  ta.style.minHeight = "160px";
  const ciC = api.check("ddl.ci", false);
  const out = api.outputBar("c.output");
  root.append(api.field("c.input", ta));
  root.append(ciC.node);
  root.append(api.btn("ddl.btn", "btn-primary", dedupe, "filter"));
  root.append(out.node);
  function dedupe() {
    const lines = ta.value.split("\n");
    const seen = new Set();
    const res = [];
    lines.forEach((l) => {
      const key = ciC.input.checked ? l.trim().toLowerCase() : l.trim();
      if (l.trim() && !seen.has(key)) { seen.add(key); res.push(l); }
    });
    setOut(out.out, res.join("\n"), "ok");
  }
});

/* ---------- text: sort lines ---------- */
define("sort-lines", "text", "sort", ["sort", "lines", "order", "alphabetical", "numeric", "مرتب"], function (root, api) {
  const t = api.t;
  root.append(api.note("sl.note"));
  const ta = api.textarea({ placeholder: t("sl.placeholder") });
  ta.style.minHeight = "160px";
  const dirS = api.select([["asc", t("sl.asc")], ["desc", t("sl.desc")]], {});
  const numC = api.check("sl.numeric", false);
  const out = api.outputBar("c.output");
  root.append(api.field("c.input", ta));
  root.append(api.el("div", { class: "row" }, [api.field("sl.dir", dirS), numC.node]));
  root.append(api.btn("sl.btn", "btn-primary", sort, "sort"));
  root.append(out.node);
  function sort() {
    const lines = ta.value.split("\n").filter((l) => l.trim() !== "");
    const cmp = numC.input.checked ? (a, b) => parseFloat(a) - parseFloat(b) : (a, b) => a.localeCompare(b);
    lines.sort(cmp);
    if (dirS.value === "desc") lines.reverse();
    setOut(out.out, lines.join("\n"), "ok");
  }
});

/* ---------- text: slug generator ---------- */
define("slug-generator", "text", "tag", ["slug", "url", "seo", "permalink", "text", "اسلاگ"], function (root, api) {
  const t = api.t;
  root.append(api.note("slug.note"));
  const ta = api.input({ placeholder: t("slug.ph") });
  const sepS = api.select([["-", "- (dash)"], ["_", "_ (underscore)"], ["none", t("slug.none")]], {});
  const out = api.outputBar("c.output");
  root.append(api.field("c.input", ta));
  root.append(api.field("slug.sep", sepS));
  root.append(api.btn("slug.btn", "btn-primary", make, "tag"));
  root.append(out.node);
  function make() {
    let s = ta.value.trim().toLowerCase();
    s = s.replace(/[^\p{L}\p{N}\s-]/gu, ""); // keep letters, digits, spaces, dashes (unicode-aware)
    s = s.trim().replace(/\s+/g, "-");
    if (sepS.value !== "-") s = s.replace(/-/g, sepS.value === "_" ? "_" : "");
    s = s.replace(/[-_]+/g, sepS.value === "none" ? "" : sepS.value).replace(/^[-_]+|[-_]+$/g, "");
    setOut(out.out, s || "-", s ? "ok" : "err");
  }
});

/* ---------- text: find & replace ---------- */
define("find-replace", "text", "search", ["find", "replace", "search", "text", "جستجو", "جایگزینی"], function (root, api) {
  const t = api.t;
  root.append(api.note("fr.note"));
  const findI = api.input({ placeholder: t("fr.find") });
  const repI = api.input({ placeholder: t("fr.replace") });
  const ta = api.textarea({ placeholder: t("fr.ph") });
  ta.style.minHeight = "150px";
  const ciC = api.check("fr.ci", false);
  const out = api.outputBar("c.output");
  root.append(api.el("div", { class: "row" }, [api.field("fr.find", findI), api.field("fr.replace", repI)]));
  root.append(api.field("c.input", ta));
  root.append(ciC.node);
  root.append(api.btn("fr.btn", "btn-primary", run, "search"));
  root.append(out.node);
  function run() {
    const find = findI.value;
    if (!find) { api.toast(t("c.emptyErr"), "x"); return; }
    const flags = ciC.input.checked ? "gi" : "g";
    let res;
    try { res = ta.value.replace(new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), flags), repI.value); }
    catch (e) { res = ta.value.split(find).join(repI.value); }
    const count = (ta.value.match(new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), ciC.input.checked ? "g" : "g")) || []).length;
    setOut(out.out, res, "ok");
    api.toast(t("fr.done") + ": " + count, "check");
  }
});

/* ============= exports ============= */
window.DRT_TOOLS = DRT_TOOLS;
})();
