/**
 * GitHub authentication utilities
 */

import { execFileSync } from 'child_process';
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
 * Three-tier hierarchy: gh CLI → manual credentials → environment variables
 */
export function getTokenFromCredentials(
  credentials?: Record<string, string>
): string {
  // First priority: GitHub CLI
  try {
    const ghToken = execFileSync('gh', ['auth', 'token'], {
      encoding: 'utf8',
      timeout: 5000,
    }).trim();

    if (ghToken && validateToken(ghToken)) {
      return ghToken;
    }
  } catch {
    // gh CLI not available or not authenticated - continue to next method
  }

  // Second priority: credentials parameter
  if (credentials?.['token']) {
    const token = credentials['token'];
    if (validateToken(token)) {
      return token;
    }
    throw new GitHubAuthError('Invalid token format in credentials');
  }

  // Third priority: environment variables
  const envToken =
    process.env['GITHUB_TOKEN'] || process.env['CI_GITHUB_TOKEN'];
  if (envToken) {
    if (validateToken(envToken)) {
      console.warn(
        'Using GitHub token from environment variable. Consider using "gh auth login" for better security.'
      );
      return envToken;
    }
    throw new GitHubAuthError('Invalid token format in environment variable');
  }

  throw new GitHubAuthError(
    `No GitHub token found. Please authenticate using one of these methods:

1. GitHub CLI (recommended): gh auth login
2. Environment variable: export GITHUB_TOKEN=your_token
3. Manual credentials: work context add --tool github --token your_token

For help: https://docs.github.com/en/authentication`
  );
}
