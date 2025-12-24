'use client';

/**
 * Executive Summary - High-level KPIs
 *
 * Displays key performance indicators:
 * - Leads generated
 * - Conversion rate
 * - Pipeline value
 * - CAC & LTV
 * - ROI metrics
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@forge/ui/atoms/Card';
import { Skeleton } from '@forge/ui/atoms/Skeleton';
import { Badge } from '@forge/ui/atoms/Badge';
import {
  Users,
  TrendingUp,
  DollarSign,
  Target,
  Mail,
  BarChart3,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { MetricCard, MetricCardGrid } from '../../../.design-system/hephaitos/components-dashboard/MetricCard';
import { DateRange } from './MarketingDashboard';
import { formatCurrency, formatPercentage, formatCompactNumber } from '@forge/utils/src/marketing-metrics';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ExecutiveSummaryProps {
  dateRange: DateRange;
  lastUpdated: Date;
}

interface SummaryMetrics {
  leads: {
    total: number;
    change: number;
  };
  conversionRate: {
    value: number;
    change: number;
  };
  pipelineValue: {
    total: number;
    change: number;
  };
  cac: {
    value: number;
    change: number;
  };
  ltv: {
    value: number;
    change: number;
  };
  roi: {
    value: number;
    change: number;
  };
  emailPerformance: {
    sent: number;
    openRate: number;
    replyRate: number;
  };
  activeSequences: number;
}

export function ExecutiveSummary({ dateRange, lastUpdated }: ExecutiveSummaryProps) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<SummaryMetrics | null>(null);
  const [trendData, setTrendData] = useState<any[]>([]);

  useEffect(() => {
    loadMetrics();
  }, [dateRange, lastUpdated]);

  const loadMetrics = async () => {
    setLoading(true);

    // TODO: Replace with actual API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Mock data
    const mockMetrics: SummaryMetrics = {
      leads: {
        total: 1247,
        change: 12.5,
      },
      conversionRate: {
        value: 3.8,
        change: 0.4,
      },
      pipelineValue: {
        total: 485000,
        change: 18.2,
      },
      cac: {
        value: 125,
        change: -8.5,
      },
      ltv: {
        value: 3200,
        change: 5.2,
      },
      roi: {
        value: 285,
        change: 15.8,
      },
      emailPerformance: {
        sent: 12480,
        openRate: 28.5,
        replyRate: 6.2,
      },
      activeSequences: 12,
    };

    // Mock trend data
    const mockTrend = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      leads: Math.floor(Math.random() * 100) + 20,
      conversions: Math.floor(Math.random() * 10) + 2,
      revenue: Math.floor(Math.random() * 50000) + 10000,
    }));

    setMetrics(mockMetrics);
    setTrendData(mockTrend);
    setLoading(false);
  };

  if (loading || !metrics) {
    return (
      <div className="space-y-6">
        <MetricCardGrid columns={4}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </MetricCardGrid>
      </div>
    );
  }

  const ltvCacRatio = metrics.ltv.value / metrics.cac.value;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <MetricCardGrid columns={4}>
        <MetricCard
          title="Leads Generated"
          value={formatCompactNumber(metrics.leads.total)}
          change={{
            value: metrics.leads.change,
            type: metrics.leads.change > 0 ? 'increase' : 'decrease',
            label: 'vs last period',
          }}
          icon={Users}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
        />

        <MetricCard
          title="Conversion Rate"
          value={formatPercentage(metrics.conversionRate.value)}
          change={{
            value: metrics.conversionRate.change,
            type: metrics.conversionRate.change > 0 ? 'increase' : 'decrease',
            label: 'vs last period',
          }}
          icon={Target}
          iconColor="text-green-600"
          iconBg="bg-green-100"
        />

        <MetricCard
          title="Pipeline Value"
          value={formatCurrency(metrics.pipelineValue.total)}
          change={{
            value: metrics.pipelineValue.change,
            type: metrics.pipelineValue.change > 0 ? 'increase' : 'decrease',
            label: 'vs last period',
          }}
          icon={DollarSign}
          iconColor="text-purple-600"
          iconBg="bg-purple-100"
        />

        <MetricCard
          title="ROI"
          value={formatPercentage(metrics.roi.value, 0)}
          change={{
            value: metrics.roi.change,
            type: metrics.roi.change > 0 ? 'increase' : 'decrease',
            label: 'vs last period',
          }}
          icon={TrendingUp}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-100"
        />

        <MetricCard
          title="CAC"
          value={formatCurrency(metrics.cac.value)}
          change={{
            value: metrics.cac.change,
            type: metrics.cac.change > 0 ? 'increase' : 'decrease',
            label: 'vs last period',
          }}
          icon={DollarSign}
          iconColor="text-orange-600"
          iconBg="bg-orange-100"
        />

        <MetricCard
          title="LTV"
          value={formatCurrency(metrics.ltv.value)}
          change={{
            value: metrics.ltv.change,
            type: metrics.ltv.change > 0 ? 'increase' : 'decrease',
            label: 'vs last period',
          }}
          icon={DollarSign}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-100"
        />

        <MetricCard
          title="LTV:CAC Ratio"
          value={ltvCacRatio.toFixed(1) + ':1'}
          subtitle={ltvCacRatio >= 3 ? 'Excellent' : ltvCacRatio >= 2 ? 'Good' : 'Needs improvement'}
          icon={BarChart3}
          iconColor={ltvCacRatio >= 3 ? 'text-green-600' : ltvCacRatio >= 2 ? 'text-yellow-600' : 'text-red-600'}
          iconBg={ltvCacRatio >= 3 ? 'bg-green-100' : ltvCacRatio >= 2 ? 'bg-yellow-100' : 'bg-red-100'}
        />

        <MetricCard
          title="Email Performance"
          value={formatPercentage(metrics.emailPerformance.openRate)}
          subtitle={`${formatPercentage(metrics.emailPerformance.replyRate)} reply rate`}
          icon={Mail}
          iconColor="text-cyan-600"
          iconBg="bg-cyan-100"
        />
      </MetricCardGrid>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads & Conversions Trend */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Leads & Conversions</CardTitle>
              <Badge variant="outline">Last 30 Days</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="leads"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  name="Leads"
                />
                <Line
                  type="monotone"
                  dataKey="conversions"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  name="Conversions"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Revenue Trend</CardTitle>
              <Badge variant="outline">Last 30 Days</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fill="url(#colorRevenue)"
                  name="Revenue"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Email Outreach Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">
                  {formatCompactNumber(metrics.emailPerformance.sent)}
                </p>
                <p className="text-sm text-neutral-500">Emails Sent</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">
                  {formatPercentage(metrics.emailPerformance.openRate)}
                </p>
                <p className="text-sm text-neutral-500">Open Rate</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">
                  {metrics.activeSequences}
                </p>
                <p className="text-sm text-neutral-500">Active Sequences</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
