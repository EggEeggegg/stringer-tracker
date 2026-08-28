---
name: tennis-cream-ui
description: >-
  Apply the stringer-tracker cream-and-green UI theme (court green on cream).
  Use when building or restyling frontend pages/components, theming the app,
  editing globals.css / Tailwind colors, NavBar, cards, forms, buttons, or when
  the user asks for tennis/cream/green UI, ธีมเทนนิส, สีครีม, or สีเขียว.
---

# Tennis Cream–Green UI Theme

Design system for this project's frontend (`frontend/`). Keep light cream + court green; do not revert to dark/blue/purple themes.

## Source of truth

1. CSS tokens + component classes: `frontend/src/app/globals.css`
2. Tailwind palette: `frontend/tailwind.config.ts`
3. Prefer existing classes (`.card`, `.inp`, `.btn-primary`, `.bottom-nav`, etc.) over new one-off styles

## Color tokens

| Role | Hex / token | Use |
|------|-------------|-----|
| Cream bg | `#F3EFE4` / `--cream` | Page background |
| Cream card | `#FFFcf5` / `--cream-soft` | Cards, modals, nav |
| Cream deep | `#E8E0D0` / `--cream-deep` | Subtle depth |
| Court green | `#2F6B3A` / `--court` | Primary accent, active nav |
| Court deep | `#1F4D28` / `--court-deep` | Strong emphasis, brand end |
| Court soft | `#5B9A4A` / `--court-soft` | Gradients, soft green |
| Ink | `#1F2E1C` / `--ink` | Body text |
| Muted | `#5C6B57` / `--muted` | Labels, secondary text |
| Dim | `#8A9784` / `--dim` | Placeholder, hints |
| Amber | `#B8860B` / `--amber` | Sale / commission |
| Teal | `#2A7A6E` / `--teal` | Other income |
| Danger | `#C44B4B` / `--danger` | Delete / errors |

### Semantic money colors

- String income / ฿200 → court green `#2F6B3A`
- ฿300 / commission → amber `#B8860B`
- Other income → teal `#2A7A6E`
- Totals → court deep `#1F4D28` (not purple)

## Typography

- Body UI: `Sarabun`
- Numbers / brand title: `Space Grotesk` via `.num` / `.brand-title`
- Inputs must stay `font-size: 16px` (iOS zoom)

## Component classes (use these)

| Class | Purpose |
|-------|---------|
| `.card` | Panel / empty state |
| `.record-item` | List row |
| `.stat-card` | Summary stat tile |
| `.inp` | Text / select / date |
| `.btn-primary` | Main CTA (green gradient) |
| `.btn-success` | Save / confirm |
| `.btn-ghost` | Secondary |
| `.btn-danger` | Destructive |
| `.chip-active` / `.chip-inactive` | Date chips |
| `.seg-control` | Segmented tabs |
| `.summary-box` | Total highlight |
| `.bottom-nav` / `.nav-item` / `.nav-item-active` | Tab bar |
| `.fab` | Floating add button |
| `.brand-mark` / `.brand-title` | Logo circle + gradient title |
| `.modal` / `.overlay` | Bottom sheet |
| `.badge-edited` | Edited stamp |

## Layout rules

- Max content width: `max-w-lg mx-auto`
- Dashboard bottom padding: `pb-[calc(72px+env(safe-area-inset-bottom))]`
- Bottom nav height: `64px + safe-area`; icon 22–28px + label 11px, centered
- FAB sits above nav: `bottom: calc(72px + env(safe-area-inset-bottom))`
- `themeColor` / `color-scheme`: light cream (`#F3EFE4`)

## Do / Don't

**Do**
- Light cream surfaces + green accents
- Soft green borders `rgba(47,107,58,0.12–0.18)`
- Green gradients for primary actions
- Keep existing structure; retheme via tokens/classes

**Don't**
- Dark backgrounds (`#0b0f1a`, `#151c2c`)
- Blue/purple primary accents (`#3b82f6`, `#a78bfa`)
- Purple totals or indigo gradients
- Flat single-color bg with no cream atmosphere
- Text-only bottom nav without balanced icon+label

## When adding a new screen

1. Reuse `.card`, `.inp`, `.btn-*`, `.stat-card`
2. Header: `.brand-mark` + `.brand-title` (optional subtitle in `--dim`)
3. Money values: `.num` + semantic color from table above
4. Hardcoded colors must match tokens — no new palette without user ask

## Related files

- `frontend/src/components/NavBar.tsx`
- `frontend/src/components/RecordCard.tsx`
- `frontend/src/components/RecordForm.tsx`
- `frontend/src/app/login/page.tsx`
- `frontend/src/app/(dashboard)/*/page.tsx`
