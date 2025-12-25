/**
 * Claude AI Assistant Component
 *
 * Features:
 * - Chat interface for AI queries
 * - Real-time streaming responses
 * - Quick action buttons
 * - Usage statistics display
 * - Cost tracking
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { SparklesIcon, XMarkIcon, ChartBarIcon, ClockIcon } from '@heroicons/react/24/outline';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  cost?: number;
}

interface ClaudeAssistantProps {
  data: any[];
  onCommand?: (command: {
    action: string;
    params: any;
  }) => void;
}

export function ClaudeAssistant({ data, onCommand }: ClaudeAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load usage stats
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/v1/ai/stats');
      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/v1/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data,
          complexity: 'medium',
        }),
      });

      const result = await response.json();

      if (result.success) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: formatResponse(result.data),
          timestamp: new Date(),
          cost: result.meta.cost,
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Reload stats
        loadStats();
      } else {
        throw new Error(result.error.message);
      }
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `오류: ${error.message}`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const formatResponse = (data: any): string => {
    const { insights, recommendations, trends } = data;

    let formatted = '';

    if (insights && insights.length > 0) {
      formatted += '**📊 인사이트:**\n';
      insights.forEach((insight: string, i: number) => {
        formatted += `${i + 1}. ${insight}\n`;
      });
      formatted += '\n';
    }

    if (recommendations && recommendations.length > 0) {
      formatted += '**💡 추천사항:**\n';
      recommendations.forEach((rec: string, i: number) => {
        formatted += `${i + 1}. ${rec}\n`;
      });
      formatted += '\n';
    }

    if (trends && trends.length > 0) {
      formatted += '**📈 트렌드:**\n';
      trends.forEach((trend: string, i: number) => {
        formatted += `${i + 1}. ${trend}\n`;
      });
    }

    return formatted || data.text || JSON.stringify(data, null, 2);
  };

  const quickActions = [
    '이번 주 트렌드는?',
    '고액 입찰 보여줘',
    '마감 임박 입찰',
    '승률 높은 입찰',
  ];

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-l border-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <SparklesIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Claude AI</h3>
            <p className="text-xs text-zinc-400">입찰 데이터 분석 어시스턴트</p>
          </div>
        </div>

        {/* Stats Badge */}
        {stats && (
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <ChartBarIcon className="w-4 h-4" />
            <span>${stats.totalCost.toFixed(3)}</span>
            <span className="text-zinc-600">|</span>
            <span>{stats.totalRequests}회</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto bg-zinc-900 rounded-full flex items-center justify-center mb-4">
              <SparklesIcon className="w-8 h-8 text-blue-500" />
            </div>
            <h4 className="text-sm font-medium text-white mb-2">
              AI 어시스턴트에게 질문하세요
            </h4>
            <p className="text-xs text-zinc-400">
              입찰 데이터에 대해 무엇이든 물어보세요
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.role === 'user'
                  ? 'bg-blue-500/10 border border-blue-500/20 text-blue-300'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-100'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">{msg.content}</div>

              {/* Meta info */}
              <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
                <ClockIcon className="w-3 h-3" />
                <span>{msg.timestamp.toLocaleTimeString()}</span>

                {msg.cost && (
                  <>
                    <span className="text-zinc-700">|</span>
                    <span>${msg.cost.toFixed(4)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg p-3 bg-zinc-900 border border-zinc-800">
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-75" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-150" />
                <span className="ml-2">Claude가 분석하는 중...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t border-zinc-800">
        <div className="flex flex-wrap gap-2 mb-3">
          {quickActions.map((action) => (
            <button
              key={action}
              onClick={() => setInput(action)}
              className="px-3 py-1.5 text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded border border-zinc-800 transition-colors"
            >
              {action}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="입찰 데이터에 대해 질문하세요..."
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            전송
          </button>
        </div>

        {/* Quota Warning */}
        {stats && stats.totalCost > 0.8 && (
          <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
            <p className="text-xs text-yellow-400">
              ⚠️ 일일 한도의 {Math.round((stats.totalCost / 1.0) * 100)}% 사용 중
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
