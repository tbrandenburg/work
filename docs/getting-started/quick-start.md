# 5-Minute Quick Start

Get from zero to managing your first work item in 5 minutes.

## What You'll Accomplish
- Install work CLI
- Create your first work item
- See it in GitHub Issues
- Get a notification

## Prerequisites
- GitHub account
- Node.js 18+
- 5 minutes

## Step 1: Install (30 seconds)
```bash
git clone https://github.com/username/work-cli
cd work-cli
npm install
npm run build
npm install -g .
work --version  # Should show version
```

## Step 2: Connect to GitHub (1 minute)
```bash
# Authenticate (opens browser)
gh auth login

# Connect to your repo (replace with your GitHub repo)
work context add my-project --tool github --url https://github.com/YOUR-USERNAME/YOUR-REPO
work context set my-project
```

## Step 3: Create Your First Work Item (30 seconds)
```bash
work create "Fix login bug" --kind bug --priority high
# Output: Created ISSUE-123
```

## Step 4: See It Live (30 seconds)
Visit your GitHub repo → Issues tab. Your work item is there!

## Step 5: List Your Work (30 seconds)
```bash
work list
# Shows your work items with status, priority, and details
```

## Step 6: Update and Close (1 minute)
```bash
# Start working on it
work start ISSUE-123
work comment ISSUE-123 "Found the root cause in auth.js"

# Mark it complete
work close ISSUE-123 --comment "Fixed authentication flow"
```

## Step 7: Get Notifications (Optional - 2 minutes)
```bash
# Add Telegram notifications (requires bot setup)
work notify add telegram --bot-token YOUR_BOT_TOKEN --chat-id YOUR_CHAT_ID
work notify send ISSUE-123
```

## What's Next?

**Ready for more?** Try these workflows:

- **[Complete GitHub Workflow](../../examples/ai-scrum-github/README.md)** - Full team collaboration example
- **[AI Agent Integration](../../examples/ai-scrum/)** - Set up automated workflows
- **[Local Development](../tutorials/local-development.md)** - Work offline with local filesystem

## Troubleshooting

**GitHub authentication failed?**
```bash
gh auth status  # Check if authenticated
gh auth login   # Re-authenticate if needed
```

**Can't find your work item?**
```bash
work context list    # Check active context
work list --all      # List all items
```

**Need help?**
```bash
work --help          # General help
work create --help   # Command-specific help
```

## Success! 🎉

You've successfully:
- ✅ Installed work CLI
- ✅ Connected to GitHub
- ✅ Created and managed work items
- ✅ Seen real GitHub integration

You're now ready to use work CLI for real project management!
