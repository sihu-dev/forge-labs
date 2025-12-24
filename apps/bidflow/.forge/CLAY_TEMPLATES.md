# Clay.com Templates for BIDFLOW Lead Enrichment

> **Purpose**: Automated data enrichment using Clay.com waterfalls
> **Version**: 1.0.0
> **Date**: 2025-12-24

---

## Overview

Clay.com is a data enrichment platform that automatically fills in missing company and contact information using multiple data sources (waterfalls). This guide shows exactly how to set up Clay for BIDFLOW.

---

## Template 1: Company Enrichment Waterfall

### Input Fields
- Company Name (required)
- Company Domain (optional)

### Waterfall Steps

```
┌──────────────────────────────────────────────────────────────┐
│         Company Enrichment Waterfall (9 steps)               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [1] Find Company Domain                                     │
│      ├─ Google Search API                                    │
│      ├─ Clearbit Logo API                                    │
│      └─ Manual fallback (if needed)                          │
│                                                              │
│  [2] Get Basic Company Data                                  │
│      ├─ Clearbit Company API ............. [Primary]         │
│      ├─ Crunchbase ...................... [Fallback 1]      │
│      └─ LinkedIn Company Scraper ........ [Fallback 2]      │
│                                                              │
│  [3] Get Employee Count                                      │
│      ├─ LinkedIn Company Page                                │
│      ├─ Crunchbase                                           │
│      └─ ZoomInfo                                             │
│                                                              │
│  [4] Get Revenue Estimate                                    │
│      ├─ Crunchbase (if funded startup)                       │
│      ├─ OpenCorporates (if public)                           │
│      └─ Estimate from employee count                         │
│                                                              │
│  [5] Get Industry Classification                             │
│      ├─ Clearbit Industry                                    │
│      ├─ LinkedIn Industry                                    │
│      └─ NAICS/SIC Code lookup                                │
│                                                              │
│  [6] Get Location Data                                       │
│      ├─ Clearbit Geo                                         │
│      ├─ Google Places API                                    │
│      └─ Company website parser                               │
│                                                              │
│  [7] Get Social Profiles                                     │
│      ├─ Clearbit Social                                      │
│      ├─ Hunter.io Social Finder                              │
│      └─ Manual scrape (Twitter, Facebook)                    │
│                                                              │
│  [8] Get Funding Data (if applicable)                        │
│      ├─ Crunchbase API                                       │
│      ├─ PitchBook (premium)                                  │
│      └─ News mentions (Google News)                          │
│                                                              │
│  [9] Get Technologies Used                                   │
│      ├─ BuiltWith                                            │
│      ├─ Wappalyzer                                           │
│      └─ HTTP headers analysis                                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Output Fields

```json
{
  "company": {
    "legal_name": "한국수자원공사",
    "domain": "kwater.or.kr",
    "website": "https://www.kwater.or.kr",
    "founded_year": 1967,
    "industry": "Water Supply and Waste Management",
    "industry_code": "NAICS 221310",
    "employee_count": 6500,
    "employee_count_range": "5001+",
    "estimated_revenue": 8000000000000,
    "revenue_range": "500B+",
    "headquarters": {
      "address": "경상남도 창원시 의창구 수성로 300",
      "city": "창원",
      "region": "경상남도",
      "country": "KR",
      "postal_code": "51171"
    },
    "social_profiles": {
      "linkedin": "https://www.linkedin.com/company/k-water",
      "facebook": "https://www.facebook.com/kwater1967",
      "twitter": null
    },
    "funding": null,
    "technologies": ["WordPress", "Google Analytics", "Cloudflare"],
    "enrichment_source": "clay",
    "enriched_at": "2025-12-24T10:30:00Z",
    "confidence": 95
  }
}
```

### Clay.com Configuration

```json
{
  "template_name": "BIDFLOW - Company Enrichment",
  "input_columns": [
    {
      "name": "company_name",
      "type": "text",
      "required": true
    },
    {
      "name": "company_domain",
      "type": "text",
      "required": false
    }
  ],
  "enrichment_columns": [
    {
      "name": "Find Domain",
      "provider": "clearbit",
      "endpoint": "logo",
      "input": "={{company_name}}",
      "output": "domain"
    },
    {
      "name": "Company Data",
      "provider": "clearbit",
      "endpoint": "company",
      "input": "={{domain}}",
      "output": "company_data",
      "fallback": [
        {
          "provider": "crunchbase",
          "endpoint": "organization",
          "input": "={{domain}}"
        },
        {
          "provider": "linkedin",
          "endpoint": "company",
          "input": "={{company_name}}"
        }
      ]
    },
    {
      "name": "Employee Count",
      "provider": "linkedin",
      "endpoint": "company_employees",
      "input": "={{company_name}}",
      "output": "employee_count"
    },
    {
      "name": "Revenue Estimate",
      "provider": "opencorporates",
      "endpoint": "financials",
      "input": "={{domain}}",
      "output": "revenue",
      "fallback": [
        {
          "provider": "formula",
          "formula": "={{employee_count}} * 150000000",
          "note": "Avg ₩150M per employee"
        }
      ]
    }
  ],
  "credits_per_row": 5
}
```

---

## Template 2: Contact Finder & Enrichment

### Input Fields
- Company Name
- Company Domain
- Contact Name (optional)
- Job Title Keywords (e.g., "구매", "조달", "procurement")

### Waterfall Steps

```
┌──────────────────────────────────────────────────────────────┐
│         Contact Enrichment Waterfall (8 steps)               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [1] Find Contact Name (if not provided)                     │
│      ├─ LinkedIn People Search (title + company)             │
│      ├─ Hunter.io Domain Search                              │
│      └─ Apollo.io People Finder                              │
│                                                              │
│  [2] Find Email Address                                      │
│      ├─ Hunter.io Email Finder .......... [Primary]         │
│      ├─ Apollo.io Email Finder .......... [Fallback 1]      │
│      ├─ Clearbit Prospector ............. [Fallback 2]      │
│      └─ Email Pattern Guess ............. [Fallback 3]      │
│          Pattern: firstname.lastname@company.com             │
│                                                              │
│  [3] Verify Email Address                                    │
│      ├─ Hunter.io Email Verifier                             │
│      ├─ Clearbit Email Verifier                              │
│      └─ SMTP Check (Mailgun)                                 │
│                                                              │
│  [4] Find Phone Number                                       │
│      ├─ Apollo.io Phone Finder                               │
│      ├─ RocketReach                                          │
│      └─ LinkedIn Profile (if public)                         │
│                                                              │
│  [5] Get LinkedIn Profile                                    │
│      ├─ LinkedIn People Search API                           │
│      ├─ Google Search (site:linkedin.com)                    │
│      └─ Clearbit Person API                                  │
│                                                              │
│  [6] Extract Job Details                                     │
│      ├─ LinkedIn Profile Scraper                             │
│      ├─ Clearbit Person Data                                 │
│      └─ Apollo.io Profile                                    │
│                                                              │
│  [7] Determine Seniority                                     │
│      ├─ Job Title Analysis (ML model)                        │
│      ├─ LinkedIn Seniority                                   │
│      └─ Rule-based (keywords: 팀장, 부장, 이사...)          │
│                                                              │
│  [8] Get Recent Activity                                     │
│      ├─ LinkedIn Posts (last 30 days)                        │
│      ├─ News Mentions (Google News)                          │
│      └─ Job Change Detection                                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Output Fields

```json
{
  "contact": {
    "full_name": "김영수",
    "first_name": "영수",
    "last_name": "김",
    "job_title": "영업기획팀 과장",
    "seniority": "manager",
    "department": "procurement",
    "email": "ys.kim@kwater.or.kr",
    "email_confidence": 95,
    "email_verified": true,
    "email_deliverability": "deliverable",
    "phone": "+82-42-629-1234",
    "phone_confidence": 85,
    "phone_verified": false,
    "linkedin_url": "https://www.linkedin.com/in/youngsu-kim-abc123",
    "linkedin_connections": 450,
    "linkedin_activity": {
      "posts_last_30_days": 3,
      "last_post_date": "2025-12-20"
    },
    "recent_activity": [
      "Posted about water infrastructure project on LinkedIn (Dec 20)",
      "Promoted to Manager (Dec 1)"
    ],
    "enrichment_source": "hunter",
    "enriched_at": "2025-12-24T10:35:00Z",
    "confidence": 92
  }
}
```

### Email Discovery Patterns

```javascript
// Common Korean email patterns
const patterns = [
  '{first}.{last}@{domain}',          // youngsu.kim@kwater.or.kr
  '{first}{last}@{domain}',           // youngsoukim@kwater.or.kr
  '{last}{first}@{domain}',           // kimyoungsu@kwater.or.kr
  '{first_initial}{last}@{domain}',   // ykim@kwater.or.kr
  '{last}{first_initial}@{domain}',   // kimy@kwater.or.kr
  '{first}@{domain}',                 // youngsu@kwater.or.kr
  '{last}@{domain}',                  // kim@kwater.or.kr
];

// Generate all variations
const emailCandidates = patterns.map(pattern => {
  return pattern
    .replace('{first}', firstName.toLowerCase())
    .replace('{last}', lastName.toLowerCase())
    .replace('{first_initial}', firstName[0].toLowerCase())
    .replace('{domain}', domain);
});

// Verify each candidate (Hunter.io or Clearbit)
const verifiedEmail = await verifyEmails(emailCandidates);
```

---

## Template 3: Behavioral Enrichment

### Input Fields
- Company Name
- Company Domain

### Data Sources

```
┌──────────────────────────────────────────────────────────────┐
│       Behavioral Enrichment Sources (6 categories)           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [1] Procurement History                                     │
│      ├─ 나라장터 API (past bids)                            │
│      ├─ Scrape G2B website                                   │
│      └─ Internal BIDFLOW database                            │
│                                                              │
│  [2] News Mentions                                           │
│      ├─ Google News API (last 90 days)                       │
│      ├─ Naver News API                                       │
│      └─ Company press releases                               │
│                                                              │
│  [3] Funding & Financial Events                              │
│      ├─ Crunchbase News                                      │
│      ├─ Korean startup news (TheVC, Platum)                  │
│      └─ DART (공시 시스템) for public companies             │
│                                                              │
│  [4] Competitor Activity                                     │
│      ├─ G2B bid results (낙찰 이력)                          │
│      ├─ Industry news mentions                               │
│      └─ Patent filings (KIPRIS)                              │
│                                                              │
│  [5] Website Activity (if tracked)                           │
│      ├─ Google Analytics (if integrated)                     │
│      ├─ Hotjar session recordings                            │
│      └─ UTM parameter tracking                               │
│                                                              │
│  [6] Social Media Activity                                   │
│      ├─ LinkedIn company posts                               │
│      ├─ Facebook page updates                                │
│      └─ Twitter/X mentions                                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Output Example

```json
{
  "behavioral": {
    "procurement_history": {
      "total_bids": 47,
      "won_bids": 18,
      "lost_bids": 25,
      "pending_bids": 4,
      "average_bid_value": 180000000,
      "last_bid_date": "2025-12-15",
      "preferred_suppliers": [
        "Endress+Hauser Korea",
        "Siemens Korea",
        "Local Supplier A"
      ],
      "win_rate": 0.38
    },
    "news_mentions": {
      "count": 12,
      "recent_headlines": [
        "K-water, 스마트 워터 시티 프로젝트 착수 (2025-12-20)",
        "정부, 상수도 노후화 시설 개선에 1조원 투자 (2025-12-10)",
        "K-water, AI 기반 수질 관리 시스템 도입 (2025-11-25)"
      ],
      "sentiment": "positive",
      "last_mention_date": "2025-12-20"
    },
    "funding": null,
    "competitor_activity": {
      "recent_wins": [
        {
          "competitor": "Endress+Hauser",
          "bid_title": "정수장 유량계 교체 사업",
          "amount": 420000000,
          "date": "2025-12-18"
        },
        {
          "competitor": "Siemens",
          "bid_title": "하수처리장 계측기 설치",
          "amount": 210000000,
          "date": "2025-12-15"
        }
      ]
    },
    "website_visits": null,
    "enriched_at": "2025-12-24T10:40:00Z"
  }
}
```

---

## Clay.com API Integration

### Authentication

```javascript
// Clay.com API Key
const CLAY_API_KEY = process.env.CLAY_API_KEY;

// Base URL
const CLAY_BASE_URL = 'https://api.clay.com/v1';

// Headers
const headers = {
  'Authorization': `Bearer ${CLAY_API_KEY}`,
  'Content-Type': 'application/json',
};
```

### Enrichment Request

```javascript
// POST /v1/enrichments
async function enrichCompany(companyName, companyDomain) {
  const response = await fetch(`${CLAY_BASE_URL}/enrichments`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      table_id: 'tbl_company_enrichment',
      rows: [
        {
          company_name: companyName,
          company_domain: companyDomain,
        },
      ],
      enrichment_options: {
        company_data: true,
        contact_data: true,
        email_discovery: true,
        phone_discovery: true,
        linkedin_profile: true,
        behavioral_data: false,  // Separate template
      },
    }),
  });

  return await response.json();
}
```

### Response Structure

```json
{
  "job_id": "job_abc123xyz",
  "status": "processing",
  "created_at": "2025-12-24T10:30:00Z",
  "estimated_completion": "2025-12-24T10:35:00Z",
  "credits_used": 0,
  "credits_estimated": 5
}
```

### Polling for Results

```javascript
// GET /v1/jobs/{job_id}
async function getEnrichmentResult(jobId) {
  const response = await fetch(`${CLAY_BASE_URL}/jobs/${jobId}`, {
    headers: headers,
  });

  const data = await response.json();

  if (data.status === 'completed') {
    return {
      success: true,
      data: data.results[0],
      credits_used: data.credits_used,
    };
  } else if (data.status === 'failed') {
    return {
      success: false,
      error: data.error_message,
    };
  } else {
    // Still processing, wait and retry
    await new Promise(resolve => setTimeout(resolve, 2000));
    return await getEnrichmentResult(jobId);
  }
}
```

---

## Cost Optimization

### Credit Usage per Enrichment

| Template | Credits | Cost (at $0.08/credit) |
|----------|---------|------------------------|
| Company Enrichment | 5 | $0.40 |
| Contact Finder | 3 | $0.24 |
| Email Verification | 1 | $0.08 |
| Behavioral Enrichment | 2 | $0.16 |
| **Total per Lead** | **11** | **$0.88** (~₩1,100) |

### Monthly Budget Calculation

```
Scenario 1: 1,000 leads/month
├─ Credits: 1,000 × 11 = 11,000 credits
├─ Cost: 11,000 × $0.08 = $880 (~₩110만)
└─ Plan: Clay Pro ($800/month) + $80 overage

Scenario 2: 5,000 leads/month
├─ Credits: 5,000 × 11 = 55,000 credits
├─ Cost: 55,000 × $0.08 = $4,400 (~₩550만)
└─ Plan: Clay Enterprise (custom pricing)
```

### Optimization Strategies

1. **Conditional Enrichment**
   ```javascript
   // Only enrich if score >= 50 (before enrichment)
   if (preliminaryScore >= 50) {
     enrichWithClay();
   }
   ```

2. **Waterfall Optimization**
   ```javascript
   // Use free sources first, paid as fallback
   [
     { provider: 'g2b_api', cost: 0 },
     { provider: 'linkedin_scrape', cost: 0 },
     { provider: 'clearbit', cost: 1 },  // Only if above fail
   ]
   ```

3. **Batch Processing**
   ```javascript
   // Enrich in batches of 100 (discount applies)
   const batches = chunk(leads, 100);
   for (const batch of batches) {
     await enrichBatch(batch);
   }
   ```

4. **Cache Results**
   ```javascript
   // Cache company data for 30 days
   const cached = await redis.get(`company:${domain}`);
   if (cached) return JSON.parse(cached);

   const enriched = await enrichCompany(domain);
   await redis.setex(`company:${domain}`, 2592000, JSON.stringify(enriched));
   return enriched;
   ```

---

## Quality Assurance

### Validation Rules

```javascript
// Validate enrichment quality
function validateEnrichment(enrichment) {
  const issues = [];

  // Email validation
  if (enrichment.contact?.email) {
    if (enrichment.contact.email_confidence < 70) {
      issues.push('Low email confidence');
    }
    if (!enrichment.contact.email_verified) {
      issues.push('Email not verified');
    }
  } else {
    issues.push('Missing email');
  }

  // Company validation
  if (!enrichment.company?.employee_count) {
    issues.push('Missing employee count');
  }
  if (!enrichment.company?.industry) {
    issues.push('Missing industry');
  }

  // Calculate completeness score
  const totalFields = 20;
  const filledFields = Object.keys(enrichment).filter(key => {
    return enrichment[key] !== null && enrichment[key] !== undefined;
  }).length;

  const completeness = Math.round((filledFields / totalFields) * 100);

  return {
    valid: issues.length === 0,
    issues: issues,
    completeness: completeness,
  };
}
```

### Fallback Strategies

```javascript
// If enrichment fails or low quality, use fallbacks
async function enrichWithFallback(companyName, companyDomain) {
  try {
    // Try Clay.com first
    const clayResult = await enrichWithClay(companyName, companyDomain);

    if (clayResult.completeness >= 80) {
      return clayResult;
    }

    // If incomplete, try secondary sources
    const hunterResult = await hunterEmailFinder(companyDomain);
    const linkedinResult = await linkedinCompanyScraper(companyName);

    // Merge results
    return {
      ...clayResult,
      contact: {
        ...clayResult.contact,
        ...hunterResult,
      },
      company: {
        ...clayResult.company,
        ...linkedinResult,
      },
    };
  } catch (error) {
    console.error('Enrichment failed:', error);

    // Ultimate fallback: manual research task
    return {
      status: 'manual_review_required',
      company_name: companyName,
      company_domain: companyDomain,
      error: error.message,
    };
  }
}
```

---

## Testing & Debugging

### Test Data

```json
{
  "test_companies": [
    {
      "name": "한국수자원공사",
      "domain": "kwater.or.kr",
      "expected": {
        "employees": "> 5000",
        "industry": "Water Supply",
        "email_pattern": "firstname.lastname@kwater.or.kr"
      }
    },
    {
      "name": "한국환경공단",
      "domain": "keco.or.kr",
      "expected": {
        "employees": "1000-5000",
        "industry": "Environmental Services",
        "email_pattern": "firstnamelastname@keco.or.kr"
      }
    },
    {
      "name": "씨엠엔텍",
      "domain": "cmntech.co.kr",
      "expected": {
        "employees": "50-100",
        "industry": "Manufacturing",
        "email_pattern": "firstname@cmntech.co.kr"
      }
    }
  ]
}
```

### Debug Mode

```javascript
// Enable verbose logging
const DEBUG = process.env.CLAY_DEBUG === 'true';

async function enrichCompanyDebug(companyName) {
  if (DEBUG) console.log('[Clay] Starting enrichment for:', companyName);

  const startTime = Date.now();

  const result = await enrichCompany(companyName);

  if (DEBUG) {
    console.log('[Clay] Enrichment completed in:', Date.now() - startTime, 'ms');
    console.log('[Clay] Credits used:', result.credits_used);
    console.log('[Clay] Completeness:', result.completeness, '%');
    console.log('[Clay] Result:', JSON.stringify(result, null, 2));
  }

  return result;
}
```

---

*Clay.com Templates for BIDFLOW - v1.0.0*
*2025-12-24*
