# BIDFLOW Chrome Extension v2.0

AI-powered bid information extraction for BIDFLOW

## Features

- ✅ **One-Click Extraction**: Extract bid info from procurement websites with a single click
- ✅ **AI-Powered**: Uses Claude AI to intelligently parse and extract structured data
- ✅ **Secure**: Server-side API key management, no credentials in extension
- ✅ **Multi-Platform**: Supports 5+ procurement platforms (G2B, UNGM, DgMarket, TED, SAM.gov)
- ✅ **Real-Time Stats**: Track extraction count, AI usage, and success rate
- ✅ **Auto-Save**: Automatically save extracted bids to your BIDFLOW account

## Installation

### Development

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `chrome-extension` directory

### Production

_Coming soon to Chrome Web Store_

## Supported Platforms

| Platform | Domain | Status |
|----------|--------|--------|
| 나라장터 (G2B) | g2b.go.kr | ✅ Supported |
| UN Global Marketplace | ungm.org | ✅ Supported |
| DgMarket | dgmarket.com | ✅ Supported |
| TED (EU) | ted.europa.eu | ✅ Supported |
| SAM.gov (US) | sam.gov | ✅ Supported |

## Usage

### 1. Sign In

Click the BIDFLOW extension icon and sign in to your BIDFLOW account.

### 2. Navigate to Bid Page

Go to any supported procurement website and open a bid detail page.

### 3. Extract Bid

You'll see a floating "Extract Bid" button in the bottom right. Click it to extract the bid information.

### 4. Review & Save

The extracted data will be shown in a notification. Click "View in BIDFLOW" to review and save to your account.

## Settings

### Development Mode

Toggle between production (`bidflow.vercel.app`) and development (`localhost:3010`) APIs.

### Auto-Extract

Automatically save extracted bids to your BIDFLOW account without confirmation.

## Architecture

```
┌─────────────────┐
│  Bid Website    │
│  (g2b.go.kr)    │
└────────┬────────┘
         │
         │ (content.js extracts HTML)
         │
┌────────▼────────┐
│ Content Script  │
│  (content.js)   │
└────────┬────────┘
         │
         │ (chrome.runtime.sendMessage)
         │
┌────────▼────────┐
│ Background      │
│ Service Worker  │
│ (background.js) │
└────────┬────────┘
         │
         │ (POST /api/v1/ai/extract-bid)
         │
┌────────▼────────┐
│ BIDFLOW API     │
│  + Claude AI    │
└─────────────────┘
```

## Security

- ✅ **No API keys in extension**: All AI processing happens server-side
- ✅ **HTTPS only**: Only extracts from secure HTTPS pages
- ✅ **Domain whitelist**: Only works on approved procurement domains
- ✅ **Content size limit**: Prevents abuse with 50KB HTML limit
- ✅ **Rate limiting**: Server-side rate limits prevent spam
- ✅ **Authentication**: Requires valid BIDFLOW account

## Cost Control

- **Daily quota**: $1 per user per day
- **Caching**: Identical extractions use cached results (free)
- **Model optimization**: Uses Claude Haiku/Sonnet based on complexity

## Development

### File Structure

```
chrome-extension/
├── manifest.json           # Extension configuration
├── popup.html              # Popup UI
├── scripts/
│   ├── background.js       # Service worker (API calls)
│   ├── content.js          # Content script (page injection)
│   └── popup.js            # Popup logic
├── styles/
│   └── content.css         # Injected page styles
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

### Testing

1. Load extension in Chrome
2. Enable "Development Mode" in popup settings
3. Navigate to a test bid page
4. Click "Extract Bid"
5. Check console for logs

### API Endpoints

#### Extract Bid

```typescript
POST /api/v1/ai/extract-bid
Authorization: Bearer <token>

{
  "url": "https://www.g2b.go.kr/...",
  "html": "<html>...</html>"
}
```

#### Save Bid

```typescript
POST /api/v1/bids
Authorization: Bearer <token>

{
  "title": "...",
  "organization": "...",
  "budget": 100000000,
  "deadline": "2025-01-31",
  ...
}
```

## Troubleshooting

### "Not authenticated" error

1. Click extension icon
2. Click "Sign In to BIDFLOW"
3. Complete authentication
4. Return to bid page and try again

### Extraction fails

1. Check if page is on supported domain
2. Verify page is a bid detail page (not search results)
3. Check console for errors
4. Try refreshing the page

### Quota exceeded

Your daily AI usage quota ($1) has been reached. Wait until tomorrow or contact support to increase your limit.

## Version History

### v2.0.0 (2025-12-25)

- ✅ Complete rewrite with Manifest V3
- ✅ Claude AI integration
- ✅ Server-side API key management
- ✅ Multi-platform support
- ✅ Real-time stats tracking
- ✅ Auto-save functionality
- ✅ Development mode toggle

## Support

- **Documentation**: `/CLAUDE_AI_INTEGRATION.md`
- **Issues**: https://github.com/sihu2/forge-labs/issues
- **Email**: support@bidflow.app

---

**License**: MIT
**Author**: BIDFLOW Team
**Last Updated**: 2025-12-25
