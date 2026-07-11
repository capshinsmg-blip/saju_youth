# Slide Design System — Editorial Pastel (16:9 only)

> **Purpose.** This is a prompt + design-system spec for generating **16:9 presentation slides** in an editorial, print-magazine aesthetic. Follow every token, rule, and layout constraint below. Output slides only — never mobile, tablet, or web-page layouts.

---

## 0. Hard Constraints (read first — these override anything below)

1. **Fonts: only three families, each with a fixed role.** Every glyph on every slide comes from **Jalnan 2**, **paybooc**, or **Pretendard** — no serif, no Inter, no Waldenburg, no other face, and no system fallback shown to the viewer.
   - **Jalnan 2 (잘난체)** → display / titles / section covers / large stat numbers. The punchy heading voice.
   - **paybooc** → subtitles, sub-heads, card & component titles, chapter labels, badges, buttons. The structured supporting voice (Light / Medium / Bold / ExtraBold).
   - **Pretendard** → all running body, captions, lists, footer, UI text (400 / 500 / 600 / 700).
   Never use a family outside its assigned role (e.g. no Jalnan body text, no Pretendard display headline). See §3 for the exact token map and `@font-face` aliases.
2. **Aspect ratio: 16:9 only.** Every slide is exactly **1280 × 720 px** (or a proportional multiple such as 1920 × 1080). Never emit any other ratio, and never emit responsive breakpoints — there is no mobile/tablet/desktop variant. One canvas, one ratio.
3. **Wordmark: `안산 청년회 기획과`.** Wherever a logo/wordmark appears (top-left header, footer, CTA band), render the **text** `안산 청년회 기획과` in **paybooc** (Bold in the header, Medium/muted in the footer). There is no ElevenLabs mark and no image logo anywhere.
4. **Fixed anchor positions.** The chapter label, title, and subtitle sit at the **same coordinates on every slide** (see §5 Slide Master). A viewer flipping through the deck should see these three elements hold still.
5. **Generous title↔subtitle spacing.** Never crowd the subtitle against the title. Keep the specified vertical gap (§5) — the pairing should breathe.
6. **No empty bottom.** Never leave the lower body of a slide blank. Fill the content region densely — with cards, captions, data, an atmospheric orb, or a supporting strip — without harming the composition. A slide that ends at 60% height with dead space below is a defect.
7. **Vertical centering inside boxes.** Any text box, card, pill, or plate must center its contents on the **vertical middle** of that box (`align-items: center` / `justify-content: center` as appropriate). No text clinging to the top edge of its container.

---

## 1. Overview

The deck reads like a quietly editorial print magazine that happens to be a public-sector / youth-organization brief. The base canvas is off-white `{colors.canvas}` (#f5f5f5) holding warm near-black ink `{colors.ink}` (#0c0a09). Brand voltage is **photographic, not chromatic**: soft pastel atmospheric gradient orbs (mint, peach, lavender, sky, rose) drift through the slide as the only "color" moments. There is no neon accent, no saturated CTA color, no dark dev-tools atmosphere.

Type is a **three-voice system**. **Jalnan 2** carries display — its rounded, confident weight is the deck's signature and gives titles a distinctly Korean, punchy presence. **paybooc** structures the mid-tier — subtitles, sub-heads, card titles, labels, and buttons — bridging the bold display and the quiet body. **Pretendard** carries all running text with high legibility. The contrast between Jalnan's heavy display and Pretendard's calm body *is* the type rhythm; paybooc mediates between them.

CTAs and emphasis chips are subtle: a near-black ink pill (`{component.button-primary}`) is primary, a transparent outline (`{component.button-outline}`) is secondary. The system trusts atmospheric pastel and modest type weights to carry the brand.

**Key Characteristics:**
- Off-white canvas, warm near-black ink. No saturated action color.
- Single primary action: ink pill at `{rounded.pill}`. Pastel orbs carry visual voltage.
- Display runs **Jalnan 2** — the punchy heading signature.
- Mid-tier (subtitles, sub-heads, card titles, labels, buttons) runs **paybooc** (Medium / Bold / ExtraBold).
- Body runs **Pretendard 400/500** with subtle tracking (+0.15–0.18px).
- Five pastel gradient orbs (mint, peach, lavender, sky, rose) used as atmospheric decoration only.
- Soft geometry: `{rounded.pill}` for CTAs/badges, `{rounded.xl}`–`{rounded.xxl}` for cards.
- Consistent slide master: chapter label, title, subtitle locked to fixed positions.

---

## 2. Colors

### Brand & Accent
- **Ink Primary** (`{colors.primary}` — #292524): Primary action color — warm near-black pill. Used scarcely.
- **Ink Primary Active** (`{colors.primary-active}` — #0c0a09): Press / emphasis state.

### Surface
- **Canvas** (`{colors.canvas}` — #f5f5f5): Off-white slide floor — the default background of every slide.
- **Canvas Soft** (`{colors.canvas-soft}` — #fafafa): Lighter plate for subtle bands/cards.
- **Canvas Deep** (`{colors.canvas-deep}` — #0c0a09): Same as ink — the rare full-bleed dark hero slide.
- **Surface Card** (`{colors.surface-card}` — #ffffff): Pure white card.
- **Surface Strong** (`{colors.surface-strong}` — #f0efed): Badges, icon plates.
- **Surface Dark** (`{colors.surface-dark}` — #0c0a09): Dark hero / closing-slide canvas.
- **Surface Dark Elevated** (`{colors.surface-dark-elevated}` — #1c1917): Cards on a dark slide.

### Hairlines
- **Hairline** (`{colors.hairline}` — #e7e5e4): Default 1px divider.
- **Hairline Soft** (`{colors.hairline-soft}` — #f0efed): Lighter divider.
- **Hairline Strong** (`{colors.hairline-strong}` — #d6d3d1): Stronger panel outline.

### Text
- **Ink** (`{colors.ink}` — #0c0a09): Display, primary text.
- **Body** (`{colors.body}` — #4e4e4e): Default running text.
- **Body Strong** (`{colors.body-strong}` — #292524): Emphasis.
- **Muted** (`{colors.muted}` — #777169): Sub-titles, chapter labels.
- **Muted Soft** (`{colors.muted-soft}` — #a8a29e): De-emphasized text.
- **On Primary** (`{colors.on-primary}` — #ffffff): White text on ink pill.
- **On Dark** (`{colors.on-dark}` — #ffffff): White text on a dark slide.
- **On Dark Soft** (`{colors.on-dark-soft}` — #a8a29e): Muted off-white on dark.

### Atmospheric Gradient Stops (signature)
- **Gradient Mint** (`{colors.gradient-mint}` — #a7e5d3)
- **Gradient Peach** (`{colors.gradient-peach}` — #f4c5a8)
- **Gradient Lavender** (`{colors.gradient-lavender}` — #c8b8e0)
- **Gradient Sky** (`{colors.gradient-sky}` — #a8c8e8)
- **Gradient Rose** (`{colors.gradient-rose}` — #e8b8c4)

Appear ONLY as soft radial-gradient orbs inside `{component.gradient-orb-card}` and as background blooms behind hero copy. Never as button fills, never as text colors.

### Semantic
- **Success** (`{colors.semantic-success}` — #16a34a)
- **Error** (`{colors.semantic-error}` — #dc2626)

---

## 3. Typography (Jalnan 2 · paybooc · Pretendard)

### Font Families & Roles
Three families, three jobs — never cross the roles.

| Family | CSS name (OTF / TTF) | Weights available | Role |
|---|---|---|---|
| **Jalnan 2** | `'Jalnan 2'` / `'Jalnan 2 TTF'` | single weight | Display — titles, section-cover heroes, large stat numbers |
| **paybooc** | `'paybooc OTF'` / `'paybooc'` | Light · Medium · Bold · ExtraBold | Mid-tier — subtitles, sub-heads, card/component titles, chapter labels, badges, buttons, wordmark |
| **Pretendard** | `'Pretendard'` | 100–900 | Body — running text, captions, lists, footer, UI |

To keep the token map simple, load the files once and alias each family to a single CSS name (`Jalnan 2`, `paybooc`, `Pretendard`) via `@font-face` — then the tokens below just reference the family + weight:

```css
/* Display */
@font-face { font-family:'Jalnan 2'; src:url('Jalnan2.otf') format('opentype'); font-weight:400; font-display:swap; }
/* paybooc — map each file to its weight under one family name */
@font-face { font-family:'paybooc'; src:url('paybooc_OTF_Light.otf')     format('opentype'); font-weight:300; }
@font-face { font-family:'paybooc'; src:url('paybooc_OTF_Medium.otf')    format('opentype'); font-weight:500; }
@font-face { font-family:'paybooc'; src:url('paybooc_OTF_Bold.otf')      format('opentype'); font-weight:700; }
@font-face { font-family:'paybooc'; src:url('paybooc_OTF_ExtraBold.otf') format('opentype'); font-weight:800; }
/* Pretendard assumed available (self-host or CDN) */
```

All three carry Korean + Latin, so mixed 한글/English copy stays unified within each role.

### Hierarchy

| Token | Font | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|---|
| `{typography.display-mega}` | **Jalnan 2** | 64px | — | 1.08 | -1.5px | Title / section-cover hero |
| `{typography.display-xl}` | **Jalnan 2** | 48px | — | 1.1 | -1.0px | Secondary hero title |
| `{typography.display-lg}` | **Jalnan 2** | 36px | — | 1.2 | -0.4px | Standard slide title (default) |
| `{typography.display-md}` | **paybooc** | 32px | 800 | 1.2 | -0.3px | Sub-section head |
| `{typography.display-sm}` | **paybooc** | 24px | 500 | 1.3 | 0 | Subtitle / card-group title |
| `{typography.title-md}` | **paybooc** | 20px | 700 | 1.35 | 0 | Component / card titles |
| `{typography.title-sm}` | **paybooc** | 18px | 500 | 1.44 | 0.1px | List labels |
| `{typography.body-md}` | **Pretendard** | 16px | 400 | 1.5 | 0.16px | Default body |
| `{typography.body-strong}` | **Pretendard** | 16px | 600 | 1.5 | 0.16px | Emphasized body |
| `{typography.body-sm}` | **Pretendard** | 15px | 400 | 1.47 | 0.15px | Caption body, footer |
| `{typography.caption}` | **Pretendard** | 14px | 400 | 1.5 | 0 | Photo captions |
| `{typography.caption-uppercase}` | **paybooc** | 12px | 700 | 1.4 | 0.96px | **Chapter label**, badges, section tags |
| `{typography.button}` | **paybooc** | 15px | 700 | 1.0 | 0 | CTA pill |
| `{typography.stat-number}` | **Jalnan 2** | 40px | — | 1.0 | -0.5px | Big numbers in stat cards |

### Principles
- **Jalnan 2 owns display.** Slide titles and hero numbers are always Jalnan — its weight *is* the signature, so don't try to lighten or thin it. This is a confident, punchy heading voice (not a delicate editorial serif).
- **paybooc owns the mid-tier.** Subtitles, sub-heads, card titles, labels, and buttons are paybooc. Use Medium (500) for subtitles/labels, Bold (700) for card titles and buttons, ExtraBold (800) only for sub-section heads that need more presence.
- **Pretendard owns body.** Never set body in Jalnan or paybooc; never set a headline in Pretendard. Body stays 400/500/600 for legibility.
- **Contrast is the rhythm.** The jump from Jalnan's heavy display down to Pretendard's calm body carries the hierarchy — lean on that contrast instead of adding a fourth size.
- **Display tracking slightly negative.** Jalnan display pulls -0.4px to -1.5px tighter at large sizes so titles read as one solid mass.
- **Body tracking +0.15–0.16px.** Pretendard body sits slightly looser than default for an even, readable texture.

---

## 4. Layout — Spacing, Grid, Whitespace

### Spacing System
- **Base unit:** 4px.
- **Tokens:** `{spacing.xxs}` 4 · `{spacing.xs}` 8 · `{spacing.sm}` 12 · `{spacing.base}` 16 · `{spacing.md}` 20 · `{spacing.lg}` 24 · `{spacing.xl}` 32 · `{spacing.xxl}` 48 · `{spacing.section}` 64 (slide-scaled).

### Grid & Container (per 1280 × 720 slide)
- **Outer safe margins:** 80px left / 80px right → **content width 1120px**. 56px top / 48px bottom.
- **12-column grid** across the 1120px content width, 24px gutters.
- Card grids: **2-up** for split layouts, **3-up** for benefit/stat grids. 24px inter-card gap.

### Whitespace Philosophy
Generous editorial pacing **at the top** — the title/subtitle zone breathes. But the **body region must stay dense** (see Hard Constraint #6): distribute content to reach the footer line so no slide bottom sits empty. Pastel orbs may fill residual negative space as atmosphere, but orbs alone do not excuse a half-empty slide — prefer real content (cards, stats, captions) and let orbs sit behind it.

---

## 5. Slide Master (the fixed skeleton every slide inherits)

Every slide is built on this master so the chapter label, title, and subtitle **never move**. Coordinates are for a 1280 × 720 canvas; scale proportionally for 1920 × 1080.

```
┌─────────────────────────────────────────────────────────────┐  1280 × 720
│  [80,56]  안산 청년회 기획과            (top-right: section no.)│  ← header row, y≈56
│                                                               │
│  [80,112] CHAPTER LABEL            {caption-uppercase}, muted  │  ← chapter anchor
│  [80,140] Slide Title              {display-lg} Jalnan 2 36px  │  ← title anchor
│                                                               │      (↓ 28px gap)
│  [80,212] Slide subtitle           {display-sm} 24 / 400 muted │  ← subtitle anchor
│                                                               │
│  ┌───────────────── CONTENT REGION ─────────────────────────┐ │
│  │ y ≈ 268 → 660.  Width 1120. Must be filled densely.       │ │
│  │ Cards / grids / stats / captions / atmospheric orb.       │ │
│  └───────────────────────────────────────────────────────────┘ │
│  [80,672] ─── hairline ───────────────────────────────────────  │  ← footer rule
│  [80,684] 안산 청년회 기획과            ·   page 04 / 20         │  ← footer row
└─────────────────────────────────────────────────────────────┘
```

**Locked anchors (identical on every content slide):**

| Element | Token | X | Y (baseline top) | Notes |
|---|---|---|---|---|
| Header wordmark | `{typography.body-sm}` 600, ink | 80 | 56 | `안산 청년회 기획과`, always top-left |
| **Chapter label** | `{typography.caption-uppercase}`, muted | 80 | **112** | e.g. `01 · 사업 개요` |
| **Title** | `{typography.display-lg}` (Jalnan 2, 36px) | 80 | **140** | max 2 lines |
| **Subtitle** | `{typography.display-sm}` (24/400), muted | 80 | **212** | **≥ 28px gap below title baseline** — never tighter |
| Content region top | — | 80 | **268** | fill down to ~660 |
| Footer rule | 1px `{colors.hairline}` | 80–1200 | 672 | full content-width hairline |
| Footer wordmark + page | `{typography.body-sm}`, muted | 80 / 1200 | 684 | wordmark left, `page NN / NN` right |

**Title↔subtitle rule (Hard Constraint #5):** the vertical gap between the title's baseline and the subtitle's cap-height is **≥ 28px** (`{spacing.xl}`-ish). If a title wraps to 2 lines, the subtitle anchor shifts down by exactly one title line-height so the *gap* stays constant — the pairing keeps its breathing room rather than colliding.

**Section-cover / title slides** may deviate: they center the `{typography.display-mega}` title with an atmospheric orb behind it. All *content* slides obey the master exactly.

---

## 6. Elevation & Depth

Hairline + soft drop. Cards float above off-white via 1px hairlines and a single subtle shadow tier. Atmospheric depth comes from gradient orbs.

| Level | Treatment | Use |
|---|---|---|
| Flat (canvas) | `{colors.canvas}` (#f5f5f5) | Slide floor, footer |
| Card | `{colors.surface-card}` (#ffffff) | Content cards |
| Hairline border | 1px `{colors.hairline}` | Card outlines, footer rule |
| Soft drop | `0 4px 16px rgba(0,0,0,0.04)` | Emphasized cards (single tier) |
| Gradient orb | Radial gradient in one `{colors.gradient-*}` | Atmosphere only — never a content surface |

**Pastel orbs** are the strongest atmospheric pattern: soft radial blooms in mint / peach / lavender / sky / rose drift behind hero copy and into residual space. They hold no content.

---

## 7. Shapes — Border Radius

| Token | Value | Use |
|---|---|---|
| `{rounded.none}` | 0px | Reserved |
| `{rounded.xs}` | 4px | Inline tags |
| `{rounded.sm}` | 6px | Compact rows |
| `{rounded.md}` | 8px | Inputs |
| `{rounded.lg}` | 12px | Compact cards |
| `{rounded.xl}` | 16px | Feature / stat cards |
| `{rounded.xxl}` | 24px | Gradient-orb cards (extra soft) |
| `{rounded.pill}` | 9999px | CTAs, badges |
| `{rounded.full}` | 9999px | Icon circles, avatars |

---

## 8. Components

> **Universal rule (Hard Constraint #7):** every component that holds text vertically **centers** its contents on the box's middle axis. Cards, pills, plates, stat blocks, list rows — all use `display:flex; align-items:center` (and `justify-content:center` when the content is meant to be centered) so nothing hugs the top edge.

### Header & Footer
**`slide-header`** — Top row of every content slide. Left: wordmark `안산 청년회 기획과` in `{typography.body-sm}` 600 ink. Right (optional): running section number in `{typography.caption-uppercase}` muted. Height 40px, contents vertically centered.

**`slide-footer`** — Bottom of every content slide: a full-width `{colors.hairline}` rule at y=672, then a row with wordmark `안산 청년회 기획과` (muted) left and `page NN / NN` right, both `{typography.body-sm}`, vertically centered.

### Chapter / Title Block
**`slide-heading`** — The locked chapter-label + title + subtitle stack from §5. Left-aligned at x=80. Chapter label (paybooc, muted uppercase) → title (`{display-lg}`, Jalnan 2) → **≥28px gap** → subtitle (`{display-sm}`, paybooc Medium, muted). This block is identical in position on every content slide.

### Buttons
**`button-primary`** — Near-black ink pill. Background `{colors.primary}`, text `{colors.on-primary}`, `{typography.button}`, padding 10×20px, height 40px, `{rounded.pill}`, contents centered.

**`button-outline`** — Transparent pill, 1px `{colors.hairline-strong}` border, text `{colors.ink}`.

**`button-tertiary-text`** — Inline ink text link.

### Hero & Atmospheric (cover / section slides)
**`hero-band`** — Full-bleed slide. Centered display headline `{typography.display-mega}` (Jalnan 2, 64px), subhead `{typography.body-md}`, optional CTA pair, and an atmospheric gradient orb bloom behind the centered copy. Everything vertically centered on the canvas.

**`gradient-orb-card`** — Large card with a soft radial orb behind centered display copy. Background `{colors.canvas-soft}`, `{rounded.xxl}` (24px), padding 32px, contents centered. Each variant uses one of the five gradient tokens.

### Cards
**`feature-card`** — 2-up/3-up grids. Background `{colors.surface-card}`, `{rounded.xl}`, padding 24px, 1px hairline. Icon/plate → title `{title-md}` → body `{body-md}`, all vertically centered within the card.

**`stat-card`** — For dense data. Background `{colors.surface-card}`, `{rounded.xl}`, padding 24px, 1px hairline. Big number in `{typography.stat-number}` (Jalnan 2, ~40px) ink, label below in `{typography.caption-uppercase}` (paybooc) muted. Number + label centered on the card's vertical axis.

**`testimonial-card`** — Quote card. Background `{colors.surface-card}`, text `{colors.body}`, `{rounded.xl}`, padding 32px, contents centered.

### Rows, Badges, Inputs
**`list-row`** — Horizontal row, transparent bg, 1px hairline divider. Left: 32px circular icon plate; right: label stack. Vertically centered.

**`icon-circular`** — Background `{colors.surface-strong}`, `{rounded.full}`, 32px, glyph centered.

**`badge-pill`** — Background `{colors.surface-strong}`, text `{colors.ink}`, `{typography.caption-uppercase}`, `{rounded.pill}`, padding 4×10px, centered.

**`text-input`** — (rare, for form mockups) Background `{colors.surface-card}`, `{rounded.md}`, padding 12×16px, height 44px, 1px `{colors.hairline-strong}`; focus thickens to 2px ink.

### Closing Slide
**`cta-band`** — Closing slide. Background `{colors.canvas}` (or dark variant), centered display headline `{typography.display-lg}`, single ink pill, wordmark `안산 청년회 기획과`, all vertically centered.

---

## 9. Filling the Content Region (density guidance — Hard Constraint #6)

A content slide's region (y≈268→660, 1120px wide) must be **worked to the footer**. Reach for these before leaving space empty:

- **Stat strip:** a 3-up or 4-up `stat-card` row across the bottom to anchor the base of the slide.
- **Two-tier layout:** primary point up top, supporting cards/captions filling the lower band.
- **Caption rail:** a slim `{typography.caption}` note or source line just above the footer rule.
- **Atmospheric orb:** a pastel bloom occupying otherwise-negative corners *behind* content — never as the sole filler.
- **Balanced 2-up split:** copy left, card/visual right, both extending to the same lower boundary.

**Test:** if you can draw a horizontal line across the slide below which there is nothing but canvas, the slide fails. Add a supporting tier or redistribute vertical rhythm.

---

## 10. Do's and Don'ts

### Do
- Use only the three families, each in its role: **Jalnan 2** display, **paybooc** mid-tier, **Pretendard** body.
- Set every slide title and hero number in **Jalnan 2**; subtitles / card titles / labels / buttons in **paybooc**; all running text in **Pretendard**.
- Render the wordmark as the text `안산 청년회 기획과` in **paybooc**, in header and footer.
- Keep chapter label / title / subtitle at their locked master positions on every content slide.
- Keep **≥28px** between title and subtitle.
- Fill the content region down to the footer; no empty lower bands.
- Vertically center contents inside every box, card, and pill.
- Use `{rounded.pill}` for CTAs/badges, `{rounded.xl}`/`{rounded.xxl}` for cards; pastel orbs as atmosphere only.

### Don't
- **Don't** use any font outside the three families — no serif, no Inter, no fallback shown.
- **Don't** cross the roles: no Jalnan body text, no Pretendard headlines, no paybooc running paragraphs.
- **Don't** emit any aspect ratio but 16:9, and don't emit responsive breakpoints.
- **Don't** show an ElevenLabs mark or any image logo — text wordmark only.
- **Don't** try to thin or lighten Jalnan display — its single heavy weight is the point; keep body Pretendard at 400+.
- **Don't** crowd the subtitle against the title.
- **Don't** leave the bottom of a slide empty.
- **Don't** top-align text inside a box — center it vertically.
- **Don't** introduce a saturated action color; ink pill is the only CTA color.
- **Don't** use gradient orbs as button fills, text colors, or content surfaces.

---

## 11. Iteration Guide

1. Start from the **Slide Master** (§5) — place header, locked heading block, footer first, then fill the content region.
2. One component at a time; CTAs default to `{rounded.pill}`, cards to `{rounded.xl}`.
3. Use `{token.refs}` everywhere — never inline hex.
4. Jalnan 2 for display; paybooc for mid-tier; Pretendard (400/500/600) for body.
5. Verify each slide against the four self-checks below before finishing.

### Per-slide self-check
- [ ] Only Jalnan 2 / paybooc / Pretendard, each in its role (no crossed roles)?
- [ ] Exactly 16:9 (1280×720 or 1920×1080)?
- [ ] Wordmark reads `안산 청년회 기획과`, no ElevenLabs?
- [ ] Chapter label / title / subtitle on locked anchors, ≥28px title–subtitle gap?
- [ ] Content region filled to the footer — no empty lower band?
- [ ] Every box's text vertically centered?

---

## 12. Known Gaps
- Animation timings (orb drift, entrance transitions) are out of scope.
- Only 16:9 is supported by design — no other export ratio exists in this system.
- Jalnan 2 and paybooc are provided as font files (self-host via `@font-face`); Pretendard is assumed available (self-host or CDN). Design as if all three always load.
- Jalnan 2 ships a single weight — hierarchy within display comes from size, not weight.
