# BIDFLOW Lead Generation Pipeline - Quick Start Guide

> **Version**: 1.0.0
> **Date**: 2025-12-24
> **Status**: Ready for Implementation

---

## Overview

This lead generation pipeline automatically:
1. ✅ Collects bids from 나라장터 (G2B) every hour
2. ✅ Enriches company & contact data via Clay.com
3. ✅ Scores leads using ML (100-point system)
4. ✅ Sends alerts for HOT leads (85+ score)
5. ✅ Syncs to CRM (HubSpot/Salesforce)

---

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│                  BIDFLOW Lead Pipeline                      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  [1] DATA SOURCES                                          │
│  ├─ 나라장터 API (G2B) ............ Every 1 hour          │
│  ├─ LinkedIn Sales Navigator ...... Weekly                 │
│  ├─ Company Websites .............. Monthly                │
│  └─ Industry Databases ............ Quarterly              │
│                                                            │
│  [2] ENRICHMENT (Clay.com)                                 │
│  ├─ Company Data (domain, size, revenue)                   │
│  ├─ Contact Data (email, phone, LinkedIn)                  │
│  ├─ Email Verification (Hunter.io, Clearbit)               │
│  └─ Behavioral Data (news, procurement history)            │
│                                                            │
│  [3] SCORING (ML + Rules)                                  │
│  ├─ Firmographic (40pts): Budget, Size, Industry           │
│  ├─ Behavioral (30pts): History, Engagement, Timeline      │
│  ├─ Contact Quality (20pts): Email, Phone, Decision Maker  │
│  └─ Intent (10pts): Buying Signals, Urgency                │
│                                                            │
│  [4] AUTOMATION (n8n)                                      │
│  ├─ HOT Lead Alert (Slack + Email) ....... Score 85+      │
│  ├─ Auto Outreach (Email Sequence) ....... Score 70+      │
│  ├─ CRM Sync (HubSpot/Salesforce) ........ All Qualified  │
│  └─ Trigger Actions (Job Change, Funding) ... Real-time   │
│                                                            │
│  [5] CRM HANDOFF                                           │
│  └─ Create Opportunity → Assign Sales Rep → Track Progress │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Quick Start (5 Steps)

### Step 1: Set Up Environment Variables

```bash
# .env
G2B_API_KEY=your_g2b_api_key
CLAY_API_KEY=your_clay_api_key
HUNTER_API_KEY=your_hunter_api_key
CLEARBIT_API_KEY=your_clearbit_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SLACK_WEBHOOK_URL=your_slack_webhook_url
BIDFLOW_URL=https://bidflow.yourdomain.com
```

### Step 2: Deploy n8n Workflow

```bash
# Install n8n
npm install -g n8n

# Start n8n
n8n start

# Import workflow
# Go to http://localhost:5678
# Click "Import from File"
# Select: /apps/bidflow/n8n-workflows/01-lead-generation-pipeline.json
```

### Step 3: Configure Clay.com

1. Sign up at https://clay.com
2. Create enrichment template:
   - Company Data Waterfall
   - Contact Finder
   - Email Verification
3. Get API Key from Settings

### Step 4: Set Up Database

```sql
-- Already created in Supabase migrations
-- Just run:
-- supabase db push

-- Verify tables exist:
SELECT * FROM leads LIMIT 1;
SELECT * FROM lead_scores LIMIT 1;
SELECT * FROM lead_enrichments LIMIT 1;
```

### Step 5: Test the Pipeline

```bash
# Manual trigger via n8n UI
# Or wait 1 hour for auto-trigger

# Check results:
# - Supabase: leads table
# - Slack: #sales-hot-leads channel
# - Email: sales@cmntech.com
```

---

## Key Features

### 1. Intelligent Lead Scoring (100 Points)

| Component | Points | What It Measures |
|-----------|--------|------------------|
| **Firmographic** | 40 | Budget (15), Size (10), Industry (10), Location (5) |
| **Behavioral** | 30 | Purchase History (15), Engagement (10), Timeline (5) |
| **Contact Quality** | 20 | Email Verified (10), Phone (5), Decision Maker (5) |
| **Intent** | 10 | Buying Signals (5), Urgency (5) |

**Grading Scale:**
- 90+: A+ (Immediate - 2hr SLA)
- 80-89: A (High - 24hr SLA)
- 70-79: B (Medium - 3day SLA)
- 60-69: C (Low - 1week SLA)
- <60: D (Disqualify)

### 2. Automated Enrichment Flow

```
Raw Lead → Clay.com → Hunter.io → Clearbit → Supabase
   ↓           ↓           ↓           ↓          ↓
Company    Employees   Email      Verify    Save
  Name       Count     Discovery   Email    100%
```

**Enrichment Rate:** 90%+ (Clay.com waterfall)

### 3. Multi-Channel Alerts

**Immediate Alerts (Score 85+):**
- 🔥 Slack (#sales-hot-leads)
- 📧 Email (sales@cmntech.com)
- 📱 SMS (Optional - Twilio)

**Auto Outreach (Score 70+):**
- Day 0: Email with personalized template
- Day 3: LinkedIn connection request
- Day 7: Phone call attempt
- Day 14: Follow-up email

### 4. Trigger-Based Actions

| Trigger | Condition | Action |
|---------|-----------|--------|
| New Bid Published | Keywords match | Enrich + Score + Alert |
| Company Funding | $5M+ raised | Priority boost (+20pts) |
| Decision Maker Job Change | Previous contact | Re-engage sequence |
| Email Opened 2+ | Within 1 hour | Real-time Slack alert |
| Competitor Won Bid | Same company | Alert + Strategy note |

---

## Performance Metrics

### Current Baseline (Manual Process)
```yaml
Time Spent: 3 hours/day (리드 발굴)
Leads Found: 10-15/day
Qualification Rate: 20%
Response Rate: 5%
Conversion Rate: 2%
```

### Target (Automated Pipeline)
```yaml
Time Spent: 10 minutes/day (리뷰만)
Leads Found: 100+/day
Qualification Rate: 40% (스코어링)
Response Rate: 15% (맞춤형 메시지)
Conversion Rate: 10% (우선순위 타겟팅)
```

### Expected ROI (Year 1)
```
Investment: ₩3억
  - Clay.com: ₩1억/year
  - n8n: ₩2천만/year
  - Hunter/Clearbit: ₩3천만/year
  - Dev: ₩5천만 (one-time)
  - Operations: ₩5천만/year

Returns: ₩50억
  - 10,000 leads → 4,000 qualified → 600 opportunities → 60 wins
  - Average deal: ₩83M
  - Total: 60 × ₩83M = ₩50억

ROI: 15:1 (₩3억 투자 → ₩50억 매출)
```

---

## Implementation Roadmap

### Phase 1: MVP (4 weeks)
- [x] G2B API integration
- [ ] Clay.com enrichment
- [ ] Lead scoring algorithm
- [ ] Supabase storage
- [ ] n8n workflow deployment
- [ ] Slack alerts

**Target:** 100 leads/month, 40% qualification rate

### Phase 2: Enrichment (4 weeks)
- [ ] Hunter.io email discovery
- [ ] Clearbit verification
- [ ] LinkedIn profile extraction
- [ ] ML model training (past data)
- [ ] A/B test email templates

**Target:** 500 leads/month, 90% enrichment rate

### Phase 3: Automation (4 weeks)
- [ ] Email sequence automation
- [ ] Multi-channel outreach (SMS, Kakao)
- [ ] CRM integration (HubSpot/Salesforce)
- [ ] Response tracking
- [ ] Auto follow-up

**Target:** 1,000 leads/month, 15% response rate

### Phase 4: Intelligence (4 weeks)
- [ ] GPT-4 message personalization
- [ ] Optimal send time prediction
- [ ] Churn prediction model
- [ ] LinkedIn Sales Navigator automation
- [ ] Website crawler (200 companies)
- [ ] Industry database integration

**Target:** 1,500 leads/month, 25% response rate, 10% conversion

---

## API Costs & Limits

| Service | Plan | Monthly Cost | Limits |
|---------|------|--------------|--------|
| **G2B (나라장터)** | Free | ₩0 | 1,000 requests/day |
| **Clay.com** | Pro | $800 (~₩100만) | 10,000 enrichments |
| **Hunter.io** | Starter | $49 (~₩6만) | 500 searches |
| **Clearbit** | Growth | $99 (~₩12만) | 2,500 verifications |
| **n8n** | Cloud | $20 (~₩2.5만) | Unlimited workflows |
| **Supabase** | Pro | $25 (~₩3만) | 100GB storage |
| **Slack** | Free | ₩0 | 10,000 messages |
| **Twilio** | Pay-as-go | Variable | ₩50/SMS |

**Total:** ~₩125만/month (₩1,500만/year)

---

## Monitoring Dashboard

### Key Metrics to Track

```yaml
Daily:
  - New Leads: Target 50+
  - Enrichment Rate: Target 90%+
  - Score Distribution: 40% Grade A/B
  - Alert Sent: HOT leads only

Weekly:
  - Response Rate: Target 15%+
  - Email Deliverability: Target 95%+
  - CRM Sync Status: 100%
  - Cost per Lead: Target <₩10,000

Monthly:
  - Opportunities Created: Target 50+
  - Conversion Rate: Target 10%+
  - Pipeline Value: Target ₩5억+
  - ROI: Target 10:1+
```

### Alerts for Anomalies
- 🔴 Enrichment rate <70% → Check Clay.com API
- 🔴 Email deliverability <90% → Verify sender reputation
- 🔴 No new leads for 2+ hours → Check G2B API
- 🟡 Score distribution skewed → Adjust scoring weights

---

## Troubleshooting

### Issue: No leads collected

**Possible Causes:**
1. G2B API key expired → Renew at data.go.kr
2. Rate limit exceeded → Wait 24 hours
3. Network error → Check n8n logs

**Solution:**
```bash
# Check n8n logs
n8n start --tunnel

# Test G2B API
curl "https://apis.data.go.kr/1230000/BidPublicInfoService04/getBidPblancListInfoThng01?ServiceKey=YOUR_KEY&inqryDiv=1"
```

### Issue: Low enrichment rate (<70%)

**Possible Causes:**
1. Clay.com credits exhausted → Upgrade plan
2. Email discovery failing → Check Hunter.io quota
3. Company domain not found → Manual fallback

**Solution:**
```bash
# Check Clay.com usage
# Dashboard → Usage → Credits Remaining

# If low, upgrade:
https://clay.com/billing
```

### Issue: Emails bouncing

**Possible Causes:**
1. Invalid email addresses → Better verification
2. Spam filters → Improve sender reputation
3. No authentication → Set up SPF/DKIM

**Solution:**
```bash
# Add SPF record
v=spf1 include:_spf.bidflow.io ~all

# Add DKIM key
# SendGrid → Settings → Sender Authentication

# Test deliverability
https://www.mail-tester.com
```

---

## Next Steps

1. ✅ Review documentation
   - `/apps/bidflow/.forge/LEAD_GENERATION_PIPELINE.md`
   - `/apps/bidflow/src/types/lead-generation.ts`

2. ✅ Set up accounts
   - Clay.com (Pro plan)
   - Hunter.io (Starter)
   - Clearbit (Growth)

3. ✅ Deploy n8n workflow
   - Import workflow JSON
   - Configure credentials
   - Test manual trigger

4. ✅ Monitor first week
   - Check daily metrics
   - Adjust scoring weights
   - Optimize email templates

5. ✅ Scale up
   - Add LinkedIn integration
   - Train ML model
   - Expand to 200+ target companies

---

## Support

**Technical Issues:**
- GitHub Issues: https://github.com/yourorg/bidflow/issues
- Slack: #dev-bidflow

**Business Questions:**
- Email: sales@bidflow.io
- Slack: #sales-ops

---

*BIDFLOW Lead Generation - Built with n8n, Clay.com, Supabase*
*Version 1.0.0 - 2025-12-24*
