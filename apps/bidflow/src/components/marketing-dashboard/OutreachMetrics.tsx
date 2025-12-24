'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@forge/ui/atoms/Card';
import { DateRange } from './MarketingDashboard';

interface OutreachMetricsProps {
  dateRange: DateRange;
  lastUpdated: Date;
}

export function OutreachMetrics({ dateRange, lastUpdated }: OutreachMetricsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Outreach Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-neutral-500">Email metrics and engagement analytics will be displayed here.</p>
      </CardContent>
    </Card>
  );
}
