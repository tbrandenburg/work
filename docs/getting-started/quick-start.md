# 5-Minute Quick Start

Get from zero to managing your first work item in 5 minutes.

## Choose Your Path

**🚀 Want to try quickly without setup?** → [Local Filesystem Quick Start](#local-filesystem-quick-start) (No GitHub required)

**🔗 Ready to integrate with GitHub?** → [GitHub Integration Quick Start](#github-integration-quick-start) (Requires GitHub account)

---

## Local Filesystem Quick Start

### What You'll Accomplish
- Install work CLI
- Create and manage work items locally
- Optional Telegram notifications
- No external dependencies required

### Prerequisites
- Node.js 18+
- 5 minutes

### Step 1: Install (30 seconds)
```bash
git clone https://github.com/username/work-cli
cd work-cli
npm install
npm run build
npm install -g .
work --version  # Should show version
```

### Step 2: Create Local Context (30 seconds)
```bash
# Create a local project context
work context add my-local-project --tool local-fs --path ./my-work
work context set my-local-project
```

### Step 3: Create and Manage Work Items (2 minutes)
```bash
# Create your first work item
work create "Set up project structure" --kind task --priority medium
# Output: Created TASK-001

# List your work
work list

# Start working on it
work start TASK-001
work comment TASK-001 "Created initial directory structure"

# Create more items
work create "Add documentation" --kind task --assignee me
work create "Fix bug in parser" --kind bug --priority high

# Close completed work
work close TASK-001 --comment "Project structure complete"
```

### Step 4: View Your Work Files (30 seconds)
```bash
# See the files work CLI created
ls -la ./my-work/
cat ./my-work/TASK-001.json  # View work item details
```

### Step 5: Optional Telegram Notifications (2 minutes)
```bash
# Set up Telegram bot (requires bot token and chat ID)
work notify add telegram --bot-token YOUR_BOT_TOKEN --chat-id YOUR_CHAT_ID

# Send notifications about work items
work notify send TASK-001
work create "Deploy to production" --kind task --notify
```

**Benefits of Local Filesystem:**
- ✅ No external dependencies
- ✅ Works completely offline
- ✅ Full version control with git
- ✅ Easy to backup and sync
- ✅ Perfect for personal projects

---

## GitHub Integration Quick Start

### What You'll Accomplish
- Install work CLI
- Create your first work item
- See it in GitHub Issues
- Get a notification

### Prerequisites
- GitHub account
- Node.js 18+
- 5 minutes

### Step 1: Install (30 seconds)
```bash
git clone https://github.com/username/work-cli
cd work-cli
npm install
npm run build
npm install -g .
work --version  # Should show version
```

### Step 2: Connect to GitHub (1 minute)
```bash
# Authenticate (opens browser)
gh auth login

# Connect to your repo (replace with your GitHub repo)
work context add my-project --tool github --url https://github.com/YOUR-USERNAME/YOUR-REPO
work context set my-project

# Authenticate work CLI with GitHub
work auth login
```

### Step 3: Create Your First Work Item (30 seconds)
```bash
work create "Fix login bug" --kind bug --priority high
# Output: Created ISSUE-123
```

### Step 4: See It Live (30 seconds)
Visit your GitHub repo → Issues tab. Your work item is there!

### Step 5: List Your Work (30 seconds)
```bash
work list
# Shows your work items with status, priority, and details
```

### Step 6: Update and Close (1 minute)
```bash
# Start working on it
work start ISSUE-123
work comment ISSUE-123 "Found the root cause in auth.js"

# Mark it complete
work close ISSUE-123 --comment "Fixed authentication flow"
```

### Step 7: Get Notifications (Optional - 2 minutes)
```bash
# Add Telegram notifications (requires bot setup)
work notify add telegram --bot-token YOUR_BOT_TOKEN --chat-id YOUR_CHAT_ID
work notify send ISSUE-123
```

---

## What's Next?

**Ready for more?** Try these workflows:

- **[Complete GitHub Workflow](../../examples/ai-scrum-github/README.md)** - Full team collaboration example
- **[AI Agent Integration](../../examples/ai-scrum/)** - Set up automated workflows
- **[Local Development](../tutorials/local-development.md)** - Work offline with local filesystem

---

## Alternative: Local Filesystem Quick Start (No GitHub Required)

Want to try work CLI without setting up GitHub? Use the local filesystem backend:

### Step 1: Install (30 seconds)
```bash
git clone https://github.com/username/work-cli
cd work-cli
npm install
npm run build
npm install -g .
work --version  # Should show version
```

### Step 2: Create Local Context (30 seconds)
```bash
# Create a local project context
work context add my-local-project --tool local-fs --path ./my-work
work context set my-local-project
```

### Step 3: Create and Manage Work Items (2 minutes)
```bash
# Create your first work item
work create "Set up project structure" --kind task --priority medium
# Output: Created TASK-001

# List your work
work list

# Start working on it
work start TASK-001
work comment TASK-001 "Created initial directory structure"

# Create more items
work create "Add documentation" --kind task --assignee me
work create "Fix bug in parser" --kind bug --priority high

# Close completed work
work close TASK-001 --comment "Project structure complete"
```

### Step 4: View Your Work Files (30 seconds)
```bash
# See the files work CLI created
ls -la ./my-work/
cat ./my-work/TASK-001.json  # View work item details
```

### Step 5: Optional Telegram Notifications (2 minutes)
```bash
# Set up Telegram bot (requires bot token and chat ID)
work notify add telegram --bot-token YOUR_BOT_TOKEN --chat-id YOUR_CHAT_ID

# Send notifications about work items
work notify send TASK-001
work create "Deploy to production" --kind task --notify
```

**Benefits of Local Filesystem:**
- ✅ No external dependencies
- ✅ Works completely offline
- ✅ Full version control with git
- ✅ Easy to backup and sync
- ✅ Perfect for personal projects

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
- ✅ Created and managed work items
- ✅ Explored your chosen backend (GitHub or local filesystem)

You're now ready to use work CLI for real project management!

## What's Next?

**Ready for more?** Try these workflows:

- **[Complete GitHub Workflow](../../examples/ai-scrum-github/README.md)** - Full team collaboration example
- **[AI Agent Integration](../../examples/ai-scrum/)** - Set up automated workflows
- **[Local Development](../tutorials/local-development.md)** - Work offline with local filesystem
