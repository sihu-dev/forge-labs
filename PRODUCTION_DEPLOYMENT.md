# 🚀 FORGE LABS Production Deployment Guide

> **Complete deployment automation for HEPHAITOS & BIDFLOW**
> **Target**: Beta launch in < 1 hour

---

## 📋 Overview

This guide covers complete production deployment for both platforms:
- **HEPHAITOS**: Trading education platform (Next.js 14, Supabase, Redis)
- **BIDFLOW**: Bid automation system (Next.js 14, Supabase, n8n)

**Deployment Stack**:
- **Hosting**: Vercel (Frontend + API)
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **Cache/Queue**: Upstash Redis
- **Automation**: n8n (self-hosted or cloud)
- **Monitoring**: Vercel Analytics + Sentry (optional)

---

## 🎯 Prerequisites

### Required Accounts
- [ ] Vercel account (free tier OK for beta)
- [ ] Supabase account (free tier OK for beta)
- [ ] Upstash account (free tier OK for beta)
- [ ] n8n Cloud account (for BIDFLOW) or self-hosted setup
- [ ] Domain name (optional, Vercel provides .vercel.app)

### Required API Keys
- [ ] Supabase API keys (auto-generated)
- [ ] Upstash Redis URL (auto-generated)
- [ ] Binance API key (HEPHAITOS - optional for beta)
- [ ] Upbit API key (HEPHAITOS - optional for beta)
- [ ] Apollo.io API key (BIDFLOW)
- [ ] Persana AI API key (BIDFLOW)
- [ ] Attio/HubSpot CRM API key (BIDFLOW)
- [ ] Toss Payments keys (HEPHAITOS - optional for beta)

---

## 📦 Part 1: Database Setup (Supabase)

### Step 1: Create Supabase Project

```bash
# 1. Go to https://supabase.com
# 2. Click "New Project"
# 3. Name: forge-labs-production
# 4. Database Password: [GENERATE STRONG PASSWORD]
# 5. Region: Singapore (ap-southeast-1) or nearest
# 6. Click "Create new project" (takes 2 minutes)
```

### Step 2: Run Database Migrations

```bash
# From repository root
cd apps/hephaitos

# Install Supabase CLI (if not installed)
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run HEPHAITOS migrations
supabase db push

# Verify migrations
supabase db diff

# Switch to BIDFLOW
cd ../bidflow

# Run BIDFLOW migrations
supabase db push
```

### Step 3: Configure Row Level Security (RLS)

```sql
-- Run in Supabase SQL Editor
-- This enables RLS for all tables (already in migrations)

-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- All tables should show rowsecurity = true
```

### Step 4: Create Admin User

```sql
-- Run in Supabase SQL Editor
-- Replace with your email
INSERT INTO auth.users (
  email,
  email_confirmed_at,
  raw_user_meta_data
) VALUES (
  'admin@yourcompany.com',
  NOW(),
  '{"role": "admin"}'::jsonb
);

-- Get the user ID for admin operations
SELECT id, email FROM auth.users WHERE email = 'admin@yourcompany.com';
```

### Step 5: Get Supabase Credentials

```bash
# From Supabase Dashboard > Settings > API

# Copy these values for .env:
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ⚡ Part 2: Redis Setup (Upstash)

### Step 1: Create Redis Database

```bash
# 1. Go to https://console.upstash.com
# 2. Click "Create Database"
# 3. Name: forge-labs-redis
# 4. Type: Regional
# 5. Region: ap-southeast-1 (Singapore) or nearest
# 6. Enable Eviction: Yes (allkeys-lru)
# 7. Click "Create"
```

### Step 2: Get Redis Credentials

```bash
# From Upstash Dashboard > Database > Details

# Copy for HEPHAITOS .env:
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXXxxxxxxxxxxxxx
```

### Step 3: Test Redis Connection

```bash
# From repository root
cd apps/hephaitos

# Create test script
cat > test-redis.js << 'EOF'
const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function test() {
  await redis.set('test', 'hello');
  const value = await redis.get('test');
  console.log('Redis test:', value); // Should print: hello
}

test();
EOF

# Run test
node test-redis.js

# Clean up
rm test-redis.js
```

---

## 🔐 Part 3: Environment Variables

### HEPHAITOS Environment Variables

Create `apps/hephaitos/.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXXxxxxxxxxxxxxx

# App Config
NEXT_PUBLIC_APP_URL=https://hephaitos.vercel.app
NODE_ENV=production

# Exchange APIs (Optional for beta)
BINANCE_API_KEY=your_binance_api_key
BINANCE_API_SECRET=your_binance_api_secret
UPBIT_ACCESS_KEY=your_upbit_access_key
UPBIT_SECRET_KEY=your_upbit_secret_key

# KIS (Korea Investment & Securities) - Optional
KIS_APP_KEY=your_kis_app_key
KIS_APP_SECRET=your_kis_app_secret
KIS_ACCOUNT_NUMBER=your_account_number

# Payments (Toss) - Optional for beta
TOSS_CLIENT_KEY=test_ck_xxxxx
TOSS_SECRET_KEY=test_sk_xxxxx

# Analytics (Optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

### BIDFLOW Environment Variables

Create `apps/bidflow/.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App Config
NEXT_PUBLIC_APP_URL=https://bidflow.vercel.app
NODE_ENV=production

# Lead Enrichment APIs
APOLLO_API_KEY=your_apollo_api_key
PERSANA_API_KEY=your_persana_api_key

# CRM Integration
ATTIO_API_KEY=your_attio_api_key
HUBSPOT_API_KEY=your_hubspot_api_key

# n8n Automation
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/xxxxx

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Analytics (Optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

## 🚢 Part 4: Deploy to Vercel

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
vercel login
```

### Step 2: Deploy HEPHAITOS

```bash
# From repository root
cd apps/hephaitos

# First deployment (will ask configuration questions)
vercel

# Questions and recommended answers:
# ? Set up and deploy? Yes
# ? Which scope? [Your account]
# ? Link to existing project? No
# ? What's your project's name? hephaitos
# ? In which directory is your code located? ./
# ? Want to override the settings? No

# Production deployment
vercel --prod

# Note the deployment URL: https://hephaitos.vercel.app
```

### Step 3: Deploy BIDFLOW

```bash
# From repository root
cd apps/bidflow

# First deployment
vercel

# Questions:
# ? Set up and deploy? Yes
# ? Which scope? [Your account]
# ? Link to existing project? No
# ? What's your project's name? bidflow
# ? In which directory is your code located? ./
# ? Want to override the settings? No

# Production deployment
vercel --prod

# Note the deployment URL: https://bidflow.vercel.app
```

### Step 4: Configure Environment Variables in Vercel

```bash
# For HEPHAITOS
cd apps/hephaitos

# Add all environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN
# ... add all other variables

# For BIDFLOW
cd apps/bidflow

# Add all environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add APOLLO_API_KEY
vercel env add PERSANA_API_KEY
# ... add all other variables

# Redeploy to apply environment variables
vercel --prod
```

---

## 🧪 Part 5: Post-Deployment Testing

### HEPHAITOS Test Checklist

```bash
# 1. Authentication Flow
- [ ] Visit https://hephaitos.vercel.app
- [ ] Click "Sign Up"
- [ ] Create test account with email
- [ ] Verify email confirmation works
- [ ] Login with new account

# 2. Strategy Builder
- [ ] Navigate to Strategy Builder
- [ ] Drag and drop nodes
- [ ] Connect nodes
- [ ] Save strategy
- [ ] Verify strategy appears in list

# 3. Backtest Engine
- [ ] Open saved strategy
- [ ] Click "Run Backtest"
- [ ] Verify backtest queues (check Redis)
- [ ] Wait for completion
- [ ] View results with metrics

# 4. Exchange Connection (if APIs configured)
- [ ] Navigate to Settings > Exchanges
- [ ] Add Binance API key
- [ ] Verify connection works
- [ ] Check balance display

# 5. Dashboard
- [ ] View portfolio
- [ ] Check performance charts
- [ ] Verify realtime updates
```

### BIDFLOW Test Checklist

```bash
# 1. Authentication Flow
- [ ] Visit https://bidflow.vercel.app
- [ ] Sign up / Login
- [ ] Verify dashboard loads

# 2. Bid Management
- [ ] Navigate to Bids
- [ ] Click "Manual Add"
- [ ] Fill in bid information
- [ ] Submit bid
- [ ] Verify keyword matching works
- [ ] Check bid appears in list

# 3. Lead Enrichment
- [ ] Create bid with organization name
- [ ] Click "Generate Leads"
- [ ] Wait for Apollo/Persana enrichment
- [ ] Verify leads created
- [ ] Check lead scores

# 4. Keyword Management
- [ ] Navigate to Keywords
- [ ] Add new keyword
- [ ] Set priority
- [ ] Verify matching on new bids

# 5. Analytics
- [ ] Navigate to Bids > Analytics
- [ ] Check charts load
- [ ] Verify statistics display
- [ ] Test period filters
```

---

## 📊 Part 6: Monitoring Setup

### Vercel Analytics (Built-in)

```bash
# Already enabled automatically
# View at: https://vercel.com/dashboard/analytics
```

### Error Tracking (Sentry - Optional)

```bash
# 1. Create Sentry account: https://sentry.io
# 2. Create new project: Next.js
# 3. Get DSN: Settings > Projects > [Your Project] > Client Keys

# Add to .env:
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# Install Sentry
npm install @sentry/nextjs

# Initialize (run in each app directory)
npx @sentry/wizard -i nextjs

# Redeploy
vercel --prod
```

### Database Monitoring

```bash
# Supabase Dashboard provides:
- Query performance
- Database size
- Connection pool
- Slow queries

# Access at: https://app.supabase.com > [Your Project] > Database
```

### Redis Monitoring

```bash
# Upstash Dashboard provides:
- Memory usage
- Request count
- Latency
- Key count

# Access at: https://console.upstash.com > [Your Database]
```

---

## 🔒 Part 7: Security Checklist

### Pre-Launch Security

```bash
# 1. Environment Variables
- [ ] All secrets in Vercel env vars (not in code)
- [ ] No API keys in git history
- [ ] .env files in .gitignore

# 2. Supabase RLS
- [ ] RLS enabled on all tables
- [ ] Policies tested for all user roles
- [ ] Admin-only tables properly restricted

# 3. API Routes
- [ ] Authentication required on protected routes
- [ ] Input validation with Zod
- [ ] Rate limiting configured (if needed)

# 4. CORS
- [ ] API routes restrict origins
- [ ] Only allow production domains

# 5. HTTPS
- [ ] Force HTTPS (Vercel automatic)
- [ ] Secure cookies (httpOnly, secure)

# 6. Dependencies
# Check for vulnerabilities
npm audit
npm audit fix
```

---

## 🎉 Part 8: Beta Launch

### Generate Beta Invite Codes

```sql
-- Run in Supabase SQL Editor
-- Create invite_codes table (if not exists)
CREATE TABLE IF NOT EXISTS invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  max_uses INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generate 100 beta codes
INSERT INTO invite_codes (code, max_uses, expires_at)
SELECT
  'BETA-' || substr(md5(random()::text), 1, 8),
  1,
  NOW() + INTERVAL '30 days'
FROM generate_series(1, 100);

-- Export codes
SELECT code FROM invite_codes WHERE used_count < max_uses;
```

### Launch Announcement Template

```markdown
🚀 FORGE LABS Beta Launch!

We're excited to announce the beta launch of:

**HEPHAITOS** - No-Code Trading Education Platform
https://hephaitos.vercel.app

**BIDFLOW** - AI-Powered Bid Automation
https://bidflow.vercel.app

**Limited Beta Access**: First 100 users
**What's Included**:
- ✅ Full platform access
- ✅ Free during beta
- ✅ Direct founder support
- ✅ Shape the product roadmap

**How to Join**:
1. Use invite code: BETA-XXXXX
2. Sign up and verify email
3. Start exploring!

**Feedback**: feedback@yourcompany.com
**Support**: support@yourcompany.com

Let's build the future together! 🚀
```

### Beta Monitoring Plan

```bash
# Week 1: Monitor Daily
- User signups
- Active users
- Error rates (Sentry)
- Database performance
- API response times

# Week 2-4: Monitor Weekly
- User retention
- Feature usage
- Backtest queue performance
- Lead generation success rate
- CRM sync success rate

# Collect Feedback
- In-app feedback form
- Weekly user interviews
- Discord/Slack community
```

---

## 🐛 Part 9: Troubleshooting

### Common Issues

#### "Supabase connection failed"
```bash
# Check:
1. NEXT_PUBLIC_SUPABASE_URL is correct
2. NEXT_PUBLIC_SUPABASE_ANON_KEY is correct
3. Database is not paused (free tier auto-pauses after 7 days)
4. RLS policies allow access

# Verify in Supabase Dashboard:
Settings > API > URL and Keys
```

#### "Redis connection timeout"
```bash
# Check:
1. UPSTASH_REDIS_REST_URL is correct
2. UPSTASH_REDIS_REST_TOKEN is correct
3. Redis database is active
4. Network not blocking Upstash IP

# Test with:
curl -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN" \
  $UPSTASH_REDIS_REST_URL/ping
```

#### "Backtest not starting"
```bash
# Check:
1. Redis queue is connected
2. BullMQ worker is running
3. OHLCV data exists for symbol
4. Strategy is valid (no parsing errors)

# Debug:
- Check Vercel function logs
- Verify queue in Redis: GET bull:backtest:*
```

#### "Exchange API connection failed"
```bash
# Check:
1. API keys are correct
2. API keys have required permissions
3. Exchange API status (not under maintenance)
4. IP whitelist (if required)

# Test with:
curl -X GET "https://api.binance.com/api/v3/time"
```

---

## 📝 Part 10: Deployment Automation Script

Save as `deploy.sh` in repository root:

```bash
#!/bin/bash

# FORGE LABS Deployment Script
# Usage: ./deploy.sh [hephaitos|bidflow|both]

set -e

PROJECT=$1

if [ -z "$PROJECT" ]; then
  echo "Usage: ./deploy.sh [hephaitos|bidflow|both]"
  exit 1
fi

echo "🚀 Starting deployment for: $PROJECT"

deploy_app() {
  local app=$1
  echo "📦 Deploying $app..."

  cd apps/$app

  # Build check
  echo "🔍 Running build check..."
  npm run build

  # Deploy to production
  echo "🚢 Deploying to Vercel..."
  vercel --prod --yes

  cd ../..

  echo "✅ $app deployed successfully!"
}

if [ "$PROJECT" = "both" ]; then
  deploy_app "hephaitos"
  deploy_app "bidflow"
elif [ "$PROJECT" = "hephaitos" ] || [ "$PROJECT" = "bidflow" ]; then
  deploy_app "$PROJECT"
else
  echo "❌ Invalid project: $PROJECT"
  echo "Choose: hephaitos, bidflow, or both"
  exit 1
fi

echo "🎉 Deployment complete!"
echo "🔗 Check status at: https://vercel.com/dashboard"
```

Make executable:
```bash
chmod +x deploy.sh
```

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] All code committed to git
- [ ] Tests passing
- [ ] Build succeeds locally
- [ ] Environment variables documented
- [ ] Database migrations ready
- [ ] API keys obtained

### Deployment
- [ ] Supabase project created
- [ ] Database migrations run
- [ ] RLS policies enabled
- [ ] Upstash Redis created
- [ ] Environment variables set in Vercel
- [ ] HEPHAITOS deployed
- [ ] BIDFLOW deployed

### Post-Deployment
- [ ] Authentication tested
- [ ] Core features tested
- [ ] Error monitoring active
- [ ] Analytics configured
- [ ] Beta codes generated
- [ ] Launch announcement ready

### Week 1 Monitoring
- [ ] Daily error check
- [ ] User signup tracking
- [ ] Feature usage analytics
- [ ] Database performance
- [ ] API response times
- [ ] User feedback collection

---

## 🎓 Additional Resources

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Upstash Docs**: https://docs.upstash.com
- **Next.js Docs**: https://nextjs.org/docs
- **Turborepo Docs**: https://turbo.build/repo/docs

---

## 📞 Support

- **Documentation**: See `/docs` folder in each app
- **Issues**: GitHub Issues
- **Email**: support@yourcompany.com

---

**Last Updated**: 2024-12-25
**Version**: 1.0.0
**Platforms**: HEPHAITOS v0.95 | BIDFLOW v1.0
