#!/usr/bin/env python3
"""Build a static page per card, plus sitemap.xml, so search engines can find them.

The main page draws everything with JavaScript, which search engines (Naver especially)
mostly don't see. These pages have the card's name, code and current Bunjang prices in
plain HTML, and link to the full catalog.

Output:
  card/<id>/index.html   one page per card
  sitemap.xml

Run after build_catalog.py / scrape_bunjang.py. Standard library only.
"""
import datetime
import html
import os
import shutil
import sys
import urllib.parse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from scrape_bunjang import load_js  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://riftbound.card-cafe.com"
CONTACT = "dan@torchsmith.com"
TYPES = {"unit": "유닛", "spell": "주문", "legend": "전설", "gear": "장비", "battlefield": "전장", "rune": "룬"}
VARIANTS = {"alt": "대체 일러스트", "signature": "시그니처"}
DISCLAIMER = ("Riftbound KR Prices isn't endorsed by Riot Games and doesn't reflect the views or opinions of "
              "Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, "
              "and all associated properties are trademarks or registered trademarks of Riot Games, Inc. "
              "번개장터·KREAM과 제휴 관계가 없습니다.")

e = html.escape


def won(n):
    return f"{n:,}원"


def short_code(c):
    return c["code"].split("/")[0]


def display_name(c):
    """'징크스 - 폭파광 (Jinx - Loose Cannon)', or just the name when both languages match."""
    en = c.get("nameEn") or c["name"]
    return c["name"] if en == c["name"] else f"{c['name']} ({en})"


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
      <div class="hist"><h3>시세 추이 (중간값)</h3>
        <svg viewBox="0 0 {W} {H}" role="img" aria-label="시세 추이">
          <polygon class="area" points="{xy[0][0]:.1f},{H} {line} {xy[-1][0]:.1f},{H}"></polygon>
          <polyline points="{line}"></polyline>{dots}
        </svg>
        <div class="axis"><span>{points[0][0]}</span><span>{won(lo)} – {won(hi)}</span><span>{points[-1][0]}</span></div>
      </div>"""


def page(c, p, updated, history, prev_c, next_c, related):
    name = display_name(c)
    code = short_code(c)
    # People search by champion ("징크스 시세"), which isn't always part of the card name.
    champ = next((ch for ch in c.get("champsKo", []) if ch not in c["name"]), "")
    title = f"{champ} {name} {code} 시세" if champ else f"{name} {code} 시세"
    url = f"{SITE}/card/{c['id']}/"
    if p:
        desc = (f"리프트바운드 {c['name']} ({c['code']}) 번개장터 시세: 중간값 {won(p['median'])}, "
                f"최저 {won(p['min'])}, 매물 {p['n']}건. {updated} 기준.")
    else:
        desc = f"리프트바운드 {c['name']} ({c['code']}) 카드 정보와 번개장터 시세."
    facts = [c["code"], c.get("setName", ""), c.get("rarityKo", ""), TYPES.get(c["type"], "")]
    facts += [", ".join(c["champsKo"])] if c.get("champsKo") else []
    facts += [VARIANTS[c["variant"]]] if c.get("variant") else []

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
      <table>{rows}</table>"""
    else:
        prices = '<p class="note">현재 번개장터에 매칭된 매물이 없습니다.</p>'

    nav = " · ".join(
        f'<a href="/card/{x["id"]}/">{label} {e(short_code(x))} {e(x["name"])}</a>'
        for label, x in (("←", prev_c), ("→", next_c)) if x)
    rel = ""
    if related:
        rel = "<h3>같은 챔피언 카드</h3><ul class=\"rel\">" + "".join(
            f'<li><a href="/card/{x["id"]}/">{e(short_code(x))} {e(display_name(x))}</a></li>' for x in related) + "</ul>"

    return f"""<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{e(title)} · Riftbound KR Prices</title>
  <meta name="description" content="{e(desc)}">
  <link rel="canonical" href="{url}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/style.css">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Riftbound KR Prices">
  <meta property="og:title" content="{e(title)}">
  <meta property="og:description" content="{e(desc)}">
  <meta property="og:url" content="{url}">
  <meta property="og:image" content="{SITE}/{e(c['img'])}">
</head>
<body>
  <header class="top">
    <div class="brand"><h1><a class="home" href="/">Riftbound KR Prices</a></h1>
      <p class="meta"><a class="home" href="/">리프트바운드 전체 카드 시세 검색 →</a></p></div>
  </header>
  <main class="cardpage">
    <div class="detail">
      <div><img src="/{e(c['img'])}" alt="{e(c['name'])}" width="744" height="1039"></div>
      <div>
        <h2>{e(name)}</h2>
        <p class="facts">{" · ".join(e(f) for f in facts if f)}{f"<br>일러스트: {e(c['artist'])}" if c.get("artist") else ""}</p>
        <div class="src"><h3>번개장터 시세</h3></div>
        {prices}
        <div class="links">
          <a href="/?card={e(c['id'])}">카탈로그에서 보기 · Open in catalog</a>
          <a href="https://m.bunjang.co.kr/search/products?q={urllib.parse.quote('리프트바운드 ' + code)}" rel="nofollow noopener" target="_blank">번개장터에서 검색 ↗</a>
        </div>
        {rel}
        <p class="note cardnav">{nav}</p>
      </div>
    </div>
  </main>
  <footer class="foot">
    <p><a href="/privacy.html">개인정보처리방침</a> · <a href="mailto:{CONTACT}">{CONTACT}</a></p>
    <p>{e(DISCLAIMER)}</p>
  </footer>
</body>
</html>
"""


def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path + ".tmp", "w", encoding="utf8") as f:
        f.write(text)
    os.replace(path + ".tmp", path)


def main():
    cards = load_js("cards.js", "CARDS")
    prices = load_js("prices.js", "PRICES") or {"bunjang": {}}
    hist = load_js("history.js", "HISTORY") or {"dates": [], "cards": {}}
    bj = prices.get("bunjang", {})
    updated = prices.get("updated", "")

    by_champ = {}
    for c in cards:
        for ch in c.get("champs", []):
            by_champ.setdefault(ch, []).append(c)

    out_dir = os.path.join(ROOT, "card")
    for i, c in enumerate(cards):
        points = [(d, v[0]) for d, v in zip(hist["dates"], hist["cards"].get(c["id"], [])) if v]
        related = [x for ch in c.get("champs", []) for x in by_champ[ch] if x["id"] != c["id"]][:12]
        prev_c = cards[i - 1] if i > 0 else None
        next_c = cards[i + 1] if i + 1 < len(cards) else None
        write(os.path.join(out_dir, c["id"], "index.html"),
              page(c, bj.get(c["id"]), updated, points, prev_c, next_c, related))

    # Remove pages of cards that are no longer in the catalog.
    ids = {c["id"] for c in cards}
    for name in os.listdir(out_dir):
        if name not in ids and os.path.isdir(os.path.join(out_dir, name)):
            shutil.rmtree(os.path.join(out_dir, name))

    price_day = updated[:10] or datetime.date.today().isoformat()
    urls = [f"  <url><loc>{SITE}/</loc><lastmod>{price_day}</lastmod></url>"]
    urls += [f"  <url><loc>{SITE}/card/{c['id']}/</loc><lastmod>{price_day}</lastmod></url>" for c in cards]
    write(os.path.join(ROOT, "sitemap.xml"),
          '<?xml version="1.0" encoding="UTF-8"?>\n'
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "\n".join(urls) + "\n</urlset>\n")
    print(f"{len(cards)} card pages, sitemap.xml")


if __name__ == "__main__":
    main()
