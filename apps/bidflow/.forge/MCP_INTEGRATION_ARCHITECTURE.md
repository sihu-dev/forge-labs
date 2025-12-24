# MCP Integration Architecture for BIDFLOW
## Sales/Marketing Automation with Model Context Protocol

> **Version**: 1.0.0
> **Last Updated**: 2025-12-24
> **MCP Spec**: 2025-11-25

---

## Executive Summary

BIDFLOW integrates with multiple MCP (Model Context Protocol) servers to enable AI-powered sales and marketing automation. This document outlines the complete architecture for:

- **7 External MCP Servers** (HubSpot, GitHub, Slack, Google Drive, Playwright, n8n, Gmail)
- **1 Custom BIDFLOW MCP Server** (나라장터 lead generation)
- **Integration Patterns** (Claude Code, Claude Chrome, API workflows)
- **Security Framework** (OAuth, API key management, audit logging)

---

## Table of Contents

1. [Required MCP Servers](#1-required-mcp-servers)
2. [Custom BIDFLOW MCP Server](#2-custom-bidflow-mcp-server)
3. [MCP Configuration](#3-mcp-configuration)
4. [Integration Patterns](#4-integration-patterns)
5. [Security Considerations](#5-security-considerations)
6. [Implementation Guide](#6-implementation-guide)
7. [Testing & Monitoring](#7-testing--monitoring)

---

## 1. Required MCP Servers

### 1.1 HubSpot MCP Server (CRM Integration)

**Purpose**: Sync leads from 나라장터 to HubSpot CRM automatically.

**NPM Package**: `@hubspot/mcp-server` (official)

**Configuration**:
```json
{
  "hubspot": {
    "command": "npx",
    "args": ["-y", "@hubspot/mcp-server"],
    "env": {
      "HUBSPOT_ACCESS_TOKEN": "pat-na1-xxxxx",
      "HUBSPOT_PORTAL_ID": "12345678"
    }
  }
}
```

**Tools Exposed**:
- `hubspot_create_contact` - Create contact from bid opportunity
- `hubspot_create_deal` - Create deal pipeline entry
- `hubspot_update_deal_stage` - Move deals through pipeline
- `hubspot_get_contact_activity` - Fetch engagement history
- `hubspot_search_companies` - Find existing organizations

**Use Cases**:
- New bid detected → Auto-create HubSpot deal
- Bid status change → Update deal stage
- Organization match → Link to existing company

**Authentication**: Private App Access Token (HubSpot Developer Portal)

**Rate Limits**: 100 requests/10 seconds (Standard tier)

---

### 1.2 GitHub MCP Server (Code Deployment)

**Purpose**: Automate deployment triggers and changelog management.

**NPM Package**: `@github/mcp-server` (official Go rewrite)

**Configuration**:
```json
{
  "github": {
    "command": "npx",
    "args": ["-y", "@github/mcp-server"],
    "env": {
      "GITHUB_TOKEN": "ghp_xxxxx",
      "GITHUB_REPO": "forge-labs/bidflow"
    }
  }
}
```

**Tools Exposed**:
- `github_create_issue` - Auto-create issue for new bid type
- `github_create_pr` - Submit automated crawl improvements
- `github_trigger_workflow` - Deploy after successful crawl
- `github_get_deployment_status` - Check production status

**Use Cases**:
- Crawl error detected → Create GitHub issue with logs
- New data source added → Auto-PR with crawler template
- Daily bid summary → Trigger deployment workflow

**Authentication**: Personal Access Token (Fine-grained)

**Permissions**: `contents:read/write`, `workflows:write`, `issues:write`

---

### 1.3 Slack MCP Server (Team Notifications)

**Purpose**: Real-time alerts for high-priority bid opportunities.

**NPM Package**: `@slack/mcp-server` OR `@korotovsky/slack-mcp-server` (community, no OAuth required)

**Configuration**:
```json
{
  "slack": {
    "command": "npx",
    "args": ["-y", "@korotovsky/slack-mcp-server"],
    "env": {
      "SLACK_BOT_TOKEN": "xoxb-xxxxx",
      "SLACK_CHANNEL_SALES": "C123456",
      "SLACK_CHANNEL_ALERTS": "C789012"
    }
  }
}
```

**Tools Exposed**:
- `slack_send_message` - Post bid alert to channel
- `slack_send_dm` - Notify assigned sales rep
- `slack_create_thread` - Start discussion on opportunity
- `slack_add_reaction` - Mark as reviewed/assigned

**Use Cases**:
- High-value bid (>50M KRW) → Instant Slack alert to #sales
- Deadline <24h → DM to account manager
- Competitor detected → Thread in #competitive-intel

**Authentication**: Bot OAuth Token (Slack App)

**Scopes**: `chat:write`, `chat:write.public`, `channels:read`

---

### 1.4 Google Drive MCP Server (Document Management)

**Purpose**: Store bid documents, proposals, and reports.

**NPM Package**: `@google/mcp-server-drive` (official)

**Configuration**:
```json
{
  "google-drive": {
    "command": "npx",
    "args": ["-y", "@google/mcp-server-drive"],
    "env": {
      "GOOGLE_OAUTH_CLIENT_ID": "xxxxx.apps.googleusercontent.com",
      "GOOGLE_OAUTH_CLIENT_SECRET": "xxxxx",
      "GOOGLE_OAUTH_REFRESH_TOKEN": "xxxxx",
      "DRIVE_FOLDER_ID": "1abcdefg"
    }
  }
}
```

**Tools Exposed**:
- `drive_create_folder` - Create folder per bid opportunity
- `drive_upload_file` - Save proposal PDFs
- `drive_share_file` - Share with team members
- `drive_search_files` - Find past similar proposals

**Use Cases**:
- New bid → Auto-create Drive folder structure
- Proposal generated → Upload to `/Proposals/2025-Q1/`
- Past bid search → Retrieve reference documents

**Authentication**: OAuth 2.0 (3-legged)

**Permissions**: `https://www.googleapis.com/auth/drive.file`

---

### 1.5 Playwright MCP Server (Web Automation)

**Purpose**: Automated browser testing and screenshot capture.

**NPM Package**: `@microsoft/playwright-mcp` (official)

**Configuration**:
```json
{
  "playwright": {
    "command": "npx",
    "args": ["@playwright/mcp@latest"],
    "env": {
      "PLAYWRIGHT_HEADLESS": "true",
      "PLAYWRIGHT_BROWSER": "chromium"
    }
  }
}
```

**Tools Exposed**:
- `playwright_navigate` - Visit bid detail page
- `playwright_screenshot` - Capture bid announcement
- `playwright_extract_table` - Scrape bid data table
- `playwright_fill_form` - Auto-submit bid registration

**Use Cases**:
- New bid URL → Screenshot for records
- Detailed specs → Extract table to spreadsheet
- Account creation → Automate 나라장터 login

**Authentication**: None (local execution)

**Browser Support**: Chromium, Firefox, WebKit

---

### 1.6 n8n MCP Server (Workflow Orchestration)

**Purpose**: Complex multi-step automation workflows.

**NPM Package**: `@n8n/mcp-server` OR `n8n-mcp` (community)

**Configuration**:
```json
{
  "n8n": {
    "command": "npx",
    "args": ["-y", "n8n-mcp"],
    "env": {
      "N8N_API_URL": "https://n8n.forgelabs.io",
      "N8N_API_KEY": "n8n_api_xxxxx"
    }
  }
}
```

**Tools Exposed**:
- `n8n_trigger_workflow` - Execute predefined workflows
- `n8n_get_execution_status` - Check workflow progress
- `n8n_list_workflows` - Discover available automations

**Use Cases**:
- New bid → Trigger "Bid Qualification Pipeline" workflow
  - Step 1: Extract keywords
  - Step 2: Match products
  - Step 3: Score opportunity
  - Step 4: Assign sales rep
  - Step 5: Create CRM entry
- Weekly digest → Trigger "Bid Summary Report" workflow

**Authentication**: API Key (n8n Settings)

**Workflow Examples**:
- `bid-qualification-pipeline`
- `weekly-bid-digest`
- `competitor-alert-workflow`

---

### 1.7 Gmail MCP Server (Email Automation)

**Purpose**: Send bid alerts and proposal emails.

**NPM Package**: `@google/mcp-server-gmail` (official)

**Configuration**:
```json
{
  "gmail": {
    "command": "npx",
    "args": ["-y", "@google/mcp-server-gmail"],
    "env": {
      "GOOGLE_OAUTH_CLIENT_ID": "xxxxx.apps.googleusercontent.com",
      "GOOGLE_OAUTH_CLIENT_SECRET": "xxxxx",
      "GOOGLE_OAUTH_REFRESH_TOKEN": "xxxxx"
    }
  }
}
```

**Tools Exposed**:
- `gmail_send_email` - Send bid notification
- `gmail_create_draft` - Draft proposal email
- `gmail_search_emails` - Find past communication

**Use Cases**:
- High-priority bid → Email to VP Sales
- Proposal ready → Draft email with attachment
- Follow-up reminder → Scheduled email

**Authentication**: OAuth 2.0

**Scopes**: `https://www.googleapis.com/auth/gmail.send`, `gmail.readonly`

---

## 2. Custom BIDFLOW MCP Server

### 2.1 Overview

**Purpose**: Expose BIDFLOW's 나라장터 crawling and product matching capabilities to AI agents.

**Protocol**: MCP 2025-11-25 (latest spec)

**Transport**: HTTP + Server-Sent Events (SSE)

**Language**: TypeScript (Node.js 20+)

**Port**: 3011 (separate from BIDFLOW app on 3010)

---

### 2.2 Server Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BIDFLOW MCP Server                       │
│                       (Port 3011)                           │
├─────────────────────────────────────────────────────────────┤
│  Tools (12)          Resources (5)        Prompts (3)       │
├──────────────────────┬──────────────────┬──────────────────┤
│ • search_bids        │ • bid_data       │ • qualify_bid    │
│ • get_bid_details    │ • company_profile│ • match_product  │
│ • track_competitors  │ • market_trends  │ • write_proposal │
│ • match_products     │ • product_catalog│                  │
│ • create_proposal    │ • crawl_stats    │                  │
│ • schedule_crawl     │                  │                  │
│ • export_bids        │                  │                  │
│ • get_statistics     │                  │                  │
│ • add_keyword        │                  │                  │
│ • remove_keyword     │                  │                  │
│ • get_keywords       │                  │                  │
│ • health_check       │                  │                  │
└──────────────────────┴──────────────────┴──────────────────┘
                           │
                           ▼
           ┌───────────────────────────────┐
           │   BIDFLOW Next.js App         │
           │   (Port 3010)                 │
           │   • API Routes                │
           │   • Supabase DB               │
           │   • NaraJangtoClient          │
           │   • ProductMatcher            │
           └───────────────────────────────┘
```

---

### 2.3 Tools Definition

#### Tool 1: `search_bids`
Search for bid opportunities from 나라장터.

**Input Schema**:
```typescript
{
  keywords?: string[];
  source?: 'narajangto' | 'kepco' | 'ted';
  from_date?: string;  // ISO 8601
  to_date?: string;
  min_amount?: number;
  max_amount?: number;
  status?: 'new' | 'reviewing' | 'submitted';
  limit?: number;
}
```

**Output**:
```typescript
{
  total: number;
  bids: Array<{
    id: string;
    title: string;
    organization: string;
    deadline: string;
    estimated_amount: number;
    match_score: number;
    matched_products: string[];
    url: string;
  }>;
}
```

---

#### Tool 2: `get_bid_details`
Fetch detailed information for a specific bid.

**Input Schema**:
```typescript
{
  bid_id: string;
}
```

**Output**:
```typescript
{
  id: string;
  title: string;
  organization: string;
  deadline: string;
  estimated_amount: number;
  type: 'product' | 'service';
  requirements: string;
  specifications: string;
  attachments: Array<{
    name: string;
    url: string;
    size: number;
  }>;
  matched_products: Array<{
    product_id: string;
    product_name: string;
    score: number;
    confidence: 'very_high' | 'high' | 'medium' | 'low';
    reasons: string[];
  }>;
  ai_summary: string;
}
```

---

#### Tool 3: `track_competitors`
Monitor competitor activity on specific bids.

**Input Schema**:
```typescript
{
  bid_id: string;
  competitors: string[];  // Company names
}
```

**Output**:
```typescript
{
  bid_id: string;
  competitors: Array<{
    name: string;
    detected: boolean;
    last_seen: string;
    activity_count: number;
  }>;
}
```

---

#### Tool 4: `match_products`
Match CMNTech products to a bid opportunity.

**Input Schema**:
```typescript
{
  bid_id: string;
  threshold?: number;  // Minimum match score (0-100)
}
```

**Output**:
```typescript
{
  bid_id: string;
  matches: Array<{
    product_id: string;
    product_name: string;
    score: number;
    confidence: 'very_high' | 'high' | 'medium' | 'low';
    reasons: string[];
    requirements_match: string[];
    requirements_gap: string[];
  }>;
}
```

---

#### Tool 5: `create_proposal`
Generate AI-powered proposal draft.

**Input Schema**:
```typescript
{
  bid_id: string;
  product_ids: string[];
  tone?: 'professional' | 'friendly' | 'technical';
}
```

**Output**:
```typescript
{
  bid_id: string;
  proposal: {
    title: string;
    executive_summary: string;
    technical_approach: string;
    pricing: string;
    timeline: string;
    references: string[];
  };
  word_count: number;
}
```

---

#### Tool 6-12: (See implementation for full details)
- `schedule_crawl` - Schedule automated crawling
- `export_bids` - Export to Excel/CSV
- `get_statistics` - Fetch bid statistics
- `add_keyword`, `remove_keyword`, `get_keywords` - Keyword management
- `health_check` - Server health status

---

### 2.4 Resources Definition

#### Resource 1: `bid_data://`
Access bid data by ID.

**URI Pattern**: `bid_data://{bid_id}`

**MIME Type**: `application/json`

**Example**:
```
bid_data://123e4567-e89b-12d3-a456-426614174000
```

---

#### Resource 2: `company_profile://`
Fetch company/organization profile.

**URI Pattern**: `company_profile://{organization_name}`

**Example**:
```
company_profile://K-water수자원공사
```

---

#### Resource 3-5: (See implementation)
- `market_trends://` - Market analysis data
- `product_catalog://` - CMNTech product specs
- `crawl_stats://` - Crawling statistics

---

### 2.5 Prompts Definition

#### Prompt 1: `qualify_bid`
AI prompt template for bid qualification.

**Arguments**:
- `bid_id` (required)

**Template**:
```
Analyze this bid opportunity and determine if CMNTech should pursue it.

Bid Details:
{bid_data}

Product Matches:
{product_matches}

Evaluate:
1. Strategic fit (market, relationship, expertise)
2. Win probability (competition, price, timeline)
3. Resource requirements (team, time, cost)

Output: PURSUE | MONITOR | SKIP with reasoning.
```

---

#### Prompt 2: `match_product`
AI prompt for advanced product matching.

**Arguments**:
- `bid_id` (required)
- `requirements` (optional)

---

#### Prompt 3: `write_proposal`
AI prompt for proposal generation.

**Arguments**:
- `bid_id` (required)
- `product_ids` (required)
- `tone` (optional)

---

## 3. MCP Configuration

### 3.1 Complete Configuration File

**File**: `/home/user/forge-labs/apps/bidflow/mcp_config.json`

```json
{
  "mcpServers": {
    "bidflow": {
      "command": "node",
      "args": ["/home/user/forge-labs/apps/bidflow/mcp-server/dist/index.js"],
      "env": {
        "BIDFLOW_API_URL": "http://localhost:3010",
        "BIDFLOW_API_KEY": "${BIDFLOW_MCP_API_KEY}",
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_ANON_KEY": "${SUPABASE_ANON_KEY}",
        "NODE_ENV": "production"
      }
    },
    "hubspot": {
      "command": "npx",
      "args": ["-y", "@hubspot/mcp-server"],
      "env": {
        "HUBSPOT_ACCESS_TOKEN": "${HUBSPOT_ACCESS_TOKEN}",
        "HUBSPOT_PORTAL_ID": "${HUBSPOT_PORTAL_ID}"
      }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@github/mcp-server"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}",
        "GITHUB_REPO": "forge-labs/bidflow"
      }
    },
    "slack": {
      "command": "npx",
      "args": ["-y", "@korotovsky/slack-mcp-server"],
      "env": {
        "SLACK_BOT_TOKEN": "${SLACK_BOT_TOKEN}",
        "SLACK_CHANNEL_SALES": "${SLACK_CHANNEL_SALES}",
        "SLACK_CHANNEL_ALERTS": "${SLACK_CHANNEL_ALERTS}"
      }
    },
    "google-drive": {
      "command": "npx",
      "args": ["-y", "@google/mcp-server-drive"],
      "env": {
        "GOOGLE_OAUTH_CLIENT_ID": "${GOOGLE_OAUTH_CLIENT_ID}",
        "GOOGLE_OAUTH_CLIENT_SECRET": "${GOOGLE_OAUTH_CLIENT_SECRET}",
        "GOOGLE_OAUTH_REFRESH_TOKEN": "${GOOGLE_OAUTH_REFRESH_TOKEN}",
        "DRIVE_FOLDER_ID": "${DRIVE_FOLDER_ID}"
      }
    },
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"],
      "env": {
        "PLAYWRIGHT_HEADLESS": "true",
        "PLAYWRIGHT_BROWSER": "chromium"
      }
    },
    "n8n": {
      "command": "npx",
      "args": ["-y", "n8n-mcp"],
      "env": {
        "N8N_API_URL": "${N8N_API_URL}",
        "N8N_API_KEY": "${N8N_API_KEY}"
      }
    },
    "gmail": {
      "command": "npx",
      "args": ["-y", "@google/mcp-server-gmail"],
      "env": {
        "GOOGLE_OAUTH_CLIENT_ID": "${GOOGLE_OAUTH_CLIENT_ID}",
        "GOOGLE_OAUTH_CLIENT_SECRET": "${GOOGLE_OAUTH_CLIENT_SECRET}",
        "GOOGLE_OAUTH_REFRESH_TOKEN": "${GOOGLE_OAUTH_REFRESH_TOKEN}"
      }
    }
  }
}
```

---

### 3.2 Environment Variables

**File**: `/home/user/forge-labs/apps/bidflow/.env.mcp`

```bash
# BIDFLOW MCP Server
BIDFLOW_MCP_API_KEY=mcp_xxxxxxxxxxxxxxxxxxxxxxxxx
BIDFLOW_API_URL=http://localhost:3010
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# HubSpot
HUBSPOT_ACCESS_TOKEN=pat-na1-xxxxx
HUBSPOT_PORTAL_ID=12345678

# GitHub
GITHUB_TOKEN=ghp_xxxxx

# Slack
SLACK_BOT_TOKEN=xoxb-xxxxx
SLACK_CHANNEL_SALES=C123456
SLACK_CHANNEL_ALERTS=C789012

# Google (OAuth)
GOOGLE_OAUTH_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-xxxxx
GOOGLE_OAUTH_REFRESH_TOKEN=1//xxxxx

# Google Drive
DRIVE_FOLDER_ID=1abcdefg

# n8n
N8N_API_URL=https://n8n.forgelabs.io
N8N_API_KEY=n8n_api_xxxxx

# Security
MCP_AUDIT_LOG_PATH=/var/log/bidflow/mcp_audit.log
MCP_RATE_LIMIT_PER_MINUTE=60
```

---

## 4. Integration Patterns

### 4.1 Claude Code Integration

**Scenario**: Developer uses Claude Code to analyze bid opportunities.

**Flow**:
```
1. Developer: "Show me high-value bids from this week"
2. Claude Code → BIDFLOW MCP → search_bids()
3. BIDFLOW MCP → Returns 15 bids
4. Claude Code → Display in terminal + suggest next action
5. Developer: "Create HubSpot deal for bid #3"
6. Claude Code → HubSpot MCP → hubspot_create_deal()
7. HubSpot MCP → Deal created (ID: 12345)
8. Claude Code → Confirm success
```

**Code Example**:
```typescript
// Claude Code calls MCP tool
const bids = await mcpClient.callTool('bidflow', 'search_bids', {
  keywords: ['유량계', '초음파'],
  from_date: '2025-01-01',
  min_amount: 50000000,
  limit: 20
});

// Process results
for (const bid of bids.bids) {
  if (bid.match_score > 80) {
    await mcpClient.callTool('hubspot', 'hubspot_create_deal', {
      dealname: bid.title,
      amount: bid.estimated_amount,
      closedate: bid.deadline,
      pipeline: 'default',
      dealstage: 'appointmentscheduled'
    });
  }
}
```

---

### 4.2 Claude Chrome Integration

**Scenario**: User browses 나라장터 website and triggers automation via Claude Chrome extension.

**Flow**:
```
1. User visits bid detail page
2. Claude Chrome detects URL pattern
3. User: "Add this bid to our tracker"
4. Claude Chrome → BIDFLOW MCP → search_bids(external_id=...)
5. BIDFLOW MCP → Bid already exists OR create new
6. Claude Chrome → HubSpot MCP → hubspot_create_deal()
7. Claude Chrome → Slack MCP → slack_send_message(#sales)
8. User → Notification: "Bid tracked + CRM updated + Team notified"
```

---

### 4.3 Automated Workflow (n8n)

**Scenario**: Daily automated bid discovery and qualification.

**Flow**:
```
┌─────────────────────────────────────────────────────┐
│           n8n Workflow: Daily Bid Pipeline          │
├─────────────────────────────────────────────────────┤
│ 1. Schedule (Cron: 0 8 * * *)                       │
│    ↓                                                 │
│ 2. BIDFLOW MCP: search_bids(today)                  │
│    ↓                                                 │
│ 3. Filter: match_score > 70                         │
│    ↓                                                 │
│ 4. For each bid:                                    │
│    ├── BIDFLOW MCP: match_products()                │
│    ├── BIDFLOW MCP: create_proposal()               │
│    ├── HubSpot MCP: hubspot_create_deal()           │
│    ├── Google Drive MCP: drive_upload_file()        │
│    ├── Slack MCP: slack_send_message()              │
│    └── Gmail MCP: gmail_send_email(sales_team)      │
│    ↓                                                 │
│ 5. BIDFLOW MCP: get_statistics()                    │
│    ↓                                                 │
│ 6. Slack MCP: slack_send_message(#daily-digest)     │
└─────────────────────────────────────────────────────┘
```

**n8n Workflow JSON**: (See implementation files)

---

### 4.4 Error Handling and Retry Logic

**Pattern**: Exponential backoff with circuit breaker.

```typescript
async function callMCPToolWithRetry(
  server: string,
  tool: string,
  args: unknown,
  maxRetries = 3
): Promise<unknown> {
  let attempt = 0;
  let delay = 1000;

  while (attempt < maxRetries) {
    try {
      return await mcpClient.callTool(server, tool, args);
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) throw error;

      // Exponential backoff
      await sleep(delay);
      delay *= 2;

      // Log retry
      console.warn(`[MCP] Retry ${attempt}/${maxRetries} for ${server}.${tool}`);
    }
  }
}

// Circuit breaker state
const circuitBreaker = new Map<string, {
  failures: number;
  lastFailure: number;
  state: 'closed' | 'open' | 'half-open';
}>();

function shouldAllowRequest(server: string): boolean {
  const breaker = circuitBreaker.get(server);
  if (!breaker || breaker.state === 'closed') return true;

  // Open circuit after 5 failures
  if (breaker.failures >= 5) {
    breaker.state = 'open';
    // Try again after 60s
    if (Date.now() - breaker.lastFailure > 60000) {
      breaker.state = 'half-open';
      return true;
    }
    return false;
  }

  return true;
}
```

---

## 5. Security Considerations

### 5.1 API Key Management

**Strategy**: Environment variable injection + Secret rotation.

**Storage**:
- **Development**: `.env.mcp` (gitignored)
- **Production**: AWS Secrets Manager OR Doppler

**Rotation Policy**:
- HubSpot PAT: 90 days
- GitHub Token: 90 days
- Slack Bot Token: Never (unless compromised)
- Google OAuth Refresh: 6 months

**Implementation**:
```typescript
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

async function getSecret(secretName: string): Promise<string> {
  const client = new SecretsManagerClient({ region: 'ap-northeast-2' });
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretName })
  );
  return response.SecretString!;
}

// Load secrets
const secrets = {
  hubspot: await getSecret('bidflow/mcp/hubspot'),
  github: await getSecret('bidflow/mcp/github'),
  slack: await getSecret('bidflow/mcp/slack'),
};
```

---

### 5.2 Permission Scoping

**Principle**: Least privilege - only grant minimum required permissions.

**HubSpot**:
- ✅ Contacts: Read/Write
- ✅ Deals: Read/Write
- ✅ Companies: Read
- ❌ Settings: None
- ❌ Reporting: None

**GitHub**:
- ✅ Contents: Read (workflow files)
- ✅ Workflows: Trigger
- ✅ Issues: Write
- ❌ Admin: None
- ❌ Packages: None

**Slack**:
- ✅ chat:write (specific channels only)
- ❌ chat:write.public (no public channel spam)
- ✅ users:read (for @mentions)
- ❌ admin.* (no workspace admin access)

**Google Drive**:
- ✅ drive.file (only files created by app)
- ❌ drive (no full Drive access)

**Gmail**:
- ✅ gmail.send (send only)
- ✅ gmail.readonly (read for thread replies)
- ❌ gmail.modify (no delete/archive)

---

### 5.3 Audit Logging

**Implementation**: Structured JSON logs with rotation.

**Log Format**:
```json
{
  "timestamp": "2025-12-24T12:34:56.789Z",
  "event_type": "mcp_tool_call",
  "server": "bidflow",
  "tool": "search_bids",
  "user": "claude-code-session-abc123",
  "ip_address": "127.0.0.1",
  "arguments": {
    "keywords": ["유량계"],
    "limit": 20
  },
  "result": {
    "status": "success",
    "duration_ms": 234,
    "records_returned": 15
  },
  "metadata": {
    "session_id": "sess_xyz789",
    "client_version": "1.0.0"
  }
}
```

**Storage**:
- **File**: `/var/log/bidflow/mcp_audit.log` (daily rotation)
- **Database**: `mcp_audit_logs` table (Supabase)
- **SIEM**: Forward to Datadog/Splunk (production)

**Retention**: 90 days (compliance requirement)

**Code**:
```typescript
import { createWriteStream } from 'fs';
import { createClient } from '@supabase/supabase-js';

const auditLog = createWriteStream(process.env.MCP_AUDIT_LOG_PATH!, { flags: 'a' });
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

async function logMCPToolCall(event: AuditLogEvent): Promise<void> {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ...event
  };

  // Write to file
  auditLog.write(JSON.stringify(logEntry) + '\n');

  // Write to database
  await supabase.from('mcp_audit_logs').insert(logEntry);

  // Alert on suspicious activity
  if (event.result?.status === 'error' && event.result.error?.includes('unauthorized')) {
    await sendSlackAlert('#security', `⚠️ Unauthorized MCP access attempt: ${JSON.stringify(event)}`);
  }
}
```

---

### 5.4 Rate Limiting

**Strategy**: Token bucket algorithm per MCP server.

**Limits**:
- BIDFLOW MCP: 60 requests/minute
- HubSpot MCP: 100 requests/10 seconds
- GitHub MCP: 5000 requests/hour
- Slack MCP: 1 message/second (burst: 10)

**Implementation**:
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!
});

const rateLimiters = {
  bidflow: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '1 m'),
    analytics: true
  }),
  hubspot: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '10 s')
  }),
  slack: new Ratelimit({
    redis,
    limiter: Ratelimit.tokenBucket(10, '1 s', 10)
  })
};

async function checkRateLimit(server: string, identifier: string): Promise<boolean> {
  const limiter = rateLimiters[server];
  if (!limiter) return true;

  const { success } = await limiter.limit(identifier);
  return success;
}
```

---

### 5.5 Input Validation

**Strategy**: Zod schema validation for all MCP tool inputs.

**Example**:
```typescript
import { z } from 'zod';

const SearchBidsInputSchema = z.object({
  keywords: z.array(z.string()).optional(),
  source: z.enum(['narajangto', 'kepco', 'ted']).optional(),
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
  min_amount: z.number().int().min(0).optional(),
  max_amount: z.number().int().min(0).optional(),
  status: z.enum(['new', 'reviewing', 'submitted']).optional(),
  limit: z.number().int().min(1).max(100).default(20)
});

// Validate before processing
function validateToolInput(tool: string, input: unknown): unknown {
  const schema = toolSchemas[tool];
  if (!schema) throw new Error(`Unknown tool: ${tool}`);

  const result = schema.safeParse(input);
  if (!result.success) {
    throw new Error(`Invalid input: ${result.error.message}`);
  }

  return result.data;
}
```

---

## 6. Implementation Guide

### 6.1 Setup Steps

**1. Install Dependencies**:
```bash
cd /home/user/forge-labs/apps/bidflow/mcp-server
pnpm install
```

**2. Configure Environment**:
```bash
cp .env.example .env.mcp
# Edit .env.mcp with actual credentials
```

**3. Build MCP Server**:
```bash
pnpm build
```

**4. Test Locally**:
```bash
pnpm dev
# Server starts on http://localhost:3011
```

**5. Register with Claude**:
```bash
# Copy mcp_config.json to Claude config directory
cp mcp_config.json ~/.config/claude-code/mcp.json
```

---

### 6.2 Development Workflow

**1. Add New Tool**:
```typescript
// mcp-server/src/tools/my_new_tool.ts
import { z } from 'zod';
import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const myNewTool: Tool = {
  name: 'my_new_tool',
  description: 'Description of what it does',
  inputSchema: {
    type: 'object',
    properties: {
      param1: { type: 'string' },
      param2: { type: 'number' }
    },
    required: ['param1']
  }
};

export async function handleMyNewTool(args: unknown): Promise<unknown> {
  // Validate
  const input = MyNewToolInputSchema.parse(args);

  // Execute
  const result = await doSomething(input);

  // Return
  return result;
}
```

**2. Register Tool**:
```typescript
// mcp-server/src/index.ts
import { myNewTool, handleMyNewTool } from './tools/my_new_tool.js';

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    searchBidsTool,
    getBidDetailsTool,
    myNewTool  // Add here
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case 'search_bids':
      return await handleSearchBids(request.params.arguments);
    case 'my_new_tool':
      return await handleMyNewTool(request.params.arguments);
    default:
      throw new Error(`Unknown tool: ${request.params.name}`);
  }
});
```

**3. Test Tool**:
```bash
# Use MCP Inspector
npx @modelcontextprotocol/inspector node dist/index.js
```

---

## 7. Testing & Monitoring

### 7.1 Unit Tests

**Framework**: Vitest

**Example**:
```typescript
// mcp-server/src/__tests__/tools/search_bids.test.ts
import { describe, it, expect, vi } from 'vitest';
import { handleSearchBids } from '../../tools/search_bids.js';

describe('search_bids tool', () => {
  it('should return bids matching keywords', async () => {
    const result = await handleSearchBids({
      keywords: ['유량계'],
      limit: 5
    });

    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('bids');
    expect(Array.isArray(result.bids)).toBe(true);
  });

  it('should validate date range', async () => {
    await expect(handleSearchBids({
      from_date: 'invalid-date'
    })).rejects.toThrow();
  });
});
```

---

### 7.2 Integration Tests

**Scenario**: End-to-end MCP workflow.

```typescript
// e2e/mcp-workflow.test.ts
import { MCPClient } from '@modelcontextprotocol/sdk/client/index.js';

describe('MCP Integration', () => {
  let client: MCPClient;

  beforeAll(async () => {
    client = new MCPClient({
      name: 'test-client',
      version: '1.0.0'
    }, {
      capabilities: {}
    });

    await client.connect({
      command: 'node',
      args: ['dist/index.js']
    });
  });

  it('should search bids and create HubSpot deal', async () => {
    // Step 1: Search bids
    const bids = await client.callTool('search_bids', {
      keywords: ['유량계'],
      limit: 1
    });

    expect(bids.bids.length).toBeGreaterThan(0);

    // Step 2: Create HubSpot deal
    const deal = await client.callTool('hubspot_create_deal', {
      dealname: bids.bids[0].title,
      amount: bids.bids[0].estimated_amount
    });

    expect(deal).toHaveProperty('id');
  });

  afterAll(async () => {
    await client.close();
  });
});
```

---

### 7.3 Monitoring Dashboard

**Metrics to Track**:
- MCP tool call rate (per minute)
- Success/failure ratio
- Average latency
- Error rate by tool
- API quota usage (HubSpot, GitHub, etc.)

**Tools**:
- **Grafana** + **Prometheus** (self-hosted)
- **Datadog** (SaaS)

**Example Prometheus Metrics**:
```typescript
import { Registry, Counter, Histogram } from 'prom-client';

const registry = new Registry();

const mcpToolCalls = new Counter({
  name: 'mcp_tool_calls_total',
  help: 'Total MCP tool calls',
  labelNames: ['server', 'tool', 'status'],
  registers: [registry]
});

const mcpToolLatency = new Histogram({
  name: 'mcp_tool_latency_seconds',
  help: 'MCP tool latency in seconds',
  labelNames: ['server', 'tool'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [registry]
});

// Instrument tool calls
async function instrumentedToolCall(server: string, tool: string, fn: () => Promise<unknown>) {
  const start = Date.now();
  try {
    const result = await fn();
    mcpToolCalls.inc({ server, tool, status: 'success' });
    return result;
  } catch (error) {
    mcpToolCalls.inc({ server, tool, status: 'error' });
    throw error;
  } finally {
    mcpToolLatency.observe({ server, tool }, (Date.now() - start) / 1000);
  }
}
```

---

## Appendices

### A. MCP Specification References

- [MCP Spec 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25)
- [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Registry](https://registry.modelcontextprotocol.io)

### B. External MCP Servers

- [HubSpot MCP](https://developers.hubspot.com/mcp)
- [GitHub MCP](https://github.com/github/mcp-server)
- [Slack MCP](https://github.com/korotovsky/slack-mcp-server)
- [Google Drive MCP](https://github.com/google/mcp-server-drive)
- [Playwright MCP](https://github.com/microsoft/playwright-mcp)

### C. Security Best Practices

- [OAuth 2.1 RFC](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)

---

**Document Status**: Ready for Implementation
**Next Steps**: Implement custom BIDFLOW MCP server (see TypeScript code)
**Questions?**: Contact DevOps team or Claude Code support
