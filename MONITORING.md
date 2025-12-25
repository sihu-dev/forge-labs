# 📊 FORGE LABS Monitoring & Health Checks

> **Complete monitoring setup for production**

---

## 🎯 Monitoring Goals

- **Uptime**: 99.9%+ availability
- **Performance**: <2s page load, <500ms API response
- **Errors**: <0.1% error rate
- **User Experience**: Real user monitoring (RUM)

---

## 📈 Built-in Monitoring (Free)

### Vercel Analytics

**Automatically enabled on deployment**

**What it tracks**:
- Page views
- Unique visitors
- Top pages
- Geographic distribution
- Device types
- Referrers

**Access**: https://vercel.com/dashboard/analytics

**Setup**: None required! ✅

---

### Supabase Dashboard

**Database & Auth monitoring**

**What it tracks**:
- Query performance
- Database size & growth
- Active connections
- Slow queries
- Authentication events
- Storage usage

**Access**: https://app.supabase.com > [Project] > Reports

**Key Metrics to Watch**:
```bash
# Daily checks:
- Database size: < 500MB (free tier limit: 500MB)
- Active connections: < 50 (limit: 60)
- Query time (p95): < 100ms

# Weekly checks:
- Storage size: < 1GB (free tier)
- Auth success rate: > 99%
- Slow queries: identify and optimize
```

---

### Upstash Redis Dashboard

**Cache & Queue monitoring**

**What it tracks**:
- Memory usage
- Commands per second
- Hit rate
- Latency
- Key count

**Access**: https://console.upstash.com > [Database]

**Key Metrics**:
```bash
# Daily checks:
- Memory usage: < 256MB (free tier limit)
- Hit rate: > 80%
- Latency (p99): < 50ms

# Backtest queue (HEPHAITOS):
- Queue length: < 100
- Processing time: < 10 min per job
```

---

## 🚨 Error Tracking (Recommended)

### Option 1: Sentry (Free Tier: 5,000 errors/month)

**Setup (5 minutes)**:

```bash
# 1. Create account: https://sentry.io/signup
# 2. Create project: Next.js
# 3. Get DSN from: Settings > Projects > [Project] > Client Keys

# 4. Install Sentry
cd apps/hephaitos
npm install @sentry/nextjs

# 5. Initialize
npx @sentry/wizard -i nextjs

# 6. Add to .env
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# 7. Deploy
vercel env add SENTRY_DSN
vercel --prod

# Repeat for BIDFLOW
cd ../bidflow
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
vercel env add SENTRY_DSN
vercel --prod
```

**What it tracks**:
- JavaScript errors
- API errors
- Performance issues
- User sessions
- Release tracking

**Key Features**:
- Error grouping
- Source maps
- User context
- Breadcrumbs
- Alerts

---

### Option 2: LogRocket (Free Tier: 1,000 sessions/month)

**For session replay & debugging**

```bash
# 1. Create account: https://logrocket.com
# 2. Create app
# 3. Get App ID

# 4. Install
npm install logrocket

# 5. Add to _app.tsx
import LogRocket from 'logrocket';

if (process.env.NODE_ENV === 'production') {
  LogRocket.init('your-app-id');
}

# 6. Deploy
vercel --prod
```

**What it tracks**:
- Session replays
- Console logs
- Network requests
- DOM changes
- User interactions

---

## 🏥 Health Checks

### Create Health Check Endpoints

**HEPHAITOS** - Create `apps/hephaitos/src/app/api/health/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Redis } from '@upstash/redis';

export async function GET() {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: 'unknown',
      redis: 'unknown',
    },
  };

  try {
    // Check Supabase
    const supabase = await createClient();
    const { error } = await supabase.from('strategies').select('id').limit(1);
    checks.checks.database = error ? 'unhealthy' : 'healthy';
  } catch {
    checks.checks.database = 'unhealthy';
  }

  try {
    // Check Redis
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    await redis.ping();
    checks.checks.redis = 'healthy';
  } catch {
    checks.checks.redis = 'unhealthy';
  }

  const isHealthy = Object.values(checks.checks).every((c) => c === 'healthy');
  checks.status = isHealthy ? 'healthy' : 'degraded';

  return NextResponse.json(checks, {
    status: isHealthy ? 200 : 503,
  });
}
```

**BIDFLOW** - Create `apps/bidflow/src/app/api/health/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: 'unknown',
    },
  };

  try {
    const supabase = await createClient();
    const { error } = await supabase.from('bids').select('id').limit(1);
    checks.checks.database = error ? 'unhealthy' : 'healthy';
  } catch {
    checks.checks.database = 'unhealthy';
  }

  const isHealthy = checks.checks.database === 'healthy';
  checks.status = isHealthy ? 'healthy' : 'degraded';

  return NextResponse.json(checks, {
    status: isHealthy ? 200 : 503,
  });
}
```

### Test Health Checks

```bash
# HEPHAITOS
curl https://hephaitos.vercel.app/api/health

# BIDFLOW
curl https://bidflow.vercel.app/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-12-25T10:30:00.000Z",
  "checks": {
    "database": "healthy",
    "redis": "healthy"
  }
}
```

---

## 🔔 Uptime Monitoring

### Option 1: UptimeRobot (Free: 50 monitors)

```bash
# 1. Create account: https://uptimerobot.com/signUp
# 2. Add monitors:
#    - HEPHAITOS: https://hephaitos.vercel.app/api/health
#    - BIDFLOW: https://bidflow.vercel.app/api/health
# 3. Set check interval: 5 minutes
# 4. Add alert contacts: email, Slack, etc.
```

**Alerts**:
- Email when down
- Slack notification
- SMS (paid tier)

---

### Option 2: Better Uptime (Free: 10 monitors)

```bash
# 1. Create account: https://betteruptime.com
# 2. Add monitors with health checks
# 3. Create incidents automatically
# 4. Status page (optional)
```

---

## 📉 Performance Monitoring

### Vercel Speed Insights

```bash
# 1. Install in both apps
cd apps/hephaitos
npm install @vercel/speed-insights

cd ../bidflow
npm install @vercel/speed-insights

# 2. Add to _app.tsx
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <SpeedInsights />
    </>
  );
}

# 3. Deploy
vercel --prod
```

**What it tracks**:
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
- First Input Delay (FID)
- Time to First Byte (TTFB)

**Access**: Vercel Dashboard > Project > Speed Insights

---

## 📊 Custom Metrics

### Key Business Metrics

**HEPHAITOS**:
```sql
-- Daily Active Users
SELECT COUNT(DISTINCT user_id) as dau
FROM user_sessions
WHERE DATE(created_at) = CURRENT_DATE;

-- Backtest Success Rate
SELECT
  COUNT(CASE WHEN status = 'completed' THEN 1 END)::float /
  COUNT(*)::float * 100 as success_rate
FROM backtest_jobs
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- Average Backtest Time
SELECT AVG(duration_seconds) as avg_duration
FROM backtest_jobs
WHERE status = 'completed'
AND created_at >= NOW() - INTERVAL '24 hours';
```

**BIDFLOW**:
```sql
-- Daily Lead Generation
SELECT COUNT(*) as leads_generated
FROM leads
WHERE DATE(created_at) = CURRENT_DATE;

-- CRM Sync Success Rate
SELECT
  COUNT(CASE WHEN crm_synced_at IS NOT NULL THEN 1 END)::float /
  COUNT(*)::float * 100 as sync_rate
FROM leads
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- Keyword Match Rate
SELECT
  COUNT(CASE WHEN matched = true THEN 1 END)::float /
  COUNT(*)::float * 100 as match_rate
FROM bids
WHERE created_at >= NOW() - INTERVAL '24 hours';
```

---

## 🚨 Alerting Rules

### Critical Alerts (Immediate Action)

```bash
# 1. Service Down
   Trigger: Health check fails for 5 minutes
   Action: Page on-call engineer

# 2. Error Rate Spike
   Trigger: Error rate > 5% for 10 minutes
   Action: Email + Slack notification

# 3. Database Connection Pool Exhausted
   Trigger: Active connections > 55 (limit: 60)
   Action: Email + Auto-scale (if possible)

# 4. Redis Memory > 90%
   Trigger: Memory usage > 230MB (limit: 256MB)
   Action: Email + Clear cache
```

### Warning Alerts (Next Business Day)

```bash
# 1. Slow API Responses
   Trigger: p95 latency > 2s for 1 hour
   Action: Email

# 2. Database Size Growing Fast
   Trigger: 10% growth in 24 hours
   Action: Email

# 3. Queue Backing Up
   Trigger: Backtest queue length > 50
   Action: Email
```

---

## 📅 Monitoring Schedule

### Daily (Automated)

- [ ] Uptime checks (UptimeRobot)
- [ ] Error tracking (Sentry)
- [ ] Performance metrics (Vercel)

### Daily (Manual - 5 minutes)

- [ ] Review Sentry errors
- [ ] Check Supabase database size
- [ ] Verify backtest queue length
- [ ] Review top slow queries

### Weekly (15 minutes)

- [ ] Performance trends
- [ ] User growth metrics
- [ ] Feature usage analytics
- [ ] Cost review (Vercel/Supabase usage)

### Monthly (30 minutes)

- [ ] Security audit
- [ ] Dependency updates
- [ ] Database optimization
- [ ] Cost optimization

---

## 🎯 SLA Targets

### Availability

- **Uptime**: 99.9% (8.76 hours downtime/year)
- **API Success**: 99.5%
- **Database**: 99.95% (Supabase SLA)

### Performance

- **Page Load**: < 2s (p95)
- **API Response**: < 500ms (p95)
- **Backtest**: < 10 minutes (average)
- **Lead Enrichment**: < 30s (average)

### Reliability

- **Data Loss**: 0% (daily backups)
- **Error Rate**: < 0.1%
- **Queue Success**: > 99%

---

## 🔧 Monitoring Tools Summary

| Tool | Cost | Purpose | Setup Time |
|------|------|---------|------------|
| Vercel Analytics | Free | Traffic & performance | 0 min (automatic) |
| Supabase Dashboard | Free | Database health | 0 min (automatic) |
| Upstash Dashboard | Free | Redis monitoring | 0 min (automatic) |
| Sentry | Free (5k errors) | Error tracking | 5 min |
| UptimeRobot | Free (50 monitors) | Uptime monitoring | 5 min |
| Vercel Speed Insights | Free | Core Web Vitals | 5 min |
| LogRocket | Free (1k sessions) | Session replay | 10 min (optional) |

**Total Setup Time**: ~30 minutes for complete monitoring

---

## 📖 Resources

- **Vercel Docs**: https://vercel.com/docs/analytics
- **Sentry Docs**: https://docs.sentry.io
- **Supabase Monitoring**: https://supabase.com/docs/guides/platform/metrics
- **Upstash Docs**: https://docs.upstash.com

---

**Last Updated**: 2024-12-25
**Monitoring Coverage**: 100%
