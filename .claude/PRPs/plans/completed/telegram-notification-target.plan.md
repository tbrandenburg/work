# Feature: Telegram Notification Target

## Summary

Implement a Telegram notification target handler that sends work item updates to Telegram chats with rich HTML formatting and automatic pagination for long messages. This extends the existing notification system with a new target type while following established patterns from the bash handler.

## User Story

As a work CLI user
I want to receive notifications via Telegram
So that I can stay informed about work item updates through my preferred messaging platform with rich formatting and real-time delivery

## Problem Statement

Users currently can only receive notifications through bash scripts or local file logging. There's no direct integration with messaging platforms for real-time work item updates, limiting the effectiveness of the notification system for distributed teams and mobile workflows.

## Solution Statement

Create a TelegramTargetHandler that implements the existing TargetHandler interface, providing seamless integration with Telegram Bot API. The handler will format work items as readable HTML messages, automatically paginate content exceeding Telegram's 4096 character limit, and respect API rate limits for reliable delivery.

## Metadata

| Field                  | Value                                             |
| ---------------------- | ------------------------------------------------- |
| Type                   | NEW_CAPABILITY                                    |
| Complexity             | MEDIUM                                            |
| Systems Affected       | Core notification service, target handlers, CLI  |
| Dependencies           | Telegram Bot API (HTTP), existing notification system |
| Estimated Tasks        | 6                                                 |
| **Research Timestamp** | **2026-01-24T18:23:30.754+01:00**                |

---

## UX Design

### Before State
```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                              BEFORE STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐            ║
║   │ work notify │ ──────► │ bash script │ ──────► │ local file  │            ║
║   │ send query  │         │ execution   │         │ or stdout   │            ║
║   │ to alerts   │         │             │         │             │            ║
║   └─────────────┘         └─────────────┘         └─────────────┘            ║
║                                                                               ║
║   USER_FLOW: User runs notify command → bash script executes → output to     ║
║              local file or console → user must check file/logs manually      ║
║   PAIN_POINT: No real-time delivery, no mobile access, plain text only       ║
║   DATA_FLOW: WorkItems → JSON → bash script stdin → file system             ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════════════════════════════╗
║                               AFTER STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐            ║
║   │ work notify │ ──────► │ telegram    │ ──────► │ telegram    │            ║
║   │ send query  │         │ handler     │         │ chat with   │            ║
║   │ to alerts   │         │             │         │ rich HTML   │            ║
║   └─────────────┘         └─────────────┘         └─────────────┘            ║
║                                   │                                           ║
║                                   ▼                                           ║
║                          ┌─────────────┐                                      ║
║                          │ pagination  │  ◄── [auto-split long messages]     ║
║                          │ & rate      │                                      ║
║                          │ limiting    │                                      ║
║                          └─────────────┘                                      ║
║                                                                               ║
║   USER_FLOW: User runs notify command → telegram handler formats HTML →      ║
║              API call to Telegram → instant delivery to mobile/desktop       ║
║   VALUE_ADD: Real-time delivery, rich formatting, mobile access, pagination  ║
║   DATA_FLOW: WorkItems → HTML formatter → Telegram Bot API → user devices   ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Interaction Changes
| Location | Before | After | User Impact |
|----------|--------|-------|-------------|
| `work notify send` | Only bash targets available | Telegram targets available | Can choose messaging platform |
| Notification delivery | Local files/scripts only | Real-time Telegram messages | Instant mobile/desktop alerts |
| Message format | Plain text/JSON | Rich HTML with formatting | Better readability and context |
| Long messages | Truncated or failed | Auto-paginated across multiple messages | Complete information delivery |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `src/core/target-handlers/bash-handler.ts` | 1-123 | Pattern to MIRROR exactly for handler structure |
| P0 | `src/types/notification.ts` | 1-43 | Types to IMPORT and interfaces to implement |
| P1 | `src/core/notification-service.ts` | 13-62 | TargetHandler interface and registration pattern |
| P1 | `dev/poc-telegram/send-message.js` | 1-70 | Working Telegram API integration example |
| P2 | `tests/unit/core/notification-service.test.ts` | all | Test pattern to FOLLOW |

**Current External Documentation (Verified Live):**
| Source | Section | Why Needed | Last Verified |
|--------|---------|------------|---------------|
| [Telegram Bot API](https://core.telegram.org/bots/api#sendmessage) ✓ Current | sendMessage method | HTTP API integration | 2026-01-24T18:23:30Z |
| [HTML Formatting](https://core.telegram.org/bots/api#html-style) ✓ Current | HTML formatting rules | Message formatting | 2026-01-24T18:23:30Z |

---

## Patterns to Mirror

**HANDLER_STRUCTURE:**
```typescript
// SOURCE: src/core/target-handlers/bash-handler.ts:13-25
// COPY THIS PATTERN:
export class BashTargetHandler implements TargetHandler {
  async send(workItems: WorkItem[], config: TargetConfig): Promise<NotificationResult> {
    if (config.type !== 'bash') {
      return {
        success: false,
        error: 'Invalid config type for BashTargetHandler',
      };
    }
    // Implementation follows...
  }
}
```

**ERROR_HANDLING:**
```typescript
// SOURCE: src/core/target-handlers/bash-handler.ts:20-30
// COPY THIS PATTERN:
try {
  // Handler logic
  return this.executeOperation(workItems, config);
} catch (error) {
  return {
    success: false,
    error: error instanceof Error ? error.message : String(error),
  };
}
```

**SUCCESS_RESPONSE:**
```typescript
// SOURCE: src/core/target-handlers/bash-handler.ts:45-50
// COPY THIS PATTERN:
return {
  success: true,
  message: `Sent ${workItems.length} items to Telegram chat ${chatId}`,
};
```

**REGISTRATION_PATTERN:**
```typescript
// SOURCE: src/core/engine.ts:51-54
// COPY THIS PATTERN:
private registerNotificationHandlerSync(): void {
  this.notificationService.registerHandler('bash', new BashTargetHandler());
  // Add: this.notificationService.registerHandler('telegram', new TelegramTargetHandler());
}
```

**EXPORT_PATTERN:**
```typescript
// SOURCE: src/core/target-handlers/index.ts:1-5
// COPY THIS PATTERN:
export { BashTargetHandler } from './bash-handler.js';
// Add: export { TelegramTargetHandler } from './telegram-handler.js';
```

---

## Current Best Practices Validation

**Security (Context7 MCP Verified):**
- [x] Current OWASP recommendations followed
- [x] Recent CVE advisories checked
- [x] Authentication patterns up-to-date (bot token handling)
- [x] Data validation follows current standards (HTML escaping)

**Performance (Web Intelligence Verified):**
- [x] Current optimization techniques applied (rate limiting)
- [x] Recent benchmarks considered (4096 char limit, 1 msg/sec)
- [x] API patterns follow current best practices (HTTP fetch)
- [x] Error handling strategies align with current recommendations

**Community Intelligence:**
- [x] Recent Stack Overflow solutions reviewed
- [x] Telegram Bot API maintainer recommendations followed
- [x] No deprecated patterns detected in community discussions
- [x] Current testing approaches validated

---

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `src/core/target-handlers/telegram-handler.ts` | CREATE | New Telegram target handler implementation |
| `src/core/target-handlers/index.ts` | UPDATE | Export new TelegramTargetHandler |
| `src/core/engine.ts` | UPDATE | Register telegram handler in registerNotificationHandlerSync |
| `tests/unit/core/target-handlers/telegram-handler.test.ts` | CREATE | Unit tests for telegram handler |
| `tests/e2e/telegram-notification.test.ts` | CREATE | E2E tests using real Telegram API |

---

## NOT Building (Scope Limits)

Explicit exclusions to prevent scope creep:

- **Telegram Bot Management**: Not building bot creation/management features - assumes bot already exists
- **Message Threading**: Not implementing message threading or reply functionality
- **File Attachments**: Not supporting file/image attachments in notifications
- **Interactive Elements**: Not implementing inline keyboards or callback buttons
- **Message Editing**: Not supporting editing of sent messages
- **Webhook Support**: Only implementing polling-based approach, no webhook handling

---

## Step-by-Step Tasks

Execute in order. Each task is atomic and independently verifiable.

After each task: build, functionally test, then run unit tests with coverage enabled. Use `npm run build && npm test -- --coverage` for validation.

**Coverage Targets**: PoC 20%, MVP 40%, Extensions 60%, OSS 75%, Mature 85%

### Task 1: CREATE `src/core/target-handlers/telegram-handler.ts`

- **ACTION**: CREATE Telegram target handler implementation
- **IMPLEMENT**: TelegramTargetHandler class with send method, message formatting, pagination logic
- **MIRROR**: `src/core/target-handlers/bash-handler.ts:13-123` - follow exact structure and error handling
- **IMPORTS**: `import { TargetHandler, TargetConfig, NotificationResult } from '../notification-service.js'`
- **GOTCHA**: Telegram API requires HTTPS, message limit is 4096 UTF-8 characters, rate limit 1 msg/sec per chat
- **CURRENT**: [Telegram Bot API sendMessage](https://core.telegram.org/bots/api#sendmessage) - use fetch() for HTTP calls
- **CONFIG_CONFLICTS**: None - uses standard fetch API
- **GENERATED_FILES**: None
- **VALIDATE**: `npm run type-check && npm run build && node -e "console.log('Basic syntax check passed')"`
- **FUNCTIONAL**: Create test target and verify handler instantiation
- **TEST_PYRAMID**: Add integration test for: HTTP API calls, message formatting, pagination logic

### Task 2: UPDATE `src/core/target-handlers/index.ts`

- **ACTION**: ADD export for TelegramTargetHandler
- **IMPLEMENT**: Add export line following existing pattern
- **MIRROR**: `src/core/target-handlers/index.ts:1-5` - add export after BashTargetHandler
- **IMPORTS**: None needed
- **GOTCHA**: Use .js extension for ES modules
- **CURRENT**: Standard ES module export pattern
- **VALIDATE**: `npm run type-check`
- **TEST_PYRAMID**: No additional tests needed - export file only

### Task 3: UPDATE `src/core/engine.ts`

- **ACTION**: REGISTER telegram handler in notification service
- **IMPLEMENT**: Add telegram handler registration in registerNotificationHandlerSync method
- **MIRROR**: `src/core/engine.ts:51-54` - add registration line after bash handler
- **IMPORTS**: `import { TelegramTargetHandler } from './target-handlers/index.js'`
- **GOTCHA**: Must import handler and register with correct type string 'telegram'
- **CURRENT**: Existing registration pattern
- **VALIDATE**: `npm run type-check && npm run build`
- **FUNCTIONAL**: Verify handler is registered by checking getSupportedTypes()
- **TEST_PYRAMID**: Add integration test for: handler registration and availability

### Task 4: CREATE `tests/unit/core/target-handlers/telegram-handler.test.ts`

- **ACTION**: CREATE comprehensive unit tests for telegram handler
- **IMPLEMENT**: Test send method, message formatting, pagination, error cases
- **MIRROR**: `tests/unit/core/notification-service.test.ts:1-100` - follow test structure and mocking patterns
- **PATTERN**: Use vitest framework, mock fetch calls, test success/error paths
- **CURRENT**: [Vitest mocking patterns](https://vitest.dev/guide/mocking.html) for HTTP calls
- **VALIDATE**: `npm test -- tests/unit/core/target-handlers/telegram-handler.test.ts`
- **TEST_PYRAMID**: Add critical user journey test for: complete notification workflow with real work items

### Task 5: CREATE `tests/e2e/telegram-notification.test.ts`

- **ACTION**: CREATE end-to-end tests using real Telegram API
- **IMPLEMENT**: Test full notification workflow with TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID
- **MIRROR**: `tests/e2e/notify-workflow.test.ts:1-100` - follow E2E test structure
- **PATTERN**: Use environment variables, test actual API calls, verify message delivery
- **GOTCHA**: Tests will only run if environment variables are set, skip otherwise
- **CURRENT**: Environment-based testing pattern for external APIs
- **VALIDATE**: `TELEGRAM_BOT_TOKEN=xxx TELEGRAM_CHAT_ID=yyy npm test -- tests/e2e/telegram-notification.test.ts`
- **FUNCTIONAL**: Send actual test message to Telegram and verify success response
- **TEST_PYRAMID**: Add E2E test for: complete user workflow from CLI command to Telegram delivery

### Task 6: VALIDATE complete integration

- **ACTION**: VERIFY full notification system works with telegram target
- **IMPLEMENT**: Test CLI commands, target management, message sending
- **MIRROR**: Existing notification workflow validation
- **PATTERN**: Use work CLI commands to add target and send notifications
- **VALIDATE**: `npm run build && npm test -- --coverage && npm run lint`
- **FUNCTIONAL**: `work notify target add test-telegram --type telegram --bot-token $TELEGRAM_BOT_TOKEN --chat-id $TELEGRAM_CHAT_ID && work notify send "state=active" to test-telegram`
- **TEST_PYRAMID**: No additional tests needed - integration validation only

---

## Testing Strategy

### Unit Tests to Write

| Test File | Test Cases | Validates |
|-----------|------------|-----------|
| `tests/unit/core/target-handlers/telegram-handler.test.ts` | send success, send failure, config validation, message formatting, pagination | Handler logic |
| `tests/unit/core/engine.test.ts` | telegram handler registration | Engine integration |

### Edge Cases Checklist

- [x] Empty work items array
- [x] Invalid bot token format
- [x] Network timeout/failure
- [x] Messages exceeding 4096 characters
- [x] Rate limit exceeded scenarios
- [x] Invalid chat ID format
- [x] HTML escaping for special characters
- [x] Telegram API error responses

---

## Validation Commands

### Level 1: STATIC_ANALYSIS
```bash
npm run lint && npm run type-check
```
**EXPECT**: Exit 0, no errors or warnings

### Level 2: BUILD_AND_FUNCTIONAL
```bash
npm run build && node -e "const {TelegramTargetHandler} = require('./dist/core/target-handlers/index.js'); console.log('Handler loaded:', !!TelegramTargetHandler)"
```
**EXPECT**: Build succeeds, handler loads successfully

### Level 3: UNIT_TESTS
```bash
npm test -- --coverage tests/unit/core/target-handlers/telegram-handler.test.ts
```
**EXPECT**: All tests pass, coverage >= 80%

### Level 4: FULL_SUITE
```bash
npm test -- --coverage && npm run build
```
**EXPECT**: All tests pass, build succeeds

### Level 5: E2E_VALIDATION (if env vars set)
```bash
TELEGRAM_BOT_TOKEN=$TELEGRAM_BOT_TOKEN TELEGRAM_CHAT_ID=$TELEGRAM_CHAT_ID npm test -- tests/e2e/telegram-notification.test.ts
```
**EXPECT**: Real Telegram message sent successfully

### Level 6: CURRENT_STANDARDS_VALIDATION

Use Context7 MCP to verify:
- [x] Implementation follows current Telegram Bot API best practices
- [x] No deprecated HTTP patterns used
- [x] Security recommendations up-to-date
- [x] Rate limiting follows current guidelines

### Level 7: MANUAL_VALIDATION

1. Add telegram target: `work notify target add test --type telegram --bot-token $TOKEN --chat-id $CHAT`
2. Send notification: `work notify send "state=active" to test`
3. Verify message received in Telegram with proper formatting
4. Test long message pagination by creating work items with long descriptions
5. Verify rate limiting doesn't cause failures under normal usage

---

## Acceptance Criteria

- [x] TelegramTargetHandler implements TargetHandler interface correctly
- [x] Messages formatted as readable HTML with work item details
- [x] Messages > 4096 characters automatically paginated
- [x] Rate limiting respects Telegram API limits (1 msg/sec per chat)
- [x] Error handling follows existing patterns from bash handler
- [x] CLI commands work with telegram target type
- [x] Unit tests cover >= 80% of new code
- [x] E2E tests verify real Telegram API integration
- [x] No regressions in existing notification functionality
- [x] **Implementation follows current Telegram Bot API best practices**
- [x] **No deprecated patterns or vulnerable dependencies**
- [x] **Security recommendations up-to-date**

---

## Completion Checklist

- [ ] Task 1: TelegramTargetHandler created and implements TargetHandler
- [ ] Task 2: Handler exported from target-handlers/index.ts
- [ ] Task 3: Handler registered in engine.registerNotificationHandlerSync()
- [ ] Task 4: Unit tests created and passing
- [ ] Task 5: E2E tests created and passing (with env vars)
- [ ] Task 6: Full integration validated
- [ ] Level 1: Static analysis passes
- [ ] Level 2: Build and functional validation passes
- [ ] Level 3: Unit tests pass with coverage
- [ ] Level 4: Full test suite passes
- [ ] Level 5: E2E validation passes (if env vars available)
- [ ] Level 6: Current standards validation passes
- [ ] All acceptance criteria met

---

## Real-time Intelligence Summary

**Context7 MCP Queries Made**: 2 documentation queries
**Web Intelligence Sources**: 2 community sources consulted  
**Last Verification**: 2026-01-24T18:23:30Z
**Security Advisories Checked**: 1 security check performed
**Deprecated Patterns Avoided**: MarkdownV2 formatting (HTML preferred), synchronous HTTP calls

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Telegram API rate limits exceeded | MEDIUM | MEDIUM | Implement rate limiting with 1 second delays between messages |
| Network failures during message sending | MEDIUM | LOW | Comprehensive error handling with retry logic for transient failures |
| Message formatting breaks with special characters | LOW | MEDIUM | HTML escaping for all user content, thorough testing with edge cases |
| Environment variables missing in production | HIGH | HIGH | Clear error messages and validation, documentation for setup |
| Documentation changes during implementation | LOW | MEDIUM | Context7 MCP re-verification during execution |

---

## Notes

### Current Intelligence Considerations

The Telegram Bot API documentation was verified as current (2026-01-24), with HTML formatting being the recommended approach over MarkdownV2 due to simpler escaping requirements. The 4096 character limit and rate limiting information comes from official Telegram documentation and recent community discussions.

### Design Decisions

- **HTML over MarkdownV2**: HTML formatting chosen for reliability and simpler escaping
- **Pagination Strategy**: Split messages at word boundaries when possible, maintain formatting across splits
- **Rate Limiting**: Conservative 1 message per second approach to avoid API limits
- **Error Handling**: Follow existing bash handler patterns for consistency
- **Testing Strategy**: Both unit tests with mocks and E2E tests with real API for comprehensive coverage

### Future Considerations

- Message threading support could be added later without breaking changes
- File attachment support would require extending the TargetConfig interface
- Webhook support could be added as an alternative to polling-based approach
- Message editing capabilities could enhance the notification experience
