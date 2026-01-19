# work CLI — Non-Functional Requirements

This document defines the quality attributes and performance requirements for the `work` CLI system.

---

## 1. Performance Requirements

### 1.1 Response Time Targets

| Operation | Backend | Target | Measurement |
|-----------|---------|--------|-------------|
| List high-priority open tasks | local-fs | < 2s | Up to 1,000 items |
| List operations | Remote (Jira/GitHub/Linear/ADO) | < 5s | Typical project size |
| Single item retrieval | Any backend | < 1s | Individual work item |
| Create work item | Any backend | < 3s | Including validation |
| State transitions | Any backend | < 2s | start/close/reopen |

### 1.2 Startup Performance

- CLI initialization: < 500ms
- Context resolution: < 100ms
- Adapter loading: < 200ms

### 1.3 Memory Usage

- Peak memory per command: < 100MB
- Graph slice size: < 10MB for typical queries
- No memory leaks between commands

---

## 2. Scalability Requirements

### 2.1 Data Volume Limits

| Backend | Max Work Items | Max Relations | Notes |
|---------|---------------|---------------|-------|
| local-fs | 10,000 | 50,000 | Filesystem performance dependent |
| Jira | Project-limited | N/A | Respects Jira API limits |
| GitHub | Repository-limited | N/A | Respects GitHub API limits |
| Linear | Team-limited | N/A | Respects Linear API limits |
| ADO | Project-limited | N/A | Respects ADO API limits |

### 2.2 Concurrent Usage

- Multiple contexts: No interference between contexts
- File locking: Safe concurrent access to local-fs
- API rate limits: Respect backend-specific throttling

---

## 3. Reliability Requirements

### 3.1 Error Handling

- Graceful degradation when backends are unavailable
- Clear error messages with actionable guidance
- No data corruption on partial failures
- Atomic operations for state changes

### 3.2 Data Integrity

- Relation consistency validation
- No orphaned references
- Cycle detection in hierarchies and dependencies
- Rollback capability for failed operations

### 3.3 Availability

- Offline capability via local-fs backend
- No single point of failure across contexts
- Fallback behavior when remote services are down

---

## 4. Security Requirements

### 4.1 Credential Management

- Credential isolation per context
- No credential leakage in logs or output
- Secure storage of authentication tokens
- Automatic credential expiration handling

### 4.2 Data Protection

- No sensitive data in temporary files
- Secure transmission to remote backends
- Input validation and sanitization
- Protection against injection attacks

---

## 5. Usability Requirements

### 5.1 Command Interface

- Consistent command patterns across backends
- Predictable error messages
- Tab completion support
- Help text accessibility

### 5.2 Output Format

- Human-readable default output
- Machine-parseable formats available
- Consistent formatting across commands
- Progress indicators for long operations

---

## 6. Compatibility Requirements

### 6.1 Platform Support

- Linux (primary)
- macOS (secondary)
- Windows via WSL (tertiary)

### 6.2 Backend Versions

- Jira: Cloud and Server 8.0+
- GitHub: REST API v4, GraphQL v4
- Linear: GraphQL API current version
- Azure DevOps: REST API 6.0+

---

## 7. Maintainability Requirements

### 7.1 Code Quality

- Test coverage > 80%
- Adapter isolation for independent testing
- Clear separation of concerns
- Comprehensive error logging

### 7.2 Testing Strategy

- **Testing Pyramid Approach**:
  - Unit tests (70%): Core logic, adapters, query evaluation
  - Integration tests (20%): Adapter-backend interactions, context resolution
  - End-to-end tests (10%): Full CLI workflows, cross-adapter scenarios
- Fast feedback loop with majority unit tests
- Isolated adapter testing without external dependencies
- Contract testing between CLI core and adapters

### 7.3 Extensibility

- New adapters without CLI changes
- Plugin architecture for custom backends
- Configuration-driven behavior
- Backward compatibility for contexts

---

## 8. Monitoring and Observability

### 8.1 Performance Metrics

- Command execution time tracking
- API call frequency and latency
- Memory usage profiling
- Error rate monitoring

### 8.2 Debugging Support

- Verbose logging modes
- Request/response tracing
- Graph slice inspection
- Adapter state visibility

---

## 9. Compliance and Standards

### 9.1 API Usage

- Respect backend rate limits
- Follow OAuth 2.0 standards
- Implement proper retry logic
- Cache responses appropriately

### 9.2 Data Handling

- GDPR compliance for user data
- No unnecessary data retention
- Audit trail for sensitive operations
- Privacy-preserving defaults
