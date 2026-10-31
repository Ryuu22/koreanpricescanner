#!/usr/bin/env python3
"""Build static pages for search engines: one per card, one per set, plus sitemap.xml.

The main page draws everything with JavaScript, which search engines (Naver especially)
mostly don't see. These pages have names, codes and current Bunjang prices in plain
HTML, worded the way Korean collectors search ("리프트바운드 징크스 오버넘버 시세"), and
link to each other: home -> set pages -> card pages.

Output:
  card/<id>/index.html   one page per card
  set/<set>/index.html   one page per set, every card with its price
  sitemap.xml
  index.html             the set links in its footer (between the <!-- sets --> markers)

Run after build_catalog.py / scrape_bunjang.py. Standard library only.
"""
import collections
import datetime
import html
import json
import os
import re
import shutil
import sys
import urllib.parse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from scrape_bunjang import load_js  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://riftbound.card-cafe.com"
BRAND = "Riftbound KR Prices"
CONTACT = "dan@torchsmith.com"
TYPES = {"unit": "유닛", "spell": "주문", "legend": "전설", "gear": "장비", "battlefield": "전장", "rune": "룬"}
DISCLAIMER = ("Riftbound KR Prices isn't endorsed by Riot Games and doesn't reflect the views or opinions of "
              "Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, "
              "and all associated properties are trademarks or registered trademarks of Riot Games, Inc. "
              "번개장터·KREAM과 제휴 관계가 없습니다.")

e = html.escape


def won(n):
    return f"{n:,}원"


def short_code(c):
    return c["code"].split("/")[0]


def name_en(c):
    return c.get("nameEn") or c["name"]


def display_name(c):
    """'난폭한 말괄량이 (Loose Cannon)', or just the name when both languages match."""
    return c["name"] if name_en(c) == c["name"] else f"{c['name']} ({name_en(c)})"


def variant_words(c):
    """The words Korean sellers use for special versions, e.g. ['오버넘버', '시그니처']."""
    words = []
    m = re.search(r"-\D*(\d+)[a-z*]?/(\d+)$", c["code"])
    if m and int(m.group(1)) > int(m.group(2)):
        words.append("오버넘버")  # numbered above the set size, e.g. 301/298
    if c.get("variant") == "alt":
        words.append("알트")
    if c.get("variant") == "signature":
        words.append("시그니처")
    return words


def champion(c):
    """The champion's Korean name when the card name doesn't already contain it."""
    return next((ch for ch in c.get("champsKo", []) if ch not in c["name"]), "")


def set_slug(set_id):
    return set_id.lower()


def json_ld(data):
    return ('<script type="application/ld+json">'
            + json.dumps(data, ensure_ascii=False).replace("</", "<\\/") + "</script>")


def head(title, desc, url, image, extra=""):
    return f"""<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{e(title)}</title>
  <meta name="description" content="{e(desc)}">
  <link rel="canonical" href="{url}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/style.css">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="{BRAND}">
  <meta property="og:locale" content="ko_KR">
  <meta property="og:title" content="{e(title)}">
  <meta property="og:description" content="{e(desc)}">
  <meta property="og:url" content="{url}">
  <meta property="og:image" content="{image}">
  {extra}
</head>
<body>
  <header class="top">
    <div class="brand"><a class="site" href="/">{BRAND}</a>
      <p class="meta"><a class="home" href="/">리프트바운드 전체 카드 시세 검색 →</a></p></div>
  </header>"""


def foot(set_links):
    return f"""
  <footer class="foot">
    <p class="sets">세트별 시세: {set_links}</p>
    <p><a href="/privacy.html">개인정보처리방침</a> · <a href="mailto:{CONTACT}">{CONTACT}</a></p>
    <p>{e(DISCLAIMER)}</p>
  </footer>
</body>
</html>
"""


def breadcrumbs(items):
    """[(name, url or None)] -> visible trail + BreadcrumbList structured data."""
    trail = " › ".join(f'<a href="{u}">{e(n)}</a>' if u else e(n) for n, u in items)
    data = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": n, **({"item": SITE + u} if u else {})}
        for i, (n, u) in enumerate(items)]}
    return f'<nav class="crumbs">{trail}</nav>', json_ld(data)


def chart(points):
    """Inline SVG of the median over time; same markup as the chart in app.js."""
    W, H, PAD = 600, 150, 6
    vals = [m for _, m in points]
    lo, hi = min(vals), max(vals)
    span = hi - lo
    days = [datetime.date.fromisoformat(d).toordinal() for d, _ in points]
    dspan = (days[-1] - days[0]) or 1
    # A price that never changed is drawn across the middle.
    xy = [(PAD + (d - days[0]) / dspan * (W - 2 * PAD), PAD + (1 - (m - lo) / span) * (H - 2 * PAD) if span else H / 2)
          for d, (_, m) in zip(days, points)]
    line = " ".join(f"{x:.1f},{y:.1f}" for x, y in xy)
    dots = "".join(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="3"><title>{d}: {won(m)}</title></circle>'
                   for (x, y), (d, m) in zip(xy, points))
    return f"""
      <div class="hist"><h2>시세 추이 (중간값)</h2>
        <svg viewBox="0 0 {W} {H}" role="img" aria-label="시세 추이">
          <polygon class="area" points="{xy[0][0]:.1f},{H} {line} {xy[-1][0]:.1f},{H}"></polygon>
          <polyline points="{line}"></polyline>{dots}
        </svg>
        <div class="axis"><span>{points[0][0]}</span><span>{won(lo)} – {won(hi)}</span><span>{points[-1][0]}</span></div>
      </div>"""


def card_page(c, p, updated, history, prev_c, next_c, related, set_name, set_links):
    code = short_code(c)
    champ = champion(c)
    words = variant_words(c)
    # "리프트바운드 징크스 난폭한 말괄량이 OGN-301 오버넘버 시세·가격 | 최저 50,000원"
    title = " ".join(x for x in ["리프트바운드", champ, c["name"], code, *words, "시세·가격"] if x)
    if p:
        title += f" | 최저 {won(p['min'])}"
    label = " ".join(x for x in [champ, c["name"], code, *words] if x)
    if p:
        desc = (f"리프트바운드(Riftbound) {label} 시세·가격: 번개장터 매물 {p['n']}건 중간값 {won(p['median'])}, "
                f"최저 {won(p['min'])}, 최고 {won(p['max'])}. {updated} 업데이트.")
    else:
        desc = f"리프트바운드(Riftbound) {label} 카드 정보와 번개장터 시세·가격."
    if name_en(c) != c["name"]:
        desc += f" 영문명 {name_en(c)}."
    url = f"{SITE}/card/{c['id']}/"
    image = f"{SITE}/{c['img']}"

    rarity, ctype = c.get("rarityKo", ""), TYPES.get(c["type"], "")
    about = (f"{e(c['name'])}{f'({e(name_en(c))})' if name_en(c) != c['name'] else ''}은(는) 리프트바운드 "
             f"{e(set_name)} 세트의 {e(rarity)} {e(ctype)} 카드입니다 (카드 번호 {e(c['code'])}"
             f"{', ' + e(' · '.join(words)) if words else ''}).")
    if p:
        about += (f" 현재 번개장터에서 판매 중인 매물 {p['n']}건의 가격은 {won(p['min'])}~{won(p['max'])}이며, "
                  f"중간값은 {won(p['median'])}입니다.")

    facts = [c["code"], set_name, rarity, ctype, ", ".join(c.get("champsKo", [])), " · ".join(words)]
    if p:
        rows = "".join(f"""
          <tr>
            <td>{f'<img src="{e(l["thumb"])}" alt="" loading="lazy">' if l.get("thumb") else ""}</td>
            <td>{f'<span class="tag">{e(l["lang"])}</span>' if l.get("lang") else ""}{'<span class="tag">그레이딩</span>' if l.get("graded") else ""}
              <a href="https://m.bunjang.co.kr/products/{l['pid']}" rel="nofollow noopener" target="_blank">{e(l['title'])}</a></td>
            <td class="p">{won(l['price'])}</td>
          </tr>""" for l in p["listings"])
        chg = p.get("chg7")
        prices = f"""
      <div class="stats">
        <div class="stat"><b>{won(p['median'])}</b><span>중간값 · Median</span></div>
        <div class="stat"><b>{won(p['min'])}</b><span>최저 · Lowest</span></div>
        <div class="stat"><b>{won(p['max'])}</b><span>최고 · Highest</span></div>
        <div class="stat"><b>{p['n']}</b><span>매물 · Listings</span></div>
      </div>
      {f'<p class="note">7일 변동: <span class="chg {"up" if chg > 0 else "down"}">{"▲" if chg > 0 else "▼"}{abs(chg)}%</span></p>' if chg else ""}
      <p class="note">판매 중인 번개장터 매물의 호가 기준 (그레이딩 카드는 통계에서 제외). {e(updated)} 업데이트.</p>
      {chart(history) if len(history) >= 2 else ""}
      <h2>번개장터 판매 매물</h2>
      <table>{rows}</table>"""
    else:
        prices = '<p class="note">현재 번개장터에 매칭된 매물이 없습니다.</p>'

    nav = " · ".join(
        f'<a href="/card/{x["id"]}/">{arrow} {e(short_code(x))} {e(x["name"])}</a>'
        for arrow, x in (("←", prev_c), ("→", next_c)) if x)
    rel = ""
    if related:
        rel = "<h2>같은 챔피언 카드</h2><ul class=\"rel\">" + "".join(
            f'<li><a href="/card/{x["id"]}/">{e(short_code(x))} {e(display_name(x))}</a></li>' for x in related) + "</ul>"

    crumbs, crumbs_ld = breadcrumbs([("홈", "/"), (f"{set_name} 시세", f"/set/{set_slug(c['set'])}/"),
                                     (f"{c['name']} {code}", None)])
    product = {"@context": "https://schema.org", "@type": "Product",
               "name": f"리프트바운드 {c['name']} {code}", "alternateName": f"Riftbound {name_en(c)} {code}",
               "sku": c["code"], "image": image, "description": desc, "category": "트레이딩 카드 게임"}
    if p:
        product["offers"] = {"@type": "AggregateOffer", "priceCurrency": "KRW", "lowPrice": p["min"],
                             "highPrice": p["max"], "offerCount": p["n"]}

    return head(title, desc, url, image, crumbs_ld + "\n  " + json_ld(product)) + f"""
  <main class="cardpage">
    {crumbs}
    <div class="detail">
      <div><img src="/{e(c['img'])}" alt="리프트바운드 {e(c['name'])} {e(code)} 카드" width="744" height="1039"></div>
      <div>
        <h1>{e(display_name(c))}</h1>
        <p class="facts">{" · ".join(e(f) for f in facts if f)}{f"<br>일러스트: {e(c['artist'])}" if c.get("artist") else ""}</p>
        <p class="about">{about}</p>
        <h2>번개장터 시세·가격</h2>
        {prices}
        <div class="links">
          <a href="/?card={e(c['id'])}">카탈로그에서 보기 · Open in catalog</a>
          <a href="https://m.bunjang.co.kr/search/products?q={urllib.parse.quote('리프트바운드 ' + code)}" rel="nofollow noopener" target="_blank">번개장터에서 검색 ↗</a>
        </div>
        {rel}
        <p class="note cardnav">{nav}</p>
      </div>
    </div>
  </main>""" + foot(set_links)


def set_page(set_id, set_name, set_en, cards, bj, updated, set_links):
    slug = set_slug(set_id)
    priced = sorted((c for c in cards if c["id"] in bj), key=lambda c: -bj[c["id"]]["median"])
    title = f"리프트바운드 {set_name} ({set_en}) 카드 시세·가격 목록 | 전체 {len(cards)}장"
    desc = (f"리프트바운드 {set_name}({set_en}) 세트 전체 {len(cards)}장의 번개장터 시세·가격. "
            f"시세가 있는 카드 {len(priced)}장, 가장 비싼 카드와 카드별 최저가·중간값. {updated} 업데이트.")
    url = f"{SITE}/set/{slug}/"

    def row(c):
        p = bj.get(c["id"])
        return (f'<tr><td><a href="/card/{c["id"]}/">{e(short_code(c))}</a></td>'
                f'<td><a href="/card/{c["id"]}/">{e(display_name(c))}</a>'
                f'{"".join(f" <span class=tag>{w}</span>" for w in variant_words(c))}</td>'
                f'<td>{e(c.get("rarityKo", ""))}</td>'
                f'<td class="p">{won(p["median"]) if p else "–"}</td><td class="p">{p["n"] if p else ""}</td></tr>')

    top = "".join(row(c) for c in priced[:10])
    head_row = "<tr><th>코드</th><th>카드</th><th>희귀도</th><th class=p>중간값</th><th class=p>매물</th></tr>"
    crumbs, crumbs_ld = breadcrumbs([("홈", "/"), (f"{set_name} 시세", None)])
    image = f"{SITE}/{priced[0]['img']}" if priced else f"{SITE}/og.png"
    return head(title, desc, url, image, crumbs_ld) + f"""
  <main class="cardpage setpage">
    {crumbs}
    <h1>리프트바운드 {e(set_name)} 카드 시세</h1>
    <p class="about">{e(set_name)}({e(set_en)}) 세트의 카드 {len(cards)}장과 번개장터에서 판매 중인 매물 가격입니다.
      시세가 있는 카드는 {len(priced)}장이며, 가격은 판매 중인 매물 호가의 중간값입니다. {e(updated)} 업데이트.</p>
    {f'<h2>{e(set_name)} 비싼 카드 TOP 10</h2><table class="list">{head_row}{top}</table>' if top else ""}
    <h2>{e(set_name)} 전체 카드 목록</h2>
    <table class="list">{head_row}{"".join(row(c) for c in cards)}</table>
  </main>""" + foot(set_links)


def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path + ".tmp", "w", encoding="utf8") as f:
        f.write(text)
    os.replace(path + ".tmp", path)


def prune(out_dir, keep):
    """Remove generated pages that no longer exist (a card or set was dropped)."""
    for name in os.listdir(out_dir):
        if name not in keep and os.path.isdir(os.path.join(out_dir, name)):
            shutil.rmtree(os.path.join(out_dir, name))


def main():
    cards = load_js("cards.js", "CARDS")
    prices = load_js("prices.js", "PRICES") or {"bunjang": {}}
    hist = load_js("history.js", "HISTORY") or {"dates": [], "cards": {}}
    bj = prices.get("bunjang", {})
    updated = prices.get("updated", "")

    by_set = {}
    for c in cards:
        by_set.setdefault(c["set"], []).append(c)
    # A set's display name is the one most of its cards use.
    # "오리진 - 주 세트" reads as "오리진 - 주 세트 세트" in sentences; the main set is just "오리진".
    set_names = {s: re.sub(r"\s*-\s*주 세트$", "", collections.Counter(c["setName"] for c in cs).most_common(1)[0][0])
                 for s, cs in by_set.items()}
    set_en = {s: collections.Counter(c.get("setNameEn") or c["setName"] for c in cs).most_common(1)[0][0]
              for s, cs in by_set.items()}
    set_links = " · ".join(f'<a href="/set/{set_slug(s)}/">{e(set_names[s])}</a>' for s in by_set)

    by_champ = {}
    for c in cards:
        for ch in c.get("champs", []):
            by_champ.setdefault(ch, []).append(c)

    for i, c in enumerate(cards):
        points = [(d, v[0]) for d, v in zip(hist["dates"], hist["cards"].get(c["id"], [])) if v]
        related = [x for ch in c.get("champs", []) for x in by_champ[ch] if x["id"] != c["id"]][:12]
        prev_c = cards[i - 1] if i > 0 else None
        next_c = cards[i + 1] if i + 1 < len(cards) else None
        write(os.path.join(ROOT, "card", c["id"], "index.html"),
              card_page(c, bj.get(c["id"]), updated, points, prev_c, next_c, related,
                        set_names[c["set"]], set_links))
    for s, cs in by_set.items():
        write(os.path.join(ROOT, "set", set_slug(s), "index.html"),
              set_page(s, set_names[s], set_en[s], cs, bj, updated, set_links))
    prune(os.path.join(ROOT, "card"), {c["id"] for c in cards})
    prune(os.path.join(ROOT, "set"), {set_slug(s) for s in by_set})

    # Crawlable links from the home page to the set pages.
    index = os.path.join(ROOT, "index.html")
    with open(index, encoding="utf8") as f:
        text = f.read()
    text = re.sub(r"(<!-- sets -->).*?(<!-- /sets -->)", lambda m: m.group(1) + set_links + m.group(2), text, flags=re.S)
    write(index, text)

    day = updated[:10] or datetime.date.today().isoformat()
    paths = ["/"] + [f"/set/{set_slug(s)}/" for s in by_set] + [f"/card/{c['id']}/" for c in cards]
    write(os.path.join(ROOT, "sitemap.xml"),
          '<?xml version="1.0" encoding="UTF-8"?>\n'
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
          + "\n".join(f"  <url><loc>{SITE}{p}</loc><lastmod>{day}</lastmod></url>" for p in paths)
          + "\n</urlset>\n")
    print(f"{len(cards)} card pages, {len(by_set)} set pages, sitemap.xml")


if __name__ == "__main__":
    main()
