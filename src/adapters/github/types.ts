/**
 * GitHub-specific type definitions
 */

export interface GitHubConfig {
  readonly owner: string;
  readonly repo: string;
  readonly token: string;
}

export interface GitHubIssue {
  readonly id: number;
  readonly number: number;
  readonly title: string;
  readonly body: string | null;
  readonly state: 'open' | 'closed';
  readonly labels: Array<{ name: string }>;
  readonly assignee: { login: string } | null;
  readonly created_at: string;
  readonly updated_at: string;
  readonly closed_at: string | null;
}
