/**
 * Unit tests for Storage operations
 */

import { vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import {
  ensureWorkDir,
  saveWorkItem,
  loadWorkItem,
  listWorkItems,
  saveLinks,
  loadLinks,
} from '../../../../src/adapters/local-fs/storage';
import { WorkItem, Relation } from '../../../../src/types/index';

// Mock fs operations
vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn(),
    writeFile: vi.fn(),
    readFile: vi.fn(),
    readdir: vi.fn(),
    rm: vi.fn(),
  },
}));

describe('Storage', () => {
  const mockFs = vi.mocked(fs);
  const testWorkDir = '/test/work-dir';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ensureWorkDir', () => {
    it('should create work directory and work-items subdirectory', async () => {
      mockFs.mkdir.mockResolvedValue(undefined);

      await ensureWorkDir(testWorkDir);

      expect(mockFs.mkdir).toHaveBeenCalledWith(testWorkDir, {
        recursive: true,
      });
      expect(mockFs.mkdir).toHaveBeenCalledWith(
        path.join(testWorkDir, 'work-items'),
        { recursive: true }
      );
      expect(mockFs.mkdir).toHaveBeenCalledTimes(2);
    });

    it('should ignore EEXIST errors when directories already exist', async () => {
      const eexistError = new Error(
        'Directory exists'
      ) as NodeJS.ErrnoException;
      eexistError.code = 'EEXIST';
      mockFs.mkdir.mockRejectedValue(eexistError);

      await expect(ensureWorkDir(testWorkDir)).resolves.toBeUndefined();
    });

    it('should throw non-EEXIST errors', async () => {
      const permissionError = new Error(
        'Permission denied'
      ) as NodeJS.ErrnoException;
      permissionError.code = 'EACCES';
      mockFs.mkdir.mockRejectedValue(permissionError);

      await expect(ensureWorkDir(testWorkDir)).rejects.toThrow(
        'Permission denied'
      );
    });
  });

  describe('saveWorkItem', () => {
    const mockWorkItem: WorkItem = {
      id: 'task-123',
      kind: 'task',
      title: 'Test Task',
      description: 'This is a test task description',
      state: 'active',
      priority: 'high',
      assignee: 'user@example.com',
      labels: ['bug', 'urgent'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T12:00:00Z',
      closedAt: undefined,
    };

    it('should save work item as markdown with frontmatter', async () => {
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await saveWorkItem(mockWorkItem, testWorkDir);

      const expectedPath = path.join(testWorkDir, 'work-items', 'task-123.md');
      const expectedContent = [
        '---',
        JSON.stringify(
          {
            id: 'task-123',
            kind: 'task',
            title: 'Test Task',
            state: 'active',
            priority: 'high',
            assignee: 'user@example.com',
            labels: ['bug', 'urgent'],
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T12:00:00Z',
            closedAt: undefined,
          },
          null,
          2
        ),
        '---',
        '',
        'This is a test task description',
      ].join('\n');

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expectedPath,
        expectedContent,
        'utf-8'
      );
    });

    it('should handle work item without description', async () => {
      const workItemNoDesc = { ...mockWorkItem, description: undefined };
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await saveWorkItem(workItemNoDesc, testWorkDir);

      const expectedContent = [
        '---',
        JSON.stringify(
          {
            id: 'task-123',
            kind: 'task',
            title: 'Test Task',
            state: 'active',
            priority: 'high',
            assignee: 'user@example.com',
            labels: ['bug', 'urgent'],
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T12:00:00Z',
            closedAt: undefined,
          },
          null,
          2
        ),
        '---',
        '',
        '',
      ].join('\n');

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expectedContent,
        'utf-8'
      );
    });
  });

  describe('loadWorkItem', () => {
    it('should load work item from markdown file', async () => {
      const fileContent = [
        '---',
        JSON.stringify(
          {
            id: 'task-123',
            kind: 'task',
            title: 'Test Task',
            state: 'active',
            priority: 'high',
            assignee: 'user@example.com',
            labels: ['bug'],
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T12:00:00Z',
            closedAt: undefined,
          },
          null,
          2
        ),
        '---',
        'This is the description',
      ].join('\n');

      mockFs.readFile.mockResolvedValue(fileContent);

      const result = await loadWorkItem('task-123', testWorkDir);

      expect(result).toEqual({
        id: 'task-123',
        kind: 'task',
        title: 'Test Task',
        state: 'active',
        priority: 'high',
        assignee: 'user@example.com',
        labels: ['bug'],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T12:00:00Z',
        closedAt: undefined,
        description: 'This is the description',
      });

      expect(mockFs.readFile).toHaveBeenCalledWith(
        path.join(testWorkDir, 'work-items', 'task-123.md'),
        'utf-8'
      );
    });

    it('should return null for non-existent work item', async () => {
      const enoentError = new Error('File not found') as NodeJS.ErrnoException;
      enoentError.code = 'ENOENT';
      mockFs.readFile.mockRejectedValue(enoentError);

      const result = await loadWorkItem('non-existent', testWorkDir);

      expect(result).toBeNull();
    });

    it('should throw error for invalid frontmatter format', async () => {
      mockFs.readFile.mockResolvedValue('invalid markdown content');

      await expect(loadWorkItem('invalid', testWorkDir)).rejects.toThrow(
        'Invalid work item format: invalid'
      );
    });

    it('should handle work item with empty description', async () => {
      const fileContent = [
        '---',
        JSON.stringify({ id: 'task-123', title: 'Test' }, null, 2),
        '---',
        '',
      ].join('\n');

      mockFs.readFile.mockResolvedValue(fileContent);

      const result = await loadWorkItem('task-123', testWorkDir);

      expect(result?.description).toBeUndefined();
    });
  });

  describe('listWorkItems', () => {
    it('should list all work items from directory', async () => {
      mockFs.readdir.mockResolvedValue([
        'task-1.md',
        'task-2.md',
        'not-markdown.txt',
      ] as any);

      // Mock loadWorkItem calls
      mockFs.readFile
        .mockResolvedValueOnce(
          [
            '---',
            JSON.stringify({ id: 'task-1', title: 'Task 1' }, null, 2),
            '---',
            'Description 1',
          ].join('\n')
        )
        .mockResolvedValueOnce(
          [
            '---',
            JSON.stringify({ id: 'task-2', title: 'Task 2' }, null, 2),
            '---',
            'Description 2',
          ].join('\n')
        );

      const result = await listWorkItems(testWorkDir);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(
        expect.objectContaining({ id: 'task-1', title: 'Task 1' })
      );
      expect(result[1]).toEqual(
        expect.objectContaining({ id: 'task-2', title: 'Task 2' })
      );
      expect(mockFs.readdir).toHaveBeenCalledWith(
        path.join(testWorkDir, 'work-items')
      );
    });

    it('should return empty array if work-items directory does not exist', async () => {
      const enoentError = new Error(
        'Directory not found'
      ) as NodeJS.ErrnoException;
      enoentError.code = 'ENOENT';
      mockFs.readdir.mockRejectedValue(enoentError);

      const result = await listWorkItems(testWorkDir);

      expect(result).toEqual([]);
    });
  });

  describe('saveLinks', () => {
    const mockRelations: Relation[] = [
      { from: 'task-1', to: 'task-2', type: 'blocks' },
      { from: 'task-2', to: 'task-3', type: 'depends-on' },
    ];

    it('should save relations to links.json file', async () => {
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await saveLinks(mockRelations, testWorkDir);

      const expectedPath = path.join(testWorkDir, 'links.json');
      const expectedContent = JSON.stringify(mockRelations, null, 2);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expectedPath,
        expectedContent,
        'utf-8'
      );
    });
  });

  describe('loadLinks', () => {
    it('should load relations from links.json file', async () => {
      const mockRelations: Relation[] = [
        { from: 'task-1', to: 'task-2', type: 'blocks' },
      ];
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockRelations));

      const result = await loadLinks(testWorkDir);

      expect(result).toEqual(mockRelations);
      expect(mockFs.readFile).toHaveBeenCalledWith(
        path.join(testWorkDir, 'links.json'),
        'utf-8'
      );
    });

    it('should return empty array if links.json does not exist', async () => {
      const enoentError = new Error('File not found') as NodeJS.ErrnoException;
      enoentError.code = 'ENOENT';
      mockFs.readFile.mockRejectedValue(enoentError);

      const result = await loadLinks(testWorkDir);

      expect(result).toEqual([]);
    });

    it('should throw error for invalid JSON', async () => {
      mockFs.readFile.mockResolvedValue('invalid json');

      await expect(loadLinks(testWorkDir)).rejects.toThrow();
    });
  });
});
