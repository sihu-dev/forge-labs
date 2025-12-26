# Migration Guide: ECharts → Recharts

**Date**: 2025-12-26
**Estimated Time**: 1-2 days
**Bundle Size Impact**: -500KB (83% reduction)

---

## Overview

This guide covers migrating from ECharts (600KB) to Recharts (100KB) for all analytics charts in BIDFLOW.

## Feature Comparison

| Feature | ECharts | Recharts | Notes |
|---------|---------|----------|-------|
| **Bundle Size** | 600KB | 100KB | ✅ 83% reduction |
| **Pie Charts** | ✅ | ✅ | Similar API |
| **Line Charts** | ✅ | ✅ | Simpler in Recharts |
| **Bar Charts** | ✅ | ✅ | Good support |
| **Area Charts** | ✅ | ✅ | Native support |
| **Funnel Charts** | ✅ | ⚠️ Manual | Custom Bar implementation |
| **Gauge Charts** | ✅ | ⚠️ Manual | 30 lines custom SVG |
| **Composed Charts** | ✅ | ✅ | Better in Recharts |
| **Responsive** | Manual | ✅ Built-in | Auto-resize |
| **Animations** | ✅ | ✅ | CSS-based, lighter |
| **Themes** | Custom | CSS-based | Easier customization |
| **TypeScript** | Good | Excellent | React-first |

## Charts to Migrate

| File | Chart Type | ECharts → Recharts | Complexity |
|------|-----------|-------------------|------------|
| BidSourceChart.tsx | Pie | `PieChart` | ⭐ Easy |
| BidTimelineChart.tsx | Line | `LineChart` | ⭐ Easy |
| BudgetDistributionChart.tsx | Bar | `BarChart` | ⭐ Easy |
| ScoreDistributionChart.tsx | Area | `AreaChart` | ⭐ Easy |
| TrendsChart.tsx | Line+Bar | `ComposedChart` | ⭐⭐ Medium |
| StatusFunnelChart.tsx | Funnel | Custom `BarChart` | ⭐⭐ Medium |
| FlowGauge.tsx | Gauge | Custom SVG | ⭐⭐⭐ Hard |
| PerformanceChart.tsx | Mixed | `ComposedChart` | ⭐⭐ Medium |

## Migration Examples

### 1. Pie Chart (BidSourceChart)

#### Before (ECharts):
```typescript
import * as echarts from 'echarts';

export function BidSourceChart({ data }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const chart = echarts.init(chartRef.current, 'dark');

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
      },
      series: [
        {
          name: '입찰 출처',
          type: 'pie',
          radius: '70%',
          data: Object.entries(data).map(([source, count]) => ({
            name: sourceLabels[source],
            value: count,
            itemStyle: { color: sourceColors[source] },
          })),
        },
      ],
    };

    chart.setOption(option);

    return () => chart.dispose();
  }, [data]);

  return <div ref={chartRef} style={{ height: '300px' }} />;
}
```

#### After (Recharts):
```typescript
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function BidSourceChart({ data }: Props) {
  const chartData = Object.entries(data).map(([source, count]) => ({
    name: sourceLabels[source] || source,
    value: count,
    color: sourceColors[source] || '#71717a',
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `${value}건`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
```

**Key Differences**:
- No ref, no useEffect, no manual init/dispose
- JSX-based configuration (React-native)
- ResponsiveContainer handles auto-resize
- Cell component for colors instead of itemStyle
- 70% less code

### 2. Line Chart (BidTimelineChart)

#### Before (ECharts):
```typescript
const option: echarts.EChartsOption = {
  xAxis: {
    type: 'category',
    data: dates,
  },
  yAxis: {
    type: 'value',
  },
  series: [
    {
      name: '입찰 수',
      type: 'line',
      data: counts,
      smooth: true,
    },
  ],
};
```

#### After (Recharts):
```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function BidTimelineChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey="date" stroke="#888" />
        <YAxis stroke="#888" />
        <Tooltip
          contentStyle={{ backgroundColor: '#1f1f1f', border: 'none' }}
          labelStyle={{ color: '#fff' }}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ fill: '#3b82f6', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

**Key Differences**:
- data = `[{ date: '2025-01-01', count: 10 }, ...]`
- No manual axis configuration
- Built-in grid, tooltip, responsive
- `type="monotone"` = smooth curve

### 3. Bar Chart (BudgetDistributionChart)

#### Before (ECharts):
```typescript
const option: echarts.EChartsOption = {
  xAxis: {
    type: 'category',
    data: categories,
  },
  yAxis: {
    type: 'value',
  },
  series: [
    {
      name: '입찰 수',
      type: 'bar',
      data: values,
      itemStyle: {
        color: '#3b82f6',
      },
    },
  ],
};
```

#### After (Recharts):
```typescript
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function BudgetDistributionChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey="category" stroke="#888" />
        <YAxis stroke="#888" />
        <Tooltip
          contentStyle={{ backgroundColor: '#1f1f1f', border: 'none' }}
        />
        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

**Key Differences**:
- Same pattern as LineChart
- `radius` prop for rounded corners
- Multiple bars with different dataKey

### 4. Area Chart (ScoreDistributionChart)

#### Before (ECharts):
```typescript
series: [
  {
    type: 'line',
    data: values,
    areaStyle: {
      color: '#3b82f6',
      opacity: 0.3,
    },
    smooth: true,
  },
]
```

#### After (Recharts):
```typescript
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function ScoreDistributionChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey="range" stroke="#888" />
        <YAxis stroke="#888" />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#3b82f6"
          fillOpacity={1}
          fill="url(#colorScore)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
```

**Key Differences**:
- Gradient with SVG `<defs>`
- `fill="url(#colorScore)"` for gradient
- Better gradient control than ECharts

### 5. Composed Chart (TrendsChart)

#### Before (ECharts):
```typescript
series: [
  {
    name: '입찰 수',
    type: 'bar',
    data: bidCounts,
  },
  {
    name: '매칭률',
    type: 'line',
    data: matchRates,
    yAxisIndex: 1,
  },
]
```

#### After (Recharts):
```typescript
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function TrendsChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey="date" stroke="#888" />
        <YAxis yAxisId="left" stroke="#888" />
        <YAxis yAxisId="right" orientation="right" stroke="#888" />
        <Tooltip />
        <Legend />
        <Bar yAxisId="left" dataKey="bidCount" fill="#3b82f6" name="입찰 수" />
        <Line yAxisId="right" type="monotone" dataKey="matchRate" stroke="#10b981" name="매칭률" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
```

**Key Differences**:
- ComposedChart supports Bar + Line + Area mix
- Dual Y-axis with `yAxisId`
- Cleaner than ECharts for mixed charts

### 6. Funnel Chart (StatusFunnelChart) → Custom Bar

#### Before (ECharts):
```typescript
series: [
  {
    type: 'funnel',
    data: [
      { value: 100, name: 'New' },
      { value: 80, name: 'Reviewing' },
      { value: 50, name: 'Submitted' },
      { value: 20, name: 'Awarded' },
    ],
  },
]
```

#### After (Recharts - Custom Bar):
```typescript
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer } from 'recharts';

export function StatusFunnelChart({ data }: Props) {
  const funnelData = [
    { name: 'New', value: 100, color: '#3b82f6' },
    { name: 'Reviewing', value: 80, color: '#8b5cf6' },
    { name: 'Submitted', value: 50, color: '#10b981' },
    { name: 'Awarded', value: 20, color: '#f59e0b' },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={funnelData}
        layout="vertical"
        margin={{ left: 100, right: 20 }}
      >
        <XAxis type="number" stroke="#888" />
        <YAxis type="category" dataKey="name" stroke="#888" />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {funnelData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
```

**Key Differences**:
- No native funnel, use horizontal bar
- Similar visual effect
- Easier to customize

### 7. Gauge Chart (FlowGauge) → Custom SVG

#### Before (ECharts):
```typescript
series: [
  {
    type: 'gauge',
    progress: {
      show: true,
      width: 18,
    },
    axisLine: {
      lineStyle: {
        width: 18,
      },
    },
    data: [{ value: 75, name: 'Flow Rate' }],
  },
]
```

#### After (Custom SVG - 30 lines):
```typescript
interface GaugeProps {
  value: number; // 0-100
  max?: number;
  color?: string;
  label?: string;
}

export function FlowGauge({ value, max = 100, color = '#3b82f6', label }: GaugeProps) {
  const percentage = (value / max) * 100;
  const angle = (percentage / 100) * 270 - 135; // -135° to 135° (270° total)

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg viewBox="0 0 200 150" className="w-full h-full">
        {/* Background arc */}
        <path
          d="M 25 100 A 75 75 0 0 1 175 100"
          fill="none"
          stroke="#333"
          strokeWidth="18"
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <path
          d="M 25 100 A 75 75 0 0 1 175 100"
          fill="none"
          stroke={color}
          strokeWidth="18"
          strokeLinecap="round"
          strokeDasharray={`${(percentage / 100) * 236} 236`}
        />
        {/* Needle */}
        <line
          x1="100"
          y1="100"
          x2="100"
          y2="40"
          stroke={color}
          strokeWidth="3"
          transform={`rotate(${angle} 100 100)`}
          strokeLinecap="round"
        />
        {/* Center dot */}
        <circle cx="100" cy="100" r="6" fill={color} />
        {/* Value text */}
        <text
          x="100"
          y="130"
          textAnchor="middle"
          className="text-2xl font-bold"
          fill="#fff"
        >
          {value}
        </text>
        {label && (
          <text
            x="100"
            y="145"
            textAnchor="middle"
            className="text-xs"
            fill="#888"
          >
            {label}
          </text>
        )}
      </svg>
    </div>
  );
}
```

**Key Differences**:
- 30 lines of custom SVG
- Lighter than ECharts gauge (600KB → 0KB)
- Full customization control
- CSS-based animations

### 8. Performance Chart → ComposedChart

Same as TrendsChart example above.

## Implementation Checklist

### Phase 1: Easy Charts (Day 1 Morning - 2 hours)
- [ ] BidSourceChart (Pie) → 20 min
- [ ] BidTimelineChart (Line) → 20 min
- [ ] BudgetDistributionChart (Bar) → 20 min
- [ ] ScoreDistributionChart (Area) → 20 min

### Phase 2: Medium Charts (Day 1 Afternoon - 3 hours)
- [ ] TrendsChart (Composed) → 45 min
- [ ] PerformanceChart (Composed) → 45 min
- [ ] StatusFunnelChart (Custom Bar) → 60 min

### Phase 3: Hard Charts (Day 2 Morning - 2 hours)
- [ ] FlowGauge (Custom SVG) → 90 min
- [ ] Test all gauges work correctly

### Phase 4: Testing & Polish (Day 2 Afternoon - 3 hours)
- [ ] Visual regression testing
- [ ] Responsive behavior testing
- [ ] Dark mode consistency
- [ ] Animation smoothness
- [ ] Tooltip styling

### Phase 5: Cleanup (Day 2 End - 30 min)
- [ ] Remove `echarts` and `echarts-for-react` dependencies
- [ ] Delete backup files
- [ ] Update imports

## Styling Tips

### Dark Theme Consistency
```typescript
// Common dark theme config
const darkTheme = {
  grid: { stroke: '#333' },
  axis: { stroke: '#888' },
  tooltip: {
    contentStyle: {
      backgroundColor: '#1f1f1f',
      border: 'none',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
    },
    labelStyle: { color: '#fff' },
    itemStyle: { color: '#fff' },
  },
};
```

### Responsive Container Pattern
```typescript
// Always wrap in ResponsiveContainer
<ResponsiveContainer width="100%" height={300}>
  <YourChart>...</YourChart>
</ResponsiveContainer>
```

### Custom Colors
```typescript
const BIDFLOW_COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  gray: '#71717a',
};
```

## Migration Pattern

For each chart file:

1. **Backup**: Copy `XChart.tsx` → `XChart.echarts.backup.tsx`
2. **Replace imports**:
   ```typescript
   // Remove:
   import * as echarts from 'echarts';

   // Add:
   import { LineChart, Line, XAxis, YAxis, ... } from 'recharts';
   ```
3. **Transform data**: ECharts expects separate arrays, Recharts expects array of objects
   ```typescript
   // Before: { dates: [...], values: [...] }
   // After:  [{ date: '...', value: ... }, ...]
   ```
4. **Replace JSX**: Remove ref/useEffect, add Recharts components
5. **Test**: Visual comparison, responsive behavior
6. **Delete backup** after 1 week

## Data Transformation Helper

```typescript
// ECharts format → Recharts format
function transformToRechartsData(
  labels: string[],
  values: number[]
): Array<{ name: string; value: number }> {
  return labels.map((label, index) => ({
    name: label,
    value: values[index],
  }));
}

// Example:
const echartsData = {
  xAxis: { data: ['Jan', 'Feb', 'Mar'] },
  series: [{ data: [10, 20, 30] }],
};

const rechartsData = transformToRechartsData(
  echartsData.xAxis.data,
  echartsData.series[0].data
);
// → [{ name: 'Jan', value: 10 }, { name: 'Feb', value: 20 }, ...]
```

## Benefits

### Bundle Size
- **Before**: 600KB (ECharts + echarts-for-react)
- **After**: 100KB (Recharts)
- **Savings**: 500KB (83% reduction)

### Code Quality
- 70% less code per chart
- React-native (JSX instead of imperative)
- Better TypeScript support
- No manual cleanup (no dispose/destroy)

### Performance
- Faster initial load (smaller bundle)
- CSS-based animations (hardware accelerated)
- Auto-responsive (no manual resize listeners)

### Developer Experience
- Simpler API
- Better documentation
- Active React community
- Easier customization

## Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| Gauge not native | 30-line custom SVG (lighter than ECharts) |
| Funnel not native | Horizontal bar (similar visual) |
| Animation differences | CSS-based, can customize |
| Visual parity | Keep backups for 1 week |

## Testing Checklist

- [ ] All charts render correctly
- [ ] Tooltips show proper data
- [ ] Responsive on mobile/tablet/desktop
- [ ] Dark theme consistent
- [ ] Animations smooth
- [ ] No console errors
- [ ] Bundle size reduced (verify with analyzer)

## Rollback Plan

If critical issues:
1. Revert to `.echarts.backup.tsx` files
2. Restore imports
3. Keep Recharts for future retry

---

**Next Steps**: Start Phase 1 - Migrate 4 easy charts (Pie, Line, Bar, Area)
