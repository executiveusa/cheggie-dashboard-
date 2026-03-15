# UI Pull Request Checklist

Complete all applicable items before requesting review on UI changes.

---

## Visual

- [ ] Dark mode renders correctly (test in `#0f0f11` bg)
- [ ] No hardcoded colors — use design system tokens or Tailwind classes
- [ ] No layout overflow on mobile (320px min viewport)
- [ ] Responsive: tested at 375px, 768px, 1280px, 1920px
- [ ] Indigo accent (`#6366f1`) used for primary interactive elements

## Accessibility

- [ ] All interactive elements are keyboard-navigable (Tab, Enter, Space)
- [ ] Icon-only buttons have `aria-label`
- [ ] Form inputs have associated `<label>`
- [ ] Color is not the only differentiator (icons/text accompany status colors)
- [ ] `aria-live` regions present where SSE events update the UI

## Data & State

- [ ] Loading state shown (skeleton or spinner) while data fetches
- [ ] Empty state shown when list is empty (not a blank page)
- [ ] Error state shown on fetch failure with actionable message
- [ ] Optimistic updates reverted on error
- [ ] SSE-driven updates flash row/card per design system spec

## Components

- [ ] No new custom components if a design system component covers the use case
- [ ] New shared components added to the component library with a story or example
- [ ] Destructive actions (delete, stop agent) use a confirmation dialog

## Performance

- [ ] No unnecessary re-renders (check with React DevTools)
- [ ] Large lists use virtualization (`react-window` or similar)
- [ ] Images use `next/image` with explicit `width`/`height`

## Code Quality

- [ ] No `any` types in component props
- [ ] Event handlers use `useCallback` where appropriate
- [ ] No console.log left in production code
- [ ] All new env vars added to `docs/ENV_TEMPLATE.md`

## Testing

- [ ] Unit tests for new utility functions
- [ ] E2E test added for critical user flow (if applicable)
- [ ] Existing tests pass (`pnpm test`)

## Docs

- [ ] API changes reflected in `docs/API.md`
- [ ] Component usage documented if it's shared
