/**
 * Unit tests for GitHub error classes
 */

import { describe, it, expect } from 'vitest';
import {
  GitHubApiError,
  GitHubRateLimitError,
  GitHubAuthError,
} from '../../../../src/adapters/github/errors.js';

describe('GitHub Error Classes', () => {
  describe('GitHubApiError', () => {
    it('should create GitHubApiError with message and default status code', () => {
      const error = new GitHubApiError('Test API error');

      expect(error.message).toBe('GitHub API error: Test API error');
      expect(error.name).toBe('GitHubApiError');
      expect(error.code).toBe('GITHUB_API_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error instanceof GitHubApiError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it('should create GitHubApiError with message and custom status code', () => {
      const error = new GitHubApiError('Custom error', 404);

      expect(error.message).toBe('GitHub API error: Custom error');
      expect(error.name).toBe('GitHubApiError');
      expect(error.code).toBe('GITHUB_API_ERROR');
      expect(error.statusCode).toBe(404);
    });

    it('should maintain proper prototype chain', () => {
      const error = new GitHubApiError('Prototype test');

      expect(Object.getPrototypeOf(error)).toBe(GitHubApiError.prototype);
    });
  });

  describe('GitHubRateLimitError', () => {
    it('should create GitHubRateLimitError with reset time', () => {
      const resetTime = new Date('2023-01-01T12:00:00Z');
      const error = new GitHubRateLimitError(resetTime);

      expect(error.message).toBe(
        'GitHub rate limit exceeded. Resets at 2023-01-01T12:00:00.000Z'
      );
      expect(error.name).toBe('GitHubRateLimitError');
      expect(error.code).toBe('GITHUB_RATE_LIMIT');
      expect(error.statusCode).toBe(429);
      expect(error instanceof GitHubRateLimitError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it('should maintain proper prototype chain', () => {
      const resetTime = new Date();
      const error = new GitHubRateLimitError(resetTime);

      expect(Object.getPrototypeOf(error)).toBe(GitHubRateLimitError.prototype);
    });

    it('should format reset time correctly', () => {
      const resetTime = new Date('2024-06-15T14:30:45.123Z');
      const error = new GitHubRateLimitError(resetTime);

      expect(error.message).toContain('2024-06-15T14:30:45.123Z');
    });
  });

  describe('GitHubAuthError', () => {
    it('should create GitHubAuthError with default message', () => {
      const error = new GitHubAuthError();

      expect(error.message).toBe(
        'GitHub authentication error: Invalid or missing GitHub token'
      );
      expect(error.name).toBe('GitHubAuthError');
      expect(error.code).toBe('GITHUB_AUTH_ERROR');
      expect(error.statusCode).toBe(401);
      expect(error instanceof GitHubAuthError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it('should create GitHubAuthError with custom message', () => {
      const error = new GitHubAuthError('Token expired');

      expect(error.message).toBe('GitHub authentication error: Token expired');
      expect(error.name).toBe('GitHubAuthError');
      expect(error.code).toBe('GITHUB_AUTH_ERROR');
      expect(error.statusCode).toBe(401);
    });

    it('should maintain proper prototype chain', () => {
      const error = new GitHubAuthError('Prototype test');

      expect(Object.getPrototypeOf(error)).toBe(GitHubAuthError.prototype);
    });
  });

  describe('Error inheritance and instanceof checks', () => {
    it('should work with instanceof checks for all error types', () => {
      const apiError = new GitHubApiError('API test');
      const rateLimitError = new GitHubRateLimitError(new Date());
      const authError = new GitHubAuthError('Auth test');

      expect(apiError instanceof Error).toBe(true);
      expect(rateLimitError instanceof Error).toBe(true);
      expect(authError instanceof Error).toBe(true);

      expect(apiError instanceof GitHubApiError).toBe(true);
      expect(rateLimitError instanceof GitHubRateLimitError).toBe(true);
      expect(authError instanceof GitHubAuthError).toBe(true);

      // Cross-type checks should be false
      expect(apiError instanceof GitHubRateLimitError).toBe(false);
      expect(rateLimitError instanceof GitHubAuthError).toBe(false);
      expect(authError instanceof GitHubApiError).toBe(false);
    });

    it('should have correct constructor names', () => {
      const apiError = new GitHubApiError('Constructor test');
      const rateLimitError = new GitHubRateLimitError(new Date());
      const authError = new GitHubAuthError('Constructor test');

      expect(apiError.constructor.name).toBe('GitHubApiError');
      expect(rateLimitError.constructor.name).toBe('GitHubRateLimitError');
      expect(authError.constructor.name).toBe('GitHubAuthError');
    });

    it('should have proper error properties', () => {
      const error = new GitHubApiError('Property test', 422);

      expect(error.message).toBe('GitHub API error: Property test');
      expect(error.name).toBe('GitHubApiError');
      expect(error.code).toBe('GITHUB_API_ERROR');
      expect(error.statusCode).toBe(422);
    });
  });
});
