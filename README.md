# Riftbound KR Prices

A searchable catalog of every Riftbound card, with asking prices from Korean secondhand markets.

- **Website**: plain HTML/CSS/JS. Open `index.html` directly in a browser. No server and no build step.
- **Data**: two Python scripts (standard library only) refresh the data files the page reads.

## Update the data

```sh
python3 scripts/build_catalog.py    # card list + images  -> data/cards.js, img/cards/
python3 scripts/scrape_bunjang.py   # Bunjang listings    -> data/prices.js  (~1-2 min)
```

Run `build_catalog.py` again when a new set comes out. Run `scrape_bunjang.py` whenever you want fresh prices.

## How it works

| Source | What we use |
| --- | --- |
| riftbound.leagueoflegends.com/ko-kr/card-gallery | All cards (codes, rarity, set, images). Origins cards have Korean names and images. |
| Data Dragon (ko_KR) | Korean champion names, so you can search "징크스" as well as "Jinx". |
| Bunjang (번개장터) | Pages through every "리프트바운드" / "riftbound" listing and matches titles to cards by collector code (`OGN-301`, `301/298`, `오리진 301`, `039a`, `305*`). Bundles and sealed product are skipped. |
| KREAM | Link only. KREAM blocks automated access, so there's no scraping. |

Prices are **asking prices** of listings currently for sale, not completed sales. Graded cards (PSA/BGS/BRG) are tagged and left out of the stats.

## Why no backend in the browser

Both Bunjang and KREAM only allow their own sites to call their APIs (CORS). A static page can't fetch prices live. Instead, the scripts fetch the data ahead of time and save it as `.js` files. Script tags work from `file://`, which `fetch()` of JSON doesn't. To keep prices fresh without your own server, you can run the scraper on a schedule (cron or a GitHub Action) and host the folder on GitHub Pages.

## Files

```
index.html  style.css  app.js     the site
data/cards.js  data/prices.js     generated data
img/cards/*.webp                  generated card images (~42 MB)
scripts/                          data builders
```
