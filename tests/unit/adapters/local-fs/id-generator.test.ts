/**
 * Unit tests for ID generator
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { generateId } from '../../../../src/adapters/local-fs/id-generator';

describe('ID Generator', () => {
  const testDir = path.join(__dirname, 'test-work-dir');

  beforeEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Directory might not exist
    }
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Directory might not exist
    }
  });

  it('should generate sequential task IDs', async () => {
    const id1 = await generateId('task', testDir);
    const id2 = await generateId('task', testDir);
    const id3 = await generateId('task', testDir);

    expect(id1).toBe('TASK-001');
    expect(id2).toBe('TASK-002');
    expect(id3).toBe('TASK-003');
  });

  it('should generate different sequences for different kinds', async () => {
    const taskId = await generateId('task', testDir);
    const bugId = await generateId('bug', testDir);
    const epicId = await generateId('epic', testDir);

    expect(taskId).toBe('TASK-001');
    expect(bugId).toBe('BUG-001');
    expect(epicId).toBe('EPIC-001');
  });

  it('should handle missing counter file gracefully', async () => {
    const id = await generateId('task', testDir);
    expect(id).toBe('TASK-001');
  });

  it('should persist counters between calls', async () => {
    await generateId('task', testDir);
    await generateId('bug', testDir);

    const taskId = await generateId('task', testDir);
    const bugId = await generateId('bug', testDir);

    expect(taskId).toBe('TASK-002');
    expect(bugId).toBe('BUG-002');
  });

  it('should throw error when counter file read fails (not ENOENT)', async () => {
    const counterPath = path.join(testDir, '.work', 'counters.json');
    await fs.mkdir(path.dirname(counterPath), { recursive: true });
    await fs.writeFile(counterPath, 'valid json', 'utf-8');

    // Mock fs.readFile to throw a permission error (not ENOENT)
    const originalReadFile = fs.readFile;
    const readFileSpy = vi
      .spyOn(fs, 'readFile')
      .mockRejectedValueOnce(
        Object.assign(new Error('Permission denied'), { code: 'EACCES' })
      );

    // This should trigger line 48-49 (throw error)
    await expect(generateId('task', testDir)).rejects.toThrow(
      'Permission denied'
    );

    readFileSpy.mockRestore();
  });
});
