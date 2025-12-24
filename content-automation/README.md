# Content Marketing Automation System

> Claude AI-powered content marketing automation for solo developers

**Save 80% time. 10x content output. $135/month total cost.**

---

## What This System Does

Automates your entire content marketing workflow:

1. **📊 Keyword Research** → Auto-discovers high-opportunity keywords every week
2. **📝 Content Generation** → Claude writes SEO-optimized blog posts
3. **✅ Quality Control** → Automated SEO audits + grammar checks
4. **📢 Multi-Platform Distribution** → Auto-repurposes for LinkedIn, Twitter, email
5. **📈 Performance Tracking** → Real-time engagement metrics in Notion

---

## Tech Stack

| Component | Tool | Cost/Month |
|-----------|------|------------|
| **AI Writing** | Claude Opus 4 API | $18 |
| **Workflow Automation** | n8n (self-hosted) | $0 |
| **Content Management** | Notion | $10 |
| **Keyword Research** | DataForSEO | $50 |
| **Grammar Check** | Grammarly API | $12 |
| **Social Scheduling** | Buffer | $6 |
| **Email** | ConvertKit | $9 |
| **Image Generation** | DALL-E 3 | $10 |
| **Analytics** | Google Analytics 4 | $0 |
| **Total** | | **$115/mo** |

---

## Quick Start

### 1. Clone & Install

```bash
git clone <this-repo>
cd content-automation
npm install
```

### 2. Configure Environment

```bash
cp config/.env.example config/.env
# Edit .env with your API keys
```

**Required API Keys**:
- [ ] Claude API key → [console.anthropic.com](https://console.anthropic.com)
- [ ] Notion integration → [notion.so/my-integrations](https://www.notion.so/my-integrations)
- [ ] Google Search Console → [search.google.com/search-console](https://search.google.com/search-console)

### 3. Run Setup Script

```bash
npm run setup
```

This will:
- Verify prerequisites
- Start n8n (local Docker container)
- Guide you through creating Notion databases
- Import n8n workflows
- Configure Claude Projects

### 4. Create Your First Content

1. **Add idea to Notion** → Content Calendar database
2. **Set status** → "Ready to Write"
3. **Watch the magic** → n8n workflow runs automatically

---

## File Structure

```
content-automation/
├── claude-projects/          # Claude Project custom instructions
│   ├── blog-writer.md
│   ├── social-media.md
│   ├── newsletter.md
│   └── seo-optimizer.md
├── workflows/                # n8n workflow JSONs (import these)
│   ├── 1-keyword-research-automation.json
│   ├── 2-blog-generation-pipeline.json
│   └── 3-multi-platform-distribution.json
├── scripts/                  # Helper scripts
│   ├── setup.sh
│   ├── generate-content.js
│   └── keyword-research.js
├── config/
│   ├── .env.example
│   └── notion-templates/
└── README.md
```

---

## How It Works

### Workflow 1: Keyword Research (Weekly)

**Trigger**: Every Monday 9 AM

```
Google Search Console → Claude AI → DataForSEO → Notion
     ↓                      ↓             ↓          ↓
 Top 50 queries      Expand to 1000   Get metrics  Save ideas
```

**Output**: 50+ content ideas with opportunity scores

---

### Workflow 2: Blog Generation (On-Demand)

**Trigger**: Status → "Ready to Write" in Notion

```
Notion → SERP Analysis → Claude Outline → Approval → Claude Draft
  ↓           ↓               ↓             ↓            ↓
Get topic  Analyze top 5   Create structure  Human OK  Write full post
                                                         ↓
                                            SEO Audit → Grammarly → Publish
                                                ↓           ↓          ↓
                                            Score 0-100   Fix errors  WordPress
```

**Output**: SEO-optimized 2000-word blog post in 15 minutes

---

### Workflow 3: Multi-Platform Distribution (Auto)

**Trigger**: Status → "Published" in Notion

```
Published Blog → Claude Repurpose → Post to Platforms
       ↓               ↓                    ↓
   Get content    Generate variants    LinkedIn, Twitter, Email
                      ↓
              LinkedIn: 1500 char post
              Twitter: 10-tweet thread
              Email: Newsletter snippet
```

**Output**: Same blog repurposed across 3+ channels

---

## Notion Database Schemas

### Content Calendar

Create a new Notion database with these properties:

| Property | Type | Options |
|----------|------|---------|
| **Title** | Title | - |
| **Status** | Select | Idea, Outline, Ready to Write, Draft, Review, Published |
| **Primary Keyword** | Text | - |
| **Secondary Keywords** | Text | Comma-separated |
| **Target Audience** | Select | Solo developers, Indie hackers, etc. |
| **Content Type** | Select | Tutorial, Guide, Comparison, Opinion, Case Study |
| **Word Count** | Number | Default: 2000 |
| **SEO Score** | Number | 0-100 |
| **Overall Score** | Number | 0-100 |
| **Published URL** | URL | - |
| **Publish Date** | Date | - |
| **Distributed** | Checkbox | - |
| **LinkedIn URL** | URL | - |
| **Twitter Thread URL** | URL | - |

### Newsletter Snippets

| Property | Type | Options |
|----------|------|---------|
| **Title** | Title | - |
| **Snippet** | Text | Markdown |
| **Blog URL** | URL | - |
| **Status** | Select | Ready for Newsletter, Included, Archived |
| **Added Date** | Date | - |

---

## Claude Projects Setup

### 1. Blog Writer Project

**Purpose**: Write long-form SEO-optimized blog posts

**Instructions**: `claude-projects/blog-writer.md`

**Knowledge Files**:
- `brand-voice.md` (your writing style examples)
- `seo-keywords.csv` (target keywords database)
- `internal-links.json` (map of your existing content)

**Test Prompt**:
```
Write a 2000-word tutorial on "content marketing automation with Claude AI".

Primary keyword: content marketing automation
Secondary keywords: Claude AI, n8n workflows, solo developer
Target audience: Solo developers
Content type: Tutorial
```

### 2. Social Media Manager Project

**Purpose**: Repurpose blog posts for LinkedIn, Twitter, Reddit

**Instructions**: `claude-projects/social-media.md`

**Test Prompt**:
```
Create a LinkedIn post based on this blog:
Title: "Content Marketing Automation with Claude AI"
Key takeaways:
- Claude API saves 80% of writing time
- n8n connects everything
- Costs only $135/month

Include 3 hashtags and an engaging question.
```

### 3. Newsletter Project

**Purpose**: Write weekly email digests and product announcements

**Instructions**: `claude-projects/newsletter.md`

**Test Prompt**:
```
Create a newsletter snippet to promote this blog post:
Title: "How to Automate Content Marketing"
URL: https://yourblog.com/automate-content
Key takeaways: [list of 3 points]

Format: 100-150 words for Friday digest.
```

### 4. SEO Optimizer Project

**Purpose**: Audit content for SEO and provide actionable fixes

**Instructions**: `claude-projects/seo-optimizer.md`

**Test Prompt**:
```
Audit this blog post for SEO:

[paste your blog content]

Primary keyword: content marketing automation
Secondary keywords: Claude AI, automation tools

Provide SEO score and specific recommendations.
```

---

## CLI Commands

```bash
# Setup
npm run setup                 # Initial setup wizard

# n8n
npm run start:n8n            # Start n8n locally (Docker)
npm run stop:n8n             # Stop n8n

# Content Generation
npm run generate:content     # Interactive content generator
npm run generate:keywords    # Run keyword research

# Monitoring
npm run status               # Check system health
npm run analytics            # View content performance

# Testing
npm run test:workflow        # Test n8n workflows
npm run claude:test          # Test Claude API connection

# Maintenance
npm run backup               # Backup Notion data
npm run deploy               # Deploy to production
```

---

## Cost Breakdown

### Minimum Viable Setup ($18/mo)

- **Claude API**: $18
- **n8n**: $0 (self-hosted)
- **Notion**: $0 (free tier, 1 user)
- **WordPress**: $0 (existing blog)

**Total**: $18/mo

### Recommended Setup ($135/mo)

All of the above plus:
- **DataForSEO**: $50 (keyword research)
- **Grammarly API**: $12 (grammar checks)
- **ConvertKit**: $9 (email marketing)
- **Buffer**: $6 (social scheduling)
- **Notion Plus**: $10 (better limits)
- **DALL-E 3**: $10 (image generation)

**Total**: $135/mo

### ROI Calculation

**Time saved per week**: 30 hours
- Keyword research: 5h → 0h
- Writing: 20h → 4h
- SEO optimization: 3h → 0h
- Social media: 5h → 0h

**Hourly rate**: $50/hr (freelancer rate)
**Monthly value**: 30h × 4 weeks × $50 = **$6,000**

**ROI**: ($6,000 - $135) / $135 = **4,344%**

---

## Customization

### Change Content Style

Edit `claude-projects/blog-writer.md`:
- Update tone/voice examples
- Add your brand-specific terms
- Modify content structure

### Add New Platforms

1. Create new Claude Project (e.g., "YouTube Scripts")
2. Add n8n nodes for platform API
3. Update `3-multi-platform-distribution.json`

### Adjust SEO Settings

Edit `config/.env`:
```bash
MIN_SEO_SCORE=80              # Minimum SEO score to publish
MIN_GRAMMAR_SCORE=90          # Minimum grammar score
MIN_SEARCH_VOLUME=100         # Minimum keyword volume
MAX_KEYWORD_DIFFICULTY=60     # Maximum keyword difficulty
```

---

## Troubleshooting

### Claude API Rate Limits

**Error**: `429 Rate limit exceeded`

**Fix**: Add retry logic with exponential backoff (already in workflows)

### n8n Webhooks Not Working

**Error**: Webhooks not triggering

**Fix**:
1. Check n8n is running: `docker ps`
2. Verify webhook URLs in `.env`
3. Test webhook: `curl -X POST http://localhost:5678/webhook/test`

### Low SEO Scores

**Error**: Content consistently scores <80

**Fix**:
1. Review Claude Project instructions
2. Add more competitor analysis to prompts
3. Manually review top 5 SERP results
4. Update internal linking map

### Social Posts Not Engaging

**Error**: LinkedIn/Twitter posts get low engagement

**Fix**:
1. A/B test different hooks
2. Adjust posting times (check analytics)
3. Add personal stories to prompts
4. Review high-performing posts for patterns

---

## Roadmap

### v1.1 (Q1 2025)
- [ ] Video script generation (YouTube, TikTok)
- [ ] Auto-generate featured images (DALL-E 3)
- [ ] Reddit posting automation
- [ ] A/B testing for subject lines

### v1.2 (Q2 2025)
- [ ] Podcast show notes generator
- [ ] Instagram carousel creator
- [ ] LinkedIn carousels
- [ ] Performance prediction ML model

### v2.0 (Q3 2025)
- [ ] Multi-language support
- [ ] Content calendar auto-planning
- [ ] Competitor content monitoring
- [ ] Auto-internal linking

---

## FAQ

**Q: Can I use this with WordPress alternatives (Ghost, Webflow)?**

A: Yes! Update n8n workflows to use their APIs. Ghost and Webflow nodes are available in n8n.

**Q: Will this work for non-technical content?**

A: Yes, but you'll need to update Claude Projects with your industry-specific voice and terminology.

**Q: How do I handle images?**

A: Three options:
1. Manual: Upload to Unsplash/Pexels, add URLs to Notion
2. Semi-auto: Generate with DALL-E 3 via n8n node
3. Full-auto: Add image generation node to workflow 2

**Q: Can I run this on n8n cloud instead of self-hosting?**

A: Yes! Sign up at [n8n.cloud](https://n8n.io/cloud). Starter plan is $20/mo.

**Q: How do I backup my data?**

A: Run `npm run backup` weekly. This exports:
- Notion databases → JSON
- n8n workflows → JSON
- Claude prompts → Markdown

**Q: Is this GDPR compliant?**

A: Yes, if you:
- Use EU servers for n8n (self-host or n8n EU cloud)
- Enable IP anonymization in Google Analytics
- Add cookie consent to blog

---

## Support

**Issues**: [GitHub Issues](link)
**Discussions**: [GitHub Discussions](link)
**Email**: your@email.com

---

## Contributing

Pull requests welcome! Areas of interest:
- New platform integrations (Instagram, Pinterest, Medium)
- Improved Claude prompts
- n8n workflow optimizations
- Cost-saving strategies

---

## License

MIT License - see LICENSE file

---

## Credits

Built by [Your Name](link)

Powered by:
- [Claude AI](https://claude.ai) (Anthropic)
- [n8n](https://n8n.io) (workflow automation)
- [Notion](https://notion.so) (content management)

---

**⭐ If this saves you time, star the repo!**

---

## Appendix: Full Setup Checklist

### Pre-Setup (30 minutes)
- [ ] Sign up for Claude API
- [ ] Create Notion account
- [ ] Set up Google Search Console
- [ ] Install Docker

### Setup (1 hour)
- [ ] Clone repository
- [ ] Copy .env.example → .env
- [ ] Fill in API keys
- [ ] Run `npm run setup`
- [ ] Create Notion databases
- [ ] Import n8n workflows

### Configuration (2 hours)
- [ ] Create 4 Claude Projects
- [ ] Upload custom instructions
- [ ] Add knowledge files
- [ ] Test each Claude Project
- [ ] Configure n8n credentials

### First Content (1 hour)
- [ ] Add test idea to Notion
- [ ] Trigger keyword research workflow
- [ ] Review generated keywords
- [ ] Create first blog outline
- [ ] Approve and generate full post
- [ ] Review and publish

### Distribution (30 minutes)
- [ ] Connect LinkedIn account
- [ ] Connect Twitter account
- [ ] Set up ConvertKit form
- [ ] Test distribution workflow
- [ ] Schedule first social posts

### Total Setup Time: ~5 hours

**After setup, time per blog post: ~15 minutes**

---

**Questions? Open an issue or email me!**
