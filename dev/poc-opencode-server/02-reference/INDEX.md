# OpenCode Integration PoC - Index

## Start Here 👇

1. **Want the quick summary?** → Read [SUMMARY.md](SUMMARY.md)
2. **Want to see it work?** → Run `node complete-acp-test.js`
3. **Want detailed answers?** → Read [FINDINGS.md](FINDINGS.md)
4. **Want to integrate?** → Read [APPLICATION_GUIDE.md](APPLICATION_GUIDE.md)
5. **Want to understand shortcuts?** → Read [POC_NOTES.md](POC_NOTES.md)

---

## Quick Start

```bash
# Run the working example
node complete-acp-test.js

# View the results
cat acp-results.json
```

---

## Document Guide

### Core Documents

| File | Purpose | Read Time |
|------|---------|-----------|
| **SUMMARY.md** | Executive summary and recommendations | 2 min |
| **complete-acp-test.js** | Working code example (USE THIS) | 5 min |
| **FINDINGS.md** | Detailed Q&A with evidence | 8 min |
| **APPLICATION_GUIDE.md** | Complete integration guide | 15 min |
| **POC_NOTES.md** | Shortcuts, limitations, lessons | 5 min |

### Supporting Files

| File | Purpose |
|------|---------|
| `acp-results.json` | Raw ACP protocol responses |
| `findings.json` | HTTP API exploration results |
| `explore.sh` | Port auto-assignment test |
| `test-*.js` | Exploratory scripts |
| `*.log` | Server logs from tests |

---

## Questions Answered

✓ **Q1**: How to span several opencode servers with different system prompts?
- **Answer**: Spawn multiple `opencode acp` subprocesses
- **Evidence**: `complete-acp-test.js` + `APPLICATION_GUIDE.md` section "Multiple Agent Instances"

✓ **Q2**: Are ports automatically chosen?
- **Answer**: YES for `opencode serve`; N/A for `opencode acp` (uses stdio)
- **Evidence**: `explore.sh` output, `findings.json`

✓ **Q3**: Is there a JSON return with server properties?
- **Answer**: YES - `initialize` response includes capabilities and agent info
- **Evidence**: `acp-results.json` lines 3-32

✓ **Q4**: How to start server, connect, post prompts, get JSON responses?
- **Answer**: Use ACP protocol flow: initialize → session/new → session/prompt
- **Evidence**: `complete-acp-test.js` (full working example)

✓ **Q5**: How to select models, agents, and permissions?
- **Answer**: Models in `session/new` response; permissions in `initialize` capabilities
- **Evidence**: `APPLICATION_GUIDE.md` sections "Model Selection" and "Permission Management"

---

## Key Insight

**`opencode serve` is a web UI, not a programmatic API.**

**`opencode acp` is the programmatic interface (JSON-RPC).**

This is the most important finding from this PoC.

---

## Architecture

```
┌─────────────────┐
│  Your App/IDE   │
└────────┬────────┘
         │
         │ spawn + stdio
         ▼
┌─────────────────┐
│  opencode acp   │  ← JSON-RPC protocol
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Sessions      │  ← Stateful conversations
│   Models        │  ← LLM selection
│   Context       │  ← Project awareness
└─────────────────┘
```

---

## What We Proved

1. ✅ ACP protocol works for programmatic control
2. ✅ JSON-RPC communication is straightforward
3. ✅ Sessions maintain context automatically
4. ✅ 30+ models available (GPT-5.2, Claude 4.5, etc.)
5. ✅ Permissions are declarative via capabilities
6. ✅ Multiple instances work independently

---

## What We Learned

### Good
- ACP is well-designed and documented
- OpenCode implements it correctly
- Protocol is stable (version 1)
- Community support is active

### Bad
- Session creation is slow (5-7s)
- No direct HTTP API option
- Documentation could be more detailed

### Ugly
- `opencode serve` name is misleading (it's a web UI, not API server)
- Error messages could be clearer
- No official SDK for JavaScript (use child_process)

---

## Production Readiness

This PoC is **NOT** production-ready. It proves the concept with minimal code.

For production, add:
- ✓ Error handling and retries
- ✓ Connection pooling
- ✓ Timeout management
- ✓ Graceful shutdown
- ✓ Health checks
- ✓ Logging and monitoring
- ✓ Unit and integration tests

Estimated time to production: **2-4 weeks** depending on scope.

---

## Next Steps

### Immediate
1. Review `complete-acp-test.js` to understand the flow
2. Read `APPLICATION_GUIDE.md` for integration patterns
3. Test in your environment

### Short Term
1. Implement basic integration with error handling
2. Add UI for user interaction
3. Test with real user workflows

### Long Term
1. Add advanced features (streaming, multi-session)
2. Performance optimization
3. Scale testing and monitoring

---

## Files Created

**Total**: 18 files
**Code files**: 8 (1 bash, 7 JavaScript)
**Documentation**: 6 (markdown)
**Data files**: 4 (JSON, logs)

**Main deliverables**:
- ✓ Working ACP integration example
- ✓ Comprehensive application guide
- ✓ Complete Q&A documentation
- ✓ Production readiness assessment

---

## PoC Metadata

- **Date**: 2026-02-02
- **Time spent**: ~60 minutes
- **Lines of code**: ~200 (main example)
- **Questions answered**: 5/5
- **Tests passed**: ✓ All core flows verified
- **Recommendation**: ✅ PROCEED

---

## Contact & Support

**For this PoC**:
- All questions answered in documentation
- Code is self-contained and runnable
- No external dependencies except OpenCode

**For OpenCode**:
- Docs: https://opencode.ai/docs/acp/
- Spec: https://agentclientprotocol.com/
- GitHub: https://github.com/opencode-ai/opencode

---

## License

This PoC is for demonstration and evaluation purposes only.
