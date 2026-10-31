#!/usr/bin/env python3
"""Collect Riftbound listings from Bunjang (번개장터) and match them to cards.

Instead of one request per card, this pages through the broad Riftbound search
results (a few dozen polite requests) and matches each listing title to a card
by its collector code, e.g. "OGN 301/298", "오리진 301", "SFD-227*".

Output: data/prices.js  window.PRICES = {...}
Run build_catalog.py first. Standard library only.
"""
import json
import os
import re
import statistics
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
BUNDLE = r"일괄|묶음|bulk"
SEALED = r"카톤|부스터|booster|carton|\d\s*박스|\d\s*팩"
UNITS = r"장|p\b|팩|개|입|박스|카톤|box|pack"


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


def tag(title):
    t = title.lower()
    lang = next((code for code, pat in LANG_PATTERNS if re.search(pat, t)), "")
    return lang, bool(re.search(GRADED, t))


def load_cards():
    with open(os.path.join(ROOT, "data", "cards.js"), encoding="utf8") as f:
        text = f.read()
    return json.loads(re.search(r"window\.CARDS = (.*);\s*$", text, re.S).group(1))


def main():
    cards = load_cards()
    by_num, denom_to_set = build_index(cards)
    raw = collect()

    per_card, bundles = {}, 0
    for it in raw:
        price = it.get("price") or 0
        ids = match(it["name"], by_num, denom_to_set)
        if ids and re.search(SEALED, it["name"].lower()):
            continue
        if len(ids) > 1 or (ids and re.search(BUNDLE, it["name"].lower())):
            bundles += 1
            continue
        if not ids or price < 500:
            continue
        lang, graded = tag(it["name"])
        per_card.setdefault(ids[0], []).append({
            "pid": it["pid"],
            "title": it["name"],
            "price": price,
            "status": it.get("status", ""),
            "lang": lang,
            "graded": graded,
            "thumb": (it.get("productImage") or "").replace("{res}", "200"),
            "updated": it.get("updatedAt", ""),
        })

    out = {}
    for cid, ls in per_card.items():
        ls.sort(key=lambda l: l["price"])
        prices = [l["price"] for l in ls if not l["graded"]] or [l["price"] for l in ls]
        out[cid] = {
            "n": len(ls),
            "min": min(prices),
            "median": int(statistics.median(prices)),
            "max": max(prices),
            "listings": ls,
        }

    result = {
        "updated": time.strftime("%Y-%m-%d %H:%M"),
        "scanned": len(raw),
        "matched": sum(v["n"] for v in out.values()),
        "bunjang": out,
    }
    out_path = os.path.join(ROOT, "data", "prices.js")
    # Write to a temp file and swap it in, so the live site never serves a half-written file.
    with open(out_path + ".tmp", "w", encoding="utf8") as f:
        f.write("// Generated by scripts/scrape_bunjang.py\n")
        f.write("window.PRICES = " + json.dumps(result, ensure_ascii=False, separators=(",", ":")) + ";\n")
    os.replace(out_path + ".tmp", out_path)
    print(f"{len(raw)} listings scanned, {result['matched']} matched to {len(out)} cards, {bundles} multi-card skipped")


if __name__ == "__main__":
    main()
