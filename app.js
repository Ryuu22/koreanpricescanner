// Riftbound KR price catalog. Plain JS, no build step.
// Data comes from data/cards.js (window.CARDS) and data/prices.js (window.PRICES);
// data/history.js (window.HISTORY) is loaded when a card is first opened.
(function () {
  "use strict";

  const CARDS = window.CARDS || [];
  const PRICES = window.PRICES || { bunjang: {} };
  const BJ = PRICES.bunjang || {};
  const SOLD = PRICES.sold || {};
  const BUNDLES = PRICES.bundles || {};
  const IN_BUNDLES = PRICES.inBundles || {};
  const PAGE = 120;
  const STALE_HOURS = 24;

  const RARITY_ORDER = ["common", "uncommon", "rare", "epic", "showcase"];
  const VARIANT_WORDS = { alt: "alt 대체일러 알트 얼터", signature: "signature 시그니처 사인 오버넘버" };

  const STRINGS = {
    ko: {
      brand: "리프트바운드 시세", switchTo: "EN",
      search: "카드명, 챔피언, 코드 검색 (징크스, Jinx, OGN-301)",
      filters: "필터", setLabel: "세트", rarityLabel: "희귀도", typeLabel: "유형", sortLabel: "정렬",
      showResults: (n) => `카드 ${n}장 보기`,
      allSets: "모든 세트", allRarities: "모든 희귀도", allTypes: "모든 유형",
      sortCode: "코드순", sortPriceDesc: "시세 높은순", sortPriceAsc: "시세 낮은순",
      sortListings: "매물 많은순", sortName: "이름순", pricedOnly: "시세 있는 카드", watchedOnly: "관심 카드",
      meta: (n, s, m, u) => `카드 ${n}장, 번개장터 매물 ${s}개 중 ${m}개 매칭. ${u} 업데이트.`,
      metaNoPrices: (n) => `카드 ${n}장. 아직 시세 데이터가 없습니다.`,
      count: (n) => `${n}장`,
      empty: "조건에 맞는 카드가 없습니다", emptyHint: "검색어나 필터를 바꿔 보세요.",
      emptyWatch: "관심 카드가 없습니다", emptyWatchHint: "카드를 열고 별표를 눌러 추가하세요.",
      noPrice: "시세 없음",
      types: { unit: "유닛", spell: "주문", legend: "전설", gear: "장비", battlefield: "전장", rune: "룬", "": "기타" },
      variants: { alt: "대체 일러스트", signature: "시그니처" },
      artist: "일러스트", bunjang: "번개장터 시세", updated: "업데이트",
      median: "중간값", min: "최저", max: "최고", count2: "매물",
      priceNote: "판매 중인 매물의 호가 기준. 구매글, 일괄 매물, 그레이딩 카드는 통계에서 제외합니다.",
      noListings: "지금은 매칭된 매물이 없습니다.",
      graded: "그레이딩",
      searchBunjang: "번개장터에서 검색",
      kreamNote: "KREAM은 자동 수집을 막고 있어 검색 링크만 제공합니다.",
      searchKream: "KREAM에서 검색",
      close: "닫기",
      stale: (h) => `시세가 ${h}시간 동안 업데이트되지 않았습니다. 실제 시세와 다를 수 있습니다.`,
      history: "시세 추이 (중간값)",
      historyLoading: "불러오는 중",
      historyShort: (d) => `${d}부터 시세를 기록하고 있습니다. 며칠 뒤에 추이를 볼 수 있습니다.`,
      chg7: "7일 변동",
      privacy: "개인정보처리방침",
      sold: "최근 거래 추정가",
      soldNote: (n) => `최근 30일 동안 목록에서 사라진 매물 ${n}건의 마지막 가격 (판매된 것으로 추정)`,
      bundlesTitle: "이 카드가 포함된 일괄·묶음 매물",
      bundlesNote: "여러 장을 함께 파는 매물이라 시세 통계에는 넣지 않습니다.",
      listingsTitle: "판매 중인 매물",
      outlier: "통계 제외 (다른 매물과 가격 차이가 큼)",
      watchAdd: "관심 카드", watchRemove: "관심 카드",
      navCards: "카드", navProducts: "미개봉 상품", navMovers: "급등·급락", navCalc: "덱 계산기", navAbout: "시세 안내",
      bySet: "세트별 시세",
      disclaimer: "리프트바운드 시세는 Riot Games의 보증을 받지 않았으며, Riot Games 또는 Riot Games 자산의 제작·관리에 공식적으로 관여하는 누구의 견해나 의견도 반영하지 않습니다. Riot Games 및 관련 모든 자산은 Riot Games, Inc.의 상표 또는 등록 상표입니다. 번개장터, KREAM과 제휴 관계가 없습니다.",
    },
    en: {
      brand: "Riftbound Prices", switchTo: "한국어",
      search: "Search card, champion or code (Jinx, 징크스, OGN-301)",
      filters: "Filters", setLabel: "Set", rarityLabel: "Rarity", typeLabel: "Type", sortLabel: "Sort",
      showResults: (n) => `Show ${n} cards`,
      allSets: "All sets", allRarities: "All rarities", allTypes: "All types",
      sortCode: "By code", sortPriceDesc: "Price: high to low", sortPriceAsc: "Price: low to high",
      sortListings: "Most listings", sortName: "By name", pricedOnly: "With prices", watchedOnly: "Watchlist",
      meta: (n, s, m, u) => `${n} cards, ${m} of ${s} Bunjang listings matched. Updated ${u}.`,
      metaNoPrices: (n) => `${n} cards. No price data yet.`,
      count: (n) => `${n} cards`,
      empty: "No cards match", emptyHint: "Try a different search or fewer filters.",
      emptyWatch: "Your watchlist is empty", emptyWatchHint: "Open a card and tap the star to add it.",
      noPrice: "No price",
      types: { unit: "Unit", spell: "Spell", legend: "Legend", gear: "Gear", battlefield: "Battlefield", rune: "Rune", "": "Other" },
      variants: { alt: "Alternate art", signature: "Signature" },
      artist: "Artist", bunjang: "Bunjang prices", updated: "Updated",
      median: "Median", min: "Lowest", max: "Highest", count2: "Listings",
      priceNote: "Asking prices of listings for sale, in Korean won. Buying posts, bundles and graded cards are left out of the stats.",
      noListings: "No matching listings right now.",
      graded: "Graded",
      searchBunjang: "Search on Bunjang",
      kreamNote: "KREAM blocks automated access, so only a search link is provided.",
      searchKream: "Search on KREAM",
      close: "Close",
      stale: (h) => `Prices haven't updated in ${h} hours and may be out of date.`,
      history: "Price history (median)",
      historyLoading: "Loading",
      historyShort: (d) => `Price history is recorded since ${d}. Check back in a few days for a trend.`,
      chg7: "7-day change",
      privacy: "Privacy policy",
      sold: "Estimated sold price",
      soldNote: (n) => `Last price of ${n} listings that disappeared in the last 30 days (probably sold)`,
      bundlesTitle: "Bundles and lots with this card",
      bundlesNote: "Several cards sold together, so they're not counted in the stats.",
      listingsTitle: "Listings for sale",
      outlier: "Not in stats (far from the other prices)",
      watchAdd: "Watch", watchRemove: "Watching",
      navCards: "Cards", navProducts: "Sealed", navMovers: "Movers", navCalc: "Deck calc", navAbout: "How it works",
      bySet: "Prices by set",
      disclaimer: "Riftbound Prices isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc. Not affiliated with Bunjang or KREAM.",
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
  const icon = (name, cls = "i") => `<svg class="${cls}" aria-hidden="true"><use href="icons.svg#${name}"/></svg>`;
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

  // Watchlist: card ids, kept in this browser only.
  const watched = new Set(readWatch());
  function readWatch() {
    try { return JSON.parse(localStorage.getItem("watch") || "[]"); } catch (_) { return []; }
  }
  function toggleWatch(id) {
    if (watched.has(id)) watched.delete(id); else watched.add(id);
    try { localStorage.setItem("watch", JSON.stringify([...watched])); } catch (_) { /* storage blocked */ }
  }

  // Restore state from URL
  for (const k of ["q", "sort"]) if (params.has(k)) $(k).value = params.get(k);
  $("priced").checked = params.get("priced") === "1";
  $("watched").checked = params.get("watched") === "1";

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
    $("filtersClose").setAttribute("aria-label", t.close);
    document.title = `${t.brand} · ${lang === "ko" ? "Riftbound Prices" : "리프트바운드 시세"}`;

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
    const onlyWatched = $("watched").checked;

    results = CARDS.filter((c) =>
      (!set || c.set === set) &&
      (!rarity || c.rarity === rarity) &&
      (!type || c.type === type) &&
      (!priced || c._price !== null) &&
      (!onlyWatched || watched.has(c.id)) &&
      terms.every((term) => c._search.includes(term)));

    const sort = $("sort").value;
    const byPrice = (dir) => (a, b) =>
      (a._price === null) - (b._price === null) || dir * ((a._price || 0) - (b._price || 0));
    if (sort === "price_desc") results.sort(byPrice(-1));
    else if (sort === "price_asc") results.sort(byPrice(1));
    else if (sort === "listings") results.sort((a, b) => ((BJ[b.id] || {}).n || 0) - ((BJ[a.id] || {}).n || 0));
    else if (sort === "name") results.sort((a, b) => nameOf(a).localeCompare(nameOf(b), lang));

    $("count").textContent = t.count(results.length.toLocaleString());
    $("filtersDone").textContent = t.showResults(results.length.toLocaleString());
    const active = [set, rarity, type, priced, onlyWatched].filter(Boolean).length;
    $("filterCount").hidden = !active;
    $("filterCount").textContent = active;
    $("grid").innerHTML = results.length ? "" : (onlyWatched && !watched.size
      ? `<p class="empty"><b>${t.emptyWatch}</b>${t.emptyWatchHint}</p>`
      : `<p class="empty"><b>${t.empty}</b>${t.emptyHint}</p>`);
    $("grid").style.display = results.length ? "" : "block";
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
    el.type = "button";
    el.innerHTML = `
      <div class="art"><img src="${c.img}" alt="${esc(nameOf(c))}" loading="lazy" width="744" height="1039"></div>
      <div class="name" title="${esc(nameOf(c))} ${esc(c.code)}">${watched.has(c.id) ? icon("star-fill", "star") : ""}${esc(nameOf(c))}</div>
      <div class="row">${p ? `<span class="price">${won(p.median)}</span>${p.chg7 ? pct(p.chg7) : ""}`
          : `<span class="none">${t.noPrice}</span>`}</div>`;
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
      <tr${l.outlier ? ` class="outlier" title="${t.outlier}"` : ""}>
        <td>${l.thumb ? `<img src="${esc(l.thumb)}" alt="" loading="lazy">` : ""}</td>
        <td>
          ${l.lang ? `<span class="tag ${l.lang === "KR" ? "kr" : ""}">${l.lang}</span>` : ""}
          ${l.graded ? `<span class="tag">${t.graded}</span>` : ""}
          <a href="https://m.bunjang.co.kr/products/${l.pid}" target="_blank" rel="noopener">${esc(l.title)}</a>
        </td>
        <td class="p">${won(l.price)}</td>
      </tr>`).join("") : "";

    const chips = [
      `<span class="chip">${esc(c.code)}</span>`,
      `<span class="chip">${esc(setNameOf(c))}</span>`,
      `<span class="chip rar ${c.rarity}">${esc(rarityOf(c))}</span>`,
      `<span class="chip">${esc(t.types[c.type] || c.type)}</span>`,
      ...champs.map((ch) => `<span class="chip">${esc(ch)}</span>`),
      c.variant ? `<span class="chip">${t.variants[c.variant]}</span>` : "",
    ].join("");
    const ext = (href, label) =>
      `<a class="btn" href="${href}" target="_blank" rel="noopener">${label}${icon("arrow-up-right")}</a>`;

    $("detail-body").innerHTML = `
      <div class="detail">
        <div class="d-art"><img src="${c.img}" alt="${esc(nameOf(c))}"></div>
        <div>
          <div class="d-head">
            <div>
              <h2>${esc(nameOf(c))}</h2>
              ${lang === "en" && c.name !== c.nameEn ? `<p class="alt-name">${esc(c.name)}</p>` : ""}
            </div>
            <button class="btn watch" id="watch" type="button"></button>
          </div>
          <div class="chips">${chips}</div>
          ${c.artist ? `<p class="artist">${t.artist} ${esc(c.artist)}</p>` : ""}

          <section class="sec">
            <div class="sec-head"><h3>${t.bunjang}</h3><span class="note">${PRICES.updated ? `${t.updated} ${esc(PRICES.updated)}` : ""}</span></div>
            ${p ? `
              <div class="stats">
                <div class="stat"><b>${won(p.median)}</b><span>${t.median}</span></div>
                <div class="stat"><b>${won(p.min)}</b><span>${t.min}</span></div>
                <div class="stat"><b>${won(p.max)}</b><span>${t.max}</span></div>
                <div class="stat"><b>${p.n}</b><span>${t.count2}</span></div>
              </div>
              ${p.chg7 != null ? `<p class="note">${t.chg7} ${p.chg7 ? pct(p.chg7) : "0%"}</p>` : ""}
              ${soldBlock(c.id)}
              <div class="hist" id="hist"><h3>${t.history}</h3><p class="note">${t.historyLoading}</p></div>
              <p class="note">${t.priceNote} <a href="about.html">${t.navAbout}</a></p>`
            : `<p class="note">${t.noListings}</p>${soldBlock(c.id)}`}
          </section>
          ${p ? `<section class="sec"><h3>${t.listingsTitle}</h3><table class="listings">${rows}</table></section>` : ""}
          ${bundleBlock(c.id)}
          <div class="links">${ext(bjSearch, t.searchBunjang)}${ext(kreamSearch, t.searchKream)}</div>
          <p class="note">${t.kreamNote}</p>
        </div>
      </div>`;
    const paintWatch = () => {
      const on = watched.has(c.id);
      $("watch").setAttribute("aria-pressed", on);
      $("watch").innerHTML = icon(on ? "star-fill" : "star") + (on ? t.watchRemove : t.watchAdd);
    };
    paintWatch();
    $("watch").addEventListener("click", () => {
      toggleWatch(c.id);
      paintWatch();
      if ($("watched").checked) apply();
      else refreshTile(c);
    });
    if (!$("detail").open) $("detail").showModal();
    openCard = c.id;
    saveState();
    if (p) loadHistory(() => { if (openCard === c.id) drawHistory(c.id); });
  }

  function soldBlock(id) {
    const s = SOLD[id];
    if (!s) return "";
    return `<div class="soldbox"><b>${won(s.median)}</b>${t.sold}<p class="note">${t.soldNote(s.n)}</p></div>`;
  }

  function bundleBlock(id) {
    const ls = (IN_BUNDLES[id] || []).map((pid) => BUNDLES[pid]).filter(Boolean);
    if (!ls.length) return "";
    return `<section class="sec"><h3>${t.bundlesTitle}</h3><p class="note">${t.bundlesNote}</p><table class="listings">${ls.map((l) => `
      <tr>
        <td>${l.thumb ? `<img src="${esc(l.thumb)}" alt="" loading="lazy">` : ""}</td>
        <td><a href="https://m.bunjang.co.kr/products/${l.pid}" target="_blank" rel="noopener">${esc(l.title)}</a></td>
        <td class="p">${won(l.price)}</td>
      </tr>`).join("")}</table></section>`;
  }

  // Redraw one tile in place (watch star changed) without re-running the search.
  function refreshTile(c) {
    const i = results.indexOf(c);
    const old = $("grid").children[i];
    if (i >= 0 && i < shown && old) old.replaceWith(tile(c));
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
      <div class="axis"><span>${esc(pts[0].date)}</span><span>${won(lo)} ~ ${won(hi)}</span><span>${esc(pts[pts.length - 1].date)}</span></div>`;
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
    if ($("watched").checked) p.set("watched", "1");
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
  for (const id of ["set", "rarity", "type", "sort", "priced", "watched"]) $(id).addEventListener("change", apply);
  $("lang").addEventListener("click", () => setLang(lang === "ko" ? "en" : "ko"));
  $("close").addEventListener("click", () => $("detail").close());
  // Mobile: filters open as a bottom sheet
  const sheet = (open) => document.body.classList.toggle("sheet-open", open);
  $("filtersBtn").addEventListener("click", () => sheet(true));
  for (const id of ["filtersClose", "filtersDone", "backdrop"]) $(id).addEventListener("click", () => sheet(false));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") sheet(false); });
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
