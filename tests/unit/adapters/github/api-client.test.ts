/**
 * Unit tests for GitHub API client
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GitHubApiClient } from '../../../../src/adapters/github/api-client.js';
import { GitHubConfig } from '../../../../src/adapters/github/types.js';

describe('GitHubApiClient', () => {
  let config: GitHubConfig;

  beforeEach(() => {
    config = {
      owner: 'testowner',
      repo: 'testrepo',
      token: 'ghp_1234567890123456789012345678901234567890',
    };
  });

  describe('constructor', () => {
    it('should create GitHubApiClient instance', () => {
      const client = new GitHubApiClient(config);
      expect(client).toBeInstanceOf(GitHubApiClient);
    });

    it('should initialize with correct config', () => {
      const client = new GitHubApiClient(config);
      expect(client).toBeDefined();
      // We can't easily test private properties, but we can verify the instance was created
    });
  });

  describe('API methods', () => {
    let client: GitHubApiClient;

    beforeEach(() => {
      client = new GitHubApiClient(config);
    });

    it('should have listIssues method', () => {
      expect(typeof client.listIssues).toBe('function');
    });

    it('should have getIssue method', () => {
      expect(typeof client.getIssue).toBe('function');
    });

    it('should have createIssue method', () => {
      expect(typeof client.createIssue).toBe('function');
    });

    it('should have updateIssue method', () => {
      expect(typeof client.updateIssue).toBe('function');
    });

    it('should have closeIssue method', () => {
      expect(typeof client.closeIssue).toBe('function');
    });
  });

  describe('error handling', () => {
    it('should handle invalid config gracefully', () => {
      const invalidConfig = {
        owner: '',
      } as GitHubConfig;

      // Should not throw during construction
      expect(() => new GitHubApiClient(invalidConfig)).not.toThrow();
    });
  });

  describe('listIssues pagination', () => {
    it('should fetch all pages when repo has >100 issues', async () => {
      // Mock Octokit
      const mockListForRepo = vi.fn();
      
      // Mock first page (100 items)
      const page1 = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        number: i + 1,
        title: `Issue ${i + 1}`,
        state: 'open',
        html_url: `https://github.com/test/repo/issues/${i + 1}`,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        body: null,
        user: { login: 'testuser' },
        labels: [],
      }));

      // Mock second page (50 items - last page)
      const page2 = Array.from({ length: 50 }, (_, i) => ({
        id: i + 101,
        number: i + 101,
        title: `Issue ${i + 101}`,
        state: 'open',
        html_url: `https://github.com/test/repo/issues/${i + 101}`,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        body: null,
        user: { login: 'testuser' },
        labels: [],
      }));

      mockListForRepo
        .mockResolvedValueOnce({ data: page1 })
        .mockResolvedValueOnce({ data: page2 });

      const client = new GitHubApiClient(config);
      // Mock the octokit instance
      (client as any).octokit = {
        rest: {
          issues: {
            listForRepo: mockListForRepo,
          },
        },
      };

      const result = await client.listIssues();

      expect(result).toHaveLength(150);
      expect(mockListForRepo).toHaveBeenCalledTimes(2);
      expect(mockListForRepo).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, per_page: 100 })
      );
      expect(mockListForRepo).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2, per_page: 100 })
      );
    });

    it('should respect maxPages limit', async () => {
      const mockListForRepo = vi.fn();
      
      // Mock 100 items per page (simulating large repo)
      const page = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        number: i + 1,
        title: `Issue ${i + 1}`,
        state: 'open',
        html_url: `https://github.com/test/repo/issues/${i + 1}`,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        body: null,
        user: { login: 'testuser' },
        labels: [],
      }));

      mockListForRepo.mockResolvedValue({ data: page });

      const client = new GitHubApiClient(config);
      (client as any).octokit = {
        rest: {
          issues: {
            listForRepo: mockListForRepo,
          },
        },
      };

      const result = await client.listIssues({ maxPages: 3 });

      // Should stop after 3 pages even if more exist
      expect(mockListForRepo).toHaveBeenCalledTimes(3);
      expect(result).toHaveLength(300);
    });

    it('should stop fetching when page returns <100 results', async () => {
      const mockListForRepo = vi.fn();
      
      const page1 = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        number: i + 1,
        title: `Issue ${i + 1}`,
        state: 'open',
        html_url: `https://github.com/test/repo/issues/${i + 1}`,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        body: null,
        user: { login: 'testuser' },
        labels: [],
      }));

      const page2 = Array.from({ length: 25 }, (_, i) => ({
        id: i + 101,
        number: i + 101,
        title: `Issue ${i + 101}`,
        state: 'open',
        html_url: `https://github.com/test/repo/issues/${i + 101}`,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        body: null,
        user: { login: 'testuser' },
        labels: [],
      }));

      mockListForRepo
        .mockResolvedValueOnce({ data: page1 })
        .mockResolvedValueOnce({ data: page2 });

      const client = new GitHubApiClient(config);
      (client as any).octokit = {
        rest: {
          issues: {
            listForRepo: mockListForRepo,
          },
        },
      };

      const result = await client.listIssues({ maxPages: 10 });

      // Should stop after 2 pages (page 2 has <100 results)
      expect(mockListForRepo).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(125);
    });
  });
});
