'use client';

/**
 * Pipeline View - Lead funnel and pipeline metrics
 *
 * Displays:
 * - Funnel chart (Lead → Customer)
 * - Pipeline velocity
 * - Conversion rates by stage
 * - Source breakdown
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@forge/ui/atoms/Card';
import { Skeleton } from '@forge/ui/atoms/Skeleton';
import { Badge } from '@forge/ui/atoms/Badge';
import { DateRange } from './MarketingDashboard';
import { formatPercentage, formatCompactNumber } from '@forge/utils/src/marketing-metrics';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
  FunnelChart,
  Funnel,
  LabelList,
} from 'recharts';
import { TrendingUp, Users, Target, CheckCircle, Clock } from 'lucide-react';

interface PipelineViewProps {
  dateRange: DateRange;
  lastUpdated: Date;
}

interface PipelineData {
  stages: {
    name: string;
    count: number;
    value: number;
    conversionRate: number;
    color: string;
  }[];
  sourceBreakdown: {
    source: string;
    leads: number;
    conversions: number;
    conversionRate: number;
  }[];
  velocityDays: number;
  totalPipelineValue: number;
}

const FUNNEL_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export function PipelineView({ dateRange, lastUpdated }: PipelineViewProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PipelineData | null>(null);

  useEffect(() => {
    loadData();
  }, [dateRange, lastUpdated]);

  const loadData = async () => {
    setLoading(true);

    // TODO: Replace with actual API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Mock data
    const mockData: PipelineData = {
      stages: [
        { name: 'New Leads', count: 1247, value: 1247, conversionRate: 100, color: FUNNEL_COLORS[0]! },
        { name: 'Qualified', count: 485, value: 485, conversionRate: 38.9, color: FUNNEL_COLORS[1]! },
        { name: 'Opportunity', count: 142, value: 142, conversionRate: 29.3, color: FUNNEL_COLORS[2]! },
        { name: 'Proposal', count: 68, value: 68, conversionRate: 47.9, color: FUNNEL_COLORS[3]! },
        { name: 'Converted', count: 47, value: 47, conversionRate: 69.1, color: FUNNEL_COLORS[4]! },
      ],
      sourceBreakdown: [
        { source: 'Website', leads: 425, conversions: 18, conversionRate: 4.2 },
        { source: 'Social Media', leads: 312, conversions: 12, conversionRate: 3.8 },
        { source: 'Email', leads: 208, conversions: 8, conversionRate: 3.8 },
        { source: 'Referral', leads: 156, conversions: 5, conversionRate: 3.2 },
        { source: 'Paid Ads', leads: 146, conversions: 4, conversionRate: 2.7 },
      ],
      velocityDays: 28.5,
      totalPipelineValue: 485000,
    };

    setData(mockData);
    setLoading(false);
  };

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-96" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const overallConversionRate =
    (data.stages[data.stages.length - 1]!.count / data.stages[0]!.count) * 100;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase font-medium">Total Leads</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {formatCompactNumber(data.stages[0]!.count)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase font-medium">Conversions</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {formatCompactNumber(data.stages[data.stages.length - 1]!.count)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-100 rounded-lg">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase font-medium">Conversion Rate</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {formatPercentage(overallConversionRate)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase font-medium">Avg. Velocity</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {data.velocityDays.toFixed(0)} days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Conversion Funnel</CardTitle>
            <Badge variant="outline">{dateRange.label}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Visual Funnel */}
            <div className="space-y-3">
              {data.stages.map((stage, index) => {
                const width = (stage.count / data.stages[0]!.count) * 100;
                const dropoff = index > 0
                  ? ((data.stages[index - 1]!.count - stage.count) / data.stages[index - 1]!.count) * 100
                  : 0;

                return (
                  <div key={stage.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-neutral-700">{stage.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-neutral-900">{formatCompactNumber(stage.count)}</span>
                        <Badge variant="outline" className="text-xs">
                          {formatPercentage(stage.conversionRate)}
                        </Badge>
                      </div>
                    </div>
                    <div className="relative h-12 bg-neutral-100 rounded-lg overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 flex items-center justify-center text-white font-semibold text-sm transition-all duration-300"
                        style={{
                          width: `${width}%`,
                          backgroundColor: stage.color,
                        }}
                      >
                        {width > 20 && `${width.toFixed(1)}%`}
                      </div>
                    </div>
                    {index > 0 && dropoff > 0 && (
                      <p className="text-xs text-neutral-500 ml-2">
                        Drop-off: {formatPercentage(dropoff)} ({formatCompactNumber(data.stages[index - 1]!.count - stage.count)} leads)
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Source Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Leads by Source</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.sourceBreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} />
                <YAxis dataKey="source" type="category" tick={{ fontSize: 12 }} tickLine={false} width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="leads" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Conversion Rate by Source</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.sourceBreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  tickFormatter={(value) => `${value}%`}
                />
                <YAxis dataKey="source" type="category" tick={{ fontSize: 12 }} tickLine={false} width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                />
                <Bar dataKey="conversionRate" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Source Performance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Source</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700">Leads</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700">Conversions</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700">Conv. Rate</th>
                </tr>
              </thead>
              <tbody>
                {data.sourceBreakdown.map((item) => (
                  <tr key={item.source} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="py-3 px-4 text-sm font-medium text-neutral-900">{item.source}</td>
                    <td className="py-3 px-4 text-sm text-right text-neutral-700">{formatCompactNumber(item.leads)}</td>
                    <td className="py-3 px-4 text-sm text-right text-neutral-700">{item.conversions}</td>
                    <td className="py-3 px-4 text-sm text-right">
                      <Badge variant={item.conversionRate >= 4 ? 'default' : 'outline'}>
                        {formatPercentage(item.conversionRate)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
