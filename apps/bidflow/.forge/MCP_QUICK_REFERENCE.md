# BIDFLOW MCP Quick Reference Card

> **Cheat sheet for developers and AI agents using BIDFLOW MCP Server**

---

## 🚀 Quick Start

```bash
cd /home/user/forge-labs/apps/bidflow/mcp-server
./scripts/setup.sh
pnpm dev
pnpm inspector
```

---

## 🛠️ Tools (12)

### Search & Discovery

| Tool | Input | Output | Example |
|------|-------|--------|---------|
| `search_bids` | keywords, filters | List of bids | `{"keywords": ["유량계"], "limit": 10}` |
| `get_bid_details` | bid_id | Detailed bid info | `{"bid_id": "uuid"}` |
| `get_statistics` | period, source | Analytics | `{"period": "week"}` |

### Product & Proposal

| Tool | Input | Output | Example |
|------|-------|--------|---------|
| `match_products` | bid_id, threshold | Product matches | `{"bid_id": "uuid", "threshold": 70}` |
| `create_proposal` | bid_id, product_ids, tone | Proposal draft | `{"bid_id": "uuid", "product_ids": ["UR-1000PLUS"]}` |

### Automation

| Tool | Input | Output | Example |
|------|-------|--------|---------|
| `schedule_crawl` | source, schedule | Crawl job | `{"source": "narajangto", "immediate": true}` |
| `export_bids` | bid_ids, format | Export file | `{"format": "excel"}` |
| `track_competitors` | bid_id, competitors | Tracking config | `{"bid_id": "uuid", "competitors": ["회사A"]}` |

### Keywords

| Tool | Input | Output | Example |
|------|-------|--------|---------|
| `add_keyword` | keyword, category | Success | `{"keyword": "초음파유량계"}` |
| `remove_keyword` | keyword | Success | `{"keyword": "deprecated"}` |
| `get_keywords` | - | Keyword list | `{}` |

### Health

| Tool | Input | Output | Example |
|------|-------|--------|---------|
| `health_check` | - | Health status | `{}` |

---

## 📦 Resources (5)

### URI Patterns

```
bid_data://{bid_id}                          # Bid data by UUID
company_profile://{organization_name}         # Organization history
market_trends://{category}                    # Market analysis
product_catalog://                            # CMNTech products
crawl_stats://{source}                        # Crawl statistics
```

### Examples

```typescript
// Read bid data
mcp.readResource('bid_data://123e4567-e89b-12d3-a456-426614174000')

// Get company profile
mcp.readResource('company_profile://K-water수자원공사')

// View product catalog
mcp.readResource('product_catalog://')
```

---

## 💬 Prompts (3)

### Prompt Templates

| Prompt | Arguments | Purpose |
|--------|-----------|---------|
| `qualify_bid` | bid_id | Go/no-go decision |
| `match_product` | bid_id, requirements | Product matching |
| `write_proposal` | bid_id, product_ids, tone | Proposal generation |

### Examples

```typescript
// Qualify a bid
const prompt = await mcp.getPrompt('qualify_bid', {
  bid_id: 'uuid'
});
// Send to AI: Should we pursue this bid?

// Match products
const prompt = await mcp.getPrompt('match_product', {
  bid_id: 'uuid',
  requirements: 'DN300 파이프, 상수도용'
});

// Generate proposal
const prompt = await mcp.getPrompt('write_proposal', {
  bid_id: 'uuid',
  product_ids: 'UR-1000PLUS,MF-1000C',
  tone: 'professional'
});
```

---

## 🔐 Environment Variables

### Required

```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
BIDFLOW_API_URL=http://localhost:3010
```

### Optional

```bash
BIDFLOW_API_KEY=mcp_secure_key
NARA_JANGTO_API_KEY=data_go_kr_key
MCP_RATE_LIMIT_PER_MINUTE=60
MCP_AUDIT_LOG_PATH=/var/log/bidflow/mcp.log
NODE_ENV=production
```

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                 Claude Code / Claude Chrome              │
│                    (MCP Client)                          │
└────────────────────────┬────────────────────────────────┘
                         │
                         │ MCP Protocol (JSON-RPC)
                         │
        ┌────────────────┴────────────────┐
        │                                 │
┌───────▼────────┐              ┌─────────▼────────┐
│ BIDFLOW MCP    │              │ External MCP     │
│ Server         │              │ Servers          │
│ (Port 3011)    │              │ - HubSpot        │
│                │              │ - GitHub         │
│ Tools: 12      │              │ - Slack          │
│ Resources: 5   │              │ - Google Drive   │
│ Prompts: 3     │              │ - Playwright     │
└───────┬────────┘              │ - n8n            │
        │                       │ - Gmail          │
        │                       └──────────────────┘
        │
        │ HTTP API
        │
┌───────▼───────────────────────────────────────────────┐
│            BIDFLOW Next.js App (Port 3010)            │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │ API Routes   │  │ NaraJangto   │  │ Product     │ │
│  │              │  │ Client       │  │ Matcher     │ │
│  └──────────────┘  └──────────────┘  └─────────────┘ │
└───────────────────────────┬───────────────────────────┘
                            │
                            │ SQL
                            │
                 ┌──────────▼──────────┐
                 │  Supabase Database  │
                 │  - bids             │
                 │  - pipeline_entries │
                 │  - crawl_jobs       │
                 │  - mcp_audit_logs   │
                 └─────────────────────┘
```

---

## 🔄 Common Workflows

### Workflow 1: Daily Bid Discovery

```typescript
1. search_bids({ status: 'new', from_date: today })
2. FOR each high-value bid:
   3. get_bid_details({ bid_id })
   4. match_products({ bid_id, threshold: 70 })
   5. IF match_score > 80:
      6. hubspot.create_deal()
      7. slack.send_message('#sales')
      8. create_proposal()
```

### Workflow 2: Competitive Intelligence

```typescript
1. search_bids({ organization: 'K-water' })
2. track_competitors({ bid_id, competitors: ['회사A', '회사B'] })
3. readResource('company_profile://K-water')
4. readResource('market_trends://flow_meters')
5. getPrompt('qualify_bid', { bid_id })
```

### Workflow 3: Proposal Automation

```typescript
1. get_bid_details({ bid_id })
2. match_products({ bid_id })
3. create_proposal({ bid_id, product_ids, tone: 'professional' })
4. drive.upload_file(proposal)
5. gmail.send_email(team)
```

---

## 📊 CMNTech Products

| ID | Name | Pipe Size | Applications |
|----|------|-----------|--------------|
| `UR-1000PLUS` | 다회선 초음파 유량계 | 100-4000mm | 상수도, 취수장, 정수장 |
| `MF-1000C` | 일체형 전자유량계 | 15-2000mm | 상거래용, 공업용수 |
| `UR-1010PLUS` | 비만관형 초음파 | 200-3000mm | 하수, 우수, 복류수 |
| `SL-3000PLUS` | 개수로 유량계 | N/A | 하천, 개수로, 방류 |
| `EnerRay` | 초음파 열량계 | 15-300mm | 난방, 열교환 |

---

## 🐛 Troubleshooting

### Server Won't Start

```bash
# Check Node.js version
node -v  # Should be 20+

# Check environment
cat .env | grep SUPABASE

# Test Supabase connection
node -e "const {createClient}=require('@supabase/supabase-js');..."
```

### Tools Returning Empty

```bash
# Check database has data
# Supabase Dashboard → Table Editor → bids

# Check API connection
curl http://localhost:3010/api/v1/health
```

### Rate Limit Errors

```bash
# Increase limit
echo "MCP_RATE_LIMIT_PER_MINUTE=120" >> .env

# Restart
pnpm dev
```

---

## 🔗 Useful Links

- **Architecture**: `.forge/MCP_INTEGRATION_ARCHITECTURE.md`
- **Summary**: `.forge/MCP_IMPLEMENTATION_SUMMARY.md`
- **README**: `mcp-server/README.md`
- **MCP Spec**: https://modelcontextprotocol.io/specification/2025-11-25
- **TypeScript SDK**: https://github.com/modelcontextprotocol/typescript-sdk

---

## 📞 Support

- **Issues**: https://github.com/forge-labs/bidflow/issues
- **Email**: support@forgelabs.io
- **Slack**: #bidflow-support

---

**Last Updated**: 2025-12-24
**Version**: 1.0.0
