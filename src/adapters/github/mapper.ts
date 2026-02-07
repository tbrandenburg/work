/**
 * GitHub Issue ↔ WorkItem conversion utilities
 */

import { WorkItem, CreateWorkItemRequest } from '../../types/index.js';
import { GitHubIssue } from './types.js';

/**
 * Converts GitHub Issue to WorkItem
 */
export function githubIssueToWorkItem(issue: GitHubIssue): WorkItem {
  // Extract agent from agent:* label pattern
  const agentLabel = issue.labels.find(label => label.name.startsWith('agent:'));
  const agent = agentLabel ? agentLabel.name.substring(6) : undefined;
  
  // Filter out agent:* labels from the labels array
  const filteredLabels = issue.labels
    .map(label => label.name)
    .filter(name => !name.startsWith('agent:'));
  
  return {
    id: issue.number.toString(),
    kind: 'task', // Default kind, could be enhanced with label mapping
    title: issue.title,
    description: issue.body || undefined,
    state: issue.state === 'open' ? 'new' : 'closed',
    priority: 'medium', // Default priority, could be enhanced with label mapping
    assignee: issue.assignee?.login,
    agent,
    labels: [...filteredLabels], // Convert readonly to mutable
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

  if (request.agent) {
    // Add agent:* label
    result.labels = result.labels || [];
    result.labels.push(`agent:${request.agent}`);
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
