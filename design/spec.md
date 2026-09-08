# Design spec — extracted from Figma, once

**Source of truth: file `Qf9So7pT1dl36oVh98udnY`, section `1:189` "Claude Handoff".**
Do not re-query Figma for anything below.

Supersedes the earlier extraction from `jyQPWoE2Wh6xRAs3QTkif6`. Where the two
disagree, this file wins — the differences are called out inline, because the
old values are still wrong in ways that look plausible.

## Node map

| Node | What |
|---|---|
| `1:190` | Homepage, 1440×900 |
| `1:191` | Window, 1077×884 — `get_metadata` reports it empty, which is misleading; use `get_design_context` |
| `1:374` | Sidebar, 356×900 |
| `1:514` | work hover states — 9 cards, first is `1:515`, popover is `1:525` |
| `1:3700` | Sidebar / Meet the Head Cheff, expanded |
| `3:108`, `4:2208` | Contact dropdown mockups |

## The responsive unit

The design frame is **1077px** wide. Every scene dimension is authored as a
count of those pixels via `--u` in `app/globals.css`, so `calc(178 * var(--u))`
reads 1-to-1 with Figma and still scales continuously. `--u` is clamped: below
~668px of Window the scene stops shrinking and the Window pans instead.

**Type is never expressed in `--u`** — 11px chip copy scaled down with the scene
is illegible. Nor are the 32px hit targets, which are an ergonomic floor.

## Colour

| Token | Value | Use |
|---|---|---|
| `kitchen-purple` | `#9770ff` | sidebar surface, `website`/`E-commerce` chips, comment posters |
| `kitchen-ink` | `#000000` | borders, body text, pills |
| `kitchen-red` | `#e50305` | popover top edge, HOT ribbon, `brand` chips, vibe poster |
| `kitchen-lime` | `#ddf45b` | **all header text**, popover brand swatch, hover glow, `product`/`Shipped` chips |
| `kitchen-paper` | `#fafafa` | Window surface, popover body |
| `kitchen-brown` | `#755a3d` | the `coming soon` pill |
| `kitchen-blue` | `#14a0e1` | `growth` chips |

## Typefaces

| Role | Family | Notes |
|---|---|---|
| "Praise Fabilola" logotype | **Gochi Hand** | Live text. The handoff **hides** the bitmap layer — the old spec's "use the WebP" applies only to 'JO'DISCO. |
| Header greeting | **Gochi Hand** 16px | |
| Body / UI | **Satoshi** | 500 for the split button's "Contact me" |
| Clock, timezone chips | **Doto** ExtraBold, `ROND 0` | header clock is 16px, tracking `-0.8px` |
| "CHEF WAS CUTE" sticker | **Danfo**, `ELSH 0` | 12px. New in this handoff. |

Tracking is `-0.02em` throughout. Satoshi Black Italic (the HOT ribbon) is not
in the self-hosted set, so the ribbon synthesises italic from 700.

## Window (`1:191`)

Surface `#fafafa`, border 1px with a **2px bottom**, radius 6. The wall tile is
a bitmap; the `Video` overlay layer is dropped from scope.

### Header (`1:193`)
38 tall, `pl-16 pr-8 py-8`, **every glyph lime**. Left: Gochi greeting + Doto
clock. Right: a split button — leading half black with a 16 avatar, "Contact me",
a light `|`, and the truncated **wallet address**; trailing half black with a 12
lime disc holding a chevron-up-down. Radii `16.667` outer / `3.333` inner.
**The whole control opens the dropdown** (confirmed by Praise) — neither half is
a mailto. The dropdown is a purple panel: Resume · LinkedIn · Twitter/X · Github ·
Contra, each icon + label + chevron-right.

### Row geometry — `work_row` (`1:224`)
Row **230** tall. `shelf_top` 7 at y216; `Shelf base` 8 at y223 (so it hangs 1
below the row, which is what makes consecutive rows read as continuous shelving);
Work Card 178 wide at y94, its foot landing **9 above the row floor**.

Cans sit at **x = 96 / 450 / 804** — reproduced by percentage side padding plus
`space-between`, not by a fixed gap, which would over-constrain the track sum.

Paint order, back to front: **garnishes → shelf base → cards → `shelf_top`**.
The lip is drawn last so it crosses the cans' feet; that overlap seats them.

### Values
- `shelf_top`: `rgba(255,255,255,0.01)`, `border-top 1px rgba(255,255,255,0.2)`, `blur(2px)`
- `Shelf base`: wood at `184 × 230`, `top left`, `inset 0 4px 4px rgba(0,0,0,0.4)`
- Work Card: `drop-shadow(-2px 2px 8px rgba(0,0,0,0.25))`; lid 180×24 over a 178 card, rim 178×3
- Label: radius 1 and three inset shadows, not a gradient —
  `inset -12px 0 8px rgba(211,192,171,.25)`, `inset 0 4px 8px rgba(0,0,0,.2)`, `inset 12px 0 8px rgba(0,0,0,.4)`
- Garnishes: `drop-shadow(-2px 3px 4px rgba(0,0,0,0.25))`; exact per-row positions live in `Garnish.tsx`

### Can label chips — **corrected**
The old spec said the chips are baked into the artwork and must never be
overlaid. That is still the right instruction, but only against the **right
folder**: `compressed_assets/works/cover_images/` (534×300) is authoritative and
carries the correct fills. The retired `main_image/` set had the wrong ones.
`labelChips` in `content/works.ts` exists purely to expose that raster copy to
screen readers.

### Hover (`1:525`)
Can glow becomes `drop-shadow(0 4px 20px #ddf45b)`.

Popover **231 × 91**, at `left -26, top 19` of the card, so it overhangs both
sides. Structure: a **22-tall band** holding the HOT ribbon, then a 231 × 69
content block — red `#e50305` behind, showing as a 2 top edge; radius 6 top / 2
bottom; `blur(2px)`; lime brand swatch 38 wide with a 24 mark; body `#fafafa`
with the blurb and a right-aligned pill row (18 tall) at `(8, 41)`.

HOT ribbon: 19 × 22 at `x 106`, red, a vertical crawl of repeated `HOT`, notched
tail. Only on works flagged `hot`.

**CTA variants** — `view` (black pill, paper text) · `more` (lime) + `view` ·
`coming soon` (brown). Per-work in `content/works.ts`.

### Stickers
Shared chrome: radius 6, paper grain at `opacity .5 / mix-blend-multiply`,
flipped; a red arrow vector; a bordered photo bleeding past the bottom edge; an
inset white highlight.

| Sticker | Where | Style | Click |
|---|---|---|---|
| 66% revenue growth | row 2, centred, top 24, w 188.335 | purple, dashed red border, lime 11px `leading-.8` | opens Clients & Achievements |
| testimonial | row 3, left 91, top 24 | same | opens Comments |
| CHEF WAS CUTE | band below row 3, left 868, 200.069 × 44.313 | red, 2px solid border, Danfo lime | cycles the 3 chef photos |

### Radio and wall gallery (`90:296`)

The gallery is 481.321 x 115.471 at Window (297.679, 740.560) -- centred, 298 of
margin each side -- inside the band under the third shelf. Contents, gallery-local:

| Node | What | x, y | Size | Note |
|---|---|---|---|---|
| `90:297` | red mesh | 0, 0 | 481.32 x 115.47 | lattice, 22.866 pitch, 1.143 weight, `#e50305` |
| `90:346` | radio | -6.68, 0.44 | 125 x 151 | a still in Figma; the live component in the build |
| `90:347` | photo | 103.32, 29.72 | 73.19² | rot 3.97, 1.143 `#fafafa` border |
| `90:349` | photo | 184.32, 20.44 | 68.60² | |
| `90:348` | photo | 262.32, 6.44 | 72.67² | rot -3.51 |
| `97:366` | "10.12" card | 205.09, 76.44 | 55 x 31 | |
| `90:350` | ONION poster | 344.32, 12.44 | 68.60² | `#755a3d` ground |
| `97:368` | photo | 420.32, 29.44 | 73.19² | **rot 176.03** -- hung upside down |
| `86:238` | CHEF WAS CUTE | 253.32, 89.44 | 184 x 36.88 | the vibe sticker, now inside the gallery |

The radio runs 8 past the Window floor: that is the cable, and it is clipped by
`.kitchen-scene`, not scrolled.

**Do not take these numbers off the Figma MCP.** Its geometry for this frame put
`97:368` 68 units right of where it is and missed its rotation entirely. The
values above are from the REST dump.

### Sidebar sticker stack (`86:224`)

339 x 62, between the filter chips and the accordions. Two cards drawn, the same
component at two depths: `86:225` front, 210 x 47.84 at (64.77, 4), +1 degree,
radius 6.69; `78:237` behind, 173 wide (0.824 of it) at (82.33, 32.15), -1
degree. Copy is black on the purple card -- its purple text stroke is the ground
colour, so it only fattens the glyph. Photo is 51 x 48.71 at (162.76, 2.84),
inside the card, not bleeding past it as the kitchen note's does.

The `work_row` frames carry **no poster nodes** any more -- the revenue and
testimonial stickers were removed from the shelves, and the Clients &
Achievements accordion went with them.

## Sidebar (`1:374`)

Outer `p-8`, inner `w-340 rounded-6`, border 1px with a 2px bottom. Sections
divide with `border-b`. Brand `px-16 py-8` · Designer `p-12` · Filters `p-12`,
`flex-1` · Accordions `pt-8 px-12` · Footer `p-12`.

Chips: 1px border, radius 8, `px-6 pt-2 pb-3` — the asymmetric vertical padding
is optical centring for the cap-height trim, keep it. Timezone chips are the same
box, dashed, Doto. Accordion rows are dashed, radius 8; the open row inverts to
black with a purple label.

**Filter set — corrected.** The handoff reverts to:
`Product Design · Shipped · Branding · Website · Motion · Growth & Automation · AI assets`
The old spec recorded `Brand Design / Websites / AI Assisted` as the newer set.
It is not. Ids in `content/filters.ts` are stable regardless.

Accordions are **controlled from the store**, because the Window stickers open
them from across the page. Whether that also raises the mobile drawer is decided
in `SidebarDrawer`, not the store — Base UI portals drawer content to `<body>`,
so a `md:hidden` ancestor cannot keep it off the desktop.

## Icons

`Folder`, `Star`, `Globe`, `ChevronUp`, `ChevronsUpDown`, `ChevronRight` all map
onto lucide-react. **The four dropdown brand marks do not** — lucide v1 dropped
its brand set and no licensed package covers LinkedIn *and* Contra. They are
generics for now; export the glyphs from `3:108` and each is a one-line swap in
`content/contact.ts`.

## Known gaps

- **Wallet address** — only `FbMn...zhea` was legible in the export. `content/contact.ts` carries that fragment; `truncateAddress` handles a full string when it lands.
- **Wall tile vertical seam** — deferred by Praise. Recurs down the wall; the fix is a re-exported pattern cell or an offset-and-feather heal pass.
- **Clients & Achievements / Comments bodies** — no expanded design exists; both are data-driven and a data edit away.

## Case study (`25:664` "Homepage/ case_study")

Pulled by REST on 2026-09-02 17:34, into the same `file.json` as everything
above. **The exact values live in `design/case-study.tokens.json`**, regenerated
by `scripts/case-study-tokens.mjs` and asserted by
`tests/e2e/case-study-fidelity.spec.ts`. What follows is the prose reading of it
-- go to the JSON for a number, come here for what the number means.

> A render of this frame from 16:55 the same day already disagreed with the file
> by 17:34 -- the study breadcrumb chip had been recoloured. **Do not take values
> off a screenshot**, even one you generated yourself an hour ago.

The frame keeps the Sidebar (`25:847`) untouched and replaces the Window's
contents. Same shell, same chrome, different cargo.

### Surface

`#c1b2a3` (`kitchen-tan`) at 1077x884, 1px ink border with a **2px bottom** and
radius 6 -- byte-identical chrome to the kitchen Window. The warm greige is
doing real work: a long read on `#fafafa` inside a purple frame glares.

That 1px/2px-bottom border recurs on the brand avatar (`26:236`) and the media
holder (`35:300`). It is the house edge, not a one-off.

### Header (`25:667`)

38 tall, `pl-4 pr-8 py-8`, 1px ink rule beneath. Left is a breadcrumb, right is
the **same split Contact button as the kitchen** -- reuse `ContactMenu`, do not
rebuild it.

Breadcrumb, gap 4: a 16 chevron-left back to `/`, then two chips at radius 8
with the sidebar's asymmetric `pt-2 pr-6 pb-3 pl-6` optical padding:

| Chip | Fill | Border | Text |
|---|---|---|---|
| the work's filter | none | 1px ink | Satoshi 500 14, ink |
| the study | `kitchen-brown` | none | Satoshi 500 14, **`kitchen-tan`** |

The `/` between them is Satoshi **300** -- lighter than either label, so the
separator recedes. The folder icon inside both chips is `visible: false`; it is
in the file and is not drawn.

### Column (`35:267`)

**519 wide, centred** -- 279 of margin either side of 1077. Ends in a **dashed**
(`2,1`) `kitchen-brown` rule at **20% opacity**, bottom edge only
(`individualStrokeWeights` is `{top:0,right:0,bottom:1,left:0}` -- the uniform
`strokeWeight: 1` alone would have drawn a box). 40 of padding above it.

Masthead (`35:244`), stacked at gap 21: a 24 avatar + `Client | Sector` in Doto
800 14; the title in Satoshi 500 **24/1.35**; the hook quote in Gochi Hand 16,
`kitchen-brown`. Then a 2-col grid (`35:266`), column gap 8, row gap 16, cell
gap 8 -- Doto 800 12 brown label over Satoshi 500 14 ink value, four cells:
Role, Client, Scope, Timeline.

Media (`35:300`) opens 30 below the rule: full column width, radius 2, 1px
brown border. Figma crops its placeholder; **the brief overrides that** -- images
keep their own aspect ratio at full column width.

### Progress rail (`35:338`)

At `x 23, y 106`, 112 wide -- floated in the left margin, not in the column.
Ticks (`35:313`) are 1px `kitchen-brown` lines on an **11 pitch**, labels in
Doto 800 12 brown starting at `x 67`, vertically centred on their own tick.

Widths encode the structure, and the rule is derived (not hardcoded) in
`case-study-tokens.mjs`:

- **base 10** -- one ordinary tick
- **section 29** -- a labelled heading
- **first 40** -- the opening section, longest of all
- a **taper** under the first section only: `36, 29, 26, 19, 16, 13, 10`

A section tick is one **wider than the tick before it**. That distinction
matters: "wider than base" would read the whole opening taper as eight sections.

Praise's sketch draws 17 ticks with sections at indices 0, 8 and 16 -- evenly
spread, because a sketch has no real document behind it. In the build the count
follows the available rail height at the 11 pitch, and each section sits at the
tick matching its relative offset down the article, so the rail is a scale model
of the page. Confirmed independently: the three labels sit at `y` 106/194/282,
which is exactly `tickY - 4` for ticks 0, 8 and 16.

### The sand surface (`51:1569`)

A second case-study frame, pulled 2026-09-03. Structurally identical to
`25:664` -- same 249 nodes, same geometry, same type -- and differing in exactly
13 fills and strokes, every one of them `#9770ff` becoming `#c1b2a3`:

| What | |
|---|---|
| the page frame | ground behind the whole layout |
| Sidebar `Container` | the panel fill |
| six `Shape` rectangles | the chef tool icon grounds, hence the `on-sand` set |
| `Comments` label | purple-on-black becomes sand-on-black |
| three Avatars + one Icon | stroke only |

Homepage `1:190` is **unchanged and still fully purple** (24 purple, 0 sand),
which is deliberate: the room repaints only while you are reading a case study.
That is why `kitchen-surface` exists as a role token and why the swap is one
variable rather than a second set of components.
