# BIDFLOW MCP Server

> **Model Context Protocol server for 나라장터 bid automation**
>
> Version: 1.0.0
> MCP Spec: 2025-11-25
> License: MIT

## Overview

BIDFLOW MCP Server exposes BIDFLOW's bid discovery and product matching capabilities to AI agents via the Model Context Protocol (MCP). This enables Claude Code, Claude Chrome, and other MCP-compatible AI tools to:

- 🔍 Search for bid opportunities from 나라장터 (Korean public procurement)
- 📊 Analyze and match CMNTech products to bids
- 📝 Generate AI-powered proposal drafts
- 🏢 Track competitors and market trends
- 📈 Access analytics and statistics

## Features

### 🛠️ Tools (12)

| Tool | Description |
|------|-------------|
| `search_bids` | Search bid opportunities with advanced filtering |
| `get_bid_details` | Fetch comprehensive bid information |
| `match_products` | AI-powered product matching |
| `create_proposal` | Generate proposal drafts |
| `track_competitors` | Monitor competitor activity |
| `schedule_crawl` | Schedule automated data collection |
| `export_bids` | Export to Excel/CSV/JSON |
| `get_statistics` | Bid analytics and metrics |
| `add_keyword` | Add tracking keywords |
| `remove_keyword` | Remove tracking keywords |
| `get_keywords` | List all tracked keywords |
| `health_check` | Server health status |

### 📦 Resources (5)

| Resource | URI Pattern | Description |
|----------|-------------|-------------|
| Bid Data | `bid_data://{bid_id}` | Access bid by UUID |
| Company Profile | `company_profile://{name}` | Organization history |
| Market Trends | `market_trends://{category}` | Market analysis |
| Product Catalog | `product_catalog://` | CMNTech products |
| Crawl Stats | `crawl_stats://{source}` | Crawling statistics |

### 💬 Prompts (3)

| Prompt | Description |
|--------|-------------|
| `qualify_bid` | Bid qualification template |
| `match_product` | Product matching template |
| `write_proposal` | Proposal generation template |

## Quick Start

### 1. Installation

```bash
cd mcp-server
pnpm install
```

### 2. Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env
```

Required environment variables:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `BIDFLOW_API_URL` - BIDFLOW Next.js API URL (default: http://localhost:3010)
- `BIDFLOW_API_KEY` - API key for BIDFLOW (optional)

### 3. Build

```bash
pnpm build
```

### 4. Run

```bash
# Development mode (with auto-reload)
pnpm dev

# Production mode
pnpm start
```

### 5. Test with MCP Inspector

```bash
pnpm inspector
```

This opens the MCP Inspector UI where you can test tools, resources, and prompts interactively.

## Usage Examples

### Example 1: Search for Flow Meter Bids

```typescript
// Claude Code calling the search_bids tool
const result = await mcp.callTool('search_bids', {
  keywords: ['유량계', '초음파'],
  min_amount: 50000000,
  status: 'new',
  limit: 10
});

console.log(`Found ${result.total} bids`);
result.bids.forEach(bid => {
  console.log(`- ${bid.title} (Match: ${bid.match_score}/100)`);
});
```

### Example 2: Qualify a Bid

```typescript
// Use the qualify_bid prompt
const prompt = await mcp.getPrompt('qualify_bid', {
  bid_id: '123e4567-e89b-12d3-a456-426614174000'
});

// Send to AI model
const analysis = await ai.complete(prompt);
console.log(analysis); // PURSUE | MONITOR | SKIP
```

### Example 3: Access Company Profile

```typescript
// Read company_profile resource
const profile = await mcp.readResource('company_profile://K-water수자원공사');

console.log(`Total bids: ${profile.total_bids}`);
console.log(`Total value: ₩${profile.total_value.toLocaleString()}`);
```

## Integration with Claude

### Claude Code (CLI)

Add to `~/.config/claude-code/mcp.json`:

```json
{
  "mcpServers": {
    "bidflow": {
      "command": "node",
      "args": ["/path/to/bidflow/mcp-server/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://xxx.supabase.co",
        "SUPABASE_ANON_KEY": "eyJhbGci...",
        "BIDFLOW_API_URL": "http://localhost:3010"
      }
    }
  }
}
```

Then use in Claude Code:

```bash
claude> Search for high-value flow meter bids from this week
# Claude will automatically call search_bids tool
```

### Claude Desktop

Add to Claude Desktop settings:

1. Open Claude Desktop settings
2. Navigate to "Developer" tab
3. Click "Edit Config"
4. Add BIDFLOW MCP server configuration
5. Restart Claude Desktop

## Development

### Project Structure

```
mcp-server/
├── src/
│   ├── index.ts           # Main server entry point
│   ├── tools/             # MCP tools implementation
│   │   ├── index.ts       # Tool registry
│   │   ├── search_bids.ts
│   │   ├── get_bid_details.ts
│   │   ├── match_products.ts
│   │   └── ...
│   ├── resources/         # MCP resources
│   │   └── index.ts
│   ├── prompts/           # MCP prompts
│   │   └── index.ts
│   └── lib/               # Shared utilities
│       ├── supabase.ts    # Database client
│       ├── api-client.ts  # BIDFLOW API client
│       ├── audit.ts       # Audit logging
│       └── rate-limit.ts  # Rate limiting
├── package.json
├── tsconfig.json
└── .env.example
```

### Adding a New Tool

1. Create tool file in `src/tools/my_tool.ts`:

```typescript
import { z } from 'zod';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

const MyToolInputSchema = z.object({
  param: z.string()
});

export const myTool: Tool = {
  name: 'my_tool',
  description: 'What this tool does',
  inputSchema: {
    type: 'object',
    properties: {
      param: { type: 'string' }
    },
    required: ['param']
  }
};

export async function handleMyTool(args: unknown) {
  const input = MyToolInputSchema.parse(args);
  // Implementation
  return { result: 'success' };
}
```

2. Register in `src/tools/index.ts`:

```typescript
import { myTool, handleMyTool } from './my_tool.js';

export const tools = [
  // ... existing tools
  myTool
];

export async function handleToolCall(name: string, args: unknown) {
  switch (name) {
    // ... existing cases
    case 'my_tool':
      return await handleMyTool(args);
  }
}
```

3. Rebuild and test:

```bash
pnpm build
pnpm inspector
```

## Testing

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Type checking
pnpm typecheck
```

## Deployment

### Production Build

```bash
NODE_ENV=production pnpm build
```

### Running as a Service

Create systemd service file `/etc/systemd/system/bidflow-mcp.service`:

```ini
[Unit]
Description=BIDFLOW MCP Server
After=network.target

[Service]
Type=simple
User=bidflow
WorkingDirectory=/opt/bidflow/mcp-server
ExecStart=/usr/bin/node /opt/bidflow/mcp-server/dist/index.js
Restart=always
Environment=NODE_ENV=production
EnvironmentFile=/opt/bidflow/mcp-server/.env

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable bidflow-mcp
sudo systemctl start bidflow-mcp
sudo systemctl status bidflow-mcp
```

## Security

### Rate Limiting

Default: 60 requests/minute per tool
Configure: `MCP_RATE_LIMIT_PER_MINUTE` environment variable

### Audit Logging

All tool calls are logged to:
- File: `MCP_AUDIT_LOG_PATH` (default: `/tmp/bidflow-mcp-audit.log`)
- Database: `mcp_audit_logs` table

### API Authentication

Set `BIDFLOW_API_KEY` to secure communication between MCP server and BIDFLOW API.

## Troubleshooting

### Server won't start

```bash
# Check environment variables
node -e "require('dotenv').config(); console.log(process.env)"

# Check Supabase connection
node -e "require('@supabase/supabase-js').createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY).from('bids').select('id').limit(1)"
```

### Tools failing

```bash
# Enable debug logging
DEBUG=* pnpm start

# Check audit logs
tail -f /tmp/bidflow-mcp-audit.log
```

### Rate limit errors

Increase limit in `.env`:

```bash
MCP_RATE_LIMIT_PER_MINUTE=120
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-tool`)
3. Commit changes (`git commit -m 'Add amazing tool'`)
4. Push to branch (`git push origin feature/amazing-tool`)
5. Open Pull Request

## License

MIT © Forge Labs

## Resources

- [MCP Specification](https://modelcontextprotocol.io/specification/2025-11-25)
- [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [BIDFLOW Documentation](../.forge/MCP_INTEGRATION_ARCHITECTURE.md)

## Support

- Issues: [GitHub Issues](https://github.com/forge-labs/bidflow/issues)
- Email: support@forgelabs.io
- Claude Code: `/help mcp`
