// Riftbound KR price catalog. Plain JS, no build step.
// Data comes from data/cards.js (window.CARDS) and data/prices.js (window.PRICES).
(function () {
  "use strict";

  const CARDS = window.CARDS || [];
  const PRICES = window.PRICES || { bunjang: {} };
  const BJ = PRICES.bunjang || {};
  const PAGE = 120;

  const RARITY_ORDER = ["common", "uncommon", "rare", "epic", "showcase"];
  const TYPE_KO = {
    unit: "유닛", spell: "주문", legend: "전설", gear: "장비",
    battlefield: "전장", rune: "룬", "": "기타",
  };
  const VARIANT_KO = { alt: "대체일러 알트 얼터", signature: "시그니처 사인 오버넘버" };

  const $ = (id) => document.getElementById(id);
  const won = (n) => n.toLocaleString("ko-KR") + "원";
  const norm = (s) => s.toLowerCase().replace(/[\s\-_/.,'’]/g, "");
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Precompute a normalized search string per card.
  for (const c of CARDS) {
    c._search = norm([
      c.name, c.code, c.code.replace(/\/.*/, ""), c.set + c.num, c.setName,
      ...c.champs, ...c.champsKo, c.artist, c.rarityKo, TYPE_KO[c.type] || c.type,
      c.variant, VARIANT_KO[c.variant] || "",
    ].join(" "));
    c._price = BJ[c.id] ? BJ[c.id].median : null;
  }

  // Filters
  fillSelect($("set"), uniq(CARDS.map((c) => c.set)).map((s) =>
    [s, `${s} · ${CARDS.find((c) => c.set === s).setName}`]));
  fillSelect($("rarity"), RARITY_ORDER.map((r) =>
    [r, (CARDS.find((c) => c.rarity === r) || {}).rarityKo || r]));
  fillSelect($("type"), uniq(CARDS.map((c) => c.type)).map((t) => [t, TYPE_KO[t] || t]));

  $("meta").textContent = PRICES.updated
    ? `카드 ${CARDS.length}장 · 번개장터 매물 ${PRICES.scanned}개 중 ${PRICES.matched}개 매칭 · 업데이트 ${PRICES.updated}`
    : `카드 ${CARDS.length}장 · 시세 데이터 없음 (scripts/scrape_bunjang.py 실행)`;

  // Restore state from URL
  const params = new URLSearchParams(location.search);
  for (const k of ["q", "set", "rarity", "type", "sort"]) if (params.has(k)) $(k).value = params.get(k);
  $("priced").checked = params.get("priced") === "1";

  let openCard = "";
  let results = [];
  let shown = 0;

  function apply() {
    const q = norm($("q").value);
    const terms = $("q").value.trim().split(/\s+/).map(norm).filter(Boolean);
    const set = $("set").value, rarity = $("rarity").value, type = $("type").value;
    const priced = $("priced").checked;

    results = CARDS.filter((c) =>
      (!set || c.set === set) &&
      (!rarity || c.rarity === rarity) &&
      (!type || c.type === type) &&
      (!priced || c._price !== null) &&
      (!q || terms.every((t) => c._search.includes(t))));

    const sort = $("sort").value;
    const byPrice = (dir) => (a, b) =>
      (a._price === null) - (b._price === null) || dir * ((a._price || 0) - (b._price || 0));
    if (sort === "price_desc") results.sort(byPrice(-1));
    else if (sort === "price_asc") results.sort(byPrice(1));
    else if (sort === "listings") results.sort((a, b) => ((BJ[b.id] || {}).n || 0) - ((BJ[a.id] || {}).n || 0));
    else if (sort === "name") results.sort((a, b) => a.name.localeCompare(b.name, "ko"));

    $("count").textContent = `${results.length}장`;
    $("grid").innerHTML = "";
    shown = 0;
    more();
    saveState();
  }

  function more() {
    const frag = document.createDocumentFragment();
    for (const c of results.slice(shown, shown + PAGE)) frag.appendChild(tile(c));
    shown += PAGE;
    $("grid").appendChild(frag);
  }

  function tile(c) {
    const p = BJ[c.id];
    const el = document.createElement("button");
    el.className = "card";
    el.innerHTML = `
      <img src="${c.img}" alt="${esc(c.name)}" loading="lazy" width="744" height="1039">
      <div class="name">${esc(c.name)}</div>
      <div class="sub"><span>${esc(c.code)}</span><span class="rar ${c.rarity}">${esc(c.rarityKo)}</span></div>
      ${p ? `<div class="sub"><span class="price">${won(p.median)}</span><span>${p.n}건</span></div>`
          : `<div class="price none">시세 없음</div>`}`;
    el.addEventListener("click", () => openDetail(c));
    return el;
  }

  function openDetail(c) {
    const p = BJ[c.id];
    const query = `리프트바운드 ${c.code.replace(/\/.*/, "")}`;
    const kreamQuery = `리프트바운드 ${c.champsKo[0] || c.name}`;
    const bjSearch = `https://m.bunjang.co.kr/search/products?q=${encodeURIComponent(query)}`;
    const kreamSearch = `https://kream.co.kr/search?keyword=${encodeURIComponent(kreamQuery)}`;

    const rows = p ? p.listings.map((l) => `
      <tr>
        <td>${l.thumb ? `<img src="${esc(l.thumb)}" alt="" loading="lazy">` : ""}</td>
        <td>
          ${l.lang ? `<span class="tag ${l.lang === "KR" ? "kr" : ""}">${l.lang}</span>` : ""}
          ${l.graded ? `<span class="tag">그레이딩</span>` : ""}
          <a href="https://m.bunjang.co.kr/products/${l.pid}" target="_blank" rel="noopener">${esc(l.title)}</a>
        </td>
        <td class="p">${won(l.price)}</td>
      </tr>`).join("") : "";

    $("detail-body").innerHTML = `
      <div class="detail">
        <div><img src="${c.img}" alt="${esc(c.name)}"></div>
        <div>
          <h2>${esc(c.name)}</h2>
          <p class="facts">
            ${esc(c.code)} · ${esc(c.setName)} · <span class="rar ${c.rarity}">${esc(c.rarityKo)}</span>
            · ${esc(TYPE_KO[c.type] || c.type)}
            ${c.champsKo.length ? `· ${esc(c.champsKo.join(", "))}` : ""}
            ${c.variant ? `· ${c.variant === "alt" ? "대체 일러스트" : "시그니처"}` : ""}
            ${c.artist ? `<br>일러스트: ${esc(c.artist)}` : ""}
          </p>

          <div class="src"><h3>번개장터</h3><span class="note">${PRICES.updated ? `업데이트 ${esc(PRICES.updated)}` : ""}</span></div>
          ${p ? `
            <div class="stats">
              <div class="stat"><b>${won(p.median)}</b><span>중간값</span></div>
              <div class="stat"><b>${won(p.min)}</b><span>최저</span></div>
              <div class="stat"><b>${won(p.max)}</b><span>최고</span></div>
              <div class="stat"><b>${p.n}</b><span>매물</span></div>
            </div>
            <p class="note">판매 중인 매물의 호가 기준 (그레이딩 카드는 통계에서 제외). 제목에 카드 코드가 있는 매물만 매칭됩니다.</p>
            <table>${rows}</table>`
          : `<p class="note">매칭된 매물이 없습니다.</p>`}
          <div class="links"><a href="${bjSearch}" target="_blank" rel="noopener">번개장터에서 검색 ↗</a></div>

          <div class="src"><h3>KREAM</h3></div>
          <p class="note">KREAM은 자동 수집을 차단하므로 바로가기 링크만 제공합니다.</p>
          <div class="links"><a href="${kreamSearch}" target="_blank" rel="noopener">KREAM에서 검색 ↗</a></div>
        </div>
      </div>`;
    $("detail").showModal();
    openCard = c.id;
    saveState();
  }

  function saveState() {
    const p = new URLSearchParams();
    for (const k of ["q", "set", "rarity", "type"]) if ($(k).value) p.set(k, $(k).value);
    if ($("sort").value !== "code") p.set("sort", $("sort").value);
    if ($("priced").checked) p.set("priced", "1");
    if (openCard) p.set("card", openCard);
    const qs = p.toString();
    try { history.replaceState(null, "", qs ? `?${qs}` : location.pathname); } catch (_) { /* file:// in some browsers */ }
  }

  function fillSelect(sel, pairs) {
    for (const [value, label] of pairs) sel.add(new Option(label, value));
  }

  function uniq(a) { return [...new Set(a)]; }

  let timer;
  $("q").addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(apply, 120); });
  for (const id of ["set", "rarity", "type", "sort", "priced"]) $(id).addEventListener("change", apply);
  $("close").addEventListener("click", () => $("detail").close());
  $("detail").addEventListener("close", () => { openCard = ""; saveState(); });
  $("detail").addEventListener("click", (e) => { if (e.target === $("detail")) $("detail").close(); });

  new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && shown < results.length) more();
  }, { rootMargin: "800px" }).observe($("sentinel"));

  apply();
  const linked = CARDS.find((c) => c.id === params.get("card"));
  if (linked) openDetail(linked);
})();
