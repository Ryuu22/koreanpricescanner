---
name: 리프트바운드 시세 (Riftbound Prices)
description: Korean Riftbound card prices shown as a card shop's glass showcase, every card in a toploader with a white price sticker.
colors:
  felt: "#1b1c1e"
  shelf: "#222427"
  glass: "#2a2c30"
  line: "#36393e"
  line-2: "#4a4d53"
  text: "#ecece8"
  muted: "#a4a6aa"
  faint: "#8b8e93"
  sleeve: "rgb(214 220 226 / .07)"
  sleeve-edge: "rgb(214 220 226 / .34)"
  sticker: "#f5f5f2"
  sticker-2: "#e4e5e1"
  ink: "#18191b"
  ink-2: "#4b4e53"
  up: "#ff6b60"
  down: "#6aa6ff"
  up-ink: "#d21f26"
  down-ink: "#1a5fd0"
  rarity-common: "#b3b1aa"
  rarity-uncommon: "#5fc6c9"
  rarity-rare: "#ef8fb0"
  rarity-epic: "#eaa955"
  rarity-showcase: "#bfa8f5"
typography:
  display:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, Apple SD Gothic Neo, Noto Sans KR, Malgun Gothic, sans-serif"
    fontSize: "32px"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.03em"
    fontFeature: "tnum"
  headline:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, Apple SD Gothic Neo, Noto Sans KR, Malgun Gothic, sans-serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, Apple SD Gothic Neo, Noto Sans KR, Malgun Gothic, sans-serif"
    fontSize: "22px"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  price:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, Apple SD Gothic Neo, Noto Sans KR, Malgun Gothic, sans-serif"
    fontSize: "19px"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  body:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, Apple SD Gothic Neo, Noto Sans KR, Malgun Gothic, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, Apple SD Gothic Neo, Noto Sans KR, Malgun Gothic, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.3
  meta:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, Apple SD Gothic Neo, Noto Sans KR, Malgun Gothic, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
    fontFeature: "tnum"
rounded:
  tag: "3px"
  sticker: "4px"
  sleeve: "6px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  row: "30px"
components:
  button:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.text}"
    rounded: "{rounded.sticker}"
    padding: "8px 13px"
  button-primary:
    backgroundColor: "{colors.sticker}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sticker}"
    padding: "8px 13px"
  watch-button-pressed:
    backgroundColor: "{colors.sticker}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sticker}"
  tab:
    textColor: "{colors.muted}"
    rounded: "{rounded.sticker}"
    padding: "7px 12px"
  tab-hover:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.text}"
  tab-active:
    backgroundColor: "{colors.sticker}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sticker}"
  toggle:
    textColor: "{colors.muted}"
    rounded: "{rounded.sticker}"
    padding: "7px 12px"
  toggle-checked:
    backgroundColor: "{colors.sticker}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sticker}"
  search-input:
    backgroundColor: "{colors.sticker}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sticker}"
    padding: "10px 14px 10px 38px"
  select:
    backgroundColor: "{colors.felt}"
    textColor: "{colors.text}"
    rounded: "{rounded.sticker}"
    padding: "8px 32px 8px 12px"
  chip:
    textColor: "{colors.muted}"
    rounded: "{rounded.sticker}"
    padding: "2px 8px"
  sleeve:
    backgroundColor: "{colors.sleeve}"
    rounded: "{rounded.sleeve}"
    padding: "9px 6px 6px"
  price-sticker:
    backgroundColor: "{colors.sticker}"
    textColor: "{colors.ink}"
    typography: "{typography.price}"
    rounded: "{rounded.sticker}"
    padding: "7px 9px 8px"
  price-sticker-empty:
    backgroundColor: "{colors.sticker-2}"
    textColor: "{colors.ink-2}"
  sticker-panel:
    backgroundColor: "{colors.sticker}"
    textColor: "{colors.ink}"
    typography: "{typography.display}"
    rounded: "{rounded.sticker}"
    padding: "14px 18px"
  dialog:
    backgroundColor: "{colors.shelf}"
    textColor: "{colors.text}"
    rounded: "{rounded.sleeve}"
    padding: "28px"
  bottom-tab-bar:
    backgroundColor: "{colors.shelf}"
    height: "64px"
---

# Design System: 리프트바운드 시세 (Riftbound Prices)

## Overview

**Creative North Star: "The Card Shop Showcase"**

The site is a Korean card shop's glass display case. The ground is the charcoal felt of the case; every card stands in a clear toploader sleeve on a glass shelf; and every price is a small white printed sticker pressed over the bottom of the sleeve, in near-black ink, exactly as a shop would price its wall. A trader recognises the wall, reads the sticker, and trusts it because the sticker also says how it was priced (median, listing count, update time).

The world is dense and quick to scan: card art is the hero, the number is the loudest type on any surface, and everything else (filters, metadata, method) is quiet grey on felt. There is one bright material besides the art, the sticker white, and it does double duty: it carries prices and it marks whatever is currently selected. Colour beyond that is reserved for meaning: red and blue for price movement (Korean convention), and a muted per-rarity text tint.

Surfaces are flat fills stepped by tone, not lit. No gradients, no glows, no gold. Depth comes from three physical facts only: the sticker sits on top of the sleeve, a hovered card lifts off its shelf, and the card popup floats over the case.

**Key Characteristics:**
- Felt-charcoal ground with shelf and glass tone steps instead of shadows.
- Cards framed in translucent toploader sleeves with a heavier top lip.
- White price stickers in near-black ink for every price; the same sticker white marks the active state.
- Red/blue only for price movement, always paired with ▲/▼.
- Pretendard Variable throughout, tabular figures on every number.
- Two radii only: sleeves 6px, stickers and controls 4px.

## Colors

A near-monochrome charcoal case, one paper-white material, and two signal colours that only ever mean "price went up" or "price went down".

### Primary
- **Sticker White** (#f5f5f2): the price-sticker stock. Every price label, the big median panel, the search field, the stale-data notice, the selection highlight, focus outlines, the history chart line, and every active or selected control (current tab, checked toggle, watched card, primary button, count badge).
- **Faded Sticker** (#e4e5e1): the sticker for a card with no price yet, and the hairline divider inside the median panel.
- **Sticker Ink** (#18191b): text on stickers. **Sticker Ink Soft** (#4b4e53) carries card names and labels on stickers so the price wins.

### Secondary
- **Up Red on felt** (#ff6b60) and **Down Blue on felt** (#6aa6ff): price change on the dark ground (movers lists, tables).
- **Up Red on sticker** (#d21f26) and **Down Blue on sticker** (#1a5fd0): the same signals re-inked for white stock so they keep contrast. Use the sticker pair inside any sticker, the felt pair everywhere else.

### Tertiary
- **Rarity tints**, text only: Common (#b3b1aa), Uncommon (#5fc6c9), Rare (#ef8fb0), Epic (#eaa955), Showcase (#bfa8f5). They colour the rarity chip's text and border (border takes currentColor), nothing else.

### Neutral
- **Showcase Felt** (#1b1c1e): page ground, header bar, select fields, chart well.
- **Shelf** (#222427): one step up: toolbar band, footer, dialog body, bottom tab bar, filter sheet.
- **Glass** (#2a2c30): the shelf band under each grid row, secondary buttons, tab hover.
- **Rule** (#36393e) and **Strong Rule** (#4a4d53): structural hairlines, then control borders.
- **Text** (#ecece8), **Muted** (#a4a6aa), **Faint** (#8b8e93): primary copy, secondary copy and inactive controls, metadata and counts.
- **Sleeve** (rgb(214 220 226 / .07)) with **Sleeve Edge** (rgb(214 220 226 / .34)): the toploader's clear plastic and its edge.

### Named Rules
**The Sticker Is the Accent Rule.** The only "accent" is sticker white. Selected, active, pressed and primary states become a white sticker with near-black ink; there is no brand hue, and no second highlight colour is introduced for state.

**The Movement-Only Rule.** Red and blue mean price up and price down and nothing else, always accompanied by ▲ or ▼ (never colour alone), using the felt pair on charcoal and the ink pair on stickers.

## Typography

**Display Font:** Pretendard Variable (with Pretendard, -apple-system, Apple SD Gothic Neo, Noto Sans KR, Malgun Gothic, sans-serif)
**Body Font:** the same family
**Label/Mono Font:** none; numbers use Pretendard's tabular figures

**Character:** One Korean-first grotesque in many weights, the way a shop's printed labels and signage share one typeface. Hierarchy comes from weight (400 to 800) and tight negative tracking on large sizes, not from a second family.

### Hierarchy
- **Display** (800, 32px, 1.1, -0.03em, tabular): the median on the big sticker panel in the card detail.
- **Headline** (700, 30px desktop / 24px phone, 1.25, -0.025em): card page and document titles (docs run 32px).
- **Title** (800, 22px, -0.02em): the catalog heading and the card name in the popup on phones (26px on desktop detail). Section heads step down to 16-18px.
- **Price** (800, 19px desktop / 17px phone, 1.2, -0.02em, tabular): the price on every shelf sticker.
- **Body** (400, 15px, 1.5): running copy; documents cap at 70ch to 760px wide.
- **Label** (600, 13px, 1.3): card names on stickers, form labels, notes.
- **Meta** (400-700, 11.5-12.5px, tabular): code and listing count under a price, change percentages, chart axes, table headers.

### Named Rules
**The Tabular Rule.** Every number (prices, counts, percentages, dates, axes) is set with tabular figures so columns and stickers align digit for digit; totals and price columns are right-aligned.

**The Small Won Rule.** On a sticker the currency is set small: 원 after the digits in Korean, ₩ before them in English, at 0.6em and weight 700, so the digits carry the price. Plain-text contexts (tables, titles) print the full "원" inline.

## Layout

A max-width 1400px container with 24px gutters (16px on phones). The header is a 56px sticky felt bar (52px on phones); directly under it the toolbar is a sticky shelf-toned band holding search (flexible, up to 420px) and the filter controls.

The catalog is an auto-fill grid of sleeves, minimum 176px per column with 30px between rows and 18px between columns; on phones the minimum drops to 150px (two columns on a typical phone, forced to two at 360px and below) with a 26px by 12px gap. Each row stands on a glass shelf band: every card draws a 34px band that extends half the column gap past each side, so adjacent cards fuse into one continuous shelf per row.

The card detail is a two-column grid on desktop (320px sleeve column, sticky, then the data column, 32px gap) and a single column on phones with the art capped at 60% width in the popup. Static card pages cap at 1120px, documents at 760px.

On phones (768px and below) the header tabs move into a fixed bottom tab bar of five equal cells with safe-area padding, and the filters move into a bottom sheet. Spacing follows a loose 4px base (4, 6, 8, 12, 16, 18, 24) rather than a strict scale.

## Elevation & Depth

Depth is tonal by default: felt, shelf and glass are three flat steps, separated by 1px rules. Shadows exist only where a physical object sits above another, and there are exactly three of them, plus the sleeve's inset plastic edge.

### Shadow Vocabulary
- **Sleeve edge** (`box-shadow: inset 0 0 0 1px rgb(214 220 226 / .34), inset 0 5px 0 0 rgb(214 220 226 / .26)`): the toploader's clear edge and heavier top lip. Inset only; it draws the plastic, not elevation.
- **Sticker** (`box-shadow: 0 2px 3px rgb(0 0 0 / .35)`): a paper sticker standing just off the sleeve. Shelf stickers only.
- **Hover lift** (`box-shadow: inset 0 0 0 1px rgb(214 220 226 / .6), inset 0 3px 0 0 rgb(214 220 226 / .22), 0 14px 24px -14px rgb(0 0 0 / .8)` with `translateY(-3px)`): a card lifted off its shelf, fine pointers only.
- **Dialog** (`box-shadow: 0 30px 70px -20px rgb(0 0 0 / .85)`): the card popup floating over the dimmed case (backdrop rgb(8 9 10 / .74)).

### Named Rules
**The Three Shadows Rule.** Sticker, hover lift, dialog. A new shadow needs a physical reason of the same kind; panels, buttons, tabs and the toolbar stay flat.

## Shapes

Two radii and nothing else rounded. Sleeves, the dialog and the top corners of sheets use the sleeve radius (6px); stickers, buttons, tabs, toggles, fields, chips and the median panel use the sticker radius (4px). Tiny inline tags, card-art corners and table thumbnails use 3px. The logo is a hanging price tag: a 14 by 19px white tag with a punched hole. No pills, no circles except the hole and chart dots.

Borders are 1px hairlines in Rule or Strong Rule. One dashed border exists, on the estimated-sold-price box, marking it as an estimate rather than a printed price.

## Components

### Buttons
Solid, quiet, and pressed like a physical button.
- **Shape:** sticker radius (4px), 1px Strong Rule border.
- **Default:** glass fill, 14px weight 600, 8px by 13px padding, muted 15px icon.
- **Primary:** a sticker: sticker white fill and border, ink text, weight 800 (filter sheet "done").
- **Hover / Focus:** border brightens to Muted on fine pointers only; focus is a 2px sticker-white outline at 2px offset; press scales to 0.97 over 160ms on the custom ease-out.
- **Disabled:** 40% opacity, no press.
- **Watch toggle:** a default button that becomes a sticker when pressed (aria-pressed).

### Chips
- **Style:** transparent, 1px Strong Rule border, muted 12.5px text, 2px by 8px; rarity chips take their rarity tint for text and border.
- **Filter toggles:** the same outline at rest; when checked they become a sticker (white fill, ink text, weight 700) and reveal a check icon.
- **Set links (footer):** outlined 4px chips that brighten their border on hover.

### Cards / Containers
- **Sleeve:** clear plastic fill, 6px radius, inset edge plus top lip, 9px top and 6px side padding around the 744:1039 art.
- **Price sticker:** overlaps the bottom 22px of the sleeve (20px on phones), inset 8px from the sides; name in Label ink-soft, price in Price ink, code and listing count in Meta. Unpriced cards get the faded sticker.
- **Median panel:** a large sticker in the detail view: median in Display, low / high / listings as right-aligned figures beside it, change line under a faded hairline.
- **Estimated sold box:** dashed outline on felt, never a sticker.
- **Tables:** no fills; 1px Rule between rows, right-aligned weight-700 price column, outliers struck through in Faint.

### Inputs / Fields
- **Search:** a sticker field: white stock, ink text and caret, no border, 4px radius, search icon inset at 12px.
- **Selects:** felt fill, Strong Rule border, 4px radius, custom caret icon; full-width with visible labels inside the phone sheet.
- **Calculator textarea:** sticker stock with tabular figures.
- **Focus:** 2px sticker-white outline, 1-2px offset.

### Navigation
- **Header tabs:** 14px weight 500 muted with an icon; hover goes to glass on fine pointers; the current page is a sticker chip (white, ink, weight 700). The language switch is an outlined 4px button at the far right.
- **Bottom tab bar (phones):** fixed shelf-toned bar, five equal cells, 22px icons over 11px labels; the active cell is a sticker chip.
- **Breadcrumbs and prev/next card links:** Faint text, Muted links, underline on hover.

### Card Popup
The detail opens as a dialog over the dimmed case. Desktop: centred, up to 1000px, shelf fill, 6px radius, enters from 10px below with opacity over 200ms. Phones: a bottom sheet up to 92dvh with 6px top corners, entering from 48px below over 300ms on the drawer curve. In the phone sheet the art stays the hero and carries its own price sticker over the sleeve so the number lands in the top half; prev/next buttons sit under the art.

### Filter Sheet
On phones the filters live in a shelf-toned bottom sheet: grab handle, title and close button, a two-column grid of labelled selects and toggles, and a full-width primary "done" sticker. It slides on the drawer curve (320ms) over a 66% dark backdrop.

### Motion
Short and physical. Easing: ease-out cubic-bezier(.23, 1, .32, 1) for presses, lifts and the desktop dialog; drawer cubic-bezier(.32, .72, 0, 1) for sheets. Colour changes 150ms ease. Presses scale 0.97-0.98. Dialog entry uses @starting-style. All hover effects are gated to hover-capable fine pointers. Under prefers-reduced-motion every transition collapses to near zero and animations are removed.

## Do's and Don'ts

### Do:
- **Do** put every price on a sticker: sticker white (#f5f5f2) stock, ink (#18191b) digits in weight 800, small 원/₩ at 0.6em.
- **Do** mark selection by turning the control into a sticker (white fill, ink text, bolder weight); this is the only active-state treatment.
- **Do** pair every red or blue change with ▲ or ▼, and use the ink pair (#d21f26 / #1a5fd0) on stickers, the felt pair (#ff6b60 / #6aa6ff) on charcoal.
- **Do** build depth from felt, shelf and glass tone steps and 1px rules before reaching for a shadow.
- **Do** present card art in a toploader sleeve (6px radius, inset edge, heavier top lip) standing on a glass shelf band.
- **Do** set every number in tabular figures and right-align price and total columns.
- **Do** gate hover effects to `(hover: hover) and (pointer: fine)`, give presses a 0.97-0.98 scale, and honour reduced motion.

### Don't:
- **Don't** bring back the old dark-and-gold collector look: no gold, brass or yellow accents, no foil or metallic treatments.
- **Don't** use gradients, glows, neon edges, coloured shadows or text shadows; fills are flat.
- **Don't** use pill shapes or radii beyond 6px; controls are 4px, sleeves 6px.
- **Don't** use red or blue for anything except price movement (not links, badges, errors, language tags or brand), and never as the only signal.
- **Don't** drift toward a fintech or crypto dashboard: no KPI tiles, sparkline cards, ticker strips or green/red trading colours.
- **Don't** drift toward a generic shop template: no white product grid, cart-style buttons, star ratings or "sale" badges; the felt case and stickers are the frame.
- **Don't** add a new shadow outside sticker, hover lift and dialog, or a second accent hue for state.
