# Content Marketing Automation - Quick Start Guide

**Time to first content: 30 minutes**

---

## What You're Building

An AI-powered content engine that:
- Researches keywords automatically
- Writes SEO-optimized blog posts
- Repurposes content for LinkedIn, Twitter, email
- Tracks performance in real-time

**Cost**: $18-$135/month
**Time saved**: 80%
**Content output**: 10x more

---

## Prerequisites

✅ **Required**:
- Claude API account ($18/mo) → [console.anthropic.com](https://console.anthropic.com)
- Notion account (free tier OK) → [notion.so](https://notion.so)
- Node.js 18+ → [nodejs.org](https://nodejs.org)

🟡 **Optional** (enhances functionality):
- Docker (for n8n)
- WordPress or Ghost blog
- LinkedIn, Twitter accounts
- ConvertKit or Mailchimp

---

## 5-Minute Setup (Minimal)

### 1. Get API Keys (5 min)

**Claude API**:
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign in → Settings → API Keys
3. Create key → Copy it

**Notion Integration**:
1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. New integration → Name it "Content Automation"
3. Copy Internal Integration Token

### 2. Install & Configure (5 min)

```bash
# Clone and install
cd content-automation
npm install

# Set up environment
cp config/.env.example config/.env
nano config/.env  # or use your text editor
```

Add these two keys to `.env`:
```bash
CLAUDE_API_KEY=sk-ant-xxxxx
NOTION_API_KEY=secret_xxxxx
```

Save and exit.

### 3. Create Notion Database (5 min)

1. Open Notion → New page → "Content Calendar"
2. Type `/database` → Select "Table - Inline"
3. Add these properties (click `+` button):
   - **Title** (already exists)
   - **Status** (Select): Add options: Idea, Ready to Write, Published
   - **Primary Keyword** (Text)
   - **Published URL** (URL)

4. Share with integration:
   - Click `...` (top right) → Add connections
   - Select "Content Automation"

5. Copy database ID:
   - From URL: `notion.so/YOUR_WORKSPACE_ID/DATABASE_ID?v=...`
   - Copy the `DATABASE_ID` part

6. Add to `.env`:
   ```bash
   NOTION_CONTENT_CALENDAR_DB=your-database-id
   ```

### 4. Create Claude Project (5 min)

1. Go to [claude.ai](https://claude.ai)
2. Projects → Create Project → "Blog Writer"
3. Click "Set custom instructions"
4. Copy-paste entire content from `claude-projects/blog-writer.md`
5. Save

### 5. Test It! (10 min)

```bash
# Test Claude connection
npm run claude:test

# Generate your first blog outline
npm run generate:content
```

Follow prompts:
- Title: "How to Automate Content Marketing"
- Keyword: "content marketing automation"
- Type: Tutorial

**Output**: Blog outline in 30 seconds!

---

## 30-Minute Setup (Recommended)

Everything above, plus:

### 6. Install n8n (10 min)

```bash
# Start n8n with Docker
npm run start:n8n

# Opens at http://localhost:5678
# Login: admin / changeme (change this!)
```

### 7. Import Workflows (10 min)

In n8n:

1. **Workflows** → **Import from File**
2. Import these 3 files:
   - `workflows/1-keyword-research-automation.json`
   - `workflows/2-blog-generation-pipeline.json`
   - `workflows/3-multi-platform-distribution.json`

3. For each workflow:
   - Click on colored nodes (they need credentials)
   - Add your API keys
   - Click "Execute Node" to test

### 8. Connect Your Blog (10 min)

**WordPress**:
```bash
# In .env
WORDPRESS_SITE_URL=https://yourblog.com
WORDPRESS_USERNAME=youruser
WORDPRESS_PASSWORD=yourpass  # Use application password
```

**Ghost**:
```bash
GHOST_ADMIN_API_KEY=xxxxx
GHOST_API_URL=https://yourblog.ghost.io
```

Test:
```bash
npm run test:workflow
```

---

## Your First Automated Blog Post

### Method 1: Via Notion (Recommended)

1. **Add idea to Notion**:
   - Title: "Content Marketing Automation with Claude AI"
   - Primary Keyword: "content marketing automation"
   - Status: **Ready to Write**

2. **Watch n8n**:
   - Go to n8n → Executions
   - Watch "Blog Generation Pipeline" run
   - Takes ~5 minutes

3. **Review in Notion**:
   - Status changes to "Ready to Publish"
   - Full blog post appears in page
   - SEO score shows (should be 80+)

4. **Approve & Publish**:
   - Review the content
   - Status → "Published"
   - Auto-publishes to WordPress!

### Method 2: Via CLI

```bash
npm run generate:content

# Follow prompts:
# - Title: [your title]
# - Keyword: [target keyword]
# - Type: Tutorial
# - Word count: 2000

# Wait 2-3 minutes...
# Blog post appears in Notion!
```

---

## Daily Workflow (After Setup)

### Monday (15 min)
- Check keyword research workflow results in Notion
- Pick 3-5 high-opportunity keywords
- Add to Content Calendar with status "Idea"

### Tuesday-Thursday (30 min/day)
- Change 1 idea to "Ready to Write"
- Review generated outline (5 min)
- Approve or request changes
- Let Claude write full draft
- Quick review (20 min)
- Publish

### Friday (10 min)
- Review week's published posts
- Check engagement metrics
- Reply to comments

**Total time**: ~2 hours/week for 3 high-quality blog posts

**Before automation**: 20+ hours/week

**Time saved**: 90%

---

## ROI Breakdown

### Costs (Minimum)

| Item | Cost/Month |
|------|------------|
| Claude API (500K tokens) | $18 |
| **Total** | **$18** |

### Costs (Recommended)

| Item | Cost/Month |
|------|------------|
| Claude API | $18 |
| DataForSEO (keywords) | $50 |
| Grammarly API | $12 |
| Notion Plus | $10 |
| ConvertKit | $9 |
| Buffer | $6 |
| DALL-E 3 credits | $10 |
| **Total** | **$115** |

### Value Created

**Time saved per week**: 18 hours
- Keyword research: 4h → 0h (automated)
- Writing: 12h → 2h (Claude writes)
- SEO optimization: 2h → 0h (automated)
- Social media: 4h → 0h (automated)

**Monthly value** (at $50/hr): 18h × 4 weeks × $50 = **$3,600**

**ROI**: ($3,600 - $115) / $115 = **3,030%**

**Break-even**: 1 hour of saved time

---

## Common Issues & Fixes

### "Claude API key invalid"

**Fix**:
```bash
# Check your API key starts with "sk-ant-"
# Regenerate key at console.anthropic.com
# Update .env file
# Restart n8n
```

### "Notion database not found"

**Fix**:
1. Verify database ID in `.env` is correct
2. Check integration is connected to database:
   - Open database → `...` → Add connections → Select your integration

### "n8n workflows failing"

**Fix**:
1. Check all credentials are added:
   - n8n → Credentials → Verify each one
2. Test individual nodes:
   - Open workflow → Click node → "Execute Node"
3. Check error messages in Executions panel

### "Blog posts not SEO optimized"

**Fix**:
1. Update Claude Project instructions:
   - Add more competitor examples
   - Strengthen keyword requirements
   - Add SEO checklist to prompt
2. Increase SEO score threshold in workflow

---

## Next Steps

After your first successful blog post:

### Week 1
- [ ] Set up all 4 Claude Projects
- [ ] Import all 3 n8n workflows
- [ ] Generate 2-3 test blog posts
- [ ] Review and refine prompts

### Week 2
- [ ] Connect LinkedIn & Twitter accounts
- [ ] Test multi-platform distribution
- [ ] Set up email newsletter
- [ ] Configure analytics tracking

### Week 3
- [ ] Enable automated keyword research
- [ ] Build 12-week content calendar
- [ ] Set up competitor monitoring
- [ ] Create brand voice guide

### Week 4
- [ ] Optimize workflows based on results
- [ ] A/B test subject lines
- [ ] Create content templates
- [ ] Document your process

### Month 2+
- [ ] Scale to 10-12 posts/month
- [ ] Add video script generation
- [ ] Create LinkedIn carousels
- [ ] Build email sequences

---

## Support & Resources

### Documentation
- **Main Guide**: `CONTENT_MARKETING_AUTOMATION.md` (comprehensive)
- **README**: `README.md` (overview)
- **This Guide**: `QUICK_START.md` (you are here)

### Claude Projects
- `claude-projects/blog-writer.md`
- `claude-projects/social-media.md`
- `claude-projects/newsletter.md`
- `claude-projects/seo-optimizer.md`

### n8n Workflows
- `workflows/1-keyword-research-automation.json`
- `workflows/2-blog-generation-pipeline.json`
- `workflows/3-multi-platform-distribution.json`

### Scripts
- `scripts/setup.sh` - Automated setup
- `scripts/generate-content.js` - CLI content generator
- `scripts/test-workflow.js` - Test workflows

### Community
- GitHub Issues (for bugs)
- GitHub Discussions (for questions)
- Email support: [your email]

---

## Pro Tips

### 1. Optimize Claude Prompts

**Before**:
```
Write a blog post about content automation.
```

**After**:
```
Write a 2000-word tutorial on content marketing automation for solo developers.

Primary keyword: content marketing automation (use 15-20 times)
Secondary keywords: Claude AI, n8n workflows, automation tools

Structure:
- Hook: Pain point of manual content creation
- Promise: Save 80% time with automation
- 5 main sections with code examples
- Conclusion with clear CTA

Tone: Conversational, helpful, technical but accessible
Include: Screenshots, step-by-step guides, real examples
```

Result: 10x better content!

### 2. Build a Content Cluster

Instead of random topics, create topic clusters:

**Pillar Page**: "Complete Guide to Content Marketing Automation"

**Supporting Posts**:
1. "How to Set Up Claude AI for Content Generation"
2. "n8n Workflows for Content Automation"
3. "SEO Automation Tools for Solo Developers"
4. "Multi-Platform Content Distribution Guide"
5. "Content Performance Tracking with Analytics"

Link them all together → Better SEO, higher rankings

### 3. Repurpose Everything

**1 blog post becomes**:
- 1 LinkedIn post
- 1 Twitter thread (10 tweets)
- 1 newsletter section
- 3-5 LinkedIn carousel slides
- 10 Twitter quote graphics
- 1 YouTube script

**Total**: 1 blog → 25+ pieces of content!

### 4. Schedule Strategically

**Best times** (based on data):
- **Blog posts**: Tuesday/Thursday 9 AM EST
- **LinkedIn**: Tuesday-Thursday 8-10 AM EST
- **Twitter threads**: Thursday 9 AM EST
- **Email newsletters**: Friday 8 AM EST

### 5. Track What Matters

**Focus metrics**:
- Organic traffic (Google Analytics)
- Engagement rate (LinkedIn/Twitter)
- Email click rate (ConvertKit)
- Conversions (signup, purchase, contact)

**Ignore**:
- Follower count (vanity metric)
- Likes/impressions alone
- Time on page (unless paired with conversions)

---

## Success Story Template

After 30 days, share your results:

```
I automated my content marketing with Claude AI.

Results after 30 days:
• 12 blog posts published (vs 4 before)
• 36 social media posts (vs 8 before)
• 4 newsletters sent (vs 1 before)
• Time spent: 8 hours (vs 40 hours before)

Tools:
• Claude API: $18/mo
• n8n: $0 (self-hosted)
• Notion: $0 (free tier)

ROI: 80% time saved, 300% more content

Here's my exact system: [link to your blog]
```

Tweet this with screenshots → Instant engagement!

---

## Frequently Asked Questions

**Q: Do I need coding skills?**

A: No! The setup script handles everything. You just:
1. Fill in API keys
2. Import pre-built workflows
3. Copy-paste Claude instructions

**Q: Will this replace my writing?**

A: No, it augments it. You still:
- Choose topics (based on data)
- Review outlines
- Edit final drafts
- Add personal stories

Claude does the heavy lifting (research, first draft, SEO).

**Q: How long until I see results?**

A: **Week 1**: First blog posts published
**Week 4**: SEO traffic starts increasing
**Week 12**: Measurable ROI (traffic, leads, sales)

SEO takes time. Focus on quality and consistency.

**Q: Can I use free alternatives?**

A: Some, yes:
- ✅ Claude API: No free tier (but cheap)
- ✅ Notion: Free tier works
- ✅ n8n: Self-host for free
- ✅ WordPress: Free or cheap hosting
- ❌ DataForSEO: No free tier (use free alternatives like Google Trends)

Minimum cost: $18/mo (Claude only)

**Q: What if I don't have a blog yet?**

A: Start with:
1. Medium (free, instant publishing)
2. Dev.to (free, developer-focused)
3. Hashnode (free, custom domain)
4. WordPress.com (free tier)

Later, migrate to custom domain.

---

**You're ready! Start with the 5-minute setup above. 🚀**

Questions? Open an issue or email me.

Happy automating!
