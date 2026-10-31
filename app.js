// Riftbound KR price catalog. Plain JS, no build step.
// Data comes from data/cards.js (window.CARDS) and data/prices.js (window.PRICES);
// data/history.js (window.HISTORY) is loaded when a card is first opened.
(function () {
  "use strict";

  const CARDS = window.CARDS || [];
  const PRICES = window.PRICES || { bunjang: {} };
  const BJ = PRICES.bunjang || {};
  const PAGE = 120;
  const STALE_HOURS = 24;

  const RARITY_ORDER = ["common", "uncommon", "rare", "epic", "showcase"];
  const VARIANT_WORDS = { alt: "alt 대체일러 알트 얼터", signature: "signature 시그니처 사인 오버넘버" };

  const STRINGS = {
    ko: {
      switchTo: "English",
      search: "카드명, 챔피언, 코드 검색 (e.g. 징크스, Jinx, OGN-301)",
      allSets: "모든 세트", allRarities: "모든 희귀도", allTypes: "모든 유형",
      sortCode: "코드순", sortPriceDesc: "시세 높은순", sortPriceAsc: "시세 낮은순",
      sortListings: "매물 많은순", sortName: "이름순", pricedOnly: "시세 있는 카드만",
      meta: (n, s, m, u) => `카드 ${n}장 · 번개장터 매물 ${s}개 중 ${m}개 매칭 · 업데이트 ${u}`,
      metaNoPrices: (n) => `카드 ${n}장 · 시세 데이터 없음 (scripts/scrape_bunjang.py 실행)`,
      count: (n) => `${n}장`,
      listings: (n) => `${n}건`,
      noPrice: "시세 없음",
      types: { unit: "유닛", spell: "주문", legend: "전설", gear: "장비", battlefield: "전장", rune: "룬", "": "기타" },
      variants: { alt: "대체 일러스트", signature: "시그니처" },
      artist: "일러스트", bunjang: "번개장터", updated: "업데이트",
      median: "중간값", min: "최저", max: "최고", count2: "매물",
      priceNote: "판매 중인 매물의 호가 기준 (그레이딩 카드는 통계에서 제외). 제목에 카드 코드가 있는 매물만 매칭됩니다.",
      noListings: "매칭된 매물이 없습니다.",
      graded: "그레이딩",
      searchBunjang: "번개장터에서 검색 ↗",
      kreamNote: "KREAM은 자동 수집을 차단하므로 바로가기 링크만 제공합니다.",
      searchKream: "KREAM에서 검색 ↗",
      close: "닫기",
      stale: (h) => `시세가 ${h}시간 동안 업데이트되지 않았습니다. 실제 시세와 다를 수 있습니다.`,
      history: "시세 추이 (중간값)",
      historyLoading: "불러오는 중…",
      historyShort: (d) => `${d}부터 시세를 기록하고 있습니다. 며칠 뒤에 추이를 볼 수 있습니다.`,
      chg7: "7일 변동",
      privacy: "개인정보처리방침",
      disclaimer: "Riftbound KR Prices는 Riot Games의 보증을 받지 않았으며, Riot Games 또는 Riot Games 자산의 제작·관리에 공식적으로 관여하는 누구의 견해나 의견도 반영하지 않습니다. Riot Games 및 관련 모든 자산은 Riot Games, Inc.의 상표 또는 등록 상표입니다. 번개장터·KREAM과 제휴 관계가 없습니다.",
    },
    en: {
      switchTo: "한국어",
      search: "Search card, champion or code (e.g. Jinx, 징크스, OGN-301)",
      allSets: "All sets", allRarities: "All rarities", allTypes: "All types",
      sortCode: "By code", sortPriceDesc: "Price: high to low", sortPriceAsc: "Price: low to high",
      sortListings: "Most listings", sortName: "By name", pricedOnly: "Only cards with prices",
      meta: (n, s, m, u) => `${n} cards · ${m} of ${s} Bunjang listings matched · updated ${u}`,
      metaNoPrices: (n) => `${n} cards · no price data yet (run scripts/scrape_bunjang.py)`,
      count: (n) => `${n} cards`,
      listings: (n) => `${n} listing${n === 1 ? "" : "s"}`,
      noPrice: "No price",
      types: { unit: "Unit", spell: "Spell", legend: "Legend", gear: "Gear", battlefield: "Battlefield", rune: "Rune", "": "Other" },
      variants: { alt: "Alternate art", signature: "Signature" },
      artist: "Artist", bunjang: "Bunjang (번개장터)", updated: "Updated",
      median: "Median", min: "Lowest", max: "Highest", count2: "Listings",
      priceNote: "Asking prices of listings currently for sale (graded cards excluded from stats). Only listings with the card code in the title are matched. Prices in Korean won.",
      noListings: "No matching listings.",
      graded: "Graded",
      searchBunjang: "Search on Bunjang ↗",
      kreamNote: "KREAM blocks automated access, so only a search link is provided.",
      searchKream: "Search on KREAM ↗",
      close: "Close",
      stale: (h) => `Prices haven't updated in ${h} hours and may be out of date.`,
      history: "Price history (median)",
      historyLoading: "Loading…",
      historyShort: (d) => `Price history is recorded since ${d}. Check back in a few days for a trend.`,
      chg7: "7-day change",
      privacy: "Privacy policy",
      disclaimer: "Riftbound KR Prices isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc. Not affiliated with Bunjang or KREAM.",
    },
  };

  const $ = (id) => document.getElementById(id);
  const norm = (s) => s.toLowerCase().replace(/[\s\-_/.,'’]/g, "");
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const params = new URLSearchParams(location.search);
  let lang = params.get("lang") || storedLang() ||
    ((navigator.language || "").toLowerCase().startsWith("ko") ? "ko" : "en");
  if (!STRINGS[lang]) lang = "en";
  let t = STRINGS[lang];

  const pct = (n) => `<span class="chg ${n > 0 ? "up" : "down"}">${n > 0 ? "▲" : "▼"}${Math.abs(n)}%</span>`;
  const won = (n) => lang === "ko" ? n.toLocaleString("ko-KR") + "원" : "₩" + n.toLocaleString("en-US");
  const nameOf = (c) => lang === "ko" ? c.name : c.nameEn || c.name;
  const setNameOf = (c) => lang === "ko" ? c.setName : c.setNameEn || c.setName;
  const rarityOf = (c) => lang === "ko" ? c.rarityKo : c.rarityEn || c.rarityKo;
  const champsOf = (c) => lang === "ko" ? c.champsKo : c.champs;

  // Precompute a normalized search string per card (both languages always searchable).
  for (const c of CARDS) {
    c._search = norm([
      c.name, c.nameEn || "", c.code, c.code.replace(/\/.*/, ""), c.set + c.num,
      c.setName, c.setNameEn || "", ...c.champs, ...c.champsKo, c.artist,
      c.rarityKo, c.rarityEn || "", STRINGS.ko.types[c.type] || "", STRINGS.en.types[c.type] || c.type,
      VARIANT_WORDS[c.variant] || "",
    ].join(" "));
    c._price = BJ[c.id] ? BJ[c.id].median : null;
  }

  // Restore state from URL
  for (const k of ["q", "sort"]) if (params.has(k)) $(k).value = params.get(k);
  $("priced").checked = params.get("priced") === "1";

  let openCard = "";
  let results = [];
  let shown = 0;

  // Static labels and filter options for the current language.
  function translate() {
    document.documentElement.lang = lang;
    for (const el of document.querySelectorAll("[data-i18n]")) el.textContent = t[el.dataset.i18n];
    $("q").placeholder = t.search;
    $("lang").textContent = t.switchTo;
    $("close").setAttribute("aria-label", t.close);

    fillSelect($("set"), uniq(CARDS.map((c) => c.set)).map((s) =>
      [s, `${s} · ${setNameOf(CARDS.find((c) => c.set === s))}`]));
    fillSelect($("rarity"), RARITY_ORDER.map((r) =>
      [r, rarityOf(CARDS.find((c) => c.rarity === r) || { rarityKo: r })]));
    fillSelect($("type"), uniq(CARDS.map((c) => c.type)).map((ty) => [ty, t.types[ty] || ty]));

    $("meta").textContent = PRICES.updated
      ? t.meta(CARDS.length, PRICES.scanned, PRICES.matched, PRICES.updated)
      : t.metaNoPrices(CARDS.length);
    const age = pricesAgeHours();
    $("stale").hidden = !(age >= STALE_HOURS);
    $("stale").textContent = age >= STALE_HOURS ? t.stale(Math.floor(age)) : "";
  }

  // Older prices.js files only have "updated" (Korean time, no zone).
  function pricesAgeHours() {
    const at = Date.parse(PRICES.updatedAt || (PRICES.updated || "").replace(" ", "T") + ":00+09:00");
    return isNaN(at) ? null : (Date.now() - at) / 3600e3;
  }

  function apply() {
    const terms = $("q").value.trim().split(/\s+/).map(norm).filter(Boolean);
    const set = $("set").value, rarity = $("rarity").value, type = $("type").value;
    const priced = $("priced").checked;

    results = CARDS.filter((c) =>
      (!set || c.set === set) &&
      (!rarity || c.rarity === rarity) &&
      (!type || c.type === type) &&
      (!priced || c._price !== null) &&
      terms.every((term) => c._search.includes(term)));

    const sort = $("sort").value;
    const byPrice = (dir) => (a, b) =>
      (a._price === null) - (b._price === null) || dir * ((a._price || 0) - (b._price || 0));
    if (sort === "price_desc") results.sort(byPrice(-1));
    else if (sort === "price_asc") results.sort(byPrice(1));
    else if (sort === "listings") results.sort((a, b) => ((BJ[b.id] || {}).n || 0) - ((BJ[a.id] || {}).n || 0));
    else if (sort === "name") results.sort((a, b) => nameOf(a).localeCompare(nameOf(b), lang));

    $("count").textContent = t.count(results.length);
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
      <img src="${c.img}" alt="${esc(nameOf(c))}" loading="lazy" width="744" height="1039">
      <div class="name">${esc(nameOf(c))}</div>
      <div class="sub"><span>${esc(c.code)}</span><span class="rar ${c.rarity}">${esc(rarityOf(c))}</span></div>
      ${p ? `<div class="sub"><span class="price">${won(p.median)}${p.chg7 ? " " + pct(p.chg7) : ""}</span><span>${t.listings(p.n)}</span></div>`
          : `<div class="price none">${t.noPrice}</div>`}`;
    el.addEventListener("click", () => openDetail(c));
    return el;
  }

  function openDetail(c) {
    const p = BJ[c.id];
    const query = `리프트바운드 ${c.code.replace(/\/.*/, "")}`;
    const kreamQuery = `리프트바운드 ${c.champsKo[0] || c.name}`;
    const bjSearch = `https://m.bunjang.co.kr/search/products?q=${encodeURIComponent(query)}`;
    const kreamSearch = `https://kream.co.kr/search?keyword=${encodeURIComponent(kreamQuery)}`;
    const champs = champsOf(c);

    const rows = p ? p.listings.map((l) => `
      <tr>
        <td>${l.thumb ? `<img src="${esc(l.thumb)}" alt="" loading="lazy">` : ""}</td>
        <td>
          ${l.lang ? `<span class="tag ${l.lang === "KR" ? "kr" : ""}">${l.lang}</span>` : ""}
          ${l.graded ? `<span class="tag">${t.graded}</span>` : ""}
          <a href="https://m.bunjang.co.kr/products/${l.pid}" target="_blank" rel="noopener">${esc(l.title)}</a>
        </td>
        <td class="p">${won(l.price)}</td>
      </tr>`).join("") : "";

    $("detail-body").innerHTML = `
      <div class="detail">
        <div><img src="${c.img}" alt="${esc(nameOf(c))}"></div>
        <div>
          <h2>${esc(nameOf(c))}</h2>
          ${lang === "en" && c.name !== c.nameEn ? `<p class="facts alt-name">${esc(c.name)}</p>` : ""}
          <p class="facts">
            ${esc(c.code)} · ${esc(setNameOf(c))} · <span class="rar ${c.rarity}">${esc(rarityOf(c))}</span>
            · ${esc(t.types[c.type] || c.type)}
            ${champs.length ? `· ${esc(champs.join(", "))}` : ""}
            ${c.variant ? `· ${t.variants[c.variant]}` : ""}
            ${c.artist ? `<br>${t.artist}: ${esc(c.artist)}` : ""}
          </p>

          <div class="src"><h3>${t.bunjang}</h3><span class="note">${PRICES.updated ? `${t.updated} ${esc(PRICES.updated)}` : ""}</span></div>
          ${p ? `
            <div class="stats">
              <div class="stat"><b>${won(p.median)}</b><span>${t.median}</span></div>
              <div class="stat"><b>${won(p.min)}</b><span>${t.min}</span></div>
              <div class="stat"><b>${won(p.max)}</b><span>${t.max}</span></div>
              <div class="stat"><b>${p.n}</b><span>${t.count2}</span></div>
            </div>
            ${p.chg7 != null ? `<p class="note">${t.chg7}: ${p.chg7 ? pct(p.chg7) : "0%"}</p>` : ""}
            <div class="hist" id="hist"><h3>${t.history}</h3><p class="note">${t.historyLoading}</p></div>
            <p class="note">${t.priceNote}</p>
            <table>${rows}</table>`
          : `<p class="note">${t.noListings}</p>`}
          <div class="links"><a href="${bjSearch}" target="_blank" rel="noopener">${t.searchBunjang}</a></div>

          <div class="src"><h3>KREAM</h3></div>
          <p class="note">${t.kreamNote}</p>
          <div class="links"><a href="${kreamSearch}" target="_blank" rel="noopener">${t.searchKream}</a></div>
        </div>
      </div>`;
    if (!$("detail").open) $("detail").showModal();
    openCard = c.id;
    saveState();
    if (p) loadHistory(() => { if (openCard === c.id) drawHistory(c.id); });
  }

  // history.js is only needed in the detail view, so it's loaded on first use
  // (a script tag rather than fetch, which keeps the page working from file://).
  let historyState = window.HISTORY ? "ready" : "";
  const historyWaiting = [];
  function loadHistory(done) {
    if (historyState === "ready" || historyState === "failed") return done();
    historyWaiting.push(done);
    if (historyState === "loading") return;
    historyState = "loading";
    const s = document.createElement("script");
    s.src = `data/history.js?v=${encodeURIComponent(PRICES.updatedAt || PRICES.updated || "")}`;
    const finish = (state) => () => { historyState = state; historyWaiting.splice(0).forEach((f) => f()); };
    s.onload = finish("ready");
    s.onerror = finish("failed");
    document.head.appendChild(s);
  }

  function drawHistory(id) {
    const box = $("hist");
    const H = window.HISTORY;
    if (!box) return;
    if (!H || !H.cards[id]) { box.remove(); return; }
    const pts = H.cards[id].map((v, i) => v && { date: H.dates[i], median: v[0] }).filter(Boolean);
    if (pts.length < 2) {
      box.innerHTML = `<h3>${t.history}</h3><p class="note">${t.historyShort(esc(H.dates[0]))}</p>`;
      return;
    }
    const W = 600, HT = 150, PAD = 6;
    const vals = pts.map((p) => p.median);
    const lo = Math.min(...vals), hi = Math.max(...vals), span = hi - lo;
    const day = (d) => Date.parse(d) / 864e5;
    const d0 = day(pts[0].date), dspan = day(pts[pts.length - 1].date) - d0 || 1;
    const x = (p) => (PAD + (day(p.date) - d0) / dspan * (W - 2 * PAD)).toFixed(1);
    // A price that never changed is drawn across the middle.
    const y = (p) => (span ? PAD + (1 - (p.median - lo) / span) * (HT - 2 * PAD) : HT / 2).toFixed(1);
    const line = pts.map((p) => `${x(p)},${y(p)}`).join(" ");
    const dots = pts.map((p) =>
      `<circle cx="${x(p)}" cy="${y(p)}" r="3"><title>${esc(p.date)}: ${won(p.median)}</title></circle>`).join("");
    box.innerHTML = `
      <h3>${t.history}</h3>
      <svg viewBox="0 0 ${W} ${HT}" role="img" aria-label="${t.history}">
        <polygon class="area" points="${x(pts[0])},${HT} ${line} ${x(pts[pts.length - 1])},${HT}"></polygon>
        <polyline points="${line}"></polyline>${dots}
      </svg>
      <div class="axis"><span>${esc(pts[0].date)}</span><span>${won(lo)} – ${won(hi)}</span><span>${esc(pts[pts.length - 1].date)}</span></div>`;
  }

  function setLang(next) {
    lang = next;
    t = STRINGS[lang];
    try { localStorage.setItem("lang", lang); } catch (_) { /* storage blocked */ }
    translate();
    apply();
    const card = CARDS.find((c) => c.id === openCard);
    if (card) openDetail(card);
  }

  function storedLang() {
    try { return localStorage.getItem("lang"); } catch (_) { return null; }
  }

  function saveState() {
    const p = new URLSearchParams();
    for (const k of ["q", "set", "rarity", "type"]) if ($(k).value) p.set(k, $(k).value);
    if ($("sort").value !== "code") p.set("sort", $("sort").value);
    if ($("priced").checked) p.set("priced", "1");
    if (openCard) p.set("card", openCard);
    p.set("lang", lang);
    try { history.replaceState(null, "", `?${p}`); } catch (_) { /* file:// in some browsers */ }
  }

  // Replace all options except the leading "All ..." one, keeping the selection.
  function fillSelect(sel, pairs) {
    const value = sel.value;
    while (sel.options.length > 1) sel.remove(1);
    for (const [v, label] of pairs) sel.add(new Option(label, v));
    sel.value = value;
  }

  function uniq(a) { return [...new Set(a)]; }

  let timer;
  $("q").addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(apply, 120); });
  for (const id of ["set", "rarity", "type", "sort", "priced"]) $(id).addEventListener("change", apply);
  $("lang").addEventListener("click", () => setLang(lang === "ko" ? "en" : "ko"));
  $("close").addEventListener("click", () => $("detail").close());
  $("detail").addEventListener("close", () => { openCard = ""; saveState(); });
  $("detail").addEventListener("click", (e) => { if (e.target === $("detail")) $("detail").close(); });

  new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && shown < results.length) more();
  }, { rootMargin: "800px" }).observe($("sentinel"));

  // Filter values from the URL must be set after the options exist.
  translate();
  for (const k of ["set", "rarity", "type"]) if (params.has(k)) $(k).value = params.get(k);
  apply();
  const linked = CARDS.find((c) => c.id === params.get("card"));
  if (linked) openDetail(linked);
})();
