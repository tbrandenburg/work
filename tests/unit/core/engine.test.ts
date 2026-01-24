import { vi } from 'vitest';
import { WorkEngine } from '../../../src/core/engine';
import { LocalFsAdapter } from '../../../src/adapters/local-fs/index';
import { WorkItemKind, Priority, WorkItem } from '../../../src/types/index';

// Mock the LocalFsAdapter
vi.mock('../../../src/adapters/local-fs/index', () => ({
  LocalFsAdapter: vi.fn(),
}));

describe('WorkEngine', () => {
  let engine: WorkEngine;
  let mockAdapter: any;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Create mock adapter
    mockAdapter = {
      initialize: vi.fn(),
      createWorkItem: vi.fn(),
      getWorkItem: vi.fn(),
      updateWorkItem: vi.fn(),
      changeState: vi.fn(),
      listWorkItems: vi.fn(),
      createRelation: vi.fn(),
      getRelations: vi.fn(),
      deleteRelation: vi.fn(),
      deleteWorkItem: vi.fn(),
    };

    // Mock the LocalFsAdapter constructor
    vi.mocked(LocalFsAdapter).mockImplementation(() => mockAdapter);

    engine = new WorkEngine();
  });

  describe('createWorkItem', () => {
    it('should create a work item through adapter', async () => {
      const request = {
        title: 'Test task',
        kind: 'task' as WorkItemKind,
        priority: 'medium' as Priority,
      };

      const mockWorkItem: WorkItem = {
        id: 'TASK-001',
        kind: 'task',
        title: 'Test task',
        state: 'new',
        priority: 'medium',
        labels: [],
        createdAt: '2026-01-20T10:00:00.000Z',
        updatedAt: '2026-01-20T10:00:00.000Z',
      };

      mockAdapter.createWorkItem.mockResolvedValue(mockWorkItem);

      const result = await engine.createWorkItem(request);

      expect(mockAdapter.createWorkItem).toHaveBeenCalledWith(request);
      expect(result).toEqual(mockWorkItem);
    });
  });

  describe('getWorkItem', () => {
    it('should retrieve a work item by ID', async () => {
      const mockWorkItem: WorkItem = {
        id: 'TASK-001',
        kind: 'task',
        title: 'Test task',
        state: 'new',
        priority: 'medium',
        labels: [],
        createdAt: '2026-01-20T10:00:00.000Z',
        updatedAt: '2026-01-20T10:00:00.000Z',
      };

      mockAdapter.getWorkItem.mockResolvedValue(mockWorkItem);

      const result = await engine.getWorkItem('TASK-001');

      expect(mockAdapter.getWorkItem).toHaveBeenCalledWith('TASK-001');
      expect(result).toEqual(mockWorkItem);
    });
  });

  describe('changeState', () => {
    it('should change work item state through adapter', async () => {
      const mockWorkItem: WorkItem = {
        id: 'TASK-001',
        kind: 'task',
        title: 'Test task',
        state: 'active',
        priority: 'medium',
        labels: [],
        createdAt: '2026-01-20T10:00:00.000Z',
        updatedAt: '2026-01-20T10:00:00.000Z',
      };

      mockAdapter.changeState.mockResolvedValue(mockWorkItem);

      const result = await engine.changeState('TASK-001', 'active');

      expect(mockAdapter.changeState).toHaveBeenCalledWith(
        'TASK-001',
        'active'
      );
      expect(result).toEqual(mockWorkItem);
    });
  });

  describe('updateWorkItem', () => {
    it('should update work item through adapter', async () => {
      const updateRequest = {
        title: 'Updated title',
        priority: 'high' as Priority,
      };

      const mockWorkItem: WorkItem = {
        id: 'TASK-001',
        kind: 'task',
        title: 'Updated title',
        state: 'new',
        priority: 'high',
        labels: [],
        createdAt: '2026-01-20T10:00:00.000Z',
        updatedAt: '2026-01-20T10:01:00.000Z',
      };

      mockAdapter.updateWorkItem.mockResolvedValue(mockWorkItem);

      const result = await engine.updateWorkItem('TASK-001', updateRequest);

      expect(mockAdapter.updateWorkItem).toHaveBeenCalledWith(
        'TASK-001',
        updateRequest
      );
      expect(result).toEqual(mockWorkItem);
    });
  });

  describe('listWorkItems', () => {
    it('should list work items through adapter', async () => {
      const mockWorkItems: WorkItem[] = [
        {
          id: 'TASK-001',
          kind: 'task',
          title: 'Task 1',
          state: 'new',
          priority: 'medium',
          labels: [],
          createdAt: '2026-01-20T10:00:00.000Z',
          updatedAt: '2026-01-20T10:00:00.000Z',
        },
        {
          id: 'BUG-001',
          kind: 'bug',
          title: 'Bug 1',
          state: 'active',
          priority: 'high',
          labels: [],
          createdAt: '2026-01-20T10:01:00.000Z',
          updatedAt: '2026-01-20T10:01:00.000Z',
        },
      ];

      mockAdapter.listWorkItems.mockResolvedValue(mockWorkItems);

      const result = await engine.listWorkItems();

      expect(mockAdapter.listWorkItems).toHaveBeenCalled();
      expect(result).toEqual(mockWorkItems);
    });
  });

  describe('createRelation', () => {
    it('should create relation through adapter with validation', async () => {
      const mockWorkItems: WorkItem[] = [
        {
          id: 'EPIC-001',
          kind: 'epic',
          title: 'Test epic',
          state: 'new',
          priority: 'medium',
          labels: [],
          createdAt: '2026-01-20T10:00:00.000Z',
          updatedAt: '2026-01-20T10:00:00.000Z',
        },
        {
          id: 'TASK-001',
          kind: 'task',
          title: 'Test task',
          state: 'new',
          priority: 'medium',
          labels: [],
          createdAt: '2026-01-20T10:01:00.000Z',
          updatedAt: '2026-01-20T10:01:00.000Z',
        },
      ];

      const relation = {
        from: 'EPIC-001',
        to: 'TASK-001',
        type: 'parent_of' as const,
      };

      mockAdapter.listWorkItems.mockResolvedValue(mockWorkItems);
      mockAdapter.getRelations.mockResolvedValue([]);
      mockAdapter.createRelation.mockResolvedValue();

      await engine.createRelation(relation);

      expect(mockAdapter.listWorkItems).toHaveBeenCalled();
      expect(mockAdapter.createRelation).toHaveBeenCalledWith(relation);
    });
  });

  describe('getRelations', () => {
    it('should get relations through adapter', async () => {
      const mockRelations = [
        {
          from: 'EPIC-001',
          to: 'TASK-001',
          type: 'parent_of' as const,
        },
      ];

      mockAdapter.getRelations.mockResolvedValue(mockRelations);

      const result = await engine.getRelations('EPIC-001');

      expect(mockAdapter.getRelations).toHaveBeenCalledWith('EPIC-001');
      expect(result).toEqual(mockRelations);
    });
  });

  describe('removeContext', () => {
    it('should remove context and handle active context', async () => {
      // Add a context first
      await engine.addContext({
        name: 'test-context',
        tool: 'local-fs',
        path: '/test',
        authState: 'authenticated',
        isActive: false,
      });

      engine.removeContext('test-context');

      const contexts = engine.getContexts();
      expect(contexts.find(c => c.name === 'test-context')).toBeUndefined();
    });
  });

  describe('deleteWorkItem', () => {
    it('should delete work item through adapter', async () => {
      mockAdapter.deleteWorkItem.mockResolvedValue();

      await engine.deleteWorkItem('TASK-001');

      expect(mockAdapter.deleteWorkItem).toHaveBeenCalledWith('TASK-001');
    });
  });

  describe('addComment', () => {
    it('should log placeholder message', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      engine.addComment('TASK-001', 'test comment');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Comment operation not yet implemented: TASK-001 - test comment'
      );
      consoleSpy.mockRestore();
    });
  });

  describe('moveWorkItem', () => {
    it('should log placeholder message', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      engine.moveWorkItem('TASK-001', '@other-context');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Move operation not yet implemented: TASK-001 to @other-context'
      );
      consoleSpy.mockRestore();
    });
  });

  describe('getContexts', () => {
    it('should return empty array initially', () => {
      const contexts = engine.getContexts();
      expect(contexts).toEqual([]);
    });
  });
});
