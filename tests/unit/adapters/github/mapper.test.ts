/**
 * Unit tests for GitHub Issue ↔ WorkItem mapping
 */

import { describe, it, expect } from 'vitest';
import {
  githubIssueToWorkItem,
  workItemToGitHubIssue,
  mapStateToGitHub,
  mapStateFromGitHub,
} from '../../../../src/adapters/github/mapper.js';
import { GitHubIssue } from '../../../../src/adapters/github/types.js';
import { CreateWorkItemRequest } from '../../../../src/types/index.js';

describe('GitHub Mapper', () => {
  describe('githubIssueToWorkItem', () => {
    it('should convert GitHub issue to WorkItem', () => {
      const githubIssue: GitHubIssue = {
        id: 123,
        number: 456,
        title: 'Test Issue',
        body: 'This is a test issue',
        state: 'open',
        labels: [{ name: 'bug' }, { name: 'high-priority' }],
        assignee: { login: 'testuser' },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z',
        closed_at: null,
      };

      const workItem = githubIssueToWorkItem(githubIssue);

      expect(workItem).toEqual({
        id: '456',
        kind: 'task',
        title: 'Test Issue',
        description: 'This is a test issue',
        state: 'new',
        priority: 'medium',
        assignee: 'testuser',
        labels: ['bug', 'high-priority'],
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-02T00:00:00Z',
        closedAt: undefined,
      });
    });

    it('should handle closed GitHub issue', () => {
      const githubIssue: GitHubIssue = {
        id: 123,
        number: 456,
        title: 'Closed Issue',
        body: null,
        state: 'closed',
        labels: [],
        assignee: null,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z',
        closed_at: '2023-01-03T00:00:00Z',
      };

      const workItem = githubIssueToWorkItem(githubIssue);

      expect(workItem).toEqual({
        id: '456',
        kind: 'task',
        title: 'Closed Issue',
        description: undefined,
        state: 'closed',
        priority: 'medium',
        assignee: undefined,
        labels: [],
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-02T00:00:00Z',
        closedAt: '2023-01-03T00:00:00Z',
      });
    });

    it('should handle null body and assignee', () => {
      const githubIssue: GitHubIssue = {
        id: 123,
        number: 789,
        title: 'Issue with nulls',
        body: null,
        state: 'open',
        labels: [],
        assignee: null,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z',
        closed_at: null,
      };

      const workItem = githubIssueToWorkItem(githubIssue);

      expect(workItem.description).toBeUndefined();
      expect(workItem.assignee).toBeUndefined();
      expect(workItem.closedAt).toBeUndefined();
    });
  });

  describe('workItemToGitHubIssue', () => {
    it('should convert CreateWorkItemRequest to GitHub issue params', () => {
      const request: CreateWorkItemRequest = {
        kind: 'task',
        title: 'New Task',
        description: 'Task description',
        priority: 'high',
        assignee: 'developer',
        labels: ['feature', 'urgent'],
      };

      const githubParams = workItemToGitHubIssue(request);

      expect(githubParams).toEqual({
        title: 'New Task',
        body: 'Task description',
        labels: ['feature', 'urgent'],
        assignees: ['developer'],
      });
    });

    it('should not include assignees field when assignee is undefined', () => {
      const request: CreateWorkItemRequest = {
        kind: 'task',
        title: 'Unassigned Task',
        labels: ['feature'],
      };

      const githubParams = workItemToGitHubIssue(request);

      expect(githubParams).toEqual({
        title: 'Unassigned Task',
        labels: ['feature'],
      });
      expect(githubParams).not.toHaveProperty('assignees');
    });

    it('should convert assignee to assignees array', () => {
      const request: CreateWorkItemRequest = {
        kind: 'task',
        title: 'Assigned Task',
        assignee: 'tbrandenburg',
      };

      const githubParams = workItemToGitHubIssue(request);

      expect(githubParams.assignees).toEqual(['tbrandenburg']);
    });

    it('should handle optional fields', () => {
      const request: CreateWorkItemRequest = {
        kind: 'bug',
        title: 'Simple Bug',
      };

      const githubParams = workItemToGitHubIssue(request);

      expect(githubParams).toEqual({
        title: 'Simple Bug',
      });
      expect(githubParams.body).toBeUndefined();
      expect(githubParams.labels).toBeUndefined();
    });

    it('should handle empty labels array', () => {
      const request: CreateWorkItemRequest = {
        kind: 'task',
        title: 'Task with empty labels',
        labels: [],
      };

      const githubParams = workItemToGitHubIssue(request);

      expect(githubParams).toEqual({
        title: 'Task with empty labels',
      });
      expect(githubParams.labels).toBeUndefined();
    });
  });

  describe('mapStateToGitHub', () => {
    it('should map work item states to GitHub states', () => {
      expect(mapStateToGitHub('new')).toBe('open');
      expect(mapStateToGitHub('active')).toBe('open');
      expect(mapStateToGitHub('closed')).toBe('closed');
    });

    it('should default to open for unknown states', () => {
      expect(mapStateToGitHub('unknown' as any)).toBe('open');
    });
  });

  describe('mapStateFromGitHub', () => {
    it('should map GitHub states to work item states', () => {
      expect(mapStateFromGitHub('open')).toBe('new');
      expect(mapStateFromGitHub('closed')).toBe('closed');
    });
  });
});
