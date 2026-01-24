/**
 * Unit tests for GitHub authentication utilities
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  validateToken,
  getTokenFromCredentials,
} from '../../../../src/adapters/github/auth.js';
import { GitHubAuthError } from '../../../../src/adapters/github/errors.js';

describe('GitHub Authentication', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables
    process.env = { ...originalEnv };
    delete process.env['GITHUB_TOKEN'];
    delete process.env['CI_GITHUB_TOKEN'];
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('validateToken', () => {
    it('should validate correct GitHub token formats', () => {
      expect(
        validateToken('ghp_1234567890123456789012345678901234567890')
      ).toBe(true);
      expect(
        validateToken('gho_1234567890123456789012345678901234567890')
      ).toBe(true);
      expect(
        validateToken('ghs_1234567890123456789012345678901234567890')
      ).toBe(true);
    });

    it('should reject invalid token formats', () => {
      expect(validateToken('')).toBe(false);
      expect(validateToken('invalid-token')).toBe(false);
      expect(validateToken('ghp_short')).toBe(false);
      expect(
        validateToken('wrong_prefix_1234567890123456789012345678901234567890')
      ).toBe(false);
    });

    it('should reject non-string tokens', () => {
      expect(validateToken(null as any)).toBe(false);
      expect(validateToken(undefined as any)).toBe(false);
      expect(validateToken(123 as any)).toBe(false);
    });
  });

  describe('getTokenFromCredentials', () => {
    it('should extract token from credentials', () => {
      const credentials = {
        token: 'ghp_1234567890123456789012345678901234567890',
      };
      const token = getTokenFromCredentials(credentials);
      expect(token).toBe('ghp_1234567890123456789012345678901234567890');
    });

    it('should fallback to GITHUB_TOKEN environment variable', () => {
      process.env['GITHUB_TOKEN'] =
        'ghp_1234567890123456789012345678901234567890';
      const token = getTokenFromCredentials();
      expect(token).toBe('ghp_1234567890123456789012345678901234567890');
    });

    it('should fallback to CI_GITHUB_TOKEN environment variable', () => {
      process.env['CI_GITHUB_TOKEN'] =
        'ghp_1234567890123456789012345678901234567890';
      const token = getTokenFromCredentials();
      expect(token).toBe('ghp_1234567890123456789012345678901234567890');
    });

    it('should prefer credentials over environment variables', () => {
      process.env['GITHUB_TOKEN'] =
        'ghp_env_token_1234567890123456789012345678901234567890';
      const credentials = { token: 'ghp_123456789012345678901234567890123456' };
      const token = getTokenFromCredentials(credentials);
      expect(token).toBe('ghp_123456789012345678901234567890123456');
    });

    it('should throw GitHubAuthError for invalid token in credentials', () => {
      const credentials = { token: 'invalid-token' };
      expect(() => getTokenFromCredentials(credentials)).toThrow(
        GitHubAuthError
      );
      expect(() => getTokenFromCredentials(credentials)).toThrow(
        'Invalid token format in credentials'
      );
    });

    it('should throw GitHubAuthError for invalid token in environment', () => {
      process.env['GITHUB_TOKEN'] = 'invalid-token';
      expect(() => getTokenFromCredentials()).toThrow(GitHubAuthError);
      expect(() => getTokenFromCredentials()).toThrow(
        'Invalid token format in environment variable'
      );
    });

    it('should throw GitHubAuthError when no token is found', () => {
      expect(() => getTokenFromCredentials()).toThrow(GitHubAuthError);
      expect(() => getTokenFromCredentials()).toThrow(
        'No GitHub token found in credentials or environment variables'
      );
    });
  });
});
