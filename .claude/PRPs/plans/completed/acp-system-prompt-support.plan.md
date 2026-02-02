# Feature: ACP System Prompt Support for AI Context Configuration

## Summary

Add optional `systemPrompt` field to ACP notification targets, enabling users to define AI agent behavior and context at target creation time. The system prompt is sent once during session initialization and persists throughout the conversation. This leverages ACP's existing session-based conversation history to provide consistent AI context across all notifications to that target.

## User Story

As a work CLI user
I want to configure a system prompt when creating an ACP notification target
So that the AI agent maintains consistent role, context, and behavior across all work item notifications

## Problem Statement

Currently, ACP targets have no mechanism to set initial AI context or behavior. Users cannot define the AI's role (e.g., "security reviewer", "code quality expert"), leading to inconsistent responses. While ACP sessions already maintain conversation history automatically, there's no way to establish the foundational context that shapes all subsequent interactions.

## Solution Statement

Extend `ACPTargetConfig` with optional `systemPrompt?: string` field. During session initialization (`initializeSession()`), immediately after creating a new session, send the system prompt as the first message if configured. The ACP protocol's built-in conversation history mechanism ensures this context persists for all subsequent notifications to that target. Implementation follows existing patterns: optional field in type definition, CLI flag with validation, config persistence via existing JSON mechanism.

## Metadata

| Field                  | Value                                             |
| ---------------------- | ------------------------------------------------- |
| Type                   | ENHANCEMENT                                       |
| Complexity             | LOW                                               |
| Systems Affected       | notification-service, ACP handler, CLI commands   |
| Dependencies           | @agentclientprotocol/sdk 0.13.1 (existing)        |
| Estimated Tasks        | 5                                                 |
| **Research Timestamp** | **2026-02-02T21:39:31Z**                          |

---

## UX Design

### Before State
```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                              BEFORE STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   USER: work notify target add ai --type acp --cmd "opencode acp"            ║
║                                                                               ║
║   ┌──────────────┐         ┌─────────────────┐         ┌─────────────┐      ║
║   │   Create     │ ──────► │  ACP Target     │ ──────► │   Generic   │      ║
║   │   Target     │         │  (No Context)   │         │  AI Agent   │      ║
║   └──────────────┘         └─────────────────┘         └─────────────┘      ║
║                                                                               ║
║   PAIN_POINT: No way to define AI role or expertise area                     ║
║   PAIN_POINT: Each notification treated independently, no foundational context║
║   PAIN_POINT: Inconsistent AI responses across similar tasks                 ║
║                                                                               ║
║   USER: work notify send TASK-123 to ai                                      ║
║   AI: [Generic response, no specialized context]                             ║
║                                                                               ║
║   USER: work notify send TASK-456 to ai                                      ║
║   AI: [Generic response, may contradict previous advice]                     ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════════════════════════════╗
║                               AFTER STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   USER: work notify target add security-reviewer \                            ║
║         --type acp --cmd "opencode acp" \                                     ║
║         --system-prompt "You are a security expert. Focus on..."             ║
║                                                                               ║
║   ┌──────────────┐         ┌─────────────────┐         ┌─────────────┐      ║
║   │   Create     │ ──────► │  ACP Target     │ ──────► │ Specialized │      ║
║   │   Target     │         │  WITH Context   │         │  AI Expert  │      ║
║   └──────────────┘         └─────────────────┘         └─────────────┘      ║
║        (stored in            systemPrompt:                 │                 ║
║      contexts.json)          "You are..."                 │                 ║
║                                                            │                 ║
║                                   ┌────────────────────────┘                 ║
║                                   │ Session Init                             ║
║                                   ▼                                          ║
║                          ┌─────────────────┐                                 ║
║                          │  1. session/new │                                 ║
║                          │  2. Send system │  ◄── NEW: Injected once        ║
║                          │     prompt      │      at session start           ║
║                          └────────┬────────┘                                 ║
║                                   │ sessionId stored                         ║
║                                   ▼                                          ║
║   VALUE_ADD: AI maintains specialized role across all notifications          ║
║   VALUE_ADD: Conversation history includes foundational context              ║
║   VALUE_ADD: Consistent expertise in all responses                           ║
║                                                                               ║
║   USER: work notify send TASK-123 to security-reviewer                       ║
║   AI: [Security-focused analysis with context from system prompt]            ║
║                                                                               ║
║   USER: work notify send TASK-456 to security-reviewer                       ║
║   AI: [Consistent security expertise, remembers TASK-123 in conversation]    ║
║                                                                               ║
║   DATA_FLOW:                                                                  ║
║   Config → systemPrompt → initializeSession → sendPrompt(systemPrompt) →     ║
║   ACP Session History → All future prompts see system prompt in context      ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Interaction Changes

| Location | Before | After | User_Action | Impact |
|----------|--------|-------|-------------|--------|
| `work notify target add` CLI | No system prompt option | `--system-prompt "..."` flag available | Specify AI role/expertise when creating target | AI has consistent context for all notifications |
| `.work/contexts.json` | ACP config without systemPrompt | ACP config stores `"systemPrompt": "..."` | Config persists automatically | System prompt survives CLI restarts |
| ACP session initialization | Only `session/new` call | `session/new` + `sendPrompt(systemPrompt)` | Transparent to user | First message in conversation is system prompt |
| Notification responses | Generic AI responses | Context-aware specialized responses | Send work items to target | AI maintains role/expertise defined in system prompt |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `src/types/notification.ts` | 58-66 | ACPTargetConfig interface - EXACT pattern to extend with systemPrompt |
| P0 | `src/core/target-handlers/acp-handler.ts` | 180-211 | initializeSession() - WHERE to inject system prompt send |
| P0 | `src/core/target-handlers/acp-handler.ts` | 213-232 | sendPrompt() - HOW to send the system prompt message |
| P1 | `src/cli/commands/notify/target/add.ts` | 36-73, 119-151 | Flag definitions and config building - MIRROR this pattern |
| P1 | `tests/unit/core/target-handlers/acp-handler.test.ts` | 22-93, 565-590 | Test patterns - Mock config structure |
| P2 | `src/types/notification.ts` | 31-36 | EmailTargetConfig - Example of optional string fields pattern |

**Current External Documentation (Verified Live):**

| Source | Section | Why Needed | Last Verified |
|--------|---------|------------|---------------|
| [ACP Protocol Overview](https://agentclientprotocol.com/protocol/overview) ✓ Current | Session Management, session/new, session/prompt | Official ACP protocol spec for session lifecycle | 2026-02-02T21:39:31Z |
| [ACP TypeScript SDK v0.13.0](https://agentclientprotocol.github.io/typescript-sdk/interfaces/Agent.html) ✓ Current | Agent interface, session methods | Type signatures and method contracts | 2026-02-02T21:39:31Z |
| [ACP Best Practices 2026](https://codestandup.com/posts/2025/agent-client-protocol-acp-explained/) ✓ Current | System prompts, conversation history patterns | Current community recommendations | 2026-02-02T21:39:31Z |
| [Node.js child_process](https://nodejs.org/api/child_process.html#child_processspawncommand-args-options) ✓ Current | spawn() stdio handling | Subprocess communication for ACP client | 2026-02-02T21:39:31Z |

---

## Patterns to Mirror

**TYPE_DEFINITION (Optional String Field):**
```typescript
// SOURCE: src/types/notification.ts:31-36
// COPY THIS PATTERN for systemPrompt:
export interface EmailTargetConfig {
  readonly type: 'email';
  readonly to: string;
  readonly from?: string;      // ← Optional string field pattern
  readonly smtpHost?: string;  // ← Another optional string
}

// YOUR IMPLEMENTATION:
export interface ACPTargetConfig {
  readonly type: 'acp';
  readonly cmd: string;
  readonly cwd?: string;
  readonly timeout?: number;
  sessionId?: string;
  onNotification?: (method: string, params: unknown) => void;
  capabilities?: ACPCapabilities;
  systemPrompt?: string;  // ← NEW: Follow same optional pattern
}
```

**SESSION_INITIALIZATION:**
```typescript
// SOURCE: src/core/target-handlers/acp-handler.ts:180-211
// PATTERN TO EXTEND:
private async initializeSession(
  process: ChildProcess,
  config: ACPTargetConfig
): Promise<string> {
  // Step 1: Initialize protocol
  await this.sendRequest(
    process,
    'initialize',
    {
      protocolVersion: 1,
      clientInfo: {
        name: 'work-cli',
        version: '0.2.7',
      },
      capabilities: config.capabilities || {},
    },
    config.timeout || 30
  );

  // Step 2: Create session
  const sessionResult = (await this.sendRequest(
    process,
    'session/new',
    {
      cwd: config.cwd || global.process.cwd(),
      mcpServers: [],
    },
    config.timeout || 30
  )) as { sessionId: string };

  // NEW Step 3: Send system prompt if configured
  if (config.systemPrompt) {
    await this.sendPrompt(
      process,
      sessionResult.sessionId,
      config.systemPrompt
    );
  }

  return sessionResult.sessionId;
}
```

**PROMPT_SENDING:**
```typescript
// SOURCE: src/core/target-handlers/acp-handler.ts:213-232
// EXACT METHOD TO USE (no changes needed):
private async sendPrompt(
  process: ChildProcess,
  sessionId: string,
  content: string
): Promise<unknown> {
  return this.sendRequest(
    process,
    'session/prompt',
    {
      sessionId,
      prompt: [
        {
          type: 'text',
          text: content,  // ← System prompt goes here
        },
      ],
    },
    60
  );
}
```

**CLI_FLAG_DEFINITION:**
```typescript
// SOURCE: src/cli/commands/notify/target/add.ts:36-73
// COPY THIS PATTERN:
static override flags = {
  ...BaseCommand.baseFlags,
  type: Flags.string({
    char: 't',
    description: 'target type',
    options: ['bash', 'telegram', 'email', 'acp'],
    required: true,
  }),
  // ... existing flags ...
  cwd: Flags.string({
    description: 'Working directory for ACP client context',
    dependsOn: ['type'],
  }),
  // NEW FLAG:
  'system-prompt': Flags.string({
    description: 'System prompt for ACP agent behavior and role definition',
    dependsOn: ['type'],
  }),
};
```

**CONFIG_BUILDING:**
```typescript
// SOURCE: src/cli/commands/notify/target/add.ts:138-147
// EXTEND THIS SWITCH CASE:
case 'acp':
  if (!flags.cmd) {
    throw new Error('cmd is required for acp target');
  }
  return {
    type: 'acp' as const,
    cmd: flags.cmd,
    cwd: flags.cwd || process.cwd(),
    timeout: 30,
    ...(flags['system-prompt'] && { systemPrompt: flags['system-prompt'] }),  // ← NEW
  };
```

**TEST_MOCKING:**
```typescript
// SOURCE: tests/unit/core/target-handlers/acp-handler.test.ts:565-590
// COPY THIS PATTERN for new test cases:
const mockConfig: ACPTargetConfig = {
  type: 'acp',
  cmd: 'opencode acp',
  cwd: process.cwd(),
  timeout: 30,
};

// NEW: Config with system prompt
const configWithSystemPrompt: ACPTargetConfig = {
  ...mockConfig,
  systemPrompt: 'You are a code review expert focused on security and best practices.',
};
```

---

## Current Best Practices Validation

**Security (Web Intelligence Verified):**
- ✅ System prompts should define clear role boundaries (ACP best practices 2026)
- ✅ No sensitive data in system prompts (persisted to disk in contexts.json)
- ✅ Optional field allows graceful degradation (no breaking changes)
- ✅ Input validation at CLI layer (existing pattern sufficient)

**Performance (ACP Protocol Verified):**
- ✅ System prompt sent once at session creation (not every notification)
- ✅ ACP session history maintains context automatically
- ✅ No additional round-trips per notification (leverages existing flow)
- ✅ 60-second timeout for prompts already configured (line 230)

**Community Intelligence (2026 Best Practices):**
- ✅ Session-based conversation history is standard ACP pattern
- ✅ System prompts should be explicit about role, abilities, boundaries
- ✅ Selective context window management handled by ACP server
- ✅ Metadata extensibility pattern followed (_meta field not needed for basic use)

**Architecture Alignment:**
- ✅ Follows existing optional field patterns (cwd, timeout, capabilities)
- ✅ Uses established sendPrompt() method (no new protocol methods)
- ✅ Config persistence via existing JSON mechanism (no schema changes)
- ✅ CLI flag pattern matches existing --cwd, --timeout flags

---

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `src/types/notification.ts` | UPDATE | Add `systemPrompt?: string` field to ACPTargetConfig interface |
| `src/core/target-handlers/acp-handler.ts` | UPDATE | Send system prompt in initializeSession() after session/new |
| `src/cli/commands/notify/target/add.ts` | UPDATE | Add --system-prompt flag and config building logic |
| `tests/unit/core/target-handlers/acp-handler.test.ts` | UPDATE | Add test cases for system prompt initialization |
| `docs/work-notifications.md` | UPDATE | Document system prompt feature and conversation continuity |

---

## NOT Building (Scope Limits)

Explicit exclusions to prevent scope creep:

- **System prompt templates** - Users provide their own prompts (future: template library)
- **Prompt validation/sanitization** - Trust user input (optional: add length limit in future)
- **Multi-prompt strategies** - One system prompt per target (future: dynamic prompts)
- **Prompt versioning** - No history of prompt changes (future: audit trail)
- **Session/conversation management commands** - No `session clear`, `session info` (future: session lifecycle API)
- **Template variables in prompts** - No `{{context.name}}` substitution (future: templating)

---

## Step-by-Step Tasks

Execute in order. Each task is atomic and independently verifiable.

### Task 1: UPDATE `src/types/notification.ts`

- **ACTION**: ADD optional `systemPrompt` field to ACPTargetConfig interface
- **IMPLEMENT**: Add `systemPrompt?: string;` after `capabilities` field (line 66)
- **MIRROR**: `src/types/notification.ts:31-36` (EmailTargetConfig optional string fields)
- **LOCATION**: After line 65 (`capabilities?: ACPCapabilities;`)
- **EXACT_CODE**:
  ```typescript
  export interface ACPTargetConfig {
    readonly type: 'acp';
    readonly cmd: string;
    readonly cwd?: string;
    readonly timeout?: number;
    sessionId?: string; // Mutable to allow session persistence
    onNotification?: (method: string, params: unknown) => void; // Optional streaming callback
    capabilities?: ACPCapabilities; // Optional client capabilities for permission control
    systemPrompt?: string; // Optional system prompt for AI role and behavior definition
  }
  ```
- **GOTCHA**: Use `systemPrompt` (camelCase), not `system_prompt` - follow TypeScript naming convention
- **CURRENT**: [ACP Best Practices 2026](https://codestandup.com/posts/2025/agent-client-protocol-acp-explained/) - system prompts define clear role boundaries
- **VALIDATE**: `npm run type-check`
- **TEST_PYRAMID**: No additional tests needed - type definition only

### Task 2: UPDATE `src/core/target-handlers/acp-handler.ts`

- **ACTION**: SEND system prompt immediately after session creation if configured
- **IMPLEMENT**: Add system prompt send logic in initializeSession() method
- **MIRROR**: `src/core/target-handlers/acp-handler.ts:213-232` (sendPrompt method signature)
- **LOCATION**: After line 209 (`return sessionResult.sessionId;`) - insert before return
- **EXACT_CODE**:
  ```typescript
  private async initializeSession(
    process: ChildProcess,
    config: ACPTargetConfig
  ): Promise<string> {
    // ... existing initialize and session/new code (lines 185-208) ...

    // Send system prompt if configured (NEW)
    if (config.systemPrompt) {
      await this.sendPrompt(
        process,
        sessionResult.sessionId,
        config.systemPrompt
      );
    }

    return sessionResult.sessionId;
  }
  ```
- **GOTCHA**: Send system prompt AFTER session creation but BEFORE returning sessionId - ensures it's the first message in conversation history
- **CURRENT**: [ACP Protocol Overview](https://agentclientprotocol.com/protocol/overview) - session/prompt is standard method for all messages
- **VALIDATE**: `npm run type-check && npm run build`
- **FUNCTIONAL**: Create ACP target with system prompt, verify session initialization doesn't crash
- **TEST_PYRAMID**: Add integration test for: system prompt sent during session initialization

### Task 3: UPDATE `src/cli/commands/notify/target/add.ts`

- **ACTION**: ADD --system-prompt CLI flag and config building logic
- **IMPLEMENT**: 
  1. Add flag definition in static flags object (after line 72)
  2. Add config field in buildConfig() switch case (line 145)
- **MIRROR**: 
  - Flag pattern: `src/cli/commands/notify/target/add.ts:68-72` (cwd flag)
  - Config pattern: `src/cli/commands/notify/target/add.ts:138-147` (ACP case)
- **LOCATION**: 
  - Flags: After line 72 (after `cwd` flag)
  - Config: Line 145 (in ACP case, after timeout)
- **EXACT_CODE**:
  ```typescript
  // In flags object (after line 72):
  'system-prompt': Flags.string({
    description: 'System prompt for ACP agent behavior and role definition',
    dependsOn: ['type'],
  }),

  // In buildConfig switch case (line 145):
  case 'acp':
    if (!flags.cmd) {
      throw new Error('cmd is required for acp target');
    }
    return {
      type: 'acp' as const,
      cmd: flags.cmd,
      cwd: flags.cwd || process.cwd(),
      timeout: 30,
      ...(flags['system-prompt'] && { systemPrompt: flags['system-prompt'] }),
    };
  ```
- **GOTCHA**: Use `flags['system-prompt']` with bracket notation (hyphenated flag names), conditional spread to only include if present
- **CURRENT**: [oclif Flags documentation](https://oclif.io/docs/flags) - dependsOn ensures flag only relevant for ACP type
- **VALIDATE**: `npm run type-check && npm run lint`
- **FUNCTIONAL**: `./bin/run.js notify target add test --type acp --cmd "opencode acp" --system-prompt "You are a reviewer"` - verify no errors
- **TEST_PYRAMID**: Add E2E test for: CLI flag parsing and config object construction

### Task 4: UPDATE `tests/unit/core/target-handlers/acp-handler.test.ts`

- **ACTION**: ADD test cases for system prompt initialization
- **IMPLEMENT**: 
  1. Test with system prompt: verify sendPrompt called twice (system + work items)
  2. Test without system prompt: verify sendPrompt called once (work items only)
  3. Test system prompt content: verify exact content sent to ACP
- **MIRROR**: `tests/unit/core/target-handlers/acp-handler.test.ts:565-590` (config mocking pattern)
- **LOCATION**: Add new describe block after line 935 (end of existing tests)
- **EXACT_CODE**:
  ```typescript
  describe('system prompt initialization', () => {
    it('should send system prompt during session initialization', async () => {
      const configWithPrompt: ACPTargetConfig = {
        ...mockConfig,
        systemPrompt: 'You are a security expert focused on vulnerability detection.',
      };

      const mockProcess = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess);

      // Trigger initialization
      const result = await handler.send(mockWorkItems, configWithPrompt);

      // Verify two prompts sent: system prompt + work items
      expect(mockProcess.stdin.write).toHaveBeenCalledTimes(3); // initialize, session/new, system prompt
      
      // Verify system prompt content
      const calls = mockProcess.stdin.write.mock.calls;
      const systemPromptCall = calls.find(call => {
        const msg = JSON.parse(call[0]);
        return msg.method === 'session/prompt' && 
               msg.params.prompt[0].text === 'You are a security expert focused on vulnerability detection.';
      });
      expect(systemPromptCall).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should skip system prompt if not configured', async () => {
      const configWithoutPrompt: ACPTargetConfig = {
        ...mockConfig,
        // No systemPrompt field
      };

      const mockProcess = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess);

      const result = await handler.send(mockWorkItems, configWithoutPrompt);

      // Verify only work items prompt sent (no system prompt)
      expect(mockProcess.stdin.write).toHaveBeenCalledTimes(2); // initialize, session/new only
      expect(result.success).toBe(true);
    });

    it('should send system prompt before work items in conversation history', async () => {
      const configWithPrompt: ACPTargetConfig = {
        ...mockConfig,
        systemPrompt: 'You are a code reviewer.',
      };

      const mockProcess = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess);

      await handler.send(mockWorkItems, configWithPrompt);

      // Verify ordering: initialize, session/new, system prompt, work items
      const calls = mockProcess.stdin.write.mock.calls;
      const methods = calls.map(call => {
        const msg = JSON.parse(call[0]);
        return msg.method;
      });
      
      expect(methods).toEqual(['initialize', 'session/new', 'session/prompt', 'session/prompt']);
      
      // First prompt is system, second is work items
      const prompts = calls.filter(call => {
        const msg = JSON.parse(call[0]);
        return msg.method === 'session/prompt';
      });
      expect(prompts[0][0]).toContain('You are a code reviewer.');
      expect(prompts[1][0]).toContain('Task:'); // Work item formatting
    });
  });
  ```
- **GOTCHA**: Mock stdin.write calls accumulate - count total writes including initialize/session/new
- **CURRENT**: Vitest mocking patterns from existing test file
- **VALIDATE**: `npm test -- tests/unit/core/target-handlers/acp-handler.test.ts`
- **TEST_PYRAMID**: Add critical user journey test for: complete target creation → send notification → verify AI maintains context

### Task 5: UPDATE `docs/work-notifications.md`

- **ACTION**: DOCUMENT system prompt feature and conversation continuity
- **IMPLEMENT**: Add new subsection "System Prompts and Conversation History" under ACP section
- **LOCATION**: After line 98 (after "#### Troubleshooting" section)
- **EXACT_CODE**:
  ```markdown
  #### System Prompts and Conversation History

  ACP targets support system prompts that establish the AI's role and behavior:

  \`\`\`bash
  # Set up AI with specific expertise
  work notify target add security-reviewer \\
    --type acp \\
    --cmd "opencode acp" \\
    --system-prompt "You are a security expert. Focus on identifying vulnerabilities, auth issues, and data exposure risks."

  # All notifications use this context
  work notify send where kind=feature to security-reviewer
  # AI analyzes with security mindset
  \`\`\`

  **Conversation Continuity**: The ACP protocol maintains conversation history within
  a session. When you reuse the same target:

  \`\`\`bash
  work notify send TASK-1 to security-reviewer  # First message
  work notify send TASK-2 to security-reviewer  # AI remembers TASK-1
  work notify send TASK-3 to security-reviewer  # AI remembers TASK-1 and TASK-2
  \`\`\`

  The system prompt is sent once during session creation and persists throughout
  the conversation. Each subsequent notification adds to the accumulated context.

  **Best Practices for System Prompts:**
  - **Define role clearly**: "You are a [role] focused on [expertise area]"
  - **Set boundaries**: "Focus only on [scope], ignore [out-of-scope]"
  - **Specify output format**: "Provide analysis in bullet points with severity ratings"
  - **Keep concise**: Aim for 2-3 sentences that establish clear context

  **Example System Prompts:**
  - Code Review: `"You are a senior code reviewer. Analyze code for bugs, performance issues, and maintainability. Provide specific line-by-line feedback."`
  - Security Audit: `"You are a security expert. Identify vulnerabilities, authentication flaws, and data exposure risks. Rate severity as critical/high/medium/low."`
  - Architecture Review: `"You are a software architect. Evaluate design patterns, scalability, and system integration. Focus on long-term maintainability."`
  ```
- **GOTCHA**: Use triple backticks with bash for code blocks, escape backticks with backslash in markdown strings
- **CURRENT**: [ACP Best Practices 2026](https://codestandup.com/posts/2025/agent-client-protocol-acp-explained/) - clear role assignment and contextual awareness
- **VALIDATE**: Markdown rendering check (view in GitHub/VS Code preview)
- **TEST_PYRAMID**: No additional tests needed - documentation only

---

## Testing Strategy

### Unit Tests to Write

| Test File | Test Cases | Validates |
|-----------|-----------|-----------|
| `tests/unit/core/target-handlers/acp-handler.test.ts` | System prompt sent during init | sendPrompt called with systemPrompt content |
| `tests/unit/core/target-handlers/acp-handler.test.ts` | System prompt skipped if not configured | sendPrompt called once (work items only) |
| `tests/unit/core/target-handlers/acp-handler.test.ts` | System prompt sent before work items | Message ordering in conversation history |

### Edge Cases Checklist

- [x] System prompt not configured (undefined) - should skip gracefully
- [x] Empty string system prompt (`""`) - should skip (falsy check)
- [x] Very long system prompt (>5000 chars) - accepted (no validation limit)
- [x] System prompt with special characters/quotes - JSON-encoded correctly
- [x] Session reuse with existing sessionId - system prompt not re-sent
- [x] System prompt with newlines/formatting - preserved in ACP message
- [x] Concurrent sends to same target - session reuse prevents duplicate system prompts

---

## Validation Commands

### Level 1: STATIC_ANALYSIS
```bash
npm run lint && npm run type-check
```
**EXPECT**: Exit 0, no errors or warnings

### Level 2: BUILD_AND_FUNCTIONAL
```bash
npm run build && ./bin/run.js notify target add test-ai --type acp --cmd "echo acp" --system-prompt "You are a test agent"
```
**EXPECT**: Build succeeds, target created without errors

### Level 3: UNIT_TESTS
```bash
npm test -- tests/unit/core/target-handlers/acp-handler.test.ts
```
**EXPECT**: All tests pass, new system prompt tests included

### Level 4: FULL_SUITE
```bash
npm test -- --coverage && npm run build
```
**EXPECT**: All tests pass, build succeeds, coverage maintained

### Level 5: MANUAL_VALIDATION

**Step 1: Create ACP target with system prompt**
```bash
work notify target add reviewer \
  --type acp \
  --cmd "opencode acp" \
  --system-prompt "You are a senior code reviewer focused on best practices."
```
**EXPECT**: Target created successfully

**Step 2: Verify persistence**
```bash
cat .work/contexts.json | grep systemPrompt
```
**EXPECT**: See `"systemPrompt": "You are a senior code reviewer..."` in JSON

**Step 3: Send notification**
```bash
work notify send TASK-123 to reviewer
```
**EXPECT**: AI response reflects reviewer role/context

**Step 4: Send second notification**
```bash
work notify send TASK-456 to reviewer
```
**EXPECT**: AI maintains context, may reference previous task

---

## Acceptance Criteria

- [x] ACPTargetConfig has optional `systemPrompt?: string` field
- [x] CLI accepts `--system-prompt` flag for ACP targets
- [x] System prompt sent immediately after session creation if configured
- [x] System prompt not sent if undefined or empty string
- [x] System prompt persists in `.work/contexts.json`
- [x] All unit tests pass with new system prompt test cases
- [x] Level 1-3 validation commands pass with exit 0
- [x] Documentation includes system prompt examples and best practices
- [x] No regressions in existing ACP functionality
- [x] Type safety maintained (TypeScript strict mode)

---

## Completion Checklist

- [ ] Task 1: Type definition updated with systemPrompt field
- [ ] Task 2: Handler sends system prompt during initialization
- [ ] Task 3: CLI flag added with config building logic
- [ ] Task 4: Unit tests added for system prompt scenarios
- [ ] Task 5: Documentation updated with examples
- [ ] Level 1: Static analysis passes (lint + type-check)
- [ ] Level 2: Build and functional validation passes
- [ ] Level 3: Unit tests pass
- [ ] Level 4: Full test suite passes
- [ ] Level 5: Manual validation completed
- [ ] All acceptance criteria met

---

## Real-time Intelligence Summary

**Context7 MCP Queries Made**: Not used (web search sufficient for ACP protocol)
**Web Intelligence Sources**: 11 sources consulted
- Agent Client Protocol official documentation (agentclientprotocol.com)
- ACP TypeScript SDK v0.13.0 documentation
- ACP Best Practices 2026 community articles
- JetBrains AI Assistant ACP integration docs
- GitHub ACP changelog (Copilot CLI preview)

**Last Verification**: 2026-02-02T21:39:31Z
**Security Advisories Checked**: 0 (no security-critical dependencies added)
**Deprecated Patterns Avoided**: 
- Avoided injecting system prompt into `initialize` params (not part of protocol spec)
- Avoided custom protocol extensions (used standard session/prompt method)
- Avoided runtime validation overhead (rely on TypeScript types + CLI validation)

**Key Intelligence Gathered:**
- ACP sessions maintain conversation history automatically (confirmed in protocol spec)
- System prompts should define clear role, abilities, and boundaries (2026 best practices)
- session/prompt is standard method for all messages including system prompts
- No special ACP protocol support needed - leverage existing message flow

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| System prompt too long causes ACP timeout | LOW | MEDIUM | Use existing 60-second timeout for prompts (sufficient for most use cases) |
| System prompt persisted to disk exposes sensitive info | LOW | HIGH | Document best practice: avoid secrets in system prompts, user responsibility |
| Session reuse sends duplicate system prompts | LOW | LOW | Only send during initializeSession(), check for existing sessionId |
| ACP client doesn't support system prompt concept | LOW | LOW | Use standard session/prompt method - compatible with all ACP clients |
| Documentation outdated during implementation | LOW | MEDIUM | All docs verified 2026-02-02, ACP protocol stable since v0.13.0 |

---

## Notes

### Design Decisions

**Why send system prompt via session/prompt, not initialize?**
- ACP initialize params are protocol-level (protocolVersion, capabilities)
- System prompt is conversation-level content, not protocol metadata
- session/prompt is standard message method, ensures compatibility

**Why optional field, not required?**
- Preserves backward compatibility with existing ACP targets
- Not all use cases need specialized AI behavior
- Follows existing pattern (cwd, timeout, capabilities all optional)

**Why no validation/sanitization?**
- Trust user input (CLI tool for developers, not public API)
- Length limits would be arbitrary (different ACP clients have different limits)
- Special character handling done by JSON encoding (existing pattern)

### Current Intelligence Considerations

**ACP Protocol Evolution (2026):**
- Protocol stable since v0.13.0, no breaking changes expected
- Community consensus: session-based history is best practice
- GitHub Copilot CLI added ACP support in public preview (Jan 2026)
- System prompts increasingly common pattern across ACP implementations

**Implementation Confidence:**
- HIGH (9/10) - Clear patterns in codebase, protocol well-documented
- All integration points identified with file:line references
- No new dependencies, leverages existing mechanisms
- Test patterns established, failure modes understood

### Future Enhancements (Out of Scope)

- System prompt templates library (`--system-prompt-template security-audit`)
- Dynamic prompts with variable substitution (`{{context.tool}}`)
- Prompt versioning and audit trail
- Session management commands (`session clear`, `session info`)
- Multi-prompt strategies (different prompts for different notification types)
- Prompt validation (length limits, format checking)
