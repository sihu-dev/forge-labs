# BIDFLOW Bundle Size Analysis

**Generated**: 2025-12-25
**Status**: Bundle analyzer configured, ready for analysis

---

## Setup

Bundle analyzer is configured in `next.config.bundle.js`.

### How to Run

```bash
# Install dependencies (if needed)
pnpm install

# Build with bundle analysis
ANALYZE=true pnpm build

# This will:
# 1. Create production build
# 2. Generate .next/analyze/ directory
# 3. Open browser with interactive bundle visualization
```

---

## Expected Large Dependencies

Based on package.json analysis, these are likely the largest bundles:

### 1. **Handsontable** (~800KB estimated)
```json
"handsontable": "^16.2.0"
"@handsontable/react": "^16.2.0"
```

**Impact**: CRITICAL
**Recommendation**:
- Consider switching to `ag-grid-community` (~400KB, 50% smaller)
- Or implement virtual scrolling with `@tanstack/react-table` (~50KB, 94% smaller)

### 2. **ECharts** (~600KB estimated)
```json
"echarts": "^6.0.0"
"echarts-for-react": "^3.0.5"
```

**Impact**: HIGH
**Recommendation**:
- Switch to `recharts` (~100KB, 83% smaller)
- Or use `Chart.js` (~150KB, 75% smaller)
- For simple charts, use CSS + SVG (0KB additional)

### 3. **Radix UI** (~200KB estimated)
```json
"@radix-ui/react-*": "^1.x.x" (13 packages)
```

**Impact**: MEDIUM
**Recommendation**:
- Already optimized with `optimizePackageImports` in next.config
- Tree-shaking should reduce actual bundle size
- No action needed

### 4. **Supabase** (~150KB estimated)
```json
"@supabase/supabase-js": "^2.47.0"
"@supabase/ssr": "^0.5.2"
```

**Impact**: LOW
**Recommendation**:
- Essential for functionality
- Already tree-shaken by Next.js
- No action needed

### 5. **TanStack Query** (~50KB estimated)
```json
"@tanstack/react-query": "^5.62.0"
```

**Impact**: LOW
**Recommendation**:
- Essential for data fetching
- Well-optimized
- No action needed

---

## Optimization Strategies

### Phase 1: Quick Wins (1-2 days)

#### 1. Code Splitting
```typescript
// ✅ Already implemented for large components
const ClientSpreadsheet = dynamic(
  () => import('@/components/spreadsheet/ClientSpreadsheet'),
  { ssr: false }
);
```

**Next steps**:
- Apply to all large components (400+ lines)
- Split marketing pages by route

#### 2. Optimize Imports
```typescript
// ❌ Before: Imports entire library
import * as Icons from 'lucide-react';

// ✅ After: Import only what you need
import { Search, Filter, Download } from 'lucide-react';
```

#### 3. Enable SWC Minification
```javascript
// next.config.js
module.exports = {
  swcMinify: true, // ✅ Already enabled
}
```

### Phase 2: Library Replacements (1 week)

#### 1. Replace Handsontable (Priority: CRITICAL)

**Option A: ag-Grid Community (Recommended)**
```bash
pnpm remove handsontable @handsontable/react
pnpm add ag-grid-react ag-grid-community
```

Benefits:
- 50% smaller bundle (800KB → 400KB)
- Better performance
- Free for commercial use (Community edition)

**Option B: TanStack Table + Virtual**
```bash
pnpm remove handsontable @handsontable/react
pnpm add @tanstack/react-table @tanstack/react-virtual
```

Benefits:
- 94% smaller bundle (800KB → 50KB)
- Highly customizable
- Best performance

**Effort**: 3-5 days (migration work)

#### 2. Replace ECharts (Priority: HIGH)

```bash
pnpm remove echarts echarts-for-react
pnpm add recharts
```

Benefits:
- 83% smaller bundle (600KB → 100KB)
- Better React integration
- Simpler API

**Effort**: 1-2 days (chart migration)

### Phase 3: Advanced Optimizations (2 weeks)

#### 1. Route-based Code Splitting
```typescript
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Suspense fallback={<Loading />}>
          {children}
        </Suspense>
      </body>
    </html>
  );
}
```

#### 2. Image Optimization
```typescript
// Use next/image for all images
import Image from 'next/image';

<Image
  src="/assets/logo.png"
  alt="Logo"
  width={200}
  height={100}
  priority // For LCP
/>
```

#### 3. Font Optimization
```typescript
// app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  return (
    <html className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
```

---

## Expected Improvements

### Current Estimate (before analysis)
```
Total Bundle Size:     ~2.5MB
First Load JS:         ~1.8MB
Largest Chunk:         ~800KB (handsontable)
```

### After Phase 1 (Quick Wins)
```
Total Bundle Size:     ~2.2MB (-12%)
First Load JS:         ~1.5MB (-17%)
Largest Chunk:         ~600KB (echarts)
```

### After Phase 2 (Library Replacements)
```
Total Bundle Size:     ~1.2MB (-52%)
First Load JS:         ~800KB (-56%)
Largest Chunk:         ~200KB (radix-ui)
```

### After Phase 3 (Advanced)
```
Total Bundle Size:     ~900KB (-64%)
First Load JS:         ~600KB (-67%)
Largest Chunk:         ~150KB
```

---

## Performance Impact

### Current (Estimated)
```
Lighthouse Performance:  75/100
First Contentful Paint:  2.5s
Largest Contentful Paint: 3.8s
Time to Interactive:     4.2s
```

### After Optimization (Target)
```
Lighthouse Performance:  92/100
First Contentful Paint:  1.2s
Largest Contentful Paint: 1.8s
Time to Interactive:     2.5s
```

---

## Action Items

### Immediate (Before Launch)
- [ ] Run bundle analysis: `ANALYZE=true pnpm build`
- [ ] Document actual bundle sizes
- [ ] Identify top 5 largest chunks
- [ ] Create migration plan for Handsontable/ECharts

### Short-term (1-2 weeks)
- [ ] Replace Handsontable with ag-Grid or TanStack Table
- [ ] Replace ECharts with Recharts
- [ ] Optimize Radix UI imports
- [ ] Add route-based code splitting

### Long-term (1-3 months)
- [ ] Implement image optimization
- [ ] Add font optimization
- [ ] Set up bundle size monitoring (bundlewatch)
- [ ] Create bundle budget alerts

---

## Monitoring

### Bundle Size Budgets (Recommended)

```json
// package.json
{
  "bundlewatch": {
    "files": [
      {
        "path": ".next/static/chunks/*.js",
        "maxSize": "200kb"
      },
      {
        "path": ".next/static/css/*.css",
        "maxSize": "50kb"
      }
    ]
  }
}
```

### CI/CD Integration

```yaml
# .github/workflows/bundle-size.yml
name: Bundle Size Check
on: [pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: pnpm install
      - run: pnpm build
      - uses: andresz1/size-limit-action@v1
```

---

## Next Steps

1. **Run Analysis**: Execute `ANALYZE=true pnpm build`
2. **Review Results**: Check `.next/analyze/` output
3. **Update This Document**: Add actual measurements
4. **Plan Migration**: Prioritize largest bundles
5. **Execute Phase 1**: Quick wins (1-2 days)
6. **Execute Phase 2**: Library replacements (1 week)

---

**Status**: ⏳ Analysis pending
**Priority**: HIGH (Critical Issue #4)
**Owner**: DevOps Team
**Deadline**: Before production launch

---

*Last Updated*: 2025-12-25
