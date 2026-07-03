# MedRise Frontend Audit - Action Checklist

## 🔴 HIGH PRIORITY (Do This Week)

### Performance - Missing Lazy Loading
- [ ] **home.tsx L80** - Add `loading="lazy"` to hero image
- [ ] **about.tsx L47** - Add `loading="lazy"` to about image
- [ ] **Estimate:** 10 minutes | **Impact:** Improved Core Web Vitals (LCP)

### Accessibility - Missing Focus Indicators
- [ ] Search all `.tsx` files for links/buttons without `focus-visible:outline`
- [ ] Add `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2` class
- [ ] **Files affected:** home.tsx, about.tsx, services.tsx, footer.tsx, contact.tsx, navbar.tsx
- [ ] **Estimate:** 45 minutes | **Impact:** WCAG 2.1 AA Compliance (2.4.7 Focus Visible)

### Code Quality - Unused Imports
- [ ] **home.tsx L1-18** - Remove unused lucide-react icons
- [ ] **services.tsx L1-13** - Remove unused lucide-react icons  
- [ ] **Estimate:** 5 minutes | **Impact:** ↓ Bundle size

---

## 🟡 MEDIUM PRIORITY (This Week)

### Performance - Code Splitting & Duplication
- [ ] Move `COLOR_MAP` to `src/lib/constants.ts` (used in home.tsx and services.tsx)
- [ ] Move `DEPT_ICONS` to `src/lib/constants.ts` (used in home.tsx and services.tsx)
- [ ] Move `timeSlots` to constants (appointment.tsx L129)
- [ ] Wrap `COLOR_MAP` and `DEPT_ICONS` in module scope or `useMemo()`
- [ ] **Estimate:** 20 minutes | **Impact:** ↓ Bundle size, less re-renders

### Performance - Route Code Splitting
- [ ] Update `App.tsx` to lazy-load public pages with `React.lazy()`
- [ ] Add `<Suspense>` boundary with loading fallback
- [ ] **Estimate:** 20 minutes | **Impact:** ↓ Initial bundle by ~40KB

### Accessibility - ARIA Labels & Form Structure
- [ ] **navbar.tsx L67** - Add `aria-label` and `aria-expanded` to mobile menu button
- [ ] **feedback.tsx L155-169** - Add `aria-label` to star rating buttons
- [ ] **feedback.tsx L120** - Wrap star rating in `<fieldset>` with `<legend>`
- [ ] **appointment.tsx L158-165** - Add `role="img"` to success SVG
- [ ] **Estimate:** 20 minutes | **Impact:** WCAG 2.1 A Compliance

### Code Quality - Type Safety
- [ ] Create `src/types/vite-env.d.ts` with proper environment variable types
- [ ] Remove `as any` casts from appointment.tsx L74
- [ ] **Estimate:** 10 minutes | **Impact:** Better IDE autocomplete

---

## 🟠 LOW PRIORITY (This Month)

### Performance - Image Optimization
- [ ] Convert JPG images to WebP with fallbacks using `<picture>` tag
- [ ] Implement responsive images with `srcset` and `sizes`
- [ ] Compress images to 80-85% quality
- [ ] **Estimate:** 30 minutes | **Impact:** ↓ Image size by 30-50%

### Performance - Bundle Size Analysis
- [ ] Install `rollup-plugin-visualizer`: `npm install --save-dev rollup-plugin-visualizer`
- [ ] Lower `chunkSizeWarningLimit` from 600 to 300-400 in vite.config.ts
- [ ] Analyze bundle: `npm run build && npm run analyze`
- [ ] **Estimate:** 15 minutes | **Impact:** Better TTI metrics

### Code Quality - Constants & Config
- [ ] Move `CLINICAL_ROLES` array to constants (appointment.tsx L37)
- [ ] Move hardcoded opening hours to `CONTACT_INFO` (navbar.tsx L34)
- [ ] Improve environment variable validation (main.tsx L20-24)
- [ ] **Estimate:** 15 minutes | **Impact:** Single source of truth

### Accessibility - Semantic HTML & Screen Reader Support
- [ ] Replace `<div>` with `<article>` or `<li>` for department cards (home.tsx L182, services.tsx L147)
- [ ] Add hidden `.sr-only` text for "opens in new tab" on external links
- [ ] Add `title` attribute to map link (contact.tsx L109)
- [ ] **Estimate:** 30 minutes | **Impact:** Better semantic meaning

### Data Validation - Form Consistency
- [ ] Convert feedback.tsx local state to `react-hook-form` + Zod
- [ ] Use `FormField` components for consistency with appointment.tsx
- [ ] **Estimate:** 15 minutes | **Impact:** Type safety, consistency

---

## Quick Wins (< 5 min each)

- [ ] Remove `console.error/log` from main.tsx (L22, 52-53)
- [ ] Remove `console.error` from appointment.tsx (L124)
- [ ] Add `loading="eager"` to navbar/footer logos
- [ ] Wrap Footer component in React.memo()
- [ ] Extract timeSlots from component to module scope

---

## Files to Update (Checklist)

### Public Pages
- [ ] `src/pages/home.tsx`
- [ ] `src/pages/about.tsx`
- [ ] `src/pages/services.tsx`
- [ ] `src/pages/appointment.tsx`
- [ ] `src/pages/contact.tsx`
- [ ] `src/pages/feedback.tsx`
- [ ] `src/pages/privacy.tsx`
- [ ] `src/pages/terms.tsx`

### Components
- [ ] `src/components/layout/Navbar.tsx`
- [ ] `src/components/layout/Footer.tsx`
- [ ] `src/components/layout/Layout.tsx`

### Config & Lib
- [ ] `src/App.tsx` (route code splitting)
- [ ] `src/main.tsx` (console statements)
- [ ] `src/lib/constants.ts` (consolidate duplicates)
- [ ] `vite.config.ts` (chunk size limit)
- [ ] `src/types/vite-env.d.ts` (create new)

---

## Testing Before Merge

```bash
# Type checking
npm run typecheck

# Accessibility audit
npx axe-core --url https://localhost:5173

# Bundle analysis
npm run build
npm run analyze

# Lighthouse
npm install -g lighthouse
lighthouse https://localhost:5173
```

---

## Compliance Target

- ✅ WCAG 2.1 Level AA
- ✅ Core Web Vitals (Green)
- ✅ Lighthouse Score > 90
- ✅ Zero console warnings/errors
- ✅ No unused imports
