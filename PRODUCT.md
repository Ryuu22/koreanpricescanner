# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Korean Riftbound players buying or selling singles.** They open the site to check what a card is worth right before listing it on Bunjang (번개장터) or answering an offer, usually on a phone, often mid-conversation with another trader. The job: one trustworthy number, fast.
- **Collectors tracking value.** They follow high-end cards (overnumbers, signatures, alt arts) and sealed product (T1 Signature Edition, Origins boxes and cartons) over days and weeks: trend, 7-day change, estimated sold price.
- **Card Cafe customers.** Players who trade around Card Cafe and use this as a shared price reference.
- Secondary: overseas players comparing Korean prices (English mode exists for them; Korean is the primary language).

## Product Purpose

A price catalog for every Riftbound card on the Korean secondhand market. It reads every Bunjang listing for Riftbound every 6 hours, matches listings to cards by collector code or card name, and shows the median, lowest and highest asking price, an estimated sold price from listings that disappear, price history, 7-day change, bundles that contain a card, and sealed product prices. Success: a trader trusts the number enough to price a listing or accept an offer with it, and comes back for the next trade.

## Positioning

The Korean Riftbound market specifically: local listings, local terms (오버넘버, 알트, 시그니처, 뚱팩, 카톤), local products, matched card by card across the whole catalog, with the method published. Neutral: not a shop, not a seller, no affiliation with Bunjang or KREAM. Independent from Card Cafe in identity; it only shares the domain (riftbound.card-cafe.com).

## Operating Context

- Most use is on mobile, in short sessions: search a card, read the price, leave. Some desktop use for browsing sets, movers and sealed product.
- Prices are asking prices of live listings; "sold" prices are an estimate. Data refreshes every 6 hours; the card list daily.
- Traffic arrives via search (Naver, Google) to card and set pages, and via links shared in Korean communities (KakaoTalk, Naver cafes, DC Inside, Discord).
- Static site (plain HTML/CSS/JS, no build step) on Apache; Python scripts regenerate data and static pages on the server.

## Capabilities and Constraints

- Surfaces: card catalog with search and filters (index), card popup, static card pages (`/card/<id>/`), set pages (`/set/<set>/`), sealed products (`/products/`), price movers (`/movers/`), deck/collection calculator (`calc.html`), how prices work (`about.html`), privacy policy.
- Bilingual UI on the main page (Korean default, English toggle); generated pages are Korean.
- Card images and names come from Riot's official card gallery; listing thumbnails hotlink Bunjang.
- Ad slots exist (Kakao AdFit pending approval; AdSense and Coupang Partners planned) and must coexist with the content without crowding the price.
- No accounts. Watchlist lives in the visitor's browser only.
- Terminology: 시세 (market price), 호가 (asking price), 중간값 (median), 최근 거래 추정가 (estimated sold price), 매물 (listing), 일괄·묶음 (bundle/lot), 미개봉 (sealed).

## Brand Commitments

- Name: 리프트바운드 시세 (Korean), Riftbound Prices (English).
- Values: honest, neutral data (show the method, admit what is estimated, no hype); fast and practical (the number first, everything else second); Korean-market insider (local language and terms, local products).
- Riot fan-content disclaimer on every page; contact dan@torchsmith.com.

## Evidence on Hand

- Live data: ~2,700 Bunjang listings per run, ~317 cards with prices, 10 sealed products, bundles, price history since 2026-10-27.
- No testimonials, user counts, partnerships or press exist. Do not invent any.

## Product Principles

1. **The number first.** Every surface leads with the price a trader needs; context follows.
2. **Show the method.** Asking vs sold, median vs lowest, how matching works, when data was updated. Uncertainty is labeled, never hidden.
3. **Neutral by default.** No seller is favored, nothing is "recommended to buy"; ads never look like listings.
4. **Speak the local market.** Korean terms and products as Korean traders use them.
5. **Fast on a phone.** One-handed, quick to scan, light to load.

## Accessibility & Inclusion

- Korean-first typography and copy; English as a full alternative on the main page.
- Price changes use the Korean convention (red up, blue down) and must not rely on color alone (arrows or signs accompany them).
