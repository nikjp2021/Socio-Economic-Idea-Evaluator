# DESIGN.md — Socio-Economic Evaluator

## Color Palette

### Primary
- **Forest Green:** oklch(0.45 0.12 145) — #2d5a27 — CTA buttons, GO verdict, strengths
- **Amber:** oklch(0.65 0.15 75) — #c47a0a — warnings, GO WITH EDUCATION verdict, highlights
- **Terracotta:** oklch(0.55 0.12 35) — #b5543a — alerts, SHELVE verdict, barriers
- **Sky Blue:** oklch(0.55 0.12 250) — #2563a8 — info, PIVOT verdict, links

### Neutrals (tinted toward green, never pure black/white)
- **Background:** oklch(0.97 0.005 145) — #faf7f2 — warm cream
- **Surface:** oklch(0.94 0.005 145) — #f0ede6 — cards, elevated areas
- **Border:** oklch(0.88 0.008 145) — #e0ddd5 — dividers, subtle edges
- **Text Primary:** oklch(0.20 0.01 145) — #1a1a17 — body text
- **Text Secondary:** oklch(0.45 0.01 145) — #6b6b60 — labels, captions

### Verdict Colors
- **GO:** oklch(0.50 0.15 145) — forest green
- **GO WITH EDUCATION:** oklch(0.65 0.15 75) — amber
- **PIVOT:** oklch(0.55 0.12 250) — sky blue
- **SHELVE:** oklch(0.55 0.12 35) — terracotta

## Typography

### Fonts
- **Headings:** Instrument Serif / DM Serif Display — warm, editorial, not corporate
- **Body:** DM Sans — clean, readable, works at small sizes on mobile
- **Monospace:** JetBrains Mono — for scores, numbers, code-like elements

### Scale (1.25 ratio)
- **Display:** 2.5rem / 40px — hero title only
- **H1:** 2rem / 32px — section headers
- **H2:** 1.5rem / 24px — subsection headers
- **H3:** 1.25rem / 20px — card titles
- **Body:** 1rem / 16px — minimum for mobile (prevents iOS zoom)
- **Small:** 0.875rem / 14px — labels, captions
- **Tiny:** 0.75rem / 12px — badges, metadata

### Line Length
- Max 65ch for body text
- Max 45ch for hero/subtitle text

## Spacing

### Base Unit: 4px
- **xs:** 4px — inline gaps
- **sm:** 8px — between related elements
- **md:** 16px — section padding, card padding
- **lg:** 24px — between sections
- **xl:** 32px — major section breaks
- **2xl:** 48px — page margins on mobile
- **3xl:** 64px — page margins on desktop

### Rhythm
- Vary spacing: tight between related items, loose between sections
- Never use the same padding everywhere

## Components

### Score Circle
- Diameter: 140px (desktop), 110px (mobile)
- Border: 4px solid, verdict-color
- Background: white with subtle radial gradient from verdict-color at 8% opacity
- Number: 3.5rem, font-display
- Denominator: 1.25rem, positioned bottom-right

### Verdict Badge
- Pill shape, verdict-color background
- White text, 0.75rem, uppercase, letter-spacing 0.05em
- Padding: 4px 12px

### Section Header
- H2 size, font-display
- No container, no card
- Subtitle in text-secondary below

### Barrier Card
- Full border (1px solid border-color), no side-stripe
- Background: surface color
- Padding: 16px
- Title: practical meaning (not raw field name)
- Workaround in slightly different background tint
- "Can training fix this?" label

### Action Step
- Full-width on mobile
- Height: 56px
- Background: verdict-color
- White text, bold
- Border-radius: 8px

### Share Buttons
- 48px touch targets
- Icon + label
- Full-width stacked on mobile, inline on desktop

## Layout

### Mobile (360px)
- Single column
- 16px side padding
- 12px between cards
- Sticky tab bar (44px) for section navigation
- Collapsed sections by default (except verdict + barriers if score < 8)

### Tablet (768px)
- 2-column grid for cards
- 24px side padding

### Desktop (1440px)
- Max-width 1200px, centered
- Score circle + pitch side-by-side above fold
- 32px side padding

## Motion
- No animation on score circle (reduced motion for low-end phones)
- Section expand/collapse: 200ms ease-out
- Tab bar scroll: smooth
- No bounce, no elastic, no layout animation

## Texture
- SVG noise overlay at 2.5% opacity on background
- Subtle, warm, not digital
