# 30-Second Quickstart

## Run the PoC

```bash
cd dev/poc-opencode-server
node complete-acp-test.js
```

## What it does

1. Spawns OpenCode ACP subprocess
2. Initializes protocol handshake
3. Creates a session
4. Demonstrates JSON-RPC communication

## Output

- Console: Protocol messages and status
- `acp-results.json`: Full response data

## Next Steps

```bash
# Read the summary
cat SUMMARY.md

# Read the full guide
cat APPLICATION_GUIDE.md

# Read detailed findings
cat FINDINGS.md
```

## Key Finding

**Use `opencode acp` (JSON-RPC over stdio) for programmatic integration.**

NOT `opencode serve` (that's a web UI).

---

That's it! You now know how to integrate OpenCode programmatically.
