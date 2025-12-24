'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@forge/ui/atoms/Card';
import { DateRange } from './MarketingDashboard';

interface RevenueAttributionProps {
  dateRange: DateRange;
  lastUpdated: Date;
}

export function RevenueAttribution({ dateRange, lastUpdated }: RevenueAttributionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Attribution</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-neutral-500">Multi-touch attribution and revenue tracking will be displayed here.</p>
      </CardContent>
    </Card>
  );
}
