/**
 * Unit tests for GitHub API client
 */

import { describe, it, expect } from 'vitest';
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
});
