# ⚡ FORGE LABS Quick Start Guide

> **Get running in 15 minutes**

---

## 🎯 What You'll Deploy

- **HEPHAITOS**: Trading education platform @ `https://hephaitos.vercel.app`
- **BIDFLOW**: Bid automation system @ `https://bidflow.vercel.app`

---

## 📋 Prerequisites (5 minutes)

### 1. Create Accounts

```bash
# Required (all have free tiers):
✓ Vercel: https://vercel.com/signup
✓ Supabase: https://supabase.com/dashboard
✓ Upstash: https://console.upstash.com
```

### 2. Install CLI Tools

```bash
# Install Vercel CLI
npm install -g vercel

# Install Supabase CLI
npm install -g supabase

# Verify installations
vercel --version
supabase --version
```

---

## 🗄️ Database Setup (5 minutes)

### Create Supabase Project

```bash
# 1. Go to https://supabase.com/dashboard
# 2. Click "New Project"
# 3. Fill in:
#    - Name: forge-labs
#    - Database Password: [GENERATE STRONG PASSWORD - SAVE IT!]
#    - Region: Singapore (or nearest)
# 4. Click "Create project" (takes 2 min)
```

### Run Migrations

```bash
# Clone repo if you haven't
git clone https://github.com/yourorg/forge-labs
cd forge-labs

# Link Supabase project (get ref from dashboard URL)
supabase link --project-ref YOUR_PROJECT_REF

# Run HEPHAITOS migrations
cd apps/hephaitos
supabase db push

# Run BIDFLOW migrations
cd ../bidflow
supabase db push

cd ../..
```

### Get Supabase Credentials

```bash
# Go to: Supabase Dashboard > Settings > API
# Copy these 3 values:

NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ⚡ Redis Setup (2 minutes)

### Create Upstash Redis

```bash
# 1. Go to https://console.upstash.com
# 2. Click "Create Database"
# 3. Fill in:
#    - Name: forge-labs-redis
#    - Region: Singapore (or nearest)
# 4. Click "Create"
```

### Get Redis Credentials

```bash
# From Upstash Dashboard > Your Database > REST API
# Copy these 2 values:

UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXXxxxxxxxxxxx
```

---

## 🚀 Deploy (3 minutes)

### Deploy Both Apps

```bash
# From repository root
./deploy.sh both

# Or deploy individually:
./deploy.sh hephaitos
./deploy.sh bidflow
```

### Set Environment Variables

During first deployment, Vercel will ask:
```bash
? Set up and deploy? Yes
? Which scope? [Your account]
? Link to existing project? No
? What's your project's name? [hephaitos/bidflow]
? Want to override the settings? No
```

After deployment, add environment variables:

```bash
# For HEPHAITOS
cd apps/hephaitos
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN

# For BIDFLOW
cd ../bidflow
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY

# Redeploy to apply env vars
cd ../..
./deploy.sh both
```

---

## ✅ Verify Deployment (2 minutes)

### Test HEPHAITOS

```bash
# 1. Open: https://hephaitos.vercel.app
# 2. Click "Sign Up"
# 3. Create account
# 4. Verify email
# 5. Login
# 6. Navigate to Strategy Builder
# 7. Drag a node - should work!
```

### Test BIDFLOW

```bash
# 1. Open: https://bidflow.vercel.app
# 2. Sign up / Login
# 3. Navigate to Bids
# 4. Click "Manual Add"
# 5. Fill form - should save!
```

---

## 🎉 You're Live!

### What's Next?

**For HEPHAITOS**:
- [ ] Add exchange API keys (Settings > Exchanges)
- [ ] Create first strategy (Strategy Builder)
- [ ] Run backtest
- [ ] View results

**For BIDFLOW**:
- [ ] Add keywords (Bids > Keywords)
- [ ] Add first bid (Bids > Manual Add)
- [ ] Configure Apollo API (for lead enrichment)
- [ ] Test lead generation

---

## 🔥 Optional Enhancements

### Add Payment Processing (HEPHAITOS)

```bash
# Get Toss Payments API keys
# 1. Go to: https://developers.tosspayments.com
# 2. Create app
# 3. Get test keys

# Add to Vercel env:
cd apps/hephaitos
vercel env add TOSS_CLIENT_KEY
vercel env add TOSS_SECRET_KEY
vercel --prod
```

### Add Lead Enrichment (BIDFLOW)

```bash
# Get API keys:
# Apollo: https://apollo.io/settings/api
# Persana: https://persana.ai/settings/api

# Add to Vercel env:
cd apps/bidflow
vercel env add APOLLO_API_KEY
vercel env add PERSANA_API_KEY
vercel --prod
```

---

## 🐛 Troubleshooting

### "Build failed"
```bash
# Run local build to see errors:
cd apps/hephaitos  # or bidflow
npm install
npm run build
```

### "Database connection failed"
```bash
# Verify credentials in Vercel:
vercel env ls

# Check Supabase is running:
# Dashboard > Project should show green "Active"
```

### "Can't login"
```bash
# Check email confirmation:
# 1. Check spam folder
# 2. Verify Supabase email settings
# 3. Go to: Authentication > Email Templates
```

---

## 📚 Full Documentation

- **Deployment**: See `PRODUCTION_DEPLOYMENT.md`
- **HEPHAITOS**: See `apps/hephaitos/docs/`
- **BIDFLOW**: See `apps/bidflow/README.md`
- **Architecture**: See `CLAUDE.md`

---

## 🆘 Get Help

- **Docs**: `/docs` folder
- **Issues**: GitHub Issues
- **Email**: support@yourcompany.com

---

**Deployment Time**: ~15 minutes
**Difficulty**: Beginner-friendly
**Cost**: $0 (all free tiers)

🎊 **Congratulations! You're running FORGE LABS!** 🎊
