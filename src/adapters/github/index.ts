/**
 * GitHub adapter implementation
 */

import {
  WorkAdapter,
  Context,
  WorkItem,
  CreateWorkItemRequest,
  UpdateWorkItemRequest,
  Relation,
  WorkItemNotFoundError,
  AuthStatus,
  Schema,
  SchemaAttribute,
  SchemaRelationType,
} from '../../types/index.js';
import { GitHubApiClient } from './api-client.js';
import {
  githubIssueToWorkItem,
  workItemToGitHubIssue,
  mapStateToGitHub,
} from './mapper.js';
import { getTokenFromCredentials } from './auth.js';
import { GitHubConfig } from './types.js';
import { GitHubApiError, GitHubAuthError } from './errors.js';

export class GitHubAdapter implements WorkAdapter {
  private apiClient: GitHubApiClient | null = null;
  private config: GitHubConfig | null = null;

  initialize(context: Context): Promise<void> {
    if (!context.url) {
      throw new Error('GitHub adapter requires a repository URL');
    }

    // Parse GitHub repository URL (e.g., https://github.com/owner/repo)
    const urlMatch = context.url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!urlMatch || urlMatch.length < 3) {
      throw new Error(
        'Invalid GitHub repository URL format. Expected: https://github.com/owner/repo'
      );
    }

    const owner = urlMatch[1];
    const repo = urlMatch[2];

    if (!owner || !repo) {
      throw new Error('Could not extract owner and repository from URL');
    }

    // Token will be provided during authentication
    this.config = {
      owner,
      repo,
      token: '', // Will be set during authentication
    };

    return Promise.resolve();
  }

  async createWorkItem(request: CreateWorkItemRequest): Promise<WorkItem> {
    if (!this.apiClient) {
      throw new GitHubAuthError(
        'Not authenticated. Call authenticate() first.'
      );
    }

    const issueParams = workItemToGitHubIssue(request);
    const githubIssue = await this.apiClient.createIssue(
      issueParams.title,
      issueParams.body,
      issueParams.labels
    );

    return githubIssueToWorkItem(githubIssue);
  }

  async getWorkItem(id: string): Promise<WorkItem> {
    if (!this.apiClient) {
      throw new GitHubAuthError(
        'Not authenticated. Call authenticate() first.'
      );
    }

    try {
      const issueNumber = parseInt(id, 10);
      if (isNaN(issueNumber)) {
        throw new WorkItemNotFoundError(id);
      }

      const githubIssue = await this.apiClient.getIssue(issueNumber);
      return githubIssueToWorkItem(githubIssue);
    } catch (error) {
      if (error instanceof GitHubApiError && error.statusCode === 404) {
        throw new WorkItemNotFoundError(id);
      }
      throw error;
    }
  }

  async updateWorkItem(
    id: string,
    request: UpdateWorkItemRequest
  ): Promise<WorkItem> {
    if (!this.apiClient) {
      throw new GitHubAuthError(
        'Not authenticated. Call authenticate() first.'
      );
    }

    const issueNumber = parseInt(id, 10);
    if (isNaN(issueNumber)) {
      throw new WorkItemNotFoundError(id);
    }

    const updates: { title?: string; body?: string; labels?: string[] } = {};

    if (request.title !== undefined) {
      updates.title = request.title;
    }

    if (request.description !== undefined) {
      updates.body = request.description;
    }

    if (request.labels !== undefined) {
      updates.labels = [...request.labels];
    }

    try {
      const githubIssue = await this.apiClient.updateIssue(
        issueNumber,
        updates
      );
      return githubIssueToWorkItem(githubIssue);
    } catch (error) {
      if (error instanceof GitHubApiError && error.statusCode === 404) {
        throw new WorkItemNotFoundError(id);
      }
      throw error;
    }
  }

  async changeState(id: string, state: WorkItem['state']): Promise<WorkItem> {
    if (!this.apiClient) {
      throw new GitHubAuthError(
        'Not authenticated. Call authenticate() first.'
      );
    }

    const issueNumber = parseInt(id, 10);
    if (isNaN(issueNumber)) {
      throw new WorkItemNotFoundError(id);
    }

    const githubState = mapStateToGitHub(state);

    try {
      const githubIssue = await this.apiClient.updateIssue(issueNumber, {
        state: githubState,
      });
      return githubIssueToWorkItem(githubIssue);
    } catch (error) {
      if (error instanceof GitHubApiError && error.statusCode === 404) {
        throw new WorkItemNotFoundError(id);
      }
      throw error;
    }
  }

  async listWorkItems(query?: string): Promise<WorkItem[]> {
    if (!this.apiClient) {
      throw new GitHubAuthError(
        'Not authenticated. Call authenticate() first.'
      );
    }

    const githubIssues = await this.apiClient.listIssues();
    let workItems = githubIssues.map(githubIssueToWorkItem);

    if (query) {
      // Simple query filtering
      workItems = workItems.filter(item => {
        const searchText =
          `${item.title} ${item.description || ''} ${item.state} ${item.kind}`.toLowerCase();
        return searchText.includes(query.toLowerCase());
      });
    }

    return workItems;
  }

  createRelation(_relation: Relation): Promise<void> {
    // GitHub doesn't support custom relations natively
    // This could be implemented using issue references in the future
    throw new Error('Relations are not supported by GitHub adapter yet');
  }

  getRelations(_workItemId: string): Promise<Relation[]> {
    // GitHub doesn't support custom relations natively
    return Promise.resolve([]);
  }

  deleteRelation(
    _from: string,
    _to: string,
    _type: Relation['type']
  ): Promise<void> {
    // GitHub doesn't support custom relations natively
    throw new Error('Relations are not supported by GitHub adapter yet');
  }

  async deleteWorkItem(id: string): Promise<void> {
    // GitHub doesn't support deleting issues, only closing them
    await this.changeState(id, 'closed');
  }

  async authenticate(
    credentials?: Record<string, string>
  ): Promise<AuthStatus> {
    if (!this.config) {
      throw new Error('Adapter not initialized. Call initialize() first.');
    }

    try {
      const token = getTokenFromCredentials(credentials);

      // Update config with token
      this.config = {
        ...this.config,
        token,
      };

      // Initialize API client
      this.apiClient = new GitHubApiClient(this.config);

      // Test authentication by making a simple API call
      await this.apiClient.listIssues();

      return {
        state: 'authenticated' as const,
        user: 'github-user', // Could be enhanced to get actual username
      };
    } catch (error) {
      this.apiClient = null;
      if (error instanceof GitHubAuthError) {
        return {
          state: 'unauthenticated' as const,
        };
      }
      throw error;
    }
  }

  logout(): Promise<void> {
    this.apiClient = null;
    if (this.config) {
      this.config = {
        ...this.config,
        token: '',
      };
    }
    return Promise.resolve();
  }

  getAuthStatus(): Promise<AuthStatus> {
    if (this.apiClient) {
      return Promise.resolve({
        state: 'authenticated' as const,
        user: 'github-user',
      });
    }

    return Promise.resolve({
      state: 'unauthenticated' as const,
    });
  }

  getSchema(): Promise<Schema> {
    // GitHub Issues schema
    return Promise.resolve({
      kinds: ['task'] as const, // GitHub Issues are mapped to tasks
      attributes: [
        {
          name: 'title',
          type: 'string',
          required: true,
          description: 'Issue title',
        },
        {
          name: 'description',
          type: 'string',
          required: false,
          description: 'Issue body/description',
        },
        {
          name: 'labels',
          type: 'array',
          required: false,
          description: 'Issue labels',
        },
        {
          name: 'assignee',
          type: 'string',
          required: false,
          description: 'Assigned user',
        },
      ] as const,
      relationTypes: [] as const, // GitHub doesn't support custom relations
    });
  }

  async getKinds(): Promise<readonly string[]> {
    const schema = await this.getSchema();
    return schema.kinds;
  }

  async getAttributes(): Promise<readonly SchemaAttribute[]> {
    const schema = await this.getSchema();
    return schema.attributes;
  }

  async getRelationTypes(): Promise<readonly SchemaRelationType[]> {
    const schema = await this.getSchema();
    return schema.relationTypes;
  }
}
