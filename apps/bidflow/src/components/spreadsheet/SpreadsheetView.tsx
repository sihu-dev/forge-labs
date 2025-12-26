'use client';

/**
 * BIDFLOW 스프레드시트 뷰 - ag-Grid 버전
 * Bundle size: ~400KB (was 800KB with Handsontable)
 */

import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type {
  ColDef,
  ICellRendererParams,
  CellValueChangedEvent,
  RowClickedEvent,
} from 'ag-grid-community';

// Import ag-Grid styles
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

import { Toolbar } from './Toolbar';
import { SidePanel } from './SidePanel';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  PRIORITY_COLORS,
  SOURCE_LABELS,
  calculateDDay,
  formatAmount,
} from '@/lib/spreadsheet/column-definitions';

// ============================================================================
// 타입 정의
// ============================================================================

export interface Bid {
  id: string;
  source: string;
  external_id: string;
  title: string;
  organization: string;
  deadline: string;
  estimated_amount: number | null;
  status: string;
  priority: string;
  type: string;
  keywords: string[];
  url: string | null;
  match_score?: number;
  ai_summary?: string | null;
  created_at: string;
  updated_at: string;
}

interface SpreadsheetViewProps {
  initialData?: Bid[];
  onBidUpdate?: (id: string, updates: Partial<Bid>) => Promise<void>;
  onBidCreate?: (bid: Partial<Bid>) => Promise<void>;
  onRefresh?: () => Promise<void>;
}

// ============================================================================
// Cell Renderers (React Components)
// ============================================================================

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

const PriorityCellRenderer = (props: ICellRendererParams) => {
  const value = props.value;
  if (!value) return null;

  const icon = PRIORITY_COLORS[value] || '⚪';

  return (
    <div className="flex items-center justify-center h-full text-lg">
      {icon}
    </div>
  );
};

const SourceCellRenderer = (props: ICellRendererParams) => {
  const value = props.value;
  if (!value) return null;

  return (
    <div className="flex items-center justify-center h-full text-xs">
      {SOURCE_LABELS[value] || value}
    </div>
  );
};

const AmountCellRenderer = (props: ICellRendererParams) => {
  const value = props.value;

  return (
    <div className="flex items-center justify-end h-full pr-2">
      {formatAmount(value)}
    </div>
  );
};

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

const ScoreCellRenderer = (props: ICellRendererParams) => {
  const value = props.value;

  if (value === undefined || value === null) {
    return <div className="flex items-center justify-center h-full text-xs text-gray-500">-</div>;
  }

  const percent = Math.round(value * 100);
  const barColor = percent >= 70 ? 'bg-neutral-800' : percent >= 40 ? 'bg-neutral-500' : 'bg-neutral-400';

  return (
    <div className="flex items-center justify-center h-full gap-1">
      <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${barColor}`} style={{ width: `${percent}%` }} />
      </div>
      <span className="text-xs text-gray-600">{percent}%</span>
    </div>
  );
};

const KeywordsCellRenderer = (props: ICellRendererParams) => {
  const value = props.value;
  if (!value) return null;

  // Handle both array and comma-separated string
  const keywords = Array.isArray(value)
    ? value
    : String(value).split(',').map(s => s.trim()).filter(Boolean);

  if (keywords.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 items-center h-full py-1">
      {keywords.slice(0, 3).map((keyword, index) => (
        <span key={index} className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
          {keyword}
        </span>
      ))}
      {keywords.length > 3 && (
        <span className="text-xs text-gray-400">+{keywords.length - 3}</span>
      )}
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export function SpreadsheetView({
  initialData = [],
  onBidUpdate,
  onBidCreate: _onBidCreate,
  onRefresh,
}: SpreadsheetViewProps) {
  // TODO: onBidCreate will be used for new bid creation
  void _onBidCreate;

  const gridRef = useRef<AgGridReact>(null);
  const [rowData, setRowData] = useState<Bid[]>(initialData);
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Update row data when initialData changes
  useEffect(() => {
    setRowData(initialData);
  }, [initialData]);

  // Column Definitions
  const columnDefs = useMemo<ColDef[]>(() => [
    {
      field: 'id',
      headerName: 'ID',
      hide: true,
    },
    {
      field: 'source',
      headerName: '출처',
      cellRenderer: SourceCellRenderer,
      width: 80,
      filter: true,
    },
    {
      field: 'external_id',
      headerName: '공고번호',
      width: 120,
      filter: 'agTextColumnFilter',
    },
    {
      field: 'title',
      headerName: '제목',
      flex: 2,
      editable: true,
      filter: 'agTextColumnFilter',
    },
    {
      field: 'organization',
      headerName: '발주기관',
      flex: 1,
      editable: true,
      filter: 'agTextColumnFilter',
    },
    {
      field: 'deadline',
      headerName: '마감일',
      cellRenderer: DeadlineCellRenderer,
      width: 120,
      sort: 'asc',
      filter: 'agDateColumnFilter',
    },
    {
      field: 'estimated_amount',
      headerName: '추정금액',
      cellRenderer: AmountCellRenderer,
      type: 'numericColumn',
      width: 130,
      editable: true,
      filter: 'agNumberColumnFilter',
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
      filter: 'agSetColumnFilter',
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
      filter: 'agSetColumnFilter',
    },
    {
      field: 'type',
      headerName: '유형',
      width: 80,
      editable: true,
      filter: 'agSetColumnFilter',
    },
    {
      field: 'match_score',
      headerName: '매칭점수',
      cellRenderer: ScoreCellRenderer,
      width: 120,
      filter: 'agNumberColumnFilter',
    },
    {
      field: 'keywords',
      headerName: '키워드',
      cellRenderer: KeywordsCellRenderer,
      flex: 1,
      filter: 'agTextColumnFilter',
    },
  ], []);

  // Default column configuration
  const defaultColDef = useMemo<ColDef>(() => ({
    sortable: true,
    resizable: true,
    floatingFilter: false, // Can enable for inline filtering
  }), []);

  // Cell value changed handler
  const onCellValueChanged = useCallback(
    async (event: CellValueChangedEvent) => {
      const { data, colDef, newValue, oldValue } = event;

      if (oldValue === newValue) return;
      if (!colDef.field || !onBidUpdate) return;

      try {
        await onBidUpdate(data.id, { [colDef.field]: newValue });
      } catch (error) {
        console.error('업데이트 실패:', error);
        // Revert the change on error
        event.node.setDataValue(colDef.field, oldValue);
      }
    },
    [onBidUpdate]
  );

  // Row click handler
  const onRowClicked = useCallback((event: RowClickedEvent) => {
    setSelectedBid(event.data);
    setSidePanelOpen(true);
  }, []);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;

    setIsLoading(true);
    try {
      await onRefresh();
    } finally {
      setIsLoading(false);
    }
  }, [onRefresh]);

  // Export handlers
  const handleExport = useCallback(
    async (format: 'csv' | 'excel' | 'json') => {
      const gridApi = gridRef.current?.api;
      if (!gridApi) return;

      switch (format) {
        case 'csv':
          gridApi.exportDataAsCsv({
            fileName: `bids_${new Date().toISOString().slice(0, 10)}.csv`,
          });
          break;

        case 'excel':
          gridApi.exportDataAsExcel({
            fileName: `bids_${new Date().toISOString().slice(0, 10)}.xlsx`,
            sheetName: 'Bids',
          });
          break;

        case 'json':
          {
            const data: Bid[] = [];
            gridApi.forEachNode(node => {
              if (node.data) data.push(node.data);
            });
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `bids_${new Date().toISOString().slice(0, 10)}.json`;
            link.click();
            URL.revokeObjectURL(url);
          }
          break;
      }
    },
    []
  );

  return (
    <div className="flex h-full">
      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <Toolbar
          onRefresh={handleRefresh}
          onExport={handleExport}
          isLoading={isLoading}
          totalCount={rowData.length}
        />

        {/* ag-Grid Table */}
        <div className="flex-1 ag-theme-alpine-dark">
          <AgGridReact
            ref={gridRef}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onCellValueChanged={onCellValueChanged}
            onRowClicked={onRowClicked}
            rowSelection="single"
            animateRows={true}
            enableCellTextSelection={true}
            domLayout="normal"
            // Context menu
            enableRangeSelection={true}
            // Performance
            suppressRowTransform={true}
            // Styling
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Side Panel */}
      {sidePanelOpen && selectedBid && (
        <SidePanel
          bid={selectedBid}
          onClose={() => setSidePanelOpen(false)}
          onUpdate={async (updates) => {
            if (onBidUpdate) {
              await onBidUpdate(selectedBid.id, updates);
            }
          }}
        />
      )}
    </div>
  );
}

export default SpreadsheetView;
