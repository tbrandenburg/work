/**
 * Unit tests for GitHub adapter main implementation
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { GitHubAdapter } from '../../../../src/adapters/github/index.js';
import { GitHubApiClient } from '../../../../src/adapters/github/api-client.js';
import { getTokenFromCredentials } from '../../../../src/adapters/github/auth.js';
import {
  githubIssueToWorkItem,
  workItemToGitHubIssue,
  mapStateToGitHub,
} from '../../../../src/adapters/github/mapper.js';
import {
  Context,
  CreateWorkItemRequest,
  UpdateWorkItemRequest,
  WorkItem,
} from '../../../../src/types/index.js';
import {
  GitHubAuthError,
  GitHubApiError,
} from '../../../../src/adapters/github/errors.js';

// Mock the dependencies
vi.mock('../../../../src/adapters/github/api-client.js');
vi.mock('../../../../src/adapters/github/auth.js');
vi.mock('../../../../src/adapters/github/mapper.js');

describe('GitHubAdapter', () => {
  let adapter: GitHubAdapter;
  let mockApiClient: any;
  let mockContext: Context;

  beforeEach(() => {
    adapter = new GitHubAdapter();

    // Setup mock API client
    mockApiClient = {
      createIssue: vi.fn(),
      getIssue: vi.fn(),
      updateIssue: vi.fn(),
      listIssues: vi.fn(),
      closeIssue: vi.fn(),
    };

    (GitHubApiClient as any).mockImplementation(() => mockApiClient);

    // Setup mock context
    mockContext = {
      name: 'test-github',
      tool: 'github',
      url: 'https://github.com/owner/repo',
      authState: 'unauthenticated',
      isActive: true,
    };

    // Reset mocks
    vi.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize successfully with valid GitHub URL', async () => {
      await expect(adapter.initialize(mockContext)).resolves.not.toThrow();
    });

    it('should throw error if URL is missing', () => {
      const contextWithoutUrl = { ...mockContext, url: undefined };

      expect(() => adapter.initialize(contextWithoutUrl)).toThrow(
        'GitHub adapter requires a repository URL'
      );
    });

    it('should throw error for invalid GitHub URL format', () => {
      const contextWithInvalidUrl = {
        ...mockContext,
        url: 'https://invalid-url.com/repo',
      };

      expect(() => adapter.initialize(contextWithInvalidUrl)).toThrow(
        'Invalid GitHub repository URL format'
      );
    });

    it('should throw error if owner cannot be extracted from URL', () => {
      const contextWithMalformedUrl = {
        ...mockContext,
        url: 'https://github.com//repo',
      };

      expect(() => adapter.initialize(contextWithMalformedUrl)).toThrow(
        'Invalid GitHub repository URL format. Expected: https://github.com/owner/repo'
      );
    });

    it('should throw error if repo cannot be extracted from URL', () => {
      const contextWithMalformedUrl = {
        ...mockContext,
        url: 'https://github.com/owner/',
      };

      expect(() => adapter.initialize(contextWithMalformedUrl)).toThrow(
        'Invalid GitHub repository URL format. Expected: https://github.com/owner/repo'
      );
    });

    it('should restore authentication for authenticated context', async () => {
      const mockToken = 'ghp_test_token';
      (getTokenFromCredentials as Mock).mockReturnValue(mockToken);

      const authenticatedContext = {
        ...mockContext,
        authState: 'authenticated' as const,
      };

      await adapter.initialize(authenticatedContext);

      expect(getTokenFromCredentials).toHaveBeenCalled();
      expect(GitHubApiClient).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        token: mockToken,
      });
    });

    it('should handle authentication restoration failure gracefully', async () => {
      (getTokenFromCredentials as Mock).mockImplementation(() => {
        throw new Error('No token found');
      });

      const authenticatedContext = {
        ...mockContext,
        authState: 'authenticated' as const,
      };

      // Should not throw
      await expect(
        adapter.initialize(authenticatedContext)
      ).resolves.not.toThrow();
    });
  });

  describe('createWorkItem', () => {
    beforeEach(async () => {
      await adapter.initialize(mockContext);
      // Set up authenticated state
      (adapter as any).apiClient = mockApiClient;
    });

    it('should create work item successfully', async () => {
      const request: CreateWorkItemRequest = {
        kind: 'task',
        title: 'Test Issue',
        description: 'Test description',
      };

      const mockGitHubIssue = {
        id: 1,
        number: 123,
        title: 'Test Issue',
        body: 'Test description',
        state: 'open',
        labels: [],
        assignee: null,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        closed_at: null,
      };

      const mockWorkItem: WorkItem = {
        id: '123',
        kind: 'task',
        title: 'Test Issue',
        description: 'Test description',
        state: 'new',
        priority: 'medium',
        assignee: undefined,
        labels: [],
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      (workItemToGitHubIssue as Mock).mockReturnValue({
        title: 'Test Issue',
        body: 'Test description',
        labels: [],
      });

      mockApiClient.createIssue.mockResolvedValue(mockGitHubIssue);
      (githubIssueToWorkItem as Mock).mockReturnValue(mockWorkItem);

      const result = await adapter.createWorkItem(request);

      expect(workItemToGitHubIssue).toHaveBeenCalledWith(request);
      expect(mockApiClient.createIssue).toHaveBeenCalledWith(
        'Test Issue',
        'Test description',
        []
      );
      expect(githubIssueToWorkItem).toHaveBeenCalledWith(mockGitHubIssue);
      expect(result).toEqual(mockWorkItem);
    });

    it('should throw GitHubAuthError if not authenticated', async () => {
      // Reset to unauthenticated state
      (adapter as any).apiClient = null;

      const request: CreateWorkItemRequest = {
        kind: 'task',
        title: 'Test Issue',
      };

      await expect(adapter.createWorkItem(request)).rejects.toThrow(
        GitHubAuthError
      );
    });
  });

  describe('getWorkItem', () => {
    beforeEach(async () => {
      await adapter.initialize(mockContext);
      (adapter as any).apiClient = mockApiClient;
    });

    it('should get work item successfully', async () => {
      const mockGitHubIssue = {
        id: 1,
        number: 123,
        title: 'Test Issue',
        body: 'Test description',
        state: 'open',
        labels: [],
        assignee: null,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        closed_at: null,
      };

      const mockWorkItem: WorkItem = {
        id: '123',
        kind: 'task',
        title: 'Test Issue',
        description: 'Test description',
        state: 'new',
        priority: 'medium',
        assignee: undefined,
        labels: [],
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      mockApiClient.getIssue.mockResolvedValue(mockGitHubIssue);
      (githubIssueToWorkItem as Mock).mockReturnValue(mockWorkItem);

      const result = await adapter.getWorkItem('123');

      expect(mockApiClient.getIssue).toHaveBeenCalledWith(123);
      expect(githubIssueToWorkItem).toHaveBeenCalledWith(mockGitHubIssue);
      expect(result).toEqual(mockWorkItem);
    });

    it('should throw WorkItemNotFoundError for non-existent issue', async () => {
      const apiError = new GitHubApiError('Not Found', 404);
      mockApiClient.getIssue.mockRejectedValue(apiError);

      await expect(adapter.getWorkItem('999')).rejects.toThrow(
        'Work item not found: 999'
      );
    });

    it('should throw GitHubAuthError if not authenticated', async () => {
      (adapter as any).apiClient = null;

      await expect(adapter.getWorkItem('123')).rejects.toThrow(GitHubAuthError);
    });

    it('should re-throw other GitHub API errors', async () => {
      const apiError = new GitHubApiError('Server Error', 500);
      mockApiClient.getIssue.mockRejectedValue(apiError);

      await expect(adapter.getWorkItem('123')).rejects.toThrow(GitHubApiError);
    });
  });

  describe('authenticate', () => {
    beforeEach(async () => {
      await adapter.initialize(mockContext);
    });

    it('should authenticate successfully', async () => {
      const mockToken = 'ghp_test_token';
      (getTokenFromCredentials as Mock).mockReturnValue(mockToken);

      const result = await adapter.authenticate();

      expect(getTokenFromCredentials).toHaveBeenCalled();
      expect(GitHubApiClient).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        token: mockToken,
      });
      expect(result).toEqual({
        state: 'authenticated',
        user: 'github-user',
      });
    });

    it('should return unauthenticated status if authentication fails', async () => {
      (getTokenFromCredentials as Mock).mockImplementation(() => {
        throw new GitHubAuthError('Authentication failed');
      });

      const result = await adapter.authenticate();

      expect(result).toEqual({
        state: 'unauthenticated',
      });
    });

    it('should throw error if not initialized', async () => {
      const uninitializedAdapter = new GitHubAdapter();

      await expect(uninitializedAdapter.authenticate()).rejects.toThrow(
        'Adapter not initialized'
      );
    });
  });

  describe('getAuthStatus', () => {
    it('should return unauthenticated status when no API client', async () => {
      await adapter.initialize(mockContext);

      const result = await adapter.getAuthStatus();

      expect(result).toEqual({
        state: 'unauthenticated',
      });
    });

    it('should return authenticated status with API client', async () => {
      await adapter.initialize(mockContext);
      (adapter as any).apiClient = mockApiClient;

      const result = await adapter.getAuthStatus();

      expect(result).toEqual({
        state: 'authenticated',
        user: 'github-user',
      });
    });
  });

  describe('updateWorkItem', () => {
    beforeEach(async () => {
      await adapter.initialize(mockContext);
      (adapter as any).apiClient = mockApiClient;
    });

    it('should update work item successfully', async () => {
      const request: UpdateWorkItemRequest = {
        title: 'Updated Title',
        description: 'Updated description',
        labels: ['bug', 'enhancement'],
      };

      const mockGitHubIssue = {
        id: 1,
        number: 123,
        title: 'Updated Title',
        body: 'Updated description',
        state: 'open',
        labels: ['bug', 'enhancement'],
        assignee: null,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        closed_at: null,
      };

      const mockWorkItem: WorkItem = {
        id: '123',
        kind: 'task',
        title: 'Updated Title',
        description: 'Updated description',
        state: 'new',
        priority: 'medium',
        assignee: undefined,
        labels: ['bug', 'enhancement'],
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      mockApiClient.updateIssue.mockResolvedValue(mockGitHubIssue);
      (githubIssueToWorkItem as Mock).mockReturnValue(mockWorkItem);

      const result = await adapter.updateWorkItem('123', request);

      expect(mockApiClient.updateIssue).toHaveBeenCalledWith(123, {
        title: 'Updated Title',
        body: 'Updated description',
        labels: ['bug', 'enhancement'],
      });
      expect(result).toEqual(mockWorkItem);
    });

    it('should throw WorkItemNotFoundError for non-existent issue', async () => {
      const apiError = new GitHubApiError('Not Found', 404);
      mockApiClient.updateIssue.mockRejectedValue(apiError);

      await expect(
        adapter.updateWorkItem('999', { title: 'Updated' })
      ).rejects.toThrow('Work item not found: 999');
    });

    it('should throw GitHubAuthError if not authenticated', async () => {
      (adapter as any).apiClient = null;

      await expect(
        adapter.updateWorkItem('123', { title: 'Updated' })
      ).rejects.toThrow(GitHubAuthError);
    });
  });

  describe('changeState', () => {
    beforeEach(async () => {
      await adapter.initialize(mockContext);
      (adapter as any).apiClient = mockApiClient;
    });

    it('should change work item state successfully', async () => {
      const mockGitHubIssue = {
        id: 1,
        number: 123,
        title: 'Test Issue',
        body: 'Test description',
        state: 'closed',
        labels: [],
        assignee: null,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        closed_at: '2023-01-01T01:00:00Z',
      };

      const mockWorkItem: WorkItem = {
        id: '123',
        kind: 'task',
        title: 'Test Issue',
        description: 'Test description',
        state: 'closed',
        priority: 'medium',
        assignee: undefined,
        labels: [],
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      (mapStateToGitHub as Mock).mockReturnValue('closed');
      mockApiClient.updateIssue.mockResolvedValue(mockGitHubIssue);
      (githubIssueToWorkItem as Mock).mockReturnValue(mockWorkItem);

      const result = await adapter.changeState('123', 'closed');

      expect(mapStateToGitHub).toHaveBeenCalledWith('closed');
      expect(mockApiClient.updateIssue).toHaveBeenCalledWith(123, {
        state: 'closed',
      });
      expect(result).toEqual(mockWorkItem);
    });

    it('should throw WorkItemNotFoundError for non-existent issue', async () => {
      const apiError = new GitHubApiError('Not Found', 404);
      mockApiClient.updateIssue.mockRejectedValue(apiError);

      await expect(adapter.changeState('999', 'closed')).rejects.toThrow(
        'Work item not found: 999'
      );
    });

    it('should throw GitHubAuthError if not authenticated', async () => {
      (adapter as any).apiClient = null;

      await expect(adapter.changeState('123', 'closed')).rejects.toThrow(
        GitHubAuthError
      );
    });
  });

  describe('listWorkItems', () => {
    beforeEach(async () => {
      await adapter.initialize(mockContext);
      (adapter as any).apiClient = mockApiClient;
    });

    it('should list work items successfully', async () => {
      const mockGitHubIssues = [
        {
          id: 1,
          number: 123,
          title: 'Issue 1',
          body: 'Description 1',
          state: 'open',
          labels: [],
          assignee: null,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          closed_at: null,
        },
        {
          id: 2,
          number: 124,
          title: 'Issue 2',
          body: 'Description 2',
          state: 'closed',
          labels: ['bug'],
          assignee: null,
          created_at: '2023-01-02T00:00:00Z',
          updated_at: '2023-01-02T00:00:00Z',
          closed_at: '2023-01-02T01:00:00Z',
        },
      ];

      const mockWorkItems: WorkItem[] = [
        {
          id: '123',
          kind: 'task',
          title: 'Issue 1',
          description: 'Description 1',
          state: 'new',
          priority: 'medium',
          assignee: undefined,
          labels: [],
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
        {
          id: '124',
          kind: 'task',
          title: 'Issue 2',
          description: 'Description 2',
          state: 'closed',
          priority: 'medium',
          assignee: undefined,
          labels: ['bug'],
          createdAt: '2023-01-02T00:00:00Z',
          updatedAt: '2023-01-02T00:00:00Z',
        },
      ];

      mockApiClient.listIssues.mockResolvedValue(mockGitHubIssues);
      (githubIssueToWorkItem as Mock)
        .mockReturnValueOnce(mockWorkItems[0])
        .mockReturnValueOnce(mockWorkItems[1]);

      const result = await adapter.listWorkItems();

      expect(mockApiClient.listIssues).toHaveBeenCalled();
      expect(result).toEqual(mockWorkItems);
    });

    it('should filter work items by query', async () => {
      const mockGitHubIssues = [
        {
          id: 1,
          number: 123,
          title: 'Bug fix needed',
          body: 'This is a critical bug',
          state: 'open',
          labels: ['bug'],
          assignee: null,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          closed_at: null,
        },
        {
          id: 2,
          number: 124,
          title: 'Feature request',
          body: 'New feature needed',
          state: 'open',
          labels: ['feature'],
          assignee: null,
          created_at: '2023-01-02T00:00:00Z',
          updated_at: '2023-01-02T00:00:00Z',
          closed_at: null,
        },
      ];

      const mockWorkItems: WorkItem[] = [
        {
          id: '123',
          kind: 'task',
          title: 'Bug fix needed',
          description: 'This is a critical bug',
          state: 'new',
          priority: 'medium',
          assignee: undefined,
          labels: ['bug'],
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
        {
          id: '124',
          kind: 'task',
          title: 'Feature request',
          description: 'New feature needed',
          state: 'new',
          priority: 'medium',
          assignee: undefined,
          labels: ['feature'],
          createdAt: '2023-01-02T00:00:00Z',
          updatedAt: '2023-01-02T00:00:00Z',
        },
      ];

      mockApiClient.listIssues.mockResolvedValue(mockGitHubIssues);
      (githubIssueToWorkItem as Mock)
        .mockReturnValueOnce(mockWorkItems[0])
        .mockReturnValueOnce(mockWorkItems[1]);

      const result = await adapter.listWorkItems('bug');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Bug fix needed');
    });

    it('should throw GitHubAuthError if not authenticated', async () => {
      (adapter as any).apiClient = null;

      await expect(adapter.listWorkItems()).rejects.toThrow(GitHubAuthError);
    });
  });

  describe('deleteWorkItem', () => {
    beforeEach(async () => {
      await adapter.initialize(mockContext);
      (adapter as any).apiClient = mockApiClient;
    });

    it('should delete work item by changing state to closed', async () => {
      const mockGitHubIssue = {
        id: 1,
        number: 123,
        title: 'Test Issue',
        body: 'Test description',
        state: 'closed',
        labels: [],
        assignee: null,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        closed_at: '2023-01-01T01:00:00Z',
      };

      (mapStateToGitHub as Mock).mockReturnValue('closed');
      mockApiClient.updateIssue.mockResolvedValue(mockGitHubIssue);
      (githubIssueToWorkItem as Mock).mockReturnValue({
        id: '123',
        state: 'closed',
      });

      await adapter.deleteWorkItem('123');

      expect(mapStateToGitHub).toHaveBeenCalledWith('closed');
      expect(mockApiClient.updateIssue).toHaveBeenCalledWith(123, {
        state: 'closed',
      });
    });
  });

  describe('relations', () => {
    it('should throw error for createRelation as not supported', () => {
      const relation = {
        from: '123',
        to: '124',
        type: 'blocks' as const,
      };

      expect(() => adapter.createRelation(relation)).toThrow(
        'Relations are not supported by GitHub adapter yet'
      );
    });

    it('should return empty array for getRelations', async () => {
      const result = await adapter.getRelations('123');
      expect(result).toEqual([]);
    });

    it('should throw error for deleteRelation as not supported', () => {
      expect(() => adapter.deleteRelation('123', '124', 'blocks')).toThrow(
        'Relations are not supported by GitHub adapter yet'
      );
    });
  });

  describe('logout', () => {
    beforeEach(async () => {
      await adapter.initialize(mockContext);
      (adapter as any).apiClient = mockApiClient;
    });

    it('should logout successfully', async () => {
      await adapter.logout();

      expect((adapter as any).apiClient).toBeNull();
      expect((adapter as any).config.token).toBe('');
    });
  });

  describe('schema methods', () => {
    it('should return GitHub schema', async () => {
      const schema = await adapter.getSchema();

      expect(schema).toEqual({
        kinds: ['task'],
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
        ],
        relationTypes: [],
      });
    });

    it('should return GitHub kinds', async () => {
      const kinds = await adapter.getKinds();
      expect(kinds).toEqual(['task']);
    });

    it('should return GitHub attributes', async () => {
      const attributes = await adapter.getAttributes();
      expect(attributes).toEqual([
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
      ]);
    });

    it('should return GitHub relation types', async () => {
      const relationTypes = await adapter.getRelationTypes();
      expect(relationTypes).toEqual([]);
    });
  });
});
