---
name: AV
description: A dashed ring cut into four quarters; each quarter opens into a room in pure black and white.
colors:
  ink: "#000000"
  paper: "#ffffff"
  dim: "#767676"
  dim-on-black: "#8c8c8c"
typography:
  headline:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "clamp(18px, 1.7vw, 26px)"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "0em"
  body:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.01em"
  body-long:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.02em"
  data:
    fontFamily: "Courier New, Courier, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0.04em"
    fontFeature: "tnum"
  aside:
    fontFamily: "Times New Roman, Times, serif"
    fontSize: "16px"
    fontWeight: 400
    letterSpacing: "0em"
rounded:
  none: "0px"
  full: "50%"
spacing:
  gutter: "24px"
  gutter-narrow: "16px"
  cell: "22px"
  block: "40px"
  section: "96px"
  bar: "76px"
components:
  nav-link:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
  nav-current:
    textColor: "{colors.ink}"
    typography: "{typography.aside}"
  data-reading:
    textColor: "{colors.ink}"
    typography: "{typography.data}"
  index-item:
    textColor: "{colors.dim}"
    typography: "{typography.headline}"
    padding: "0.04em 0.14em"
  index-item-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.headline}"
    padding: "0.04em 0.14em"
  tag:
    textColor: "{colors.ink}"
    typography: "{typography.data}"
  tag-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  slider-thumb:
    backgroundColor: "{colors.ink}"
    rounded: "{rounded.full}"
    size: "14px"
  corner-ring:
    size: "44px"
---

# Design System: AV

## Overview

**Creative North Star: "The Quartered Ring"**

The whole site is one drawing: a dashed circle with a Times New Roman asterisk at its center, cut into four quarters (film upper-left, misc upper-right, about lower-right, design lower-left). The homepage is that ring and nothing else. Every section page is one quarter opened into a room, and the ring travels with the visitor as a small corner mark with its quarter still lifted. The concept is the owner's own sketch; the finish is technical, with clean and precise linework and nothing hand-drawn.

The material is pure black and white with no texture, gradients or shadows. Structure comes from 1.5px hairlines, registration marks and type voice instead of boxes, cards or fills. Density is low: one instrument per page (a viewfinder, an index, a paragraph, a field of static), plus a quiet grid beneath it for when work exists. Motion is small and continuous. The ring idles, the section icons animate, and the ring morphs between pages. All of it stops under reduced motion.

No work has been supplied yet, so every work slot ships empty. Each empty state is that section's animated icon with a short Courier reading. The empty states are a designed state of the system, not filler, and nothing is ever invented to fill them.

**Key Characteristics:**
- One drawing (the quartered dashed ring) carries identity on every page.
- Pure black and white, two grounds, no texture, no shadow.
- 1.5px hairlines and + registration marks in place of boxes.
- Three type voices: Helvetica for words, Courier New for data, Times New Roman for the mark and the named room.
- Animated section icons stand in as idle and empty states.

## Colors

Two values and one grey per ground. The grounds swap, the roles stay.

### Neutral
- **Ink**: text, hairlines, marks, icons, active fills. On the white ground it is black; on the black ground (`ground-black` on the root) ink and paper swap, so ink is white.
- **Paper**: the page ground, the sticky top bar's ground, and the text color on inverted highlights.
- **Dim Grey**: secondary text on the white ground (resting index titles, the slider's track, unselected captions). Chosen for 4.5:1 on white.
- **Dim Grey on Black**: the same role on the black ground. Chosen for 6.4:1 on black.

### Named Rules
**The Diagonal Ground Rule.** Quarters diagonal from each other share a ground. Film and about are black; home, design and misc are white. A new page takes the ground of its quarter, and the swap happens only through the `--ink` / `--paper` / `--dim` custom properties. Never hard-code black or white in a component.

**The Inversion Rule.** Emphasis is a swap, not a new color: the active design index title and a hovered about tag become paper on an ink block. There is no accent color.


## Typography

**Word Font:** Helvetica Neue (with Helvetica, Arial, sans-serif)
**Data Font:** Courier New (with Courier, monospace)
**Mark Font:** Times New Roman (with Times, serif)

**Character:** A plain, system-only trio, used the way lookbooks and archive PDFs use it: Helvetica says things, Courier measures things, Times names things. No webfonts are loaded.

**Status: current but open.** Helvetica is what ships, but whether to keep it is an open question for the owner (the design hook flags it as overused). One option on the table is to self-host TeX Gyre Heros, Termes and Cursor so the trio renders the same on every platform. Treat the Helvetica choice as provisional until the owner settles it.

### Hierarchy
- **Headline** (500, clamp(18px, 1.7vw, 26px), 1.1, uppercase): design index titles only. The largest set type on the site.
- **Body Long** (400, 17px, 1.55, max 62ch, justified): the about paragraph. The shortest version stays ragged-left, because a single sentence cannot justify evenly.
- **Body** (400, 14px, 1.4, +0.01em): the top bar's "av", comma nav and contact link, and default running text.
- **Label** (400, 13px, 1, +0.02em): homepage quarter labels. 15px at 900px and wider, 12px at 560px and narrower.
- **Data** (Courier New, 400, 12px, 1.5, +0.04em, uppercase, tabular numbers): counters, captions, empty-state readings, the datum slot, tags, the misc hint. Bold (700) only in the film HUD over footage, where regular Courier thins out.
- **Aside** (Times New Roman italic, 16px, 0 tracking): the current section in the comma nav and the bio slider's poles ("In brief" / "At length").
- **Mark** (Times New Roman, upright): the homepage center asterisk, set in the ring's SVG and nudged down onto the true center.

### Named Rules
**The Three Voices Rule.** Words are Helvetica, data is Courier New, and the mark and the named room are Times New Roman. Don't add a fourth family. Don't swap voices: a number that counts goes in Courier, and a section name goes in Helvetica unless it is the current room.

**The No Display Rule.** Nothing on the site is set large for effect. The ring is the display element; type stays at reading and labelling sizes.

## Layout

The homepage is a single centered square stage: `min(64vmin, 560px)` wide, and on phones sized to `min(100vw - 170px, 60vh)` so "miscellaneous" still fits beside it. The quarter labels sit in a pinwheel at the clockwise end of each quarter (film top, misc right, about bottom, design left), with short leader lines.

Section pages share a sticky top bar of four equal slots across the width: corner ring + "av", comma nav, a Courier datum reading (for example "Reel 00", "Bio 01 / 03"), and contact. The bar is 76px tall with 24px side gutters. At 720px and narrower it becomes two rows ("home contact" / "nav datum"), 112px tall with 16px gutters. Contact takes the fourth slot on every page because getting in touch has to be one click away.

Below the bar, each section has one instrument:
- **Film:** a centered 16:9 viewfinder sized so the frame, its 48px caption row and the reel strip all fit in the first viewport (capped at 1280px). On an empty phone the frame becomes 4:5. The reel strip uses 176px columns with a 24px gap.
- **Design:** a 5fr / 7fr split, with the title index on the left and a sticky 4:3 registered preview on the right. Column gap is clamp(32px, 5vw, 88px); the contact sheet spans the full width below, 96px down. Single column at 720px.
- **About:** the paragraph centered vertically in the viewport, with the slider and the tags pinned beneath it at 40px row gaps.
- **Misc:** a full-viewport canvas (viewport minus the bar, at least 420px tall), with the object grid below it.

Object grids (the design contact sheet and the misc objects) are `auto-fill, minmax(200px, 1fr)` with zero gap. Each cell carries its own 22px padding (18px at the bottom).

## Elevation & Depth

The system is completely flat. There are no box shadows, no tonal layers and no blur at rest. Depth comes from three things: the ring's dashes lifting outward from the center, the view transition (the ring shrinking into the corner while the new page opens as a widening circle), and opacity. Faded thumbnails sit at 0.35 to 0.45 and come up to full on hover or selection.

### Named Rules
**The No Shadow Rule.** No `box-shadow`, `drop-shadow` or texture anywhere. If a thing needs separation, give it a hairline, a registration mark or an inversion.

## Shapes

Square corners everywhere (0 radius). The only round forms are true circles: the ring itself, the film HUD's record dot (8px, hairline outline, filled while playing) and the slider thumb (14px). Lines are 1.5px hairlines, drawn with `vector-effect: non-scaling-stroke` so they stay 1.5px at every scale, with round caps on dashes and icons.

Frames are implied, never boxed. A cell or frame is marked by a + registration mark (13px arms, hairline, centered on the corner) or by L-shaped corners (28px arms, used on the film viewfinder as HUD corners, with a center crosshair only over footage). These echo the ring's tick marks.

### Named Rules
**The Registration Rule.** No bordered boxes or cards. Corners are marked with +, or with HUD corners on the viewfinder; the edges are left open.

## Components

### Corner Ring (signature)
The homepage ring, carried onto every section page at 44px in the top bar's first slot. It has 24 dashes (the homepage has 60) at 1.5px, with the current section's quarter lifted outward and that section's animated icon inside. On a fine pointer, hovering lifts the whole ring ("this way home"); pressing scales it to 0.97. Clicking it goes home. It shares `view-transition-name: ring` with the homepage ring, so the two morph into each other over 520ms on `cubic-bezier(0.77, 0, 0.175, 1)`.

### Homepage Ring (signature)
Sixty dashes at radius 60 (viewBox units) with a Times asterisk at the center. Idle, it spins at 8°/s (one turn per 45s). When the pointer comes within the circle the spin stops; the hovered quarter's dashes lift outward (staggered across 180ms), a leader line grows, the label fades in, and the asterisk swaps for the section icon. On touch, the first tap reveals a quarter and the second tap enters it.

### Room Opening (signature transition)
On cross-document navigation, the new page clips open as a circle growing from the clicked quarter's position (±13vmin from center) over 560ms, laid over the old page. It is disabled under reduced motion and where the browser doesn't support it.

### Section Icons (signature)
Line icons at 1.5px in `currentColor`, round caps and joins: film is a movie camera, design an eye, about a question mark, misc a scribble ball. They animate all the time on section pages and while showing on the homepage. Film's reels turn (2.4s), the eye blinks every 4.5s, the question mark tilts like a head and its dot hops (3.6s), and the misc ball redraws its lines as live static (70ms ticks, at 1.1px stroke). Each icon is its section's empty state at 72px, above a Courier reading such as "No signal" or "Nothing on view yet".

### Navigation
A comma-separated list in the body voice ("film, design, about, miscellaneous"). The current room is in Times italic at 16px and is not a link target. Other items underline on hover (1px, 3px offset); so does "contact". There is no active underline, pill or color change.

### Data Readings
Courier New, uppercase, tabular numbers, zero-padded counts ("00", "01 / 03", "00:00:00:00"). They appear in the datum slot, the film HUD, captions, empty states and hints. Square brackets mark interactive or tag text ("[Move to tune]", "[Film]").

### Design Index
Uppercase Helvetica 500 titles in dim grey. The active title inverts to paper on an ink block that wraps cleanly across lines (120ms color and background). Swapping the preview image passes briefly through 0.5 opacity and a 6px blur (200ms).

### Bio Length Slider
A bare range input: a 1px dim track with a 1.5px ink fill up to the thumb, and a 14px ink circle as the thumb (it scales to 1.25 while pressed). It has Times italic poles at either end. Bio versions cross-fade through a 4px blur over 220ms in a single stacked cell, so the layout never jumps.

### Object Grid
Zero-gap cells with 22px padding. Images sit at 0.35 opacity and come up to full on hover or focus; they are always full on touch screens. Captions stay at full ink. Misc objects keep their whole silhouette (contain, anchored bottom-left); design sheet images crop square.

### Focus and Press
Focus is a 1.5px ink outline at a 3px offset (2px on homepage labels). Pressable controls scale slightly on press (0.97 to 0.9) over 160ms on `cubic-bezier(0.23, 1, 0.32, 1)`.

## Do's and Don'ts

### Do:
- **Do** route every color through ink, paper and dim, so a page works on either ground by toggling `ground-black`.
- **Do** draw every line at 1.5px with non-scaling strokes and round caps.
- **Do** mark corners with + registration marks (13px arms) instead of drawing boxes.
- **Do** use the section's animated icon plus a short Courier reading for any empty or idle state.
- **Do** set counts and times in Courier New with tabular, zero-padded numbers.
- **Do** stop every animation (ring spin, icons, static, view transitions) under `prefers-reduced-motion`.
- **Do** keep contact in the top bar's fourth slot on every section page.

### Don't:
- **Don't** add a color, an accent, a gradient or a texture.
- **Don't** use shadows, rounded corners or bordered cards.
- **Don't** add a fourth typeface, or set type large for display. The ring is the display.
- **Don't** fill an empty slot with sample, placeholder or invented work, press or credits.
- **Don't** draw the linework by hand or make it look sketched. The finish is precise.
