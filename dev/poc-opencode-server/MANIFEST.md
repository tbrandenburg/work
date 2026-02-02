# OpenCode PoC - File Manifest

## Document Structure

```
dev/poc-opencode-server/
│
├── 00-planning/              # Research and planning
│   ├── POC_NOTES.md         # Shortcuts and limitations (5 min)
│   ├── FINDINGS.md          # Detailed Q&A with evidence (8 min)
│   └── WORK-CLI-INTEGRATION.md # Integration strategy
│
├── 01-guides/               # Step-by-step guides
│   ├── QUICKSTART.md        # 30-second quick start
│   ├── APPLICATION_GUIDE.md # Complete integration guide (15 min)
│   ├── SESSION-RESUME-GUIDE.md # Session management
│   ├── QUICK-REFERENCE.md   # API quick reference
│   └── SDK-EVALUATION.md    # SDK analysis
│
├── 02-reference/            # Technical reference
│   ├── INDEX.md             # Start here for navigation
│   ├── SUMMARY.md           # Executive summary (2 min read)
│   └── AGENTS-MODELS-PERMISSIONS.md # Agent configuration
│
├── 03-demos/                # Working code examples ⭐
│   ├── complete-acp-test.js # Main working example
│   ├── test-sdk.js          # SDK testing
│   ├── session-resume-WORKING.js # Session resumption
│   ├── explore-acp.js       # ACP protocol exploration
│   ├── explore-http-api.js  # HTTP API exploration
│   ├── test-single-server.js
│   ├── test-acp-protocol.js
│   ├── demo-session-resume.js
│   ├── session-resume-example.js
│   ├── models-permissions-demo.js
│   └── check-session-structure.js
│
├── 04-scripts/              # Automation
│   ├── explore.sh           # Port assignment test
│   └── VERIFY.sh            # Environment verification
│
├── 05-results/              # Test results and logs
│   ├── acp-results.json     # ACP protocol responses
│   ├── findings.json        # HTTP API findings
│   ├── models-permissions-results.json
│   ├── session-list.json
│   ├── _COMPLETION_REPORT.txt # Final report
│   └── logs/                # Server execution logs
│
├── README.md                # Main entry point & overview
├── MANIFEST.md              # This file
├── package.json             # npm scripts & dependencies
└── .gitignore               # Ignore node_modules
```

## Reading Path by Role

### Busy Executive
1. `02-reference/SUMMARY.md` (2 min) → Decision made

### Product Manager
1. `02-reference/SUMMARY.md` (2 min)
2. `00-planning/FINDINGS.md` (8 min)
3. `00-planning/POC_NOTES.md` (5 min)

### Software Engineer
1. `01-guides/QUICKSTART.md` (1 min)
2. `03-demos/complete-acp-test.js` (5 min - run it!)
3. `01-guides/APPLICATION_GUIDE.md` (15 min)
4. `00-planning/POC_NOTES.md` (5 min)

### Technical Lead
1. `02-reference/INDEX.md` (3 min)
2. `00-planning/FINDINGS.md` (8 min)
3. `03-demos/complete-acp-test.js` (5 min)
4. `01-guides/APPLICATION_GUIDE.md` (15 min)
5. `00-planning/POC_NOTES.md` (5 min)

## Quick Command Reference

```bash
# Run main demo
npm run demo

# Test SDK approach
npm run demo:sdk

# Test session resumption
npm run demo:resume

# Verify environment
npm run verify

# Or run directly:
node 03-demos/complete-acp-test.js
node 03-demos/test-sdk.js
bash 04-scripts/VERIFY.sh

# View results
cat 05-results/acp-results.json | jq .
```

## File Sizes

```
Documentation:  ~60 KB (14 markdown files)
Code:          ~45 KB (11 demo files + 2 scripts)
Data:          ~30 KB (JSON + logs)
Total:         ~135 KB
```

## Key Files by Purpose

### I want to...

**...understand what was proven**
→ `02-reference/SUMMARY.md` or `00-planning/FINDINGS.md`

**...see working code**
→ `03-demos/complete-acp-test.js`

**...integrate OpenCode into my app**
→ `01-guides/APPLICATION_GUIDE.md`

**...know what shortcuts were taken**
→ `00-planning/POC_NOTES.md`

**...get started in 30 seconds**
→ `01-guides/QUICKSTART.md`

**...navigate all docs**
→ `02-reference/INDEX.md`

**...understand HTTP vs ACP**
→ `05-results/findings.json` + `05-results/acp-results.json`

**...understand the SDK**
→ `01-guides/SDK-EVALUATION.md`

**...integrate with work CLI**
→ `00-planning/WORK-CLI-INTEGRATION.md`

## Version Control

All files are in `dev/poc-opencode-server/` which is:
- ✓ Isolated from main codebase
- ✓ Gitignored via root `.gitignore` (dev/ directory)
- ✓ Self-contained with local `.gitignore` for node_modules
- ✓ Preserved for historical reference

## Dependencies

**Runtime**:
- OpenCode CLI (`opencode` command)
- Node.js 16+ (for test scripts)
- Bash (for shell scripts)

**npm packages**:
- `@agentclientprotocol/sdk` (for SDK evaluation only)

## Generated Data

Running demos generates fresh results in `05-results/`:
- `acp-results.json` - Protocol responses
- Various `.json` files - Test outputs
- `logs/` - Execution logs

Files are regenerated on each run.

## Maintenance

This PoC is **frozen** as of 2026-02-02 and reorganized on 2026-02-02.

It proves concepts and answers questions but is not:
- Production code
- Actively maintained
- Feature-complete
- Production-tested

For production use, follow `01-guides/APPLICATION_GUIDE.md` recommendations.

## License

Proof of concept for demonstration purposes only.

---

**Directory structure**: 6 directories (00-05)  
**Total files**: ~33 files  
**Core working code**: ~200 lines (raw JSON-RPC)  
**Documentation**: ~2,000 lines  
**Questions answered**: 5/5 ✓  

**Status**: ✅ Complete, verified, and organized

