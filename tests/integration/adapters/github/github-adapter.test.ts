/**
 * Integration tests for GitHub adapter with real GitHub API
 *
 * These tests require GITHUB_TOKEN environment variable to be set
 * and use the test repository: https://github.com/tbrandenburg/playground
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { GitHubAdapter } from '../../../../src/adapters/github/index.js';
import { Context } from '../../../../src/types/context.js';
import { CreateWorkItemRequest } from '../../../../src/types/work-item.js';

// Check if tests should be skipped
function shouldSkipTests(): boolean {
  // Skip tests if no GitHub token is available
  const token = process.env['CI_GITHUB_TOKEN'] || process.env['GITHUB_TOKEN'];
  if (!token) {
    console.warn('Skipping GitHub integration tests - no GitHub token available');
    return true;
  }

  // Only skip if we're in CI with the default read-only GITHUB_TOKEN
  // If CI_GITHUB_TOKEN is available, we have write permissions
  if (process.env['CI'] === 'true' && !process.env['CI_GITHUB_TOKEN']) {
    console.warn('Skipping GitHub integration tests - CI environment without CI_GITHUB_TOKEN');
    return true;
  }

  return false;
}

const skipTests = shouldSkipTests();

describe('GitHub Adapter Integration', () => {
  let adapter: GitHubAdapter;
  let context: Context;
  let createdIssueIds: string[] = [];

  beforeAll(async () => {
    if (skipTests) return;

    const token = process.env['CI_GITHUB_TOKEN'] || process.env['GITHUB_TOKEN'];
    adapter = new GitHubAdapter();
    context = {
      name: 'test-github',
      tool: 'github',
      url: 'https://github.com/tbrandenburg/work',
      authState: 'unauthenticated',
      isActive: true,
    };

    // Initialize adapter
    await adapter.initialize(context);

    // Authenticate with CI_GITHUB_TOKEN (preferred) or fallback to GITHUB_TOKEN
    await adapter.authenticate({ token });
  });

  afterAll(async () => {
    if (skipTests) return;
    
    // Clean up created issues by closing them
    if (adapter && createdIssueIds.length > 0) {
      for (const issueId of createdIssueIds) {
        try {
          await adapter.changeState(issueId, 'closed');
        } catch (error) {
          console.warn(`Failed to close issue ${issueId}:`, error);
        }
      }
    }
  });

  it.skipIf(skipTests)('should authenticate successfully', async () => {
    const authStatus = await adapter.getAuthStatus();
    expect(authStatus.state).toBe('authenticated');
  });

  it.skipIf(skipTests)('should create a new issue', async () => {

    const request: CreateWorkItemRequest = {
      kind: 'task',
      title: 'Test Issue from Integration Test',
      description:
        'This is a test issue created by the GitHub adapter integration test',
      labels: ['test', 'integration'],
    };

    const workItem = await adapter.createWorkItem(request);

    expect(workItem).toBeDefined();
    expect(workItem.title).toBe(request.title);
    expect(workItem.description).toBe(request.description);
    expect(workItem.labels).toContain('test');
    expect(workItem.labels).toContain('integration');
    expect(workItem.state).toBe('new');
    expect(workItem.kind).toBe('task');

    // Store for cleanup
    createdIssueIds.push(workItem.id);
  });

  it.skipIf(skipTests)('should list issues from repository', async () => {
    const workItems = await adapter.listWorkItems();

    expect(Array.isArray(workItems)).toBe(true);
    expect(workItems.length).toBeGreaterThan(0);

    // Check that each work item has required properties
    for (const item of workItems.slice(0, 5)) {
      // Check first 5 items
      expect(item.id).toBeDefined();
      expect(item.title).toBeDefined();
      expect(item.state).toMatch(/^(new|closed)$/);
      expect(item.kind).toBe('task');
      expect(item.createdAt).toBeDefined();
      expect(item.updatedAt).toBeDefined();
    }
  });

  it.skipIf(skipTests)('should get specific issue by ID', async () => {
    if (createdIssueIds.length === 0) {
      return; // Skip if no created issues
    }

    const issueId = createdIssueIds[0];
    const workItem = await adapter.getWorkItem(issueId);

    expect(workItem).toBeDefined();
    expect(workItem.id).toBe(issueId);
    expect(workItem.title).toBe('Test Issue from Integration Test');
    expect(workItem.description).toBe(
      'This is a test issue created by the GitHub adapter integration test'
    );
  });

  it.skipIf(skipTests)('should update issue', async () => {
    if (createdIssueIds.length === 0) {
      return; // Skip if no token or no created issues
    }

    const issueId = createdIssueIds[0];
    const updatedWorkItem = await adapter.updateWorkItem(issueId, {
      title: 'Updated Test Issue',
      description: 'This issue has been updated by the integration test',
      labels: ['test', 'integration', 'updated'],
    });

    expect(updatedWorkItem.title).toBe('Updated Test Issue');
    expect(updatedWorkItem.description).toBe(
      'This issue has been updated by the integration test'
    );
    expect(updatedWorkItem.labels).toEqual(['test', 'integration', 'updated']);
  });

  it.skipIf(skipTests)('should change issue state', async () => {
    if (createdIssueIds.length === 0) {
      return; // Skip if no created issues
    }

    const issueId = createdIssueIds[0];

    // Close the issue
    const closedWorkItem = await adapter.changeState(issueId, 'closed');
    expect(closedWorkItem.state).toBe('closed');
    expect(closedWorkItem.closedAt).toBeDefined();

    // Reopen the issue
    const reopenedWorkItem = await adapter.changeState(issueId, 'new');
    expect(reopenedWorkItem.state).toBe('new');
  });

  it.skipIf(skipTests)('should filter issues with query', async () => {
    const allItems = await adapter.listWorkItems();
    const filteredItems = await adapter.listWorkItems('test');

    expect(Array.isArray(filteredItems)).toBe(true);
    expect(filteredItems.length).toBeLessThanOrEqual(allItems.length);

    // All filtered items should contain 'test' in title or description
    for (const item of filteredItems) {
      const searchText =
        `${item.title} ${item.description || ''}`.toLowerCase();
      expect(searchText).toContain('test');
    }
  });

  it.skipIf(skipTests)('should get schema information', async () => {
    const schema = await adapter.getSchema();

    expect(schema.kinds).toEqual(['task']);
    expect(schema.attributes.length).toBeGreaterThan(0);
    expect(schema.relationTypes).toEqual([]);

    // Check that required attributes are present
    const titleAttr = schema.attributes.find(attr => attr.name === 'title');
    expect(titleAttr).toBeDefined();
    expect(titleAttr?.required).toBe(true);
  });

  it.skipIf(skipTests)('should handle non-existent issue gracefully', async () => {
    await expect(adapter.getWorkItem('999999')).rejects.toThrow(
      'Work item not found: 999999'
    );
  });

  it.skipIf(skipTests)('should delete (close) issue', async () => {
    if (createdIssueIds.length === 0) {
      return; // Skip if no created issues
    }

    const issueId = createdIssueIds[0];

    // Delete should close the issue
    await adapter.deleteWorkItem(issueId);

    // Verify it's closed
    const workItem = await adapter.getWorkItem(issueId);
    expect(workItem.state).toBe('closed');
  });
});
