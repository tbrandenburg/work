# How to Execute the AI Scrum GitHub Demo

## Prerequisites
1. **GitHub CLI authenticated**:
   ```bash
   gh auth login
   ```

2. **Work CLI built and available**:
   ```bash
   npm run build
   # Make sure work CLI is in PATH or use ./bin/run.js
   ```

## Quick Start

```bash
# Navigate to the GitHub example
cd examples/ai-scrum-github

# Run the demo
./demo.sh
```

## Step by Step

1. **Navigate to the example**:
   ```bash
   cd examples/ai-scrum-github
   ```

2. **Run the demo** (non-verbose):
   ```bash
   ./demo.sh
   ```

3. **Or run with full details**:
   ```bash
   ./demo.sh --verbose
   ```

## What It Does

The demo will:
1. Set up GitHub context for `tbrandenburg/work` repository
2. Authenticate with GitHub using your `gh auth login` credentials
3. Initialize 3 GitHub issues
4. Run 5 scrum cycles with AI agents:
   - **Scrum Master**: Prioritizes and reviews tasks
   - **Developer**: Starts and completes high-priority tasks
   - **Reviewer**: Reviews completed work, approves or reopens
5. Show final results with link to GitHub issues

## Expected Output

```
⚙️ work CLI Demo - Agent Orchestration (GitHub)
===============================================
🔧 Setting up GitHub context...
🔐 Authenticating with GitHub...
🔍 Testing GitHub connection...
✅ GitHub connection successful!
⚙️ work CLI initialized 3 GitHub issues

🔄 Cycle 1
--------
⚙️ work CLI notifies Scrum Master agent to prioritise and review tasks
[Scrum Master]   ↗️ 123 priority → critical
⚙️ work CLI notifies Developer agent to execute for task
[Developer]   ▶️ 122 started
[Developer]   ▶️ 123 started
⚙️ work CLI notifies Reviewer agent to review task completion
[Reviewer]   ➕ Follow-up task created
⚙️ work CLI reports: 4 open, 0 solved, 2 active (4 total)

[... continues for 5 cycles ...]

✅ work CLI orchestration complete: X open, Y solved (Z total GitHub issues)
🔗 View at: https://github.com/tbrandenburg/work/issues
```

## Troubleshooting

If you get authentication errors:
```bash
gh auth status  # Check if authenticated
gh auth login   # Re-authenticate if needed
```
