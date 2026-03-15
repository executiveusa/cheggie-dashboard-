# Uncodixfy Design System

The **Uncodixfy** design system governs all UI in the Cheggie Control Plane dashboard.

---

## Core Principles

1. **Dark-first** — Default theme is dark (`#0f0f11` background). Light mode is a variant.
2. **Indigo accent** — Primary brand color: `#6366f1` (Indigo 500). Hover: `#4f46e5`.
3. **Subtle glass** — Cards use `bg-white/5 backdrop-blur-sm border border-white/10`.
4. **Motion with intent** — Animate only data-driven changes. No decorative looping.
5. **Data density** — Tables and dashboards should show max useful information without clutter.

---

## Color Tokens

| Token | Value | Usage |
|---|---|---|
| `--bg-base` | `#0f0f11` | Page background |
| `--bg-card` | `#18181b` | Card surfaces |
| `--bg-elevated` | `#27272a` | Modals, popovers |
| `--accent` | `#6366f1` | Buttons, links, focus rings |
| `--accent-hover` | `#4f46e5` | Hover state |
| `--success` | `#22c55e` | Positive status |
| `--warning` | `#f59e0b` | Caution state |
| `--danger` | `#ef4444` | Destructive actions |
| `--text-primary` | `#fafafa` | Headings, labels |
| `--text-muted` | `#71717a` | Descriptions, metadata |
| `--border` | `rgba(255,255,255,0.08)` | Dividers, card borders |

---

## Typography

| Role | Class | Size / Weight |
|---|---|---|
| Page title | `text-2xl font-semibold` | 24px / 600 |
| Section header | `text-lg font-medium` | 18px / 500 |
| Body | `text-sm` | 14px / 400 |
| Caption / meta | `text-xs text-muted` | 12px / 400 |
| Code | `font-mono text-xs` | 12px / monospace |

Font stack: `Inter, system-ui, sans-serif`

---

## Spacing Scale

Uses Tailwind's default 4px base scale. Key breakpoints:

- Card padding: `p-4` (16px)
- Section gap: `gap-6` (24px)
- Page padding: `px-6 py-8`

---

## Component Rules

### Buttons

| Variant | Class |
|---|---|
| Primary | `bg-indigo-500 hover:bg-indigo-600 text-white rounded-md px-4 py-2` |
| Ghost | `bg-transparent hover:bg-white/10 border border-white/10` |
| Danger | `bg-red-500 hover:bg-red-600 text-white` |

- Always include `focus-visible:ring-2 ring-indigo-500` for accessibility.
- Destructive actions must open a confirmation dialog.

### Cards

```html
<div class="rounded-xl border border-white/8 bg-white/5 backdrop-blur-sm p-4">
```

### Status Badges

| Status | Color |
|---|---|
| `idle` / `draft` | Gray |
| `running` / `scheduled` | Blue |
| `completed` / `published` | Green |
| `failed` / `error` | Red |
| `pending` / `pending_approval` | Yellow |

### Tables

- Use zebra striping: `even:bg-white/3`
- Sticky header on long lists
- Row hover: `hover:bg-white/6`
- Numeric columns right-aligned

### Forms

- Labels above inputs
- Error messages in red below the field
- Required fields marked with `*`
- Inputs: `bg-white/5 border border-white/10 rounded-md px-3 py-2 focus:ring-2 ring-indigo-500`

---

## Icons

Use **Lucide React** (`lucide-react`) exclusively. Size: `w-4 h-4` inline, `w-5 h-5` standalone.

---

## Animation

- Use `transition-colors duration-150` for color changes
- Skeleton loaders for async data (shimmer effect)
- SSE-driven updates: flash row with `bg-indigo-500/20` for 600ms on change

---

## Accessibility

- Minimum contrast ratio: 4.5:1 for body text
- All interactive elements keyboard-navigable
- `aria-label` on icon-only buttons
- SSE events announce via `aria-live="polite"` region
