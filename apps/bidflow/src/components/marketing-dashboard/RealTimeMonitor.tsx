'use client';

/**
 * Real-Time Monitor - System health and anomaly detection
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@forge/ui/atoms/Card';
import { Badge } from '@forge/ui/atoms/Badge';
import { Alert, AlertDescription, AlertTitle } from '@forge/ui/atoms/Alert';
import { Activity, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

interface SystemStatus {
  overall: 'healthy' | 'degraded' | 'down';
  components: {
    name: string;
    status: 'healthy' | 'degraded' | 'down';
    latency?: number;
    errorRate?: number;
  }[];
}

interface AnomalyAlert {
  id: string;
  type: 'spike' | 'drop' | 'anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric_name: string;
  current_value: number;
  expected_value: number;
  deviation_percent: number;
  description: string;
  detected_at: string;
}

export function RealTimeMonitor() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    overall: 'healthy',
    components: [
      { name: 'Email Delivery', status: 'healthy', latency: 45, errorRate: 0.1 },
      { name: 'API', status: 'healthy', latency: 120, errorRate: 0.2 },
      { name: 'Database', status: 'healthy', latency: 15, errorRate: 0 },
      { name: 'Integrations', status: 'healthy', latency: 200, errorRate: 0.5 },
    ],
  });

  const [alerts, setAlerts] = useState<AnomalyAlert[]>([
    {
      id: '1',
      type: 'spike',
      severity: 'high',
      metric_name: 'bounce_rate',
      current_value: 8.5,
      expected_value: 2.1,
      deviation_percent: 304,
      description: 'Email bounce rate has increased significantly',
      detected_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      type: 'drop',
      severity: 'medium',
      metric_name: 'open_rate',
      current_value: 18.2,
      expected_value: 28.5,
      deviation_percent: -36,
      description: 'Email open rate has decreased below normal',
      detected_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
  ]);

  // Real-time updates via Supabase Realtime
  useEffect(() => {
    // TODO: Set up Supabase Realtime subscription
    const interval = setInterval(() => {
      // Simulate real-time updates
      // In production, this would be replaced with Supabase Realtime
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'down':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Activity className="w-5 h-5 text-neutral-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-neutral-100 text-neutral-800 border-neutral-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* System Health */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              <CardTitle className="text-lg">System Health</CardTitle>
            </div>
            <Badge
              variant={systemStatus.overall === 'healthy' ? 'default' : 'destructive'}
              className={
                systemStatus.overall === 'healthy'
                  ? 'bg-green-600'
                  : systemStatus.overall === 'degraded'
                  ? 'bg-yellow-600'
                  : ''
              }
            >
              {systemStatus.overall.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {systemStatus.components.map((component) => (
              <div key={component.name} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(component.status)}
                  <div>
                    <p className="font-medium text-neutral-900">{component.name}</p>
                    <p className="text-sm text-neutral-500">
                      {component.latency && `${component.latency}ms latency`}
                      {component.errorRate !== undefined && ` • ${component.errorRate}% error rate`}
                    </p>
                  </div>
                </div>
                <Badge variant={component.status === 'healthy' ? 'default' : 'outline'}>
                  {component.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Anomaly Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <CardTitle className="text-lg">Anomaly Alerts</CardTitle>
            <Badge variant="destructive">{alerts.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-neutral-500">
                <CheckCircle className="w-5 h-5 mr-2" />
                No anomalies detected
              </div>
            ) : (
              alerts.map((alert) => (
                <Alert key={alert.id} className={`border ${getSeverityColor(alert.severity)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <AlertTitle className="flex items-center gap-2">
                        <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        {alert.metric_name.replace(/_/g, ' ').toUpperCase()}
                      </AlertTitle>
                      <AlertDescription className="mt-2">
                        <p>{alert.description}</p>
                        <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-neutral-500">Current:</span>
                            <span className="ml-2 font-semibold">{alert.current_value.toFixed(1)}%</span>
                          </div>
                          <div>
                            <span className="text-neutral-500">Expected:</span>
                            <span className="ml-2 font-semibold">{alert.expected_value.toFixed(1)}%</span>
                          </div>
                          <div>
                            <span className="text-neutral-500">Deviation:</span>
                            <span className="ml-2 font-semibold text-red-600">
                              {alert.deviation_percent > 0 ? '+' : ''}
                              {alert.deviation_percent.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </AlertDescription>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <Clock className="w-3 h-3" />
                      {new Date(alert.detected_at).toLocaleTimeString()}
                    </div>
                  </div>
                </Alert>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active Sequences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Active Email Sequences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                <div>
                  <p className="font-medium text-neutral-900">Sequence #{i}</p>
                  <p className="text-sm text-neutral-500">Active subscribers: {Math.floor(Math.random() * 500) + 100}</p>
                </div>
                <Badge variant="default" className="bg-green-600">
                  Active
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
