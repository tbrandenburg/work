/**
 * GitHub-specific error classes
 */

import { WorkError } from '../../types/errors.js';

export class GitHubApiError extends WorkError {
  constructor(message: string, statusCode: number = 500) {
    super(`GitHub API error: ${message}`, 'GITHUB_API_ERROR', statusCode);
    this.name = 'GitHubApiError';
    Object.setPrototypeOf(this, GitHubApiError.prototype);
  }
}

export class GitHubRateLimitError extends WorkError {
  constructor(resetTime: Date) {
    super(
      `GitHub rate limit exceeded. Resets at ${resetTime.toISOString()}`,
      'GITHUB_RATE_LIMIT',
      429
    );
    this.name = 'GitHubRateLimitError';
    Object.setPrototypeOf(this, GitHubRateLimitError.prototype);
  }
}

export class GitHubAuthError extends WorkError {
  constructor(message: string = 'Invalid or missing GitHub token') {
    super(`GitHub authentication error: ${message}`, 'GITHUB_AUTH_ERROR', 401);
    this.name = 'GitHubAuthError';
    Object.setPrototypeOf(this, GitHubAuthError.prototype);
  }
}
