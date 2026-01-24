/**
 * GitHub authentication utilities
 */

import { GitHubAuthError } from './errors.js';

/**
 * Validates GitHub token format
 * GitHub tokens start with 'ghp_', 'gho_', or 'ghs_'
 */
export function validateToken(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  // GitHub token format validation
  return /^(ghp_|gho_|ghs_)[a-zA-Z0-9]{36,}$/.test(token);
}

/**
 * Extracts GitHub token from credentials or environment
 * Supports CI_GITHUB_TOKEN fallback for GitHub Actions
 */
export function getTokenFromCredentials(
  credentials?: Record<string, string>
): string {
  // First try credentials parameter
  if (credentials?.['token']) {
    const token = credentials['token'];
    if (validateToken(token)) {
      return token;
    }
    throw new GitHubAuthError('Invalid token format in credentials');
  }

  // Fallback to environment variables
  const envToken =
    process.env['GITHUB_TOKEN'] || process.env['CI_GITHUB_TOKEN'];
  if (envToken) {
    if (validateToken(envToken)) {
      return envToken;
    }
    throw new GitHubAuthError('Invalid token format in environment variable');
  }

  throw new GitHubAuthError(
    'No GitHub token found in credentials or environment variables'
  );
}
