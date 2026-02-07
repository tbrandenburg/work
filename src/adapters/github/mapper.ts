/**
 * GitHub Issue ↔ WorkItem conversion utilities
 */

import { WorkItem, CreateWorkItemRequest } from '../../types/index.js';
import { GitHubIssue } from './types.js';

/**
 * Converts GitHub Issue to WorkItem
 */
export function githubIssueToWorkItem(issue: GitHubIssue): WorkItem {
  return {
    id: issue.number.toString(),
    kind: 'task', // Default kind, could be enhanced with label mapping
    title: issue.title,
    description: issue.body || undefined,
    state: issue.state === 'open' ? 'new' : 'closed',
    priority: 'medium', // Default priority, could be enhanced with label mapping
    assignee: issue.assignee?.login,
    labels: [...issue.labels.map(label => label.name)], // Convert readonly to mutable
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    closedAt: issue.closed_at || undefined,
  };
}

/**
 * Converts CreateWorkItemRequest to GitHub Issue creation parameters
 */
export function workItemToGitHubIssue(request: CreateWorkItemRequest): {
  title: string;
  body?: string;
  labels?: string[];
  assignees?: string[];
} {
  const result: { title: string; body?: string; labels?: string[]; assignees?: string[] } = {
    title: request.title,
  };

  if (request.description) {
    result.body = request.description;
  }

  if (request.labels && request.labels.length > 0) {
    result.labels = [...request.labels];
  }

  if (request.assignee) {
    result.assignees = [request.assignee];
  }

  return result;
}

/**
 * Maps work item state to GitHub issue state
 */
export function mapStateToGitHub(state: WorkItem['state']): 'open' | 'closed' {
  switch (state) {
    case 'new':
    case 'active':
      return 'open';
    case 'closed':
      return 'closed';
    default:
      return 'open';
  }
}

/**
 * Maps GitHub issue state to work item state
 */
export function mapStateFromGitHub(
  state: 'open' | 'closed'
): WorkItem['state'] {
  return state === 'open' ? 'new' : 'closed';
}
