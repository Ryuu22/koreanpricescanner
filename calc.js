// Deck / collection value: paste one card per line ("3 OGN-301", "OGN-039a x2", "2 뻔뻔한 해적").
(function () {
  "use strict";

  const CARDS = window.CARDS || [];
  const PRICES = window.PRICES || {};
  const BJ = PRICES.bunjang || {};
  const SOLD = PRICES.sold || {};

  const STRINGS = {
    ko: {
      title: "덱 가격 계산기",
      intro: "한 줄에 카드 하나씩, 수량과 카드 코드 또는 카드 이름을 적으세요. 예: \"3 OGN-301\", \"OGN-039a x2\", \"2 뻔뻔한 해적\". 시세는 번개장터 호가의 중간값입니다.",
      listLabel: "카드 목록", fromWatch: "관심 카드 불러오기", example: "예시 덱",
      card: "카드", qty: "수량", unit: "중간값", subtotal: "합계",
      total: (n) => `총 ${n}장`, median: "중간값 기준", lowest: "최저가 기준",
      noPrice: "시세 없음", soldPrice: "거래 추정",
      unknown: "찾지 못한 줄", missing: (n) => `시세가 없는 카드 ${n}장은 합계에서 빠졌습니다.`,
      updated: (u) => `${u} 업데이트 기준`,
    },
  };
  // Static pages are Korean; the bilingual toggle lives on the catalog only.
  const lang = "ko";
  const t = STRINGS[lang];
  document.documentElement.lang = lang;
  for (const el of document.querySelectorAll("[data-i18n]")) el.textContent = t[el.dataset.i18n];

  const $ = (id) => document.getElementById(id);
  const norm = (s) => s.toLowerCase().replace(/[\s\-_/.,'’!?()[\]:·~]/g, "");
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const won = (n) => lang === "ko" ? n.toLocaleString("ko-KR") + "원" : "₩" + n.toLocaleString("en-US");
  const nameOf = (c) => lang === "ko" ? c.name : c.nameEn || c.name;

  // "OGN-039a/298" and "ogn 39a" both become "ogn39a".
  const codeKey = (set, prefix, num, suffix) => `${set}${prefix}${+num}${suffix}`.toLowerCase();
  const byCode = new Map();
  const byName = new Map();
  for (const c of CARDS) {
    const m = c.code.match(/^([A-Z]+)-(\D*?)(\d+)([a-z*]?)/);
    if (m) byCode.set(codeKey(m[1], m[2], m[3], m[4]), c);
    for (const n of [c.name, c.nameEn || ""]) {
      if (!n) continue;
      const list = byName.get(norm(n)) || [];
      if (!list.includes(c)) list.push(c);
      byName.set(norm(n), list);
    }
  }
  // For a name shared by several printings, the plain one (not alt / signature / overnumber).
  const overnumber = (c) => { const m = c.code.match(/-\D*(\d+)[a-z*]?\/(\d+)$/); return m && +m[1] > +m[2]; };
  const plain = (list) => list.find((c) => !c.variant && !overnumber(c)) || list[0];

  function parseLine(line) {
    let s = line.trim();
    if (!s || s.startsWith("#") || s.startsWith("//")) return null;
    let qty = 1;
    const lead = s.match(/^(\d+)\s*(?:x|×|장)?\s+/i);
    const trail = s.match(/\s+(?:x|×)\s*(\d+)$|\s+(\d+)\s*장$/i);
    if (lead) { qty = +lead[1]; s = s.slice(lead[0].length); }
    else if (trail) { qty = +(trail[1] || trail[2]); s = s.slice(0, trail.index); }
    const code = s.match(/\b([a-z]{3})\s*-?\s*([a-z]*?)(\d{1,3})([a*]?)/i);
    let card = code ? byCode.get(codeKey(code[1], code[2], code[3], code[4])) : null;
    if (!card) {
      const list = byName.get(norm(s));
      if (list) card = plain(list);
    }
    return { line, qty, card };
  }

  function render() {
    const rows = $("list").value.split("\n").map(parseLine).filter(Boolean);
    try { sessionStorage.setItem("calc", $("list").value); } catch (_) { /* storage blocked */ }
    if (!rows.length) { $("result").innerHTML = ""; return; }
    let count = 0, median = 0, lowest = 0, missing = 0;
    const unknown = [];
    const lines = [];
    for (const r of rows) {
      if (!r.card) { unknown.push(r.line); continue; }
      const p = BJ[r.card.id], s = SOLD[r.card.id];
      const unit = p ? p.median : s ? s.median : null;
      count += r.qty;
      if (unit === null) missing += r.qty;
      else { median += unit * r.qty; lowest += (p ? p.min : s.median) * r.qty; }
      lines.push(`<tr>
        <td class="p">${r.qty}</td>
        <td><a href="card/${esc(r.card.id)}/">${esc(r.card.code.replace(/\/.*/, ""))} ${esc(nameOf(r.card))}</a></td>
        <td class="p">${unit === null ? `<span class="note">${t.noPrice}</span>` : won(unit) + (p ? "" : ` <span class="note">${t.soldPrice}</span>`)}</td>
        <td class="p">${unit === null ? "" : won(unit * r.qty)}</td>
      </tr>`);
    }
    $("result").innerHTML = `
      <div class="sticker-panel totals">
        <div class="lead"><b>${won(median)}</b><span>${t.median}</span></div>
        <dl>
          <dt>${t.lowest}</dt><dd>${won(lowest)}</dd>
          <dt>${t.qty}</dt><dd>${count}</dd>
        </dl>
      </div>
      ${missing ? `<p class="note">${t.missing(missing)}</p>` : ""}
      ${PRICES.updated ? `<p class="note">${t.updated(esc(PRICES.updated))}</p>` : ""}
      <table class="list"><tr><th class="p">${t.qty}</th><th>${t.card}</th><th class="p">${t.unit}</th><th class="p">${t.subtotal}</th></tr>${lines.join("")}</table>
      ${unknown.length ? `<h2>${t.unknown}</h2><ul>${unknown.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>` : ""}`;
  }

  $("fromWatch").addEventListener("click", () => {
    let ids = [];
    try { ids = JSON.parse(localStorage.getItem("watch") || "[]"); } catch (_) { /* storage blocked */ }
    const cards = ids.map((id) => CARDS.find((c) => c.id === id)).filter(Boolean);
    $("list").value = cards.map((c) => `1 ${c.code.replace(/\/.*/, "")}`).join("\n");
    render();
  });
  $("example").addEventListener("click", () => {
    $("list").value = "1 OGN-251\n3 OGN-116\n3 OGN-077\n2 OGN-248\n3 뻔뻔한 해적\n2 OGN-039a";
    render();
  });
  let timer;
  $("list").addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(render, 200); });
  try { $("list").value = sessionStorage.getItem("calc") || ""; } catch (_) { /* storage blocked */ }
  render();
})();
