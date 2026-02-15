/**
 * GitHub API client wrapper with rate limiting
 */

import { Octokit } from '@octokit/rest';
import { throttling } from '@octokit/plugin-throttling';
import { GitHubConfig, GitHubIssue } from './types.js';
import { GitHubApiError } from './errors.js';

// Create Octokit with throttling plugin
const ThrottledOctokit = Octokit.plugin(throttling);

export class GitHubApiClient {
  private octokit: InstanceType<typeof ThrottledOctokit>;
  private config: GitHubConfig;

  constructor(config: GitHubConfig) {
    this.config = config;
    this.octokit = new ThrottledOctokit({
      auth: config.token,
      throttle: {
        onRateLimit: (retryAfter: number, _options: unknown): boolean => {
          console.warn(
            `Rate limit exceeded, retrying after ${retryAfter} seconds`
          );
          return true; // Retry once
        },
        onSecondaryRateLimit: (
          retryAfter: number,
          _options: unknown
        ): boolean => {
          console.warn(
            `Secondary rate limit exceeded, retrying after ${retryAfter} seconds`
          );
          return true; // Retry once
        },
      },
    });
  }

  async listIssues(
    options: { maxPages?: number } = {}
  ): Promise<GitHubIssue[]> {
    const { maxPages = 20 } = options; // Default: up to 2,000 issues

    try {
      const allIssues: GitHubIssue[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore && page <= maxPages) {
        const response = await this.octokit.rest.issues.listForRepo({
          owner: this.config.owner,
          repo: this.config.repo,
          state: 'all',
          per_page: 100,
          page,
        });

        const pageData = response.data as GitHubIssue[];
        allIssues.push(...pageData);

        // Stop if we got fewer than 100 results (last page)
        hasMore = pageData.length === 100;
        page++;
      }

      return allIssues;
    } catch (error: unknown) {
      const apiError = error as { message: string; status?: number };
      throw new GitHubApiError(apiError.message, apiError.status || 500);
    }
  }

  async getIssue(issueNumber: number): Promise<GitHubIssue> {
    try {
      const response = await this.octokit.rest.issues.get({
        owner: this.config.owner,
        repo: this.config.repo,
        issue_number: issueNumber,
      });

      return response.data as GitHubIssue;
    } catch (error: unknown) {
      const apiError = error as { message: string; status?: number };
      throw new GitHubApiError(apiError.message, apiError.status || 500);
    }
  }

  async createIssue(
    title: string,
    body?: string,
    labels?: string[],
    assignees?: string[]
  ): Promise<GitHubIssue> {
    try {
      const response = await this.octokit.rest.issues.create({
        owner: this.config.owner,
        repo: this.config.repo,
        title,
        body: body || '',
        labels: labels || [],
        assignees: assignees || [],
      });

      return response.data as GitHubIssue;
    } catch (error: unknown) {
      const apiError = error as { message: string; status?: number };
      throw new GitHubApiError(apiError.message, apiError.status || 500);
    }
  }

  async updateIssue(
    issueNumber: number,
    updates: {
      title?: string;
      body?: string;
      state?: 'open' | 'closed';
      labels?: string[];
      assignees?: string[];
    }
  ): Promise<GitHubIssue> {
    try {
      const response = await this.octokit.rest.issues.update({
        owner: this.config.owner,
        repo: this.config.repo,
        issue_number: issueNumber,
        ...updates,
      });

      return response.data as GitHubIssue;
    } catch (error: unknown) {
      const apiError = error as { message: string; status?: number };
      throw new GitHubApiError(apiError.message, apiError.status || 500);
    }
  }

  async closeIssue(issueNumber: number): Promise<GitHubIssue> {
    return this.updateIssue(issueNumber, { state: 'closed' });
  }

  /**
   * Check if a username can be assigned to issues in this repository
   * This checks if the user is a collaborator with triage permissions or higher
   */
  async checkUserCanBeAssigned(username: string): Promise<boolean> {
    try {
      await this.octokit.rest.repos.checkCollaborator({
        owner: this.config.owner,
        repo: this.config.repo,
        username,
      });
      return true;
    } catch (error: unknown) {
      const apiError = error as { status?: number };
      // GitHub API returns 404 for non-collaborators
      if (apiError.status === 404) {
        return false;
      }
      // Re-throw other errors (authentication issues, etc.)
      throw error;
    }
  }
}
