'use client';

/**
 * Marketing Automation Dashboard - Main Component
 *
 * Comprehensive sales/marketing analytics dashboard with:
 * - Executive summary
 * - Lead pipeline visualization
 * - Outreach performance metrics
 * - Content marketing analytics
 * - Revenue attribution
 */

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@forge/ui/atoms/Tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@forge/ui/atoms/Card';
import { Button } from '@forge/ui/atoms/Button';
import { Badge } from '@forge/ui/atoms/Badge';
import { Skeleton } from '@forge/ui/atoms/Skeleton';
import {
  BarChart3,
  TrendingUp,
  Mail,
  Users,
  DollarSign,
  Activity,
  AlertTriangle,
  RefreshCw,
  Download,
  Calendar,
  Filter,
} from 'lucide-react';

import { ExecutiveSummary } from './ExecutiveSummary';
import { PipelineView } from './PipelineView';
import { OutreachMetrics } from './OutreachMetrics';
import { ContentAnalytics } from './ContentAnalytics';
import { RevenueAttribution } from './RevenueAttribution';
import { RealTimeMonitor } from './RealTimeMonitor';
import { DateRangeSelector } from './DateRangeSelector';
import { cn } from '@/lib/utils';

export interface DateRange {
  start: string;
  end: string;
  label: string;
}

const DATE_RANGES: DateRange[] = [
  { start: '1h', end: 'now', label: 'Last Hour' },
  { start: '24h', end: 'now', label: 'Last 24 Hours' },
  { start: '7d', end: 'now', label: 'Last 7 Days' },
  { start: '30d', end: 'now', label: 'Last 30 Days' },
  { start: '90d', end: 'now', label: 'Last 90 Days' },
];

export function MarketingDashboard() {
  const [activeTab, setActiveTab] = useState('summary');
  const [dateRange, setDateRange] = useState<DateRange>(DATE_RANGES[3]!); // Default: Last 30 Days
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Trigger data refresh in child components
    setLastUpdated(new Date());

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting dashboard data...');
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">
                Marketing Analytics
              </h1>
              <p className="text-sm text-neutral-500 mt-1">
                Sales & Marketing Automation Dashboard
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Date Range Selector */}
              <DateRangeSelector
                value={dateRange}
                onChange={setDateRange}
                ranges={DATE_RANGES}
              />

              {/* Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={cn('w-4 h-4 mr-2', isRefreshing && 'animate-spin')}
                />
                Refresh
              </Button>

              {/* Export Button */}
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Last Updated */}
          <div className="mt-3 flex items-center gap-2 text-xs text-neutral-500">
            <Activity className="w-3 h-3" />
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tab Navigation */}
          <TabsList className="bg-white border border-neutral-200">
            <TabsTrigger value="summary">
              <BarChart3 className="w-4 h-4 mr-2" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="pipeline">
              <TrendingUp className="w-4 h-4 mr-2" />
              Pipeline
            </TabsTrigger>
            <TabsTrigger value="outreach">
              <Mail className="w-4 h-4 mr-2" />
              Outreach
            </TabsTrigger>
            <TabsTrigger value="content">
              <Users className="w-4 h-4 mr-2" />
              Content
            </TabsTrigger>
            <TabsTrigger value="attribution">
              <DollarSign className="w-4 h-4 mr-2" />
              Attribution
            </TabsTrigger>
            <TabsTrigger value="monitor">
              <Activity className="w-4 h-4 mr-2" />
              Monitor
              <Badge variant="default" className="ml-2 bg-neutral-800">
                Live
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <TabsContent value="summary" className="space-y-6">
            <ExecutiveSummary dateRange={dateRange} lastUpdated={lastUpdated} />
          </TabsContent>

          <TabsContent value="pipeline" className="space-y-6">
            <PipelineView dateRange={dateRange} lastUpdated={lastUpdated} />
          </TabsContent>

          <TabsContent value="outreach" className="space-y-6">
            <OutreachMetrics dateRange={dateRange} lastUpdated={lastUpdated} />
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <ContentAnalytics dateRange={dateRange} lastUpdated={lastUpdated} />
          </TabsContent>

          <TabsContent value="attribution" className="space-y-6">
            <RevenueAttribution dateRange={dateRange} lastUpdated={lastUpdated} />
          </TabsContent>

          <TabsContent value="monitor" className="space-y-6">
            <RealTimeMonitor />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default MarketingDashboard;
