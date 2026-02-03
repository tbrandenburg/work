#!/bin/bash
set -e

# Work Item Prioritization Script
# Uses the work CLI with GitHub adapter and OpenCode ACP to assess and prioritize work items

echo "🚀 Starting work item prioritization workflow..."
echo ""

# Step 1: Set up GitHub context for this repository
echo "📦 Step 1: Setting up GitHub context..."
work context add work-repo --tool github --url https://github.com/tbrandenburg/work 2>/dev/null || echo "   Context already exists, continuing..."
work context set work-repo
echo "   ✓ Context set to work-repo"
echo ""

# Step 2: Authenticate with GitHub
echo "🔐 Step 2: Authenticating with GitHub..."
work auth login
echo "   ✓ Authentication complete"
echo ""

# Step 3: Set up OpenCode ACP notification target for prioritization
echo "🤖 Step 3: Setting up OpenCode ACP prioritization agent..."
# Remove old target if exists (to ensure fresh timeout configuration)
work notify target remove prioritizer 2>/dev/null || true
work notify target add prioritizer \
  --type acp \
  --cmd "opencode acp" \
  --system-prompt "You are a business value analyst. Analyze the passed work items and assess their priority based on business impact, user value, and urgency. Use 'work set <id> priority=<low|medium|high|critical>' to update priorities. Provide brief reasoning for each change."
echo "   ✓ OpenCode ACP prioritizer configured"
echo ""

# Step 4: List current open work items
echo "📋 Step 4: Checking open work items..."
work list where 'state=new OR state=active'
echo ""

# Step 5: Notify OpenCode ACP about open work items for prioritization
echo "🔔 Step 5: Sending open work items to prioritization agent..."
work notify send where 'state=new OR state=active' to prioritizer
echo "   ✓ Work items sent to OpenCode for prioritization"
echo ""

echo "✅ Prioritization workflow complete!"
echo ""
echo "💡 Next steps:"
echo "   - Check applied priorities: work get <id> (look for priority:* labels)"
echo "   - View all with labels: work list where 'state=new'"
echo "   - See the AI's reasoning: opencode session list (then export latest session)"
echo "   - Adjust manually if needed: work set <id> --labels priority:high"
