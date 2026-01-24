/**
 * Unit tests for WorkItem types
 */

import {
  WorkItem,
  WorkItemState,
  WorkItemKind,
  Priority,
} from '@/types/work-item';

describe('WorkItem Types', () => {
  it('should have valid WorkItemState values', () => {
    const states: WorkItemState[] = ['new', 'active', 'closed'];
    expect(states).toHaveLength(3);
    expect(states).toContain('new');
    expect(states).toContain('active');
    expect(states).toContain('closed');
  });

  it('should have valid WorkItemKind values', () => {
    const kinds: WorkItemKind[] = ['task', 'bug', 'epic', 'story'];
    expect(kinds).toHaveLength(4);
    expect(kinds).toContain('task');
    expect(kinds).toContain('bug');
    expect(kinds).toContain('epic');
    expect(kinds).toContain('story');
  });

  it('should have valid Priority values', () => {
    const priorities: Priority[] = ['low', 'medium', 'high', 'critical'];
    expect(priorities).toHaveLength(4);
    expect(priorities).toContain('low');
    expect(priorities).toContain('medium');
    expect(priorities).toContain('high');
    expect(priorities).toContain('critical');
  });

  it('should create a valid WorkItem object', () => {
    const workItem: WorkItem = {
      id: 'TASK-001',
      kind: 'task',
      title: 'Test task',
      description: 'A test task',
      state: 'new',
      priority: 'medium',
      assignee: 'testuser',
      labels: ['test', 'unit'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    expect(workItem.id).toBe('TASK-001');
    expect(workItem.kind).toBe('task');
    expect(workItem.title).toBe('Test task');
    expect(workItem.state).toBe('new');
    expect(workItem.priority).toBe('medium');
    expect(workItem.labels).toEqual(['test', 'unit']);
  });
});
