# Migration Guide: Handsontable → ag-Grid Community

**Date**: 2025-12-26
**Estimated Time**: 2-3 days
**Bundle Size Impact**: -400KB (50% reduction)

---

## Overview

This guide covers migrating from Handsontable (800KB) to ag-Grid Community (400KB) for the BIDFLOW spreadsheet component.

## Feature Comparison

| Feature | Handsontable | ag-Grid Community | Notes |
|---------|--------------|-------------------|-------|
| **Bundle Size** | 800KB | 400KB | ✅ 50% reduction |
| **Custom Renderers** | ✅ Custom functions | ✅ Cell Renderers | Similar API |
| **Formula Engine** | ✅ HyperFormula | ✅ Built-in | ag-Grid has built-in support |
| **Excel Export** | ✅ Via library | ✅ Built-in | Better in ag-Grid |
| **CSV Export** | ✅ Manual | ✅ Built-in | Native support |
| **Data Validation** | ✅ | ✅ | Similar features |
| **Keyboard Navigation** | ✅ | ✅ | Excel-like in both |
| **Row Selection** | ✅ | ✅ | Better in ag-Grid |
| **Inline Editing** | ✅ | ✅ | Both support |
| **Performance** | Good (<1000 rows) | Excellent (10k+ rows) | ag-Grid faster |

## Migration Steps

### Step 1: Update Dependencies

```bash
# Already done - ag-grid-community and ag-grid-react installed
# Remove Handsontable later: pnpm remove handsontable @handsontable/react hyperformula
```

### Step 2: Convert Custom Renderers

#### Before (Handsontable):
```typescript
function statusRenderer(
  instance: Handsontable,
  td: HTMLTableCellElement,
  row: number,
  col: number,
  prop: string | number,
  value: string
) {
  td.innerHTML = '';
  const badge = document.createElement('span');
  badge.textContent = STATUS_LABELS[value] || value;
  badge.className = `inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[value]}`;
  td.appendChild(badge);
  return td;
}
```

#### After (ag-Grid):
```typescript
const StatusCellRenderer = (props: ICellRendererParams) => {
  const value = props.value;
  if (!value) return null;

  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[value]}`}>
      {STATUS_LABELS[value] || value}
    </span>
  );
};
```

**Key Differences**:
- ag-Grid uses React components (cleaner, type-safe)
- No manual DOM manipulation
- Props object instead of multiple parameters
- Return JSX instead of mutating TD element

### Step 3: Column Definitions

#### Before (Handsontable):
```typescript
const columns = [
  {
    data: 'status',
    type: 'dropdown',
    source: ['new', 'reviewing', 'submitted', 'awarded', 'rejected'],
    renderer: statusRenderer,
  },
  {
    data: 'estimated_amount',
    type: 'numeric',
    renderer: amountRenderer,
  },
];
```

#### After (ag-Grid):
```typescript
const columnDefs: ColDef[] = [
  {
    field: 'status',
    headerName: '상태',
    cellRenderer: StatusCellRenderer,
    cellEditor: 'agSelectCellEditor',
    cellEditorParams: {
      values: ['new', 'reviewing', 'submitted', 'awarded', 'rejected'],
    },
    editable: true,
  },
  {
    field: 'estimated_amount',
    headerName: '추정금액',
    cellRenderer: AmountCellRenderer,
    type: 'numericColumn',
    editable: true,
  },
];
```

**Key Differences**:
- `data` → `field`
- `renderer` → `cellRenderer`
- `type: 'dropdown'` → `cellEditor: 'agSelectCellEditor'`
- `source` → `cellEditorParams.values`

### Step 4: Component Structure

#### Before (Handsontable):
```typescript
export function SpreadsheetView({ initialData, onBidUpdate }: Props) {
  const hotRef = useRef<HotTableClass>(null);
  const [data, setData] = useState(initialData);

  const handleAfterChange = useCallback(
    async (changes: CellChange[] | null, source: string) => {
      // Handle changes
    },
    [data, onBidUpdate]
  );

  return (
    <HotTable
      ref={hotRef}
      data={data}
      columns={BID_COLUMNS}
      afterChange={handleAfterChange}
      licenseKey="non-commercial-and-evaluation"
    />
  );
}
```

#### After (ag-Grid):
```typescript
export function SpreadsheetView({ initialData, onBidUpdate }: Props) {
  const gridRef = useRef<AgGridReact>(null);
  const [rowData, setRowData] = useState(initialData);

  const onCellValueChanged = useCallback(
    async (params: CellValueChangedEvent) => {
      const { data, colDef, newValue } = params;
      if (onBidUpdate && colDef.field) {
        await onBidUpdate(data.id, { [colDef.field]: newValue });
      }
    },
    [onBidUpdate]
  );

  return (
    <div className="ag-theme-alpine" style={{ height: '100%', width: '100%' }}>
      <AgGridReact
        ref={gridRef}
        rowData={rowData}
        columnDefs={columnDefs}
        onCellValueChanged={onCellValueChanged}
        defaultColDef={{
          sortable: true,
          filter: true,
          resizable: true,
        }}
      />
    </div>
  );
}
```

**Key Differences**:
- `data` → `rowData`
- `columns` → `columnDefs`
- `afterChange` → `onCellValueChanged` (cleaner API, single cell at a time)
- Theme wrapper div required: `ag-theme-alpine`
- No license key needed (Community edition is free)

### Step 5: Export Functionality

#### Before (Handsontable):
```typescript
import { exportToExcel } from '@/lib/spreadsheet/excel-export';

const handleExport = () => {
  const hot = hotRef.current?.hotInstance;
  if (hot) {
    exportToExcel(hot.getData(), 'bids.xlsx');
  }
};
```

#### After (ag-Grid):
```typescript
const handleExportExcel = () => {
  gridRef.current?.api.exportDataAsExcel({
    fileName: 'bids.xlsx',
    sheetName: 'Bids',
  });
};

const handleExportCSV = () => {
  gridRef.current?.api.exportDataAsCsv({
    fileName: 'bids.csv',
  });
};
```

**Key Differences**:
- Built-in export (no external library needed)
- Simpler API
- Better Excel compatibility

### Step 6: Formula Support

#### Before (Handsontable):
```typescript
import { HyperFormula } from 'hyperformula';

const hyperformula = HyperFormula.buildEmpty({
  licenseKey: 'gpl-v3',
});
```

#### After (ag-Grid):
```typescript
// ag-Grid Community has built-in formula support
// No additional library needed

const columnDefs: ColDef[] = [
  {
    field: 'total',
    headerName: 'Total',
    valueGetter: (params) => {
      // Simple formulas with valueGetter
      return params.data.amount * params.data.quantity;
    },
  },
];
```

**Key Differences**:
- No HyperFormula needed for basic calculations
- Use `valueGetter` for computed columns
- Lighter bundle (no 200KB+ formula engine)

### Step 7: Styling

#### Before (Handsontable):
```typescript
import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-main.min.css';
```

#### After (ag-Grid):
```typescript
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
// Or use: ag-theme-balham, ag-theme-material, etc.
```

### Step 8: Row Selection & Side Panel

#### Before (Handsontable):
```typescript
const handleAfterSelectionEnd = useCallback((row: number) => {
  const bid = data[row];
  setSelectedBid(bid);
  setSidePanelOpen(true);
}, [data]);
```

#### After (ag-Grid):
```typescript
const onRowClicked = useCallback((event: RowClickedEvent) => {
  setSelectedBid(event.data);
  setSidePanelOpen(true);
}, []);

// In AgGridReact props:
<AgGridReact
  onRowClicked={onRowClicked}
  rowSelection="single"
/>
```

## Implementation Checklist

### Phase 1: Setup (Day 1 Morning)
- [x] Install ag-grid-community and ag-grid-react
- [ ] Create new file: `SpreadsheetView.ag-grid.tsx`
- [ ] Import ag-Grid styles
- [ ] Set up basic grid with dummy data

### Phase 2: Column Definitions (Day 1 Afternoon)
- [ ] Convert all custom renderers to React components
  - [ ] StatusCellRenderer
  - [ ] PriorityCellRenderer
  - [ ] SourceCellRenderer
  - [ ] AmountCellRenderer
  - [ ] DeadlineCellRenderer
  - [ ] ScoreCellRenderer
  - [ ] KeywordsCellRenderer
- [ ] Create column definitions with editors
- [ ] Test inline editing

### Phase 3: Features (Day 2 Morning)
- [ ] Implement cell value change handler
- [ ] Add export functionality (Excel, CSV)
- [ ] Add row selection
- [ ] Connect side panel
- [ ] Add toolbar integration

### Phase 4: Testing & Polish (Day 2 Afternoon)
- [ ] Test all cell renderers
- [ ] Test editing functionality
- [ ] Test export features
- [ ] Visual regression testing
- [ ] Performance testing with 1000+ rows

### Phase 5: Swap & Cleanup (Day 3)
- [ ] Rename `SpreadsheetView.tsx` → `SpreadsheetView.handsontable.backup.tsx`
- [ ] Rename `SpreadsheetView.ag-grid.tsx` → `SpreadsheetView.tsx`
- [ ] Update imports in parent components
- [ ] Test entire flow
- [ ] Remove Handsontable dependencies
- [ ] Delete backup file

## Code Examples

### Complete Status Cell Renderer
```typescript
import { ICellRendererParams } from 'ag-grid-community';

const StatusCellRenderer = (props: ICellRendererParams) => {
  const value = props.value;
  if (!value) return null;

  const statusLabel = STATUS_LABELS[value] || value;
  const statusColor = STATUS_COLORS[value] || 'bg-gray-100 text-gray-800';

  return (
    <div className="flex items-center justify-center h-full">
      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColor}`}>
        {statusLabel}
      </span>
    </div>
  );
};
```

### Complete Deadline Cell Renderer
```typescript
const DeadlineCellRenderer = (props: ICellRendererParams) => {
  const value = props.value;
  if (!value) return null;

  const ddayText = calculateDDay(value);
  const isUrgent = ddayText.startsWith('D-') && parseInt(ddayText.slice(2)) <= 3;

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <span className="text-sm">{value.slice(0, 10)}</span>
      <span className={`text-xs ${isUrgent ? 'text-neutral-700 font-bold' : 'text-gray-500'}`}>
        {ddayText}
      </span>
    </div>
  );
};
```

### Complete Column Definitions
```typescript
const columnDefs: ColDef[] = [
  { field: 'id', headerName: 'ID', hide: true },
  {
    field: 'source',
    headerName: '출처',
    cellRenderer: SourceCellRenderer,
    width: 80,
  },
  {
    field: 'title',
    headerName: '제목',
    flex: 2,
    editable: true,
  },
  {
    field: 'organization',
    headerName: '발주기관',
    flex: 1,
    editable: true,
  },
  {
    field: 'deadline',
    headerName: '마감일',
    cellRenderer: DeadlineCellRenderer,
    width: 120,
  },
  {
    field: 'estimated_amount',
    headerName: '추정금액',
    cellRenderer: AmountCellRenderer,
    type: 'numericColumn',
    width: 130,
    editable: true,
  },
  {
    field: 'status',
    headerName: '상태',
    cellRenderer: StatusCellRenderer,
    cellEditor: 'agSelectCellEditor',
    cellEditorParams: {
      values: ['new', 'reviewing', 'submitted', 'awarded', 'rejected'],
    },
    width: 100,
    editable: true,
  },
  {
    field: 'priority',
    headerName: '우선순위',
    cellRenderer: PriorityCellRenderer,
    cellEditor: 'agSelectCellEditor',
    cellEditorParams: {
      values: ['high', 'medium', 'low'],
    },
    width: 90,
    editable: true,
  },
  {
    field: 'match_score',
    headerName: '매칭점수',
    cellRenderer: ScoreCellRenderer,
    width: 120,
  },
  {
    field: 'keywords',
    headerName: '키워드',
    cellRenderer: KeywordsCellRenderer,
    flex: 1,
  },
];
```

## Benefits

### Bundle Size
- **Before**: 800KB (Handsontable + HyperFormula)
- **After**: 400KB (ag-Grid Community)
- **Savings**: 400KB (50% reduction)

### Performance
- Faster rendering for large datasets (1000+ rows)
- Better virtual scrolling
- Lower memory usage

### Developer Experience
- React components instead of DOM manipulation
- Better TypeScript support
- Cleaner API
- Built-in features (export, formulas)

### Maintenance
- Active community support
- Regular updates
- Better documentation
- No license issues (Community edition is free)

## Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| Visual differences | Use ag-theme-alpine and custom CSS |
| Missing features | ag-Grid Community has all needed features |
| User retraining | Similar Excel-like interface |
| Bugs during migration | Keep Handsontable backup for 1 week |

## Testing Plan

1. **Unit Tests**: Test each cell renderer
2. **Integration Tests**: Test editing, export, selection
3. **Visual Tests**: Compare screenshots before/after
4. **Performance Tests**: Measure render time with 1000 rows
5. **User Acceptance**: Test with real bid data

## Rollback Plan

If critical issues found:
1. Revert to `SpreadsheetView.handsontable.backup.tsx`
2. Update imports
3. Keep ag-Grid dependencies (try again later)

---

**Next Steps**: Start Phase 1 - Create `SpreadsheetView.ag-grid.tsx`
