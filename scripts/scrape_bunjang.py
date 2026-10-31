#!/usr/bin/env python3
"""Collect Riftbound listings from Bunjang (번개장터) and match them to cards and products.

Instead of one request per card, this pages through the broad Riftbound search
results (a few dozen polite requests) and sorts every listing title:
  - buying posts (삽니다, [구매], 매입) are dropped;
  - a single card, by collector code ("OGN 301/298", "오리진 301", "SFD-227*") or,
    failing that, by its name ("뻔뻔한 해적", "카이사 생존자 얼터");
  - a bundle: several cards in one listing (shown on each card, not in its stats);
  - a sealed product (T1 Signature Edition, Origins box, ...), see PRODUCTS.
Listings that disappear between runs are recorded as probably sold, which gives an
estimated sold price next to the asking prices.

Output: data/prices.js   window.PRICES = {...}
        data/history.js  window.HISTORY = {...}  one price point per card/product per day
        data/seen.json   listings seen last run + probable sales (input for the next run)

A run that finds far fewer listings than the last one (Bunjang changed its API or
blocked us) exits with an error instead of overwriting good prices; --force saves anyway.
--raw FILE reuses saved search results (from --save-raw FILE) instead of searching, and
--report prints how each listing was matched, for checking the matching rules.
Run build_catalog.py first. Standard library only.
"""
import datetime
import json
import os
import re
import statistics
import sys
import time
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
API = "https://api.bunjang.co.kr/api/search/v8/web/search"
UA = "koreanpricescanner/0.1 (personal price research)"
QUERIES = ["리프트바운드", "riftbound"]
PAGE_SIZE = 60
MAX_PAGES = 60  # per query
DELAY = 1.0     # seconds between requests
MIN_SHARE = 0.5     # refuse to save a run that finds under half the listings of the last one
HISTORY_DAYS = 365
SOLD_DAYS = 30      # estimated sold price uses sales from the last 30 days
SOLD_KEEP_DAYS = 90
COMPLETE_SHARE = 0.9  # only count disappeared listings as sold when this run saw nearly as many as the last
OUTLIER = 4         # with 4+ listings, prices under median/4 or over median*4 are left out of the stats

SET_WORDS = {  # Korean / English set names sellers write instead of the code
    "OGN": ["오리진", "origins"],
    "SFD": ["스피릿포지드", "스피릿 포지드", "spiritforged"],
    "UNL": ["언리시드", "unleashed"],
    "VEN": ["벤데타", "vendetta"],
    "RAD": ["레디언스", "radiance"],
}
LANG_PATTERNS = [
    ("KR", r"한글|한판|국문|국내판|korean|\bkr\b"),
    ("EN", r"영문|영판|영어판|english|\ben\b"),
    ("CN", r"중국|중문|중판|chinese|\bcn\b"),
]
GRADED = r"psa|bgs|cgc|brg|그레이딩|등급"
SIGNATURE = r"시그니처|signature|사인|싸인|\*"
ALT = r"알트|alt|얼터|대체 ?일러|이레귤러|풀아트|full ?art"
BUNDLE = r"일괄|묶음|bulk|덱소스|완덱|풀세트|\s등(?:\s|$)|\d+종"
# "3장" without "장당/개당": the price is probably for all the copies, so it's a lot.
COPIES = r"(?<![\d/])(?:[2-9]|\d{2,})\s*장(?!당)"
PER_COPY = r"장당|개당"
PROMO = r"프로모|promo"
SEALED = r"카톤|부스터|booster|carton|\d\s*박스|\d\s*팩"
UNITS = r"장|p\b|팩|개|입|박스|카톤|box|pack"
# Buying posts state the price someone wants to pay, not an asking price.
WANTED = r"삽니다|구합니다|구해요|구함|매입|구매합니다|구매글|[(\[*]\s*구매\s*[)\]*]|^구매"

# Name matching works on titles with spaces and punctuation removed ("웅장한책략").
N_SIGNATURE = r"시그니처|시그니쳐|signature|사인|싸인|\*"
N_ALT = r"알트|얼터|alt|aa|대체일러|풀아트|fullart"
N_OVER = r"오버넘버|overnumber|오버넘"

# Sealed products: (id, Korean name, English name, patterns that must all match the
# normalized title, pattern that must not). The first product that matches wins, so
# specific ones come first. The Korean Origins box is 14 jumbo packs (14입, 뚱팩).
PRODUCTS = [
    ("sealed-t1-player-bundle", "T1 플레이어 번들", "T1 Player Bundle",
     [r"t1|티원", r"플레이어번들|playerbundle"], r"낱장"),
    ("sealed-t1-signature", "T1 시그니처 에디션 (미개봉)", "T1 Signature Edition (sealed)",
     [r"t1|티원", r"시그니처|시그니쳐|signature|에디션|edition|한정판|미개봉"],
     # opened boxes are sold by the player card inside
     r"풀박스|페이커|구마유시|케리아|오너|도란|세라핀|갈리오|암베사|신짜오|미스포츈|(?<!미)개봉|아크릴|nosignature|박스및"),
    ("sealed-kda-couture", "K/DA 쿠튀르 컬렉션", "K/DA Couture Collection",
     [r"k/?da|케이디에이", r"쿠튀르|드로잉|couture"], r"카드x|카드없"),
    ("sealed-ogn-carton", "오리진 카톤", "Origins carton", [r"카톤|carton"], None),
    ("sealed-ogn-box", "오리진 부스터 박스 (14팩)", "Origins booster box (14 packs)",
     [r"오리진|origin|오리지널|점보|뚱팩|부스터", r"박스|box|14팩|14입|14p|슈링크"], r"(?<!1)5입"),
    ("sealed-proving-grounds", "증명의 전장", "Proving Grounds", [r"증명의전장|provinggrounds"], r"개별"),
    ("sealed-msi-yasuo", "2026 MSI 야스오 프로모", "2026 MSI Yasuo promo",
     [r"야스오", r"프로모|promo|msi"], r"징크스|카이사|챔피언유닛"),
    ("sealed-msi-jinx", "2026 MSI 징크스 프로모", "2026 MSI Jinx promo", [r"징크스", r"msi|팬페"], r"야스오"),
    ("sealed-nexus-night", "넥서스 나이트 프로모 팩", "Nexus Nights promo pack",
     [r"넥서스나이트|nexusnight", r"팩|pack"], None),
]
# Not the sealed product itself: empty boxes and cases, single cards pulled from it,
# opened boxes, or several units in one listing.
NOT_SEALED = (r"빈박스|공박스|케이스만|카드제외|구성품|전시케이스|케이스\+|단품|시리얼|씨리얼|넘버링|사인|싸인|"
              r"바인더|앨범|슬리브|파일|토큰|코인|메달|매트|장패드|다수|\+|&|psa|brg|bgs|"
              r"(?<!미)개봉|일괄|\d+장|[2-9]\s*(?:박스|개|세트|카톤)|\d{2,}\s*(?:박스|개|세트|카톤)|총\s*\d|각\s*\d")


def search(query, cursor=None):
    params = {"q": query, "policyKey": "pw.product.keyword", "sort": "latest", "size": PAGE_SIZE}
    if cursor:
        params["cursor"] = cursor
    req = urllib.request.Request(f"{API}?{urllib.parse.urlencode(params)}", headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        sr = json.load(r)["data"]["responses"]["mainGrid"]["searchResponse"]
    return sr["data"], sr.get("nextCursor")


def collect():
    listings = {}
    for q in QUERIES:
        cursor = None
        for page in range(MAX_PAGES):
            items, cursor = search(q, cursor)
            for it in items:
                if it.get("type") == "PRODUCT" and not it.get("ad"):
                    listings[it["pid"]] = it
            print(f"  {q!r} page {page}: {len(items)} items, {len(listings)} unique")
            time.sleep(DELAY)
            if not items or not cursor:
                break
    return list(listings.values())


def build_index(cards):
    """(set, number) -> {variant: card}, plus denominator -> set."""
    by_num, denom = {}, {}
    for c in cards:
        by_num.setdefault((c["set"], c["num"].lstrip("0") or "0"), {})[c["variant"]] = c
        m = re.search(r"/(\d+)$", c["code"])
        if m and not c["num"].startswith(("SP", "R", "T")):
            denom.setdefault(m.group(1).lstrip("0"), set()).add(c["set"])
    return by_num, {d: s.pop() for d, s in denom.items() if len(s) == 1}


def match(title, by_num, denom_to_set):
    """Return the card ids a title refers to (more than one = bundle)."""
    t = title.lower()
    found = []
    # OGN-301, OGN 301, ogn301*
    for m in re.finditer(r"\b(ogn|ogs|sfd|unl|ven|rad)\s*[-_ ]?\s*(sp|r|t)?(\d{1,3})([a*]?)", t):
        found.append((m.group(1).upper(), (m.group(2) or "").upper() + m.group(3).lstrip("0"), m.group(4)))
    # 301/298 (set inferred from the denominator)
    if not found:
        for m in re.finditer(r"(?<!\d)(\d{1,3})([a*]?)\s*/\s*(\d{2,3})(?!\d)", t):
            s = denom_to_set.get(m.group(3).lstrip("0"))
            if s:
                found.append((s, m.group(1).lstrip("0"), m.group(2)))
    # 오리진 301
    if not found:
        for s, words in SET_WORDS.items():
            for w in words:
                for m in re.finditer(re.escape(w) + r"\s*(\d{1,3})([a*]?)(?!\d|\s*(?:" + UNITS + "))", t):
                    found.append((s, m.group(1).lstrip("0"), m.group(2)))

    ids = []
    for s, num, suffix in found:
        variants = by_num.get((s, num))
        if not variants:
            continue
        if suffix == "*" or (re.search(SIGNATURE, t) and "signature" in variants):
            card = variants.get("signature")
        elif suffix == "a" or (re.search(ALT, t) and "alt" in variants):
            card = variants.get("alt")
        else:
            card = variants.get("")
        card = card or next(iter(variants.values()))
        if card["id"] not in ids:
            ids.append(card["id"])
    return ids


def norm(s):
    return re.sub(r"[\s\-_/.,'’!?()\[\]:·~]", "", s.lower())


def is_overnumber(c):
    """Numbered above the set size, e.g. OGN-301/298."""
    m = re.search(r"-\D*(\d+)[a-z*]?/(\d+)$", c["code"])
    return bool(m) and int(m.group(1)) > int(m.group(2))


def build_name_index(cards):
    """Normalized card name -> cards with that name (variants and reprints share names).

    Left out: champion names ("징크스" is on dozens of cards), very short Korean names
    and short English names, which turn up inside unrelated titles.
    """
    champs = {norm(ch) for c in cards for ch in c.get("champsKo", []) + c.get("champs", [])}
    names = {}
    for c in cards:
        for n in {c["name"], c.get("nameEn") or ""}:
            k = norm(n)
            hangul = re.search("[가-힣]", n)
            if not k or k in champs or len(k) < (3 if hangul else 8):
                continue
            if c not in names.setdefault(k, []):
                names[k].append(c)
    return names


def pick_variant(candidates, t):
    """From cards sharing a name, the one the (normalized) title means, or None if unclear."""
    if re.search(N_SIGNATURE, t):
        pool = [c for c in candidates if c["variant"] == "signature"]
    elif re.search(N_ALT, t):
        pool = [c for c in candidates if c["variant"] == "alt"]
    elif re.search(N_OVER, t):
        pool = [c for c in candidates if is_overnumber(c) and c["variant"] != "signature"]
    else:
        pool = [c for c in candidates if not c["variant"] and not is_overnumber(c)]
    if len(pool) > 1:  # reprints in several sets: the title has to name the set
        pool = [c for c in pool if any(w.replace(" ", "") in t for w in SET_WORDS.get(c["set"], []))
                or c["set"].lower() in t]
    return pool[0] if len(pool) == 1 else None


def match_name(title, names):
    """Card ids by card name, for titles without a collector code (more than one = bundle)."""
    t = norm(title)
    found = [k for k in names if k in t]
    found = [k for k in found if not any(k != o and k in o for o in found)]  # "포로" inside "뾰로통한포로"
    ids = []
    for k in found:
        card = pick_variant(names[k], t)
        if card is None and len(found) > 1:
            card = next((c for c in names[k] if not c["variant"]), names[k][0])  # bundle: any printing will do
        if card and card["id"] not in ids:
            ids.append(card["id"])
    return ids


def match_product(title):
    t = norm(title)
    if re.search(NOT_SEALED, t):
        return None
    return next((pid for pid, _, _, pats, unless in PRODUCTS
                 if all(re.search(p, t) for p in pats) and not (unless and re.search(unless, t))), None)


def summarize(listings):
    """Stats over listings sorted by price; graded cards and far-off prices left out."""
    listings.sort(key=lambda l: l["price"])
    prices = [l["price"] for l in listings if not l.get("graded")] or [l["price"] for l in listings]
    if len(prices) >= 4:
        mid = statistics.median(prices)
        kept = [p for p in prices if mid / OUTLIER <= p <= mid * OUTLIER]
        for l in listings:
            if not mid / OUTLIER <= l["price"] <= mid * OUTLIER:
                l["outlier"] = True
        prices = kept or prices
    return {"n": len(listings), "min": min(prices), "median": int(statistics.median(prices)),
            "max": max(prices), "listings": listings}


def listing(it, **extra):
    return {"pid": it["pid"], "title": it["name"], "price": it.get("price") or 0,
            "thumb": (it.get("productImage") or "").replace("{res}", "200"),
            "updated": it.get("updatedAt", ""), **extra}


def track_sales(raw, singles, today, complete):
    """Compare with the last run: matched listings that vanished were probably sold.

    singles: {pid: (item id, price, title)} for this run. Returns {item id: sold stats}.
    """
    path = os.path.join(ROOT, "data", "seen.json")
    seen = {"listings": {}, "sold": []}
    if os.path.exists(path):
        with open(path, encoding="utf8") as f:
            seen = json.load(f)
    live = {str(it["pid"]) for it in raw}
    if complete:
        for pid, (item, price, title) in seen["listings"].items():
            if pid not in live:
                seen["sold"].append({"pid": pid, "item": item, "price": price, "title": title, "date": today})
    cutoff = (datetime.date.fromisoformat(today) - datetime.timedelta(days=SOLD_KEEP_DAYS)).isoformat()
    seen["sold"] = [s for s in seen["sold"] if s["date"] >= cutoff]
    seen["listings"] = {str(pid): v for pid, v in singles.items()}
    with open(path + ".tmp", "w", encoding="utf8") as f:
        json.dump(seen, f, ensure_ascii=False, separators=(",", ":"))
    os.replace(path + ".tmp", path)

    recent = (datetime.date.fromisoformat(today) - datetime.timedelta(days=SOLD_DAYS)).isoformat()
    by_item = {}
    for s in seen["sold"]:
        if s["date"] >= recent:
            by_item.setdefault(s["item"], []).append(s)
    return {item: {"n": len(ss), "median": int(statistics.median(s["price"] for s in ss)),
                   "recent": sorted(ss, key=lambda s: s["date"], reverse=True)[:5]}
            for item, ss in by_item.items()}


def tag(title):
    t = title.lower()
    lang = next((code for code, pat in LANG_PATTERNS if re.search(pat, t)), "")
    return lang, bool(re.search(GRADED, t))


def load_js(name, var):
    """Read back a generated data/<name> file (window.<var> = {...};), or None."""
    path = os.path.join(ROOT, "data", name)
    if not os.path.exists(path):
        return None
    with open(path, encoding="utf8") as f:
        text = f.read()
    return json.loads(re.search(rf"window\.{var} = (.*);\s*$", text, re.S).group(1))


def write_js(name, var, value):
    path = os.path.join(ROOT, "data", name)
    # Write to a temp file and swap it in, so the live site never serves a half-written file.
    with open(path + ".tmp", "w", encoding="utf8") as f:
        f.write("// Generated by scripts/scrape_bunjang.py\n")
        f.write(f"window.{var} = " + json.dumps(value, ensure_ascii=False, separators=(",", ":")) + ";\n")
    os.replace(path + ".tmp", path)


def load_cards():
    return load_js("cards.js", "CARDS")


def update_history(stats, today):
    """Add today's [median, min, n] per card (a later run the same day replaces it).

    Returns the history: {"dates": [...], "cards": {id: [[median, min, n] or None per date]}}.
    """
    hist = load_js("history.js", "HISTORY") or {"dates": [], "cards": {}}
    dates, rows = hist["dates"], hist["cards"]
    if not dates or dates[-1] != today:
        dates.append(today)
        for row in rows.values():
            row.append(None)
    for row in rows.values():
        row[-1] = None
    for cid, st in stats.items():
        rows.setdefault(cid, [None] * len(dates))[-1] = [st["median"], st["min"], st["n"]]

    cut = max(0, len(dates) - HISTORY_DAYS)
    hist["dates"] = dates[cut:]
    hist["cards"] = {cid: row[cut:] for cid, row in rows.items() if any(row[cut:])}
    return hist


def change_7d(hist, cid, median, today):
    """Percent change of the median vs. the last point at least 7 days old, or None."""
    week_ago = (datetime.date.fromisoformat(today) - datetime.timedelta(days=7)).isoformat()
    row = hist["cards"].get(cid, [])
    for date, point in zip(reversed(hist["dates"]), reversed(row)):
        if date <= week_ago and point:
            return round((median - point[0]) / point[0] * 100)
    return None


def arg(flag):
    return sys.argv[sys.argv.index(flag) + 1] if flag in sys.argv else None


def main():
    cards = load_cards()
    by_num, denom_to_set = build_index(cards)
    names = build_name_index(cards)
    if arg("--raw"):
        with open(arg("--raw"), encoding="utf8") as f:
            raw = json.load(f)
    else:
        raw = collect()
    if arg("--save-raw"):
        with open(arg("--save-raw"), "w", encoding="utf8") as f:
            json.dump(raw, f, ensure_ascii=False)

    last = (load_js("prices.js", "PRICES") or {}).get("scanned", 0)
    if len(raw) < MIN_SHARE * last and "--force" not in sys.argv:
        sys.exit(f"Only {len(raw)} listings found (last run: {last}). Not saving: Bunjang may have "
                 "changed its API or blocked the scraper. Run with --force to save anyway.")

    per_card, per_product, bundles, in_bundles = {}, {}, {}, {}
    singles = {}  # pid -> (item id, price, title), for sold tracking
    counts = {"wanted": 0, "code": 0, "name": 0, "bundle": 0, "sealed": 0}
    report = "--report" in sys.argv
    for it in raw:
        title, price = it["name"], it.get("price") or 0
        low = title.lower()
        if re.search(WANTED, low) or price < 500:
            counts["wanted"] += re.search(WANTED, low) is not None
            continue
        ids, how = match(title, by_num, denom_to_set), "code"
        if not ids and not re.search(PROMO, low):  # promo printings aren't the catalog card
            ids, how = match_name(title, names), "name"
        product = None if ids else match_product(title)

        lot = re.search(BUNDLE, low) or (re.search(COPIES, low) and not re.search(PER_COPY, low))
        if ids and (len(ids) > 1 or lot):
            counts["bundle"] += 1
            bundles[str(it["pid"])] = listing(it, cards=ids)
            for cid in ids:
                in_bundles.setdefault(cid, []).append(str(it["pid"]))
            how = "bundle"
        elif ids and re.search(SEALED, low):
            continue
        elif ids:
            counts[how] += 1
            lang, graded = tag(title)
            per_card.setdefault(ids[0], []).append(listing(it, lang=lang, graded=graded))
            singles[it["pid"]] = (ids[0], price, title)
        elif product:
            counts["sealed"] += 1
            lang, _ = tag(title)
            per_product.setdefault(product, []).append(listing(it, lang=lang))
            singles[it["pid"]] = (product, price, title)
            how, ids = "sealed", [product]
        if report and ids:
            print(f"{how:7} {price:>10,} {','.join(ids):30} {title}")

    out = {cid: summarize(ls) for cid, ls in per_card.items()}
    products = {pid: summarize(ls) for pid, ls in per_product.items()}

    now = datetime.datetime.now().astimezone()
    today = now.date().isoformat()
    hist = update_history({**out, **products}, today)
    for cid, st in {**out, **products}.items():
        chg = change_7d(hist, cid, st["median"], today)
        if chg is not None:
            st["chg7"] = chg
    if report:
        print(counts)
        return
    sold = track_sales(raw, singles, today, complete=len(raw) >= COMPLETE_SHARE * last)

    result = {
        "updated": now.strftime("%Y-%m-%d %H:%M"),
        "updatedAt": now.isoformat(timespec="seconds"),
        "scanned": len(raw),
        "matched": sum(v["n"] for v in out.values()),
        "bunjang": out,
        "products": products,
        "productNames": {pid: [ko, en] for pid, ko, en, _, _ in PRODUCTS},
        "bundles": bundles,
        "inBundles": in_bundles,
        "sold": sold,
    }
    write_js("prices.js", "PRICES", result)
    write_js("history.js", "HISTORY", hist)
    print(f"{len(raw)} listings scanned: {counts['code']} matched by code and {counts['name']} by name to "
          f"{len(out)} cards, {counts['bundle']} bundles, {counts['sealed']} sealed products, "
          f"{counts['wanted']} buying posts skipped, {sum(s['n'] for s in sold.values())} probable sales in "
          f"{SOLD_DAYS} days")


if __name__ == "__main__":
    main()
