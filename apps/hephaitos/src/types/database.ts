// ============================================
// Supabase Database Types
// ============================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // Users (managed by Supabase Auth, extended with profile)
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          display_name: string | null
          username: string | null
          full_name: string | null
          avatar_url: string | null
          plan: 'free' | 'pro' | 'enterprise'
          role: 'user' | 'mentor' | 'admin' | 'super_admin'
          balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          display_name?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          plan?: 'free' | 'pro' | 'enterprise'
          role?: 'user' | 'mentor' | 'admin' | 'super_admin'
          balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          display_name?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          plan?: 'free' | 'pro' | 'enterprise'
          role?: 'user' | 'mentor' | 'admin' | 'super_admin'
          balance?: number
          updated_at?: string
        }
      }

      // Credits (simple balance tracking)
      credits: {
        Row: {
          id: string
          user_id: string
          balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          created_at?: string
          updated_at?: string
        }
      }

      // Exchange Connections
      exchange_connections: {
        Row: {
          id: string
          user_id: string
          exchange_id: string
          api_key_encrypted: string
          secret_key_encrypted: string
          is_active: boolean
          permissions: string[]
          last_connected_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          exchange_id: string
          api_key_encrypted: string
          secret_key_encrypted: string
          is_active?: boolean
          permissions?: string[]
          last_connected_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          exchange_id?: string
          api_key_encrypted?: string
          secret_key_encrypted?: string
          is_active?: boolean
          permissions?: string[]
          last_connected_at?: string | null
          updated_at?: string
        }
      }

      // Trading Strategies
      strategies: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          status: 'draft' | 'backtesting' | 'ready' | 'running' | 'paused' | 'stopped'
          config: Json
          graph: Json | null
          performance: Json | null
          prompt: string | null
          is_public: boolean
          copy_count: number
          original_strategy_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          status?: 'draft' | 'backtesting' | 'ready' | 'running' | 'paused' | 'stopped'
          config: Json
          graph?: Json | null
          performance?: Json | null
          prompt?: string | null
          is_public?: boolean
          copy_count?: number
          original_strategy_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          status?: 'draft' | 'backtesting' | 'ready' | 'running' | 'paused' | 'stopped'
          config?: Json
          graph?: Json | null
          performance?: Json | null
          prompt?: string | null
          is_public?: boolean
          copy_count?: number
          original_strategy_id?: string | null
          updated_at?: string
        }
      }

      // Trades
      trades: {
        Row: {
          id: string
          user_id: string
          strategy_id: string | null
          exchange_id: string
          symbol: string
          type: 'buy' | 'sell'
          status: 'pending' | 'filled' | 'partial' | 'cancelled' | 'rejected'
          price: number
          amount: number
          total: number
          fee: number | null
          pnl: number | null
          pnl_percent: number | null
          order_id: string | null
          executed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          strategy_id?: string | null
          exchange_id: string
          symbol: string
          type: 'buy' | 'sell'
          status?: 'pending' | 'filled' | 'partial' | 'cancelled' | 'rejected'
          price: number
          amount: number
          total: number
          fee?: number | null
          pnl?: number | null
          pnl_percent?: number | null
          order_id?: string | null
          executed_at?: string | null
          created_at?: string
        }
        Update: {
          status?: 'pending' | 'filled' | 'partial' | 'cancelled' | 'rejected'
          price?: number
          amount?: number
          total?: number
          fee?: number | null
          pnl?: number | null
          pnl_percent?: number | null
          order_id?: string | null
          executed_at?: string | null
        }
      }

      // Backtest Results
      backtest_results: {
        Row: {
          id: string
          user_id: string
          strategy_id: string
          config: Json
          performance: Json
          equity_curve: Json
          trades: Json
          result_data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          strategy_id: string
          config?: Json
          performance?: Json
          equity_curve?: Json
          trades?: Json
          result_data?: Json
          created_at?: string
        }
        Update: {
          config?: Json
          performance?: Json
          equity_curve?: Json
          trades?: Json
          result_data?: Json
        }
      }

      // Notifications
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          priority: 'low' | 'normal' | 'high' | 'urgent'
          title: string
          message: string
          read: boolean
          data: Json | null
          action_url: string | null
          action_label: string | null
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          title: string
          message: string
          read?: boolean
          data?: Json | null
          action_url?: string | null
          action_label?: string | null
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          read?: boolean
          type?: string
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          title?: string
          message?: string
          data?: Json | null
          action_url?: string | null
          action_label?: string | null
          expires_at?: string | null
        }
      }

      // User Settings
      user_settings: {
        Row: {
          id: string
          user_id: string
          notification_trade_signals: boolean
          notification_trade_execution: boolean
          notification_email_digest: boolean
          notification_push: boolean
          default_exchange: string | null
          theme: 'dark' | 'light' | 'system'
          language: string
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          notification_trade_signals?: boolean
          notification_trade_execution?: boolean
          notification_email_digest?: boolean
          notification_push?: boolean
          default_exchange?: string | null
          theme?: 'dark' | 'light' | 'system'
          language?: string
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          notification_trade_signals?: boolean
          notification_trade_execution?: boolean
          notification_email_digest?: boolean
          notification_push?: boolean
          default_exchange?: string | null
          theme?: 'dark' | 'light' | 'system'
          language?: string
          timezone?: string
          updated_at?: string
        }
      }

      // Credit Wallets
      credit_wallets: {
        Row: {
          id: string
          user_id: string
          balance: number
          lifetime_purchased: number
          lifetime_spent: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          lifetime_purchased?: number
          lifetime_spent?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          balance?: number
          lifetime_purchased?: number
          lifetime_spent?: number
          updated_at?: string
        }
      }

      // Credit Transactions
      credit_transactions: {
        Row: {
          id: string
          user_id: string
          type: 'purchase' | 'spend' | 'refund' | 'bonus' | 'referral' | 'backtest' | 'strategy_generate' | 'report_create' | 'coaching_session' | 'tutor_answer'
          amount: number
          balance_after: number | null
          feature: string | null
          description: string | null
          metadata: Json | null
          payment_order_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'purchase' | 'spend' | 'refund' | 'bonus' | 'referral' | 'backtest' | 'strategy_generate' | 'report_create' | 'coaching_session' | 'tutor_answer'
          amount: number
          balance_after?: number | null
          feature?: string | null
          description?: string | null
          metadata?: Json | null
          payment_order_id?: string | null
          created_at?: string
        }
        Update: {
          type?: 'purchase' | 'spend' | 'refund' | 'bonus' | 'referral' | 'backtest' | 'strategy_generate' | 'report_create' | 'coaching_session' | 'tutor_answer'
          amount?: number
          balance_after?: number | null
          feature?: string | null
          description?: string | null
          metadata?: Json | null
          payment_order_id?: string | null
        }
      }

      // Credit Packages
      credit_packages: {
        Row: {
          id: string
          name: string
          credits: number
          bonus_credits: number
          price_krw: number
          price_usd: number | null
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          credits: number
          bonus_credits?: number
          price_krw: number
          price_usd?: number | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          credits?: number
          bonus_credits?: number
          price_krw?: number
          price_usd?: number | null
          display_order?: number
          is_active?: boolean
          updated_at?: string
        }
      }

      // Credit Costs
      credit_costs: {
        Row: {
          id: string
          feature: string
          cost: number
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          feature: string
          cost: number
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          feature?: string
          cost?: number
          description?: string | null
          is_active?: boolean
          updated_at?: string
        }
      }

      // Referrals
      referrals: {
        Row: {
          id: string
          referrer_id: string
          referee_id: string
          referrer_bonus: number
          referee_bonus: number
          status: 'pending' | 'completed' | 'cancelled'
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          referrer_id: string
          referee_id: string
          referrer_bonus?: number
          referee_bonus?: number
          status?: 'pending' | 'completed' | 'cancelled'
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          referrer_bonus?: number
          referee_bonus?: number
          status?: 'pending' | 'completed' | 'cancelled'
          completed_at?: string | null
        }
      }

      // Payment Orders
      payment_orders: {
        Row: {
          id: string
          user_id: string
          order_id: string
          amount: number
          credits: number
          package_id: string | null
          status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded'
          payment_key: string | null
          raw: Json | null
          refund_amount: number | null
          refund_reason: string | null
          refunded_at: string | null
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          order_id: string
          amount: number
          credits: number
          package_id?: string | null
          status?: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded'
          payment_key?: string | null
          raw?: Json | null
          refund_amount?: number | null
          refund_reason?: string | null
          refunded_at?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded'
          payment_key?: string | null
          raw?: Json | null
          refund_amount?: number | null
          refund_reason?: string | null
          refunded_at?: string | null
          paid_at?: string | null
          updated_at?: string
        }
      }

      // AI Usage Events
      ai_usage_events: {
        Row: {
          id: string
          user_id: string
          feature: string
          credits_used: number
          tokens_input: number | null
          tokens_output: number | null
          model_used: string | null
          latency_ms: number | null
          cost_estimate_krw: number | null
          success: boolean
          error_message: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          feature: string
          credits_used?: number
          tokens_input?: number | null
          tokens_output?: number | null
          model_used?: string | null
          latency_ms?: number | null
          cost_estimate_krw?: number | null
          success?: boolean
          error_message?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          feature?: string
          credits_used?: number
          tokens_input?: number | null
          tokens_output?: number | null
          model_used?: string | null
          latency_ms?: number | null
          cost_estimate_krw?: number | null
          success?: boolean
          error_message?: string | null
          metadata?: Json | null
        }
      }

      // Safety Events
      safety_events: {
        Row: {
          id: string
          user_id: string
          feature: string
          section: string | null
          input_excerpt: string | null
          output_before: string | null
          output_after: string | null
          decision: 'allow' | 'soften' | 'block'
          policy_matched: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          feature: string
          section?: string | null
          input_excerpt?: string | null
          output_before?: string | null
          output_after?: string | null
          decision: 'allow' | 'soften' | 'block'
          policy_matched?: string[] | null
          created_at?: string
        }
        Update: {
          feature?: string
          section?: string | null
          decision?: 'allow' | 'soften' | 'block'
          policy_matched?: string[] | null
        }
      }

      // Refund Requests
      refund_requests: {
        Row: {
          id: string
          user_id: string
          order_id: string
          reason: string
          credits_used: number
          credits_total: number
          usage_rate: number
          refund_amount: number | null
          status: 'pending' | 'approved' | 'rejected' | 'completed'
          admin_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          order_id: string
          reason: string
          credits_used: number
          credits_total: number
          usage_rate: number
          refund_amount?: number | null
          status?: 'pending' | 'approved' | 'rejected' | 'completed'
          admin_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          created_at?: string
        }
        Update: {
          reason?: string
          refund_amount?: number | null
          status?: 'pending' | 'approved' | 'rejected' | 'completed'
          admin_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
      }

      // Refund Events
      refund_events: {
        Row: {
          id: string
          user_id: string
          order_id: string
          payment_order_id: string | null
          requested_at: string
          processed_at: string | null
          reason: string
          unused_credits: number
          refund_amount: number
          status: 'pending' | 'approved' | 'rejected' | 'completed' | 'failed'
          toss_response: Json | null
          rejection_reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          order_id: string
          payment_order_id?: string | null
          requested_at?: string
          processed_at?: string | null
          reason: string
          unused_credits: number
          refund_amount: number
          status?: 'pending' | 'approved' | 'rejected' | 'completed' | 'failed'
          toss_response?: Json | null
          rejection_reason?: string | null
          created_at?: string
        }
        Update: {
          processed_at?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'completed' | 'failed'
          toss_response?: Json | null
          rejection_reason?: string | null
        }
      }

      // Backtest Jobs
      backtest_jobs: {
        Row: {
          id: string
          user_id: string
          strategy_id: string
          job_id: string
          timeframe: string
          start_date: string
          end_date: string
          symbol: string
          status: 'queued' | 'processing' | 'completed' | 'failed'
          credits_deducted: boolean
          result: Json | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          strategy_id: string
          job_id: string
          timeframe: string
          start_date: string
          end_date: string
          symbol: string
          status?: 'queued' | 'processing' | 'completed' | 'failed'
          credits_deducted?: boolean
          result?: Json | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          status?: 'queued' | 'processing' | 'completed' | 'failed'
          credits_deducted?: boolean
          result?: Json | null
          completed_at?: string | null
        }
      }

      // Strategy Performance
      strategy_performance: {
        Row: {
          id: string
          strategy_id: string
          user_id: string
          total_return: number
          sharpe_ratio: number | null
          max_drawdown: number
          win_rate: number
          total_trades: number
          profitable_trades: number
          losing_trades: number
          avg_win: number | null
          avg_loss: number | null
          market_condition: 'bull' | 'bear' | 'sideways' | null
          start_date: string
          end_date: string
          symbol: string
          is_public: boolean
          created_at: string
        }
        Insert: {
          id?: string
          strategy_id: string
          user_id: string
          total_return: number
          sharpe_ratio?: number | null
          max_drawdown: number
          win_rate: number
          total_trades: number
          profitable_trades: number
          losing_trades: number
          avg_win?: number | null
          avg_loss?: number | null
          market_condition?: 'bull' | 'bear' | 'sideways' | null
          start_date: string
          end_date: string
          symbol: string
          is_public?: boolean
          created_at?: string
        }
        Update: {
          total_return?: number
          sharpe_ratio?: number | null
          max_drawdown?: number
          win_rate?: number
          total_trades?: number
          profitable_trades?: number
          losing_trades?: number
          avg_win?: number | null
          avg_loss?: number | null
          market_condition?: 'bull' | 'bear' | 'sideways' | null
          is_public?: boolean
        }
      }

      // Portfolio Snapshots
      portfolio_snapshots: {
        Row: {
          id: string
          user_id: string
          broker: string
          snapshot_date: string
          snapshot_time: string
          total_assets: number
          total_deposit: number
          available_cash: number
          total_purchase: number
          total_evaluation: number
          profit_loss: number
          profit_loss_rate: number
          holdings: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          broker: string
          snapshot_date: string
          snapshot_time?: string
          total_assets: number
          total_deposit: number
          available_cash: number
          total_purchase: number
          total_evaluation: number
          profit_loss: number
          profit_loss_rate: number
          holdings?: Json
          created_at?: string
        }
        Update: {
          total_assets?: number
          total_deposit?: number
          available_cash?: number
          total_purchase?: number
          total_evaluation?: number
          profit_loss?: number
          profit_loss_rate?: number
          holdings?: Json
        }
      }

      // Order Logs
      order_logs: {
        Row: {
          id: string
          user_id: string
          broker: string
          symbol: string
          side: 'buy' | 'sell'
          quantity: number
          price: number | null
          order_type: 'limit' | 'market'
          order_id: string | null
          status: 'pending' | 'submitted' | 'filled' | 'partial' | 'cancelled' | 'rejected'
          filled_quantity: number
          filled_price: number | null
          message: string | null
          strategy_id: string | null
          execution_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          broker: string
          symbol: string
          side: 'buy' | 'sell'
          quantity: number
          price?: number | null
          order_type?: 'limit' | 'market'
          order_id?: string | null
          status?: 'pending' | 'submitted' | 'filled' | 'partial' | 'cancelled' | 'rejected'
          filled_quantity?: number
          filled_price?: number | null
          message?: string | null
          strategy_id?: string | null
          execution_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'pending' | 'submitted' | 'filled' | 'partial' | 'cancelled' | 'rejected'
          filled_quantity?: number
          filled_price?: number | null
          message?: string | null
          order_id?: string | null
          updated_at?: string
        }
      }

      // Automation Workflows
      automation_workflows: {
        Row: {
          id: string
          name: string
          description: string | null
          webhook_url: string | null
          n8n_workflow_id: string | null
          trigger_type: 'manual' | 'scheduled' | 'event'
          schedule: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          webhook_url?: string | null
          n8n_workflow_id?: string | null
          trigger_type?: 'manual' | 'scheduled' | 'event'
          schedule?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          webhook_url?: string | null
          n8n_workflow_id?: string | null
          trigger_type?: 'manual' | 'scheduled' | 'event'
          schedule?: string | null
          is_active?: boolean
          updated_at?: string
        }
      }

      // Workflow Executions
      workflow_executions: {
        Row: {
          id: string
          workflow_id: string
          status: 'pending' | 'running' | 'completed' | 'failed'
          started_at: string
          completed_at: string | null
          triggered_by: string
          result: Json | null
          error: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workflow_id: string
          status?: 'pending' | 'running' | 'completed' | 'failed'
          started_at?: string
          completed_at?: string | null
          triggered_by: string
          result?: Json | null
          error?: string | null
          created_at?: string
        }
        Update: {
          status?: 'pending' | 'running' | 'completed' | 'failed'
          completed_at?: string | null
          result?: Json | null
          error?: string | null
          updated_at?: string
        }
      }

      // Exchange Keys (simplified key storage)
      exchange_keys: {
        Row: {
          id: string
          user_id: string
          exchange: string
          api_key: string
          api_secret: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          exchange: string
          api_key: string
          api_secret: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          exchange?: string
          api_key?: string
          api_secret?: string
          updated_at?: string
        }
      }

      // Users table (extends auth.users)
      users: {
        Row: {
          id: string
          email: string
          role: 'user' | 'mentor' | 'admin' | 'super_admin'
          display_name: string | null
          username: string | null
          avatar_url: string | null
          full_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'user' | 'mentor' | 'admin' | 'super_admin'
          display_name?: string | null
          username?: string | null
          avatar_url?: string | null
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string
          role?: 'user' | 'mentor' | 'admin' | 'super_admin'
          display_name?: string | null
          username?: string | null
          avatar_url?: string | null
          full_name?: string | null
          updated_at?: string
        }
      }

      // Analytics Events
      analytics_events: {
        Row: {
          id: string
          user_id: string
          event_type: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_type: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          event_type?: string
          metadata?: Json | null
        }
      }

      // Payments (simple payment records)
      payments: {
        Row: {
          id: string
          user_id: string
          order_id: string
          amount: number
          credits: number
          payment_key: string | null
          status: 'pending' | 'completed' | 'failed' | 'refunded'
          provider: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          order_id: string
          amount: number
          credits: number
          payment_key?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          provider?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          payment_key?: string | null
          updated_at?: string
        }
      }

      // Notification Settings
      notification_settings: {
        Row: {
          id: string
          user_id: string
          email_enabled: boolean
          push_enabled: boolean
          in_app_enabled: boolean
          categories: Json
          quiet_hours_enabled: boolean
          quiet_hours_start: string | null
          quiet_hours_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email_enabled?: boolean
          push_enabled?: boolean
          in_app_enabled?: boolean
          categories?: Json
          quiet_hours_enabled?: boolean
          quiet_hours_start?: string | null
          quiet_hours_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          email_enabled?: boolean
          push_enabled?: boolean
          in_app_enabled?: boolean
          categories?: Json
          quiet_hours_enabled?: boolean
          quiet_hours_start?: string | null
          quiet_hours_end?: string | null
          updated_at?: string
        }
      }

      // Subscriptions
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan: 'free' | 'starter' | 'pro' | 'enterprise'
          status: 'active' | 'cancelled' | 'past_due' | 'trialing'
          current_period_start: string
          current_period_end: string
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan?: 'free' | 'starter' | 'pro' | 'enterprise'
          status?: 'active' | 'cancelled' | 'past_due' | 'trialing'
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          plan?: 'free' | 'starter' | 'pro' | 'enterprise'
          status?: 'active' | 'cancelled' | 'past_due' | 'trialing'
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
          updated_at?: string
        }
      }

      // ===========================================
      // Additional Tables (auto-generated stubs)
      // ===========================================

      // Workflows (alias for admin automation)
      workflows: {
        Row: {
          id: string
          name: string
          description: string | null
          webhook_url: string | null
          n8n_workflow_id: string | null
          trigger_type: string
          schedule: string | null
          status: 'active' | 'paused' | 'draft'
          category: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          webhook_url?: string | null
          n8n_workflow_id?: string | null
          trigger_type?: string
          schedule?: string | null
          status?: 'active' | 'paused' | 'draft'
          category?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          webhook_url?: string | null
          n8n_workflow_id?: string | null
          trigger_type?: string
          schedule?: string | null
          status?: 'active' | 'paused' | 'draft'
          category?: string | null
          is_active?: boolean
          updated_at?: string
        }
      }

      // Learning/Education Tables
      learning_progress: {
        Row: { id: string; user_id: string; topic: string; progress: number; completed: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; topic: string; progress?: number; completed?: boolean; created_at?: string }
        Update: { progress?: number; completed?: boolean; updated_at?: string }
      }

      tutor_history: {
        Row: { id: string; user_id: string; question: string; answer: string; topic: string | null; created_at: string }
        Insert: { id?: string; user_id: string; question: string; answer: string; topic?: string | null; created_at?: string }
        Update: {}
      }

      disclaimer_versions: {
        Row: { id: string; version: string; content: string; effective_date: string; created_at: string }
        Insert: { id?: string; version: string; content: string; effective_date: string; created_at?: string }
        Update: { version?: string; content?: string; effective_date?: string }
      }

      user_consents: {
        Row: { id: string; user_id: string; version_id: string; consented_at: string; ip_address: string | null }
        Insert: { id?: string; user_id: string; version_id: string; consented_at?: string; ip_address?: string | null }
        Update: {}
      }

      // Mirroring Tables
      mirror_subscriptions: {
        Row: { id: string; user_id: string; celebrity_id: string; status: string; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; celebrity_id: string; status?: string; created_at?: string; updated_at?: string }
        Update: { status?: string; updated_at?: string }
      }

      mirror_orders: {
        Row: { id: string; user_id: string; subscription_id: string; order_id: string; symbol: string; side: string; quantity: number; price: number; status: string; created_at: string }
        Insert: { id?: string; user_id: string; subscription_id: string; order_id?: string; symbol: string; side: string; quantity: number; price?: number; status?: string; created_at?: string }
        Update: { status?: string }
      }

      // Trading/Leverage Tables
      leverage_settings: {
        Row: { id: string; user_id: string; symbol: string; leverage: number; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; symbol: string; leverage: number; created_at?: string; updated_at?: string }
        Update: { leverage?: number; updated_at?: string }
      }

      margin_accounts: {
        Row: { id: string; user_id: string; balance: number; margin_used: number; created_at: string }
        Insert: { id?: string; user_id: string; balance?: number; margin_used?: number; created_at?: string }
        Update: { balance?: number; margin_used?: number }
      }

      margin_positions: {
        Row: { id: string; user_id: string; symbol: string; side: string; size: number; entry_price: number; liquidation_price: number | null; created_at: string }
        Insert: { id?: string; user_id: string; symbol: string; side: string; size: number; entry_price: number; liquidation_price?: number | null; created_at?: string }
        Update: { size?: number; liquidation_price?: number | null }
      }

      liquidation_events: {
        Row: { id: string; user_id: string; position_id: string; liquidation_price: number; amount: number; created_at: string }
        Insert: { id?: string; user_id: string; position_id: string; liquidation_price: number; amount: number; created_at?: string }
        Update: {}
      }

      // Mentor/Course Tables
      mentor_profiles: {
        Row: { id: string; user_id: string; display_name: string; bio: string | null; specialization: string[] | null; rating: number; review_count: number; is_verified: boolean; created_at: string }
        Insert: { id?: string; user_id: string; display_name: string; bio?: string | null; specialization?: string[] | null; rating?: number; review_count?: number; is_verified?: boolean; created_at?: string }
        Update: { display_name?: string; bio?: string | null; specialization?: string[] | null; rating?: number; review_count?: number; is_verified?: boolean }
      }

      enrollments: {
        Row: { id: string; user_id: string; course_id: string; status: string; enrolled_at: string; completed_at: string | null }
        Insert: { id?: string; user_id: string; course_id: string; status?: string; enrolled_at?: string; completed_at?: string | null }
        Update: { status?: string; completed_at?: string | null }
      }

      courses: {
        Row: { id: string; mentor_id: string; title: string; description: string | null; price: number; is_active: boolean; created_at: string }
        Insert: { id?: string; mentor_id: string; title: string; description?: string | null; price?: number; is_active?: boolean; created_at?: string }
        Update: { title?: string; description?: string | null; price?: number; is_active?: boolean }
      }

      transactions: {
        Row: { id: string; user_id: string; type: string; amount: number; description: string | null; created_at: string }
        Insert: { id?: string; user_id: string; type: string; amount: number; description?: string | null; created_at?: string }
        Update: {}
      }

      reviews: {
        Row: { id: string; user_id: string; target_id: string; target_type: string; rating: number; comment: string | null; created_at: string }
        Insert: { id?: string; user_id: string; target_id: string; target_type: string; rating: number; comment?: string | null; created_at?: string }
        Update: { rating?: number; comment?: string | null }
      }

      referral_commissions: {
        Row: { id: string; referrer_id: string; referee_id: string; amount: number; status: string; created_at: string }
        Insert: { id?: string; referrer_id: string; referee_id: string; amount: number; status?: string; created_at?: string }
        Update: { status?: string }
      }

      payouts: {
        Row: { id: string; user_id: string; amount: number; status: string; payout_method: string | null; created_at: string; processed_at: string | null }
        Insert: { id?: string; user_id: string; amount: number; status?: string; payout_method?: string | null; created_at?: string; processed_at?: string | null }
        Update: { status?: string; processed_at?: string | null }
      }

      // Portfolio/Position Tables
      portfolios: {
        Row: { id: string; user_id: string; name: string; total_value: number; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; name: string; total_value?: number; created_at?: string; updated_at?: string }
        Update: { name?: string; total_value?: number; updated_at?: string }
      }

      positions: {
        Row: { id: string; user_id: string; portfolio_id: string | null; symbol: string; quantity: number; avg_price: number; current_price: number | null; pnl: number | null; created_at: string }
        Insert: { id?: string; user_id: string; portfolio_id?: string | null; symbol: string; quantity: number; avg_price: number; current_price?: number | null; pnl?: number | null; created_at?: string }
        Update: { quantity?: number; avg_price?: number; current_price?: number | null; pnl?: number | null }
      }

      // User Profile Variants
      user_profiles: {
        Row: { id: string; user_id: string; display_name: string | null; bio: string | null; avatar_url: string | null; preferences: Json | null; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; display_name?: string | null; bio?: string | null; avatar_url?: string | null; preferences?: Json | null; created_at?: string; updated_at?: string }
        Update: { display_name?: string | null; bio?: string | null; avatar_url?: string | null; preferences?: Json | null; updated_at?: string }
      }

      // Promotion Tables
      coupons: {
        Row: { id: string; code: string; discount_type: string; discount_value: number; max_uses: number | null; uses: number; expires_at: string | null; is_active: boolean; created_at: string }
        Insert: { id?: string; code: string; discount_type: string; discount_value: number; max_uses?: number | null; uses?: number; expires_at?: string | null; is_active?: boolean; created_at?: string }
        Update: { code?: string; discount_type?: string; discount_value?: number; max_uses?: number | null; uses?: number; expires_at?: string | null; is_active?: boolean }
      }

      coupon_usages: {
        Row: { id: string; coupon_id: string; user_id: string; used_at: string }
        Insert: { id?: string; coupon_id: string; user_id: string; used_at?: string }
        Update: {}
      }

      referral_codes: {
        Row: { id: string; user_id: string; code: string; uses: number; created_at: string }
        Insert: { id?: string; user_id: string; code: string; uses?: number; created_at?: string }
        Update: { uses?: number }
      }

      onboarding_progress: {
        Row: { id: string; user_id: string; step: string; completed: boolean; completed_at: string | null; created_at: string }
        Insert: { id?: string; user_id: string; step: string; completed?: boolean; completed_at?: string | null; created_at?: string }
        Update: { completed?: boolean; completed_at?: string | null }
      }

      // Exchange/Broker Tables
      broker_credentials: {
        Row: { id: string; user_id: string; broker: string; api_key: string; api_secret: string; is_active: boolean; created_at: string }
        Insert: { id?: string; user_id: string; broker: string; api_key: string; api_secret: string; is_active?: boolean; created_at?: string }
        Update: { api_key?: string; api_secret?: string; is_active?: boolean }
      }

      exchange_credentials: {
        Row: { id: string; user_id: string; exchange: string; api_key: string; api_secret: string; is_active: boolean; created_at: string }
        Insert: { id?: string; user_id: string; exchange: string; api_key: string; api_secret: string; is_active?: boolean; created_at?: string }
        Update: { api_key?: string; api_secret?: string; is_active?: boolean }
      }

      exchange_api_keys: {
        Row: { id: string; user_id: string; exchange: string; api_key: string; api_secret: string; passphrase: string | null; is_active: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; exchange: string; api_key: string; api_secret: string; passphrase?: string | null; is_active?: boolean; created_at?: string; updated_at?: string }
        Update: { api_key?: string; api_secret?: string; passphrase?: string | null; is_active?: boolean; updated_at?: string }
      }

      simulation_accounts: {
        Row: { id: string; user_id: string; name: string; balance: number; initial_balance: number; created_at: string }
        Insert: { id?: string; user_id: string; name: string; balance?: number; initial_balance?: number; created_at?: string }
        Update: { name?: string; balance?: number }
      }

      // Coaching Tables
      mentor_availability: {
        Row: { id: string; mentor_id: string; day_of_week: number; start_time: string; end_time: string; is_available: boolean }
        Insert: { id?: string; mentor_id: string; day_of_week: number; start_time: string; end_time: string; is_available?: boolean }
        Update: { start_time?: string; end_time?: string; is_available?: boolean }
      }

      coaching_sessions: {
        Row: { id: string; mentor_id: string; student_id: string; scheduled_at: string; duration_minutes: number; status: string; notes: string | null; created_at: string }
        Insert: { id?: string; mentor_id: string; student_id: string; scheduled_at: string; duration_minutes?: number; status?: string; notes?: string | null; created_at?: string }
        Update: { scheduled_at?: string; duration_minutes?: number; status?: string; notes?: string | null }
      }

      mentor_dashboard_stats: {
        Row: { mentor_id: string; total_sessions: number; total_students: number; avg_rating: number; total_earnings: number }
        Insert: { mentor_id: string; total_sessions?: number; total_students?: number; avg_rating?: number; total_earnings?: number }
        Update: {}
      }

      coaching_platform_stats: {
        Row: { id: string; total_mentors: number; total_sessions: number; avg_session_rating: number }
        Insert: { id?: string; total_mentors?: number; total_sessions?: number; avg_session_rating?: number }
        Update: {}
      }

      coaching_reviews: {
        Row: { id: string; session_id: string; reviewer_id: string; rating: number; comment: string | null; created_at: string }
        Insert: { id?: string; session_id: string; reviewer_id: string; rating: number; comment?: string | null; created_at?: string }
        Update: { rating?: number; comment?: string | null }
      }

      session_notes: {
        Row: { id: string; session_id: string; author_id: string; content: string; created_at: string }
        Insert: { id?: string; session_id: string; author_id: string; content: string; created_at?: string }
        Update: { content?: string }
      }

      // Status/Monitoring Tables
      current_service_status: {
        Row: { id: string; service_name: string; status: string; last_checked: string }
        Insert: { id?: string; service_name: string; status: string; last_checked?: string }
        Update: { status?: string; last_checked?: string }
      }

      status_checks: {
        Row: { id: string; service_name: string; status: string; response_time_ms: number | null; checked_at: string }
        Insert: { id?: string; service_name: string; status: string; response_time_ms?: number | null; checked_at?: string }
        Update: { status?: string; response_time_ms?: number | null }
      }

      status_incidents: {
        Row: { id: string; title: string; description: string; severity: string; status: string; started_at: string; resolved_at: string | null; created_at: string }
        Insert: { id?: string; title: string; description: string; severity: string; status?: string; started_at?: string; resolved_at?: string | null; created_at?: string }
        Update: { title?: string; description?: string; severity?: string; status?: string; resolved_at?: string | null }
      }

      status_maintenance: {
        Row: { id: string; title: string; description: string; scheduled_start: string; scheduled_end: string; status: string; created_at: string }
        Insert: { id?: string; title: string; description: string; scheduled_start: string; scheduled_end: string; status?: string; created_at?: string }
        Update: { title?: string; description?: string; scheduled_start?: string; scheduled_end?: string; status?: string }
      }

      status_incident_updates: {
        Row: { id: string; incident_id: string; message: string; status: string; created_at: string }
        Insert: { id?: string; incident_id: string; message: string; status?: string; created_at?: string }
        Update: { message?: string; status?: string }
      }

      status_subscribers: {
        Row: { id: string; email: string; subscribed_at: string }
        Insert: { id?: string; email: string; subscribed_at?: string }
        Update: { email?: string }
      }

      beta_invite_codes: {
        Row: { id: string; code: string; uses: number; max_uses: number | null; expires_at: string | null; created_at: string }
        Insert: { id?: string; code: string; uses?: number; max_uses?: number | null; expires_at?: string | null; created_at?: string }
        Update: { uses?: number; max_uses?: number | null; expires_at?: string | null }
      }

      // Marketplace Tables
      strategy_listings: {
        Row: { id: string; strategy_id: string; creator_id: string; title: string; description: string | null; price: number; is_active: boolean; downloads: number; rating: number; created_at: string }
        Insert: { id?: string; strategy_id: string; creator_id: string; title: string; description?: string | null; price?: number; is_active?: boolean; downloads?: number; rating?: number; created_at?: string }
        Update: { title?: string; description?: string | null; price?: number; is_active?: boolean; downloads?: number; rating?: number }
      }

      strategy_reviews: {
        Row: { id: string; listing_id: string; reviewer_id: string; rating: number; comment: string | null; created_at: string }
        Insert: { id?: string; listing_id: string; reviewer_id: string; rating: number; comment?: string | null; created_at?: string }
        Update: { rating?: number; comment?: string | null }
      }

      category_stats: {
        Row: { id: string; category: string; count: number; avg_rating: number }
        Insert: { id?: string; category: string; count?: number; avg_rating?: number }
        Update: { count?: number; avg_rating?: number }
      }

      marketplace_stats: {
        Row: { id: string; total_listings: number; total_downloads: number; total_revenue: number }
        Insert: { id?: string; total_listings?: number; total_downloads?: number; total_revenue?: number }
        Update: {}
      }

      creator_leaderboard: {
        Row: { creator_id: string; total_sales: number; total_revenue: number; avg_rating: number; rank: number }
        Insert: { creator_id: string; total_sales?: number; total_revenue?: number; avg_rating?: number; rank?: number }
        Update: {}
      }

      creator_profiles: {
        Row: { id: string; user_id: string; display_name: string; bio: string | null; avatar_url: string | null; follower_count: number; created_at: string }
        Insert: { id?: string; user_id: string; display_name: string; bio?: string | null; avatar_url?: string | null; follower_count?: number; created_at?: string }
        Update: { display_name?: string; bio?: string | null; avatar_url?: string | null; follower_count?: number }
      }

      strategy_bookmarks: {
        Row: { id: string; user_id: string; listing_id: string; created_at: string }
        Insert: { id?: string; user_id: string; listing_id: string; created_at?: string }
        Update: {}
      }

      creator_followers: {
        Row: { id: string; follower_id: string; creator_id: string; created_at: string }
        Insert: { id?: string; follower_id: string; creator_id: string; created_at?: string }
        Update: {}
      }

      // Experiment/Pricing Tables
      pricing_experiments: {
        Row: { id: string; name: string; description: string | null; status: string; start_date: string | null; end_date: string | null; created_at: string }
        Insert: { id?: string; name: string; description?: string | null; status?: string; start_date?: string | null; end_date?: string | null; created_at?: string }
        Update: { name?: string; description?: string | null; status?: string; start_date?: string | null; end_date?: string | null }
      }

      experiment_results: {
        Row: { id: string; experiment_id: string; variant_id: string; metric: string; value: number; recorded_at: string }
        Insert: { id?: string; experiment_id: string; variant_id: string; metric: string; value: number; recorded_at?: string }
        Update: { metric?: string; value?: number }
      }

      experiment_assignments: {
        Row: { id: string; experiment_id: string; user_id: string; variant_id: string; assigned_at: string }
        Insert: { id?: string; experiment_id: string; user_id: string; variant_id: string; assigned_at?: string }
        Update: {}
      }

      performance_pricing_accounts: {
        Row: { id: string; user_id: string; balance: number; profit_share_rate: number; created_at: string }
        Insert: { id?: string; user_id: string; balance?: number; profit_share_rate?: number; created_at?: string }
        Update: { balance?: number; profit_share_rate?: number }
      }

      performance_settlements: {
        Row: { id: string; account_id: string; period_start: string; period_end: string; profit: number; fee: number; status: string; created_at: string }
        Insert: { id?: string; account_id: string; period_start: string; period_end: string; profit: number; fee: number; status?: string; created_at?: string }
        Update: { status?: string }
      }

      experiment_variants: {
        Row: { id: string; experiment_id: string; name: string; weight: number; config: Json | null }
        Insert: { id?: string; experiment_id: string; name: string; weight?: number; config?: Json | null }
        Update: { name?: string; weight?: number; config?: Json | null }
      }

      experiment_conversions: {
        Row: { id: string; assignment_id: string; event_type: string; value: number | null; converted_at: string }
        Insert: { id?: string; assignment_id: string; event_type: string; value?: number | null; converted_at?: string }
        Update: {}
      }

      // Webhook Tables
      webhook_events: {
        Row: { id: string; event_type: string; payload: Json; status: string; attempts: number; created_at: string; processed_at: string | null }
        Insert: { id?: string; event_type: string; payload: Json; status?: string; attempts?: number; created_at?: string; processed_at?: string | null }
        Update: { status?: string; attempts?: number; processed_at?: string | null }
      }

      webhook_retries: {
        Row: { id: string; event_id: string; attempt: number; error: string | null; attempted_at: string }
        Insert: { id?: string; event_id: string; attempt: number; error?: string | null; attempted_at?: string }
        Update: {}
      }

      payment_webhook_events: {
        Row: { id: string; event_id: string; event_type: string; payload: Json; status: string; attempts: number; created_at: string; processed_at: string | null }
        Insert: { id?: string; event_id: string; event_type: string; payload: Json; status?: string; attempts?: number; created_at?: string; processed_at?: string | null }
        Update: { status?: string; attempts?: number; processed_at?: string | null }
      }

      // Investor Relations Tables
      investor_metrics_snapshots: {
        Row: { id: string; date: string; mrr: number; arr: number; users: number; churn_rate: number; ltv: number; cac: number; created_at: string }
        Insert: { id?: string; date: string; mrr?: number; arr?: number; users?: number; churn_rate?: number; ltv?: number; cac?: number; created_at?: string }
        Update: { mrr?: number; arr?: number; users?: number; churn_rate?: number; ltv?: number; cac?: number }
      }

      funding_rounds: {
        Row: { id: string; name: string; target_amount: number; raised_amount: number; status: string; close_date: string | null; created_at: string }
        Insert: { id?: string; name: string; target_amount: number; raised_amount?: number; status?: string; close_date?: string | null; created_at?: string }
        Update: { name?: string; target_amount?: number; raised_amount?: number; status?: string; close_date?: string | null }
      }

      investors: {
        Row: { id: string; name: string; type: string; contact_email: string | null; status: string; invested_amount: number; created_at: string }
        Insert: { id?: string; name: string; type: string; contact_email?: string | null; status?: string; invested_amount?: number; created_at?: string }
        Update: { name?: string; type?: string; contact_email?: string | null; status?: string; invested_amount?: number }
      }

      fundraising_pipeline: {
        Row: { id: string; investor_id: string; round_id: string; stage: string; probability: number; expected_amount: number; created_at: string }
        Insert: { id?: string; investor_id: string; round_id: string; stage: string; probability?: number; expected_amount?: number; created_at?: string }
        Update: { stage?: string; probability?: number; expected_amount?: number }
      }

      investor_meetings: {
        Row: { id: string; investor_id: string; scheduled_at: string; duration_minutes: number; status: string; notes: string | null; created_at: string }
        Insert: { id?: string; investor_id: string; scheduled_at: string; duration_minutes?: number; status?: string; notes?: string | null; created_at?: string }
        Update: { scheduled_at?: string; duration_minutes?: number; status?: string; notes?: string | null }
      }

      kpi_targets: {
        Row: { id: string; metric: string; target_value: number; current_value: number; period: string; created_at: string }
        Insert: { id?: string; metric: string; target_value: number; current_value?: number; period: string; created_at?: string }
        Update: { target_value?: number; current_value?: number }
      }

      competitor_analysis: {
        Row: { id: string; competitor_name: string; category: string; data: Json; updated_at: string }
        Insert: { id?: string; competitor_name: string; category: string; data: Json; updated_at?: string }
        Update: { competitor_name?: string; category?: string; data?: Json; updated_at?: string }
      }

      // Strategy Insights Tables
      strategy_insights: {
        Row: { id: string; strategy_id: string; insight_type: string; data: Json; created_at: string }
        Insert: { id?: string; strategy_id: string; insight_type: string; data: Json; created_at?: string }
        Update: { insight_type?: string; data?: Json }
      }

      strategy_type_performance: {
        Row: { id: string; strategy_type: string; avg_return: number; win_rate: number; sample_size: number; updated_at: string }
        Insert: { id?: string; strategy_type: string; avg_return?: number; win_rate?: number; sample_size?: number; updated_at?: string }
        Update: { avg_return?: number; win_rate?: number; sample_size?: number; updated_at?: string }
      }

      strategy_tags: {
        Row: { id: string; strategy_id: string; tag: string; created_at: string }
        Insert: { id?: string; strategy_id: string; tag: string; created_at?: string }
        Update: { tag?: string }
      }

      market_conditions: {
        Row: { id: string; date: string; condition: string; volatility: number; trend: string; data: Json | null }
        Insert: { id?: string; date: string; condition: string; volatility?: number; trend: string; data?: Json | null }
        Update: { condition?: string; volatility?: number; trend?: string; data?: Json | null }
      }

      strategy_executions: {
        Row: { id: string; strategy_id: string; user_id: string; started_at: string; ended_at: string | null; status: string; pnl: number | null }
        Insert: { id?: string; strategy_id: string; user_id: string; started_at?: string; ended_at?: string | null; status?: string; pnl?: number | null }
        Update: { ended_at?: string | null; status?: string; pnl?: number | null }
      }

      // Feature/Pricing Tables
      feature_flags: {
        Row: { id: string; name: string; enabled: boolean; rollout_percentage: number; created_at: string }
        Insert: { id?: string; name: string; enabled?: boolean; rollout_percentage?: number; created_at?: string }
        Update: { enabled?: boolean; rollout_percentage?: number }
      }

      pricing_display: {
        Row: { id: string; plan: string; price: number; features: Json; is_active: boolean }
        Insert: { id?: string; plan: string; price: number; features: Json; is_active?: boolean }
        Update: { plan?: string; price?: number; features?: Json; is_active?: boolean }
      }

      feature_pricing: {
        Row: { id: string; feature: string; price: number; unit: string; is_active: boolean }
        Insert: { id?: string; feature: string; price: number; unit: string; is_active?: boolean }
        Update: { feature?: string; price?: number; unit?: string; is_active?: boolean }
      }

      // Feedback Table
      feedback: {
        Row: { id: string; user_id: string; type: string; message: string; rating: number | null; created_at: string }
        Insert: { id?: string; user_id: string; type: string; message: string; rating?: number | null; created_at?: string }
        Update: { message?: string; rating?: number | null }
      }

      // Views (as tables for compatibility)
      public_strategy_ranking: {
        Row: { strategy_id: string; user_id: string; name: string; total_return: number; sharpe_ratio: number | null; rank: number }
        Insert: { strategy_id: string; user_id: string; name: string; total_return?: number; sharpe_ratio?: number | null; rank?: number }
        Update: {}
      }

      strategy_performance_agg: {
        Row: { strategy_id: string; avg_return: number; total_trades: number; win_rate: number; sharpe_ratio: number | null }
        Insert: { strategy_id: string; avg_return?: number; total_trades?: number; win_rate?: number; sharpe_ratio?: number | null }
        Update: {}
      }

    }

    Views: {
      // Portfolio view aggregating trades and positions
      portfolio_summary: {
        Row: {
          user_id: string
          total_value: number
          total_pnl: number
          total_pnl_percent: number
          total_trades: number
          winning_trades: number
          losing_trades: number
        }
      }
    }

    Functions: {
      // Calculate portfolio metrics
      get_portfolio_metrics: {
        Args: { p_user_id: string }
        Returns: Json
      }
      // Get strategy performance
      get_strategy_performance: {
        Args: { p_strategy_id: string }
        Returns: Json
      }
      // Credit system functions
      get_credit_balance: {
        Args: { p_user_id: string }
        Returns: number
      }
      spend_credits: {
        Args: {
          p_user_id: string
          p_amount: number
          p_feature: string
          p_description?: string
          p_metadata?: Json
        }
        Returns: Json
      }
      add_credits: {
        Args: {
          p_user_id: string
          p_amount: number
          p_type?: string
          p_description?: string
          p_metadata?: Json
        }
        Returns: Json
      }
      // Refund functions
      calculate_refund: {
        Args: {
          p_order_id: string
          p_user_id: string
        }
        Returns: Json
      }
      process_refund: {
        Args: {
          p_order_id: string
          p_user_id: string
          p_unused_credits: number
          p_refund_amount: number
          p_reason: string
          p_toss_response: Json
        }
        Returns: void
      }
      // Backtest functions
      create_backtest_job: {
        Args: {
          p_user_id: string
          p_strategy_id: string
          p_job_id: string
          p_timeframe: string
          p_start_date: string
          p_end_date: string
          p_symbol: string
        }
        Returns: string
      }
      deduct_backtest_credits: {
        Args: {
          p_user_id: string
          p_credits: number
          p_job_id: string
        }
        Returns: void
      }
      retry_failed_backtest: {
        Args: { p_job_id: string }
        Returns: boolean
      }
      // Strategy functions
      copy_strategy: {
        Args: {
          p_source_strategy_id: string
          p_user_id: string
        }
        Returns: string
      }
      set_strategy_performance_public: {
        Args: {
          p_performance_id: string
          p_user_id: string
          p_is_public: boolean
        }
        Returns: boolean
      }
      // Cost monitoring
      check_cost_threshold: {
        Args: { p_threshold_krw?: number }
        Returns: Json[]
      }
    }

    Enums: {
      strategy_status: 'draft' | 'backtesting' | 'ready' | 'running' | 'paused' | 'stopped'
      trade_type: 'buy' | 'sell'
      trade_status: 'pending' | 'filled' | 'partial' | 'cancelled' | 'rejected'
      notification_type: 'signal' | 'trade' | 'alert' | 'system'
      user_plan: 'free' | 'pro' | 'enterprise'
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Typed table row shortcuts
export type Profile = Tables<'profiles'>
export type ExchangeConnection = Tables<'exchange_connections'>
export type Strategy = Tables<'strategies'>
export type Trade = Tables<'trades'>
export type BacktestResult = Tables<'backtest_results'>
export type Notification = Tables<'notifications'>
export type UserSettings = Tables<'user_settings'>

// Credit system types
export type CreditWallet = Tables<'credit_wallets'>
export type CreditTransaction = Tables<'credit_transactions'>
export type CreditPackage = Tables<'credit_packages'>
export type CreditCost = Tables<'credit_costs'>
export type Referral = Tables<'referrals'>

// Payment system types
export type PaymentOrder = Tables<'payment_orders'>
export type RefundRequest = Tables<'refund_requests'>
export type RefundEvent = Tables<'refund_events'>

// AI system types
export type AIUsageEvent = Tables<'ai_usage_events'>
export type SafetyEvent = Tables<'safety_events'>

// Backtest system types
export type BacktestJob = Tables<'backtest_jobs'>
export type StrategyPerformance = Tables<'strategy_performance'>
