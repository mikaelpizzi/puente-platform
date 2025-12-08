# Accessibility (A11y) Checklist

## Target

- **Lighthouse Accessibility**: ≥ 95
- **jest-axe**: No critical violations

---

## WCAG 2.1 AA Compliance

### ✅ Perceivable

- [x] Images have `alt` text
- [x] Color contrast ≥ 4.5:1 (normal text)
- [x] Color contrast ≥ 3:1 (large text, UI components)
- [x] No color-only information conveyance
- [x] Responsive text (no horizontal scroll at 320px)

### ✅ Operable

- [x] All interactive elements keyboard accessible
- [x] Focus visible on all elements
- [x] Skip links for main content
- [x] No keyboard traps
- [x] Sufficient time for actions (or extend option)

### ✅ Understandable

- [x] Language declared (`lang="es"`)
- [x] Form inputs have labels
- [x] Error messages descriptive
- [x] Consistent navigation

### ✅ Robust

- [x] Valid HTML
- [x] ARIA roles used correctly
- [x] Works with screen readers

---

## Testing Tools

| Tool                    | Purpose                |
| ----------------------- | ---------------------- |
| **axe-core/playwright** | Automated WCAG testing |
| **Lighthouse**          | Accessibility score    |
| **NVDA/VoiceOver**      | Screen reader testing  |
| **Keyboard-only**       | Navigation testing     |

---

## Running A11y Tests

```bash
# Run all a11y tests
pnpm test:e2e -- --grep "Accessibility"

# Run with Lighthouse
npx lighthouse http://localhost:5173 --only-categories=accessibility
```

---

## Common Issues & Fixes

### Color Contrast

```css
/* Bad: #777 on #fff = 4.48:1 */
color: #777;

/* Good: #666 on #fff = 5.74:1 */
color: #666;
```

### Missing Labels

```tsx
/* Bad */
<input type="email" />

/* Good */
<input type="email" aria-label="Email address" />
```

### Focus Visibility

```css
/* Add visible focus */
:focus-visible {
  outline: 2px solid #4f46e5;
  outline-offset: 2px;
}
```

---

## Audit Results

| Date | Lighthouse Score | Critical Violations |
| ---- | ---------------- | ------------------- |
| TBD  | -                | -                   |

---

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe-core Rules](https://dequeuniversity.com/rules/axe/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
