'use client';

/**
 * Date Range Selector - Custom date range picker
 */

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@forge/ui/atoms/Select';
import { Calendar } from 'lucide-react';
import { DateRange } from './MarketingDashboard';

interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  ranges: DateRange[];
}

export function DateRangeSelector({ value, onChange, ranges }: DateRangeSelectorProps) {
  return (
    <Select
      value={value.label}
      onValueChange={(label) => {
        const range = ranges.find((r) => r.label === label);
        if (range) onChange(range);
      }}
    >
      <SelectTrigger className="w-[180px]">
        <Calendar className="w-4 h-4 mr-2" />
        <SelectValue placeholder="Select range" />
      </SelectTrigger>
      <SelectContent>
        {ranges.map((range) => (
          <SelectItem key={range.label} value={range.label}>
            {range.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
