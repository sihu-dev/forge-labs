'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@forge/ui/atoms/Card';
import { DateRange } from './MarketingDashboard';

interface ContentAnalyticsProps {
  dateRange: DateRange;
  lastUpdated: Date;
}

export function ContentAnalytics({ dateRange, lastUpdated }: ContentAnalyticsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Marketing Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-neutral-500">Content performance metrics will be displayed here.</p>
      </CardContent>
    </Card>
  );
}
