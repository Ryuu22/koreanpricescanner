// Riftbound KR price catalog. Plain JS, no build step.
// Data comes from data/cards.js (window.CARDS) and data/prices.js (window.PRICES).
(function () {
  "use strict";

  const CARDS = window.CARDS || [];
  const PRICES = window.PRICES || { bunjang: {} };
  const BJ = PRICES.bunjang || {};
  const PAGE = 120;

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
      ${p ? `<div class="sub"><span class="price">${won(p.median)}</span><span>${t.listings(p.n)}</span></div>`
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
