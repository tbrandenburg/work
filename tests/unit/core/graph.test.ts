import {
  validateRelation,
  detectCycles,
  buildGraphSlice,
} from '../../../src/core/graph';
import { WorkItem, Relation } from '../../../src/types/index';

describe('Graph Operations', () => {
  const createTestWorkItem = (
    id: string,
    kind: 'task' | 'epic' | 'bug' = 'task'
  ): WorkItem => ({
    id,
    kind,
    title: `Test ${kind}`,
    state: 'new',
    priority: 'medium',
    labels: [],
    createdAt: '2026-01-20T10:00:00.000Z',
    updatedAt: '2026-01-20T10:00:00.000Z',
  });

  describe('validateRelation', () => {
    it('should validate relation with existing work items', () => {
      const workItems = [
        createTestWorkItem('TASK-001'),
        createTestWorkItem('TASK-002'),
      ];

      const relation: Relation = {
        from: 'TASK-001',
        to: 'TASK-002',
        type: 'blocks',
      };

      expect(() => validateRelation(relation, workItems)).not.toThrow();
    });

    it('should throw error for non-existent source work item', () => {
      const workItems = [createTestWorkItem('TASK-002')];

      const relation: Relation = {
        from: 'TASK-001',
        to: 'TASK-002',
        type: 'blocks',
      };

      expect(() => validateRelation(relation, workItems)).toThrow(
        'Source work item not found: TASK-001'
      );
    });

    it('should throw error for non-existent target work item', () => {
      const workItems = [createTestWorkItem('TASK-001')];

      const relation: Relation = {
        from: 'TASK-001',
        to: 'TASK-002',
        type: 'blocks',
      };

      expect(() => validateRelation(relation, workItems)).toThrow(
        'Target work item not found: TASK-002'
      );
    });

    it('should throw error for self-referencing relation', () => {
      const workItems = [createTestWorkItem('TASK-001')];

      const relation: Relation = {
        from: 'TASK-001',
        to: 'TASK-001',
        type: 'blocks',
      };

      expect(() => validateRelation(relation, workItems)).toThrow(
        'Work item cannot have a relation to itself'
      );
    });

    it('should validate hierarchical constraints', () => {
      const workItems = [
        createTestWorkItem('TASK-001', 'task'),
        createTestWorkItem('EPIC-001', 'epic'),
      ];

      const invalidRelation: Relation = {
        from: 'TASK-001',
        to: 'EPIC-001',
        type: 'parent_of',
      };

      expect(() => validateRelation(invalidRelation, workItems)).toThrow(
        'Task cannot be parent of epic'
      );
    });
  });

  describe('detectCycles', () => {
    it('should detect cycle in parent-child relationships', () => {
      const existingRelations: Relation[] = [
        { from: 'TASK-001', to: 'TASK-002', type: 'parent_of' },
        { from: 'TASK-002', to: 'TASK-003', type: 'parent_of' },
      ];

      const newRelation: Relation = {
        from: 'TASK-003',
        to: 'TASK-001',
        type: 'parent_of',
      };

      expect(detectCycles(existingRelations, newRelation)).toBe(true);
    });

    it('should not detect cycle in valid parent-child relationships', () => {
      const existingRelations: Relation[] = [
        { from: 'TASK-001', to: 'TASK-002', type: 'parent_of' },
        { from: 'TASK-001', to: 'TASK-003', type: 'parent_of' },
      ];

      const newRelation: Relation = {
        from: 'TASK-002',
        to: 'TASK-004',
        type: 'parent_of',
      };

      expect(detectCycles(existingRelations, newRelation)).toBe(false);
    });

    it('should handle complex cycle detection', () => {
      const existingRelations: Relation[] = [
        { from: 'A', to: 'B', type: 'parent_of' },
        { from: 'B', to: 'C', type: 'parent_of' },
        { from: 'C', to: 'D', type: 'parent_of' },
      ];

      const cyclicRelation: Relation = {
        from: 'D',
        to: 'A',
        type: 'parent_of',
      };

      expect(detectCycles(existingRelations, cyclicRelation)).toBe(true);
    });
  });

  describe('buildGraphSlice', () => {
    it('should build graph slice with work items and relations', () => {
      const workItems = [
        createTestWorkItem('TASK-001'),
        createTestWorkItem('TASK-002'),
        createTestWorkItem('EPIC-001', 'epic'),
      ];

      const relations: Relation[] = [
        { from: 'EPIC-001', to: 'TASK-001', type: 'parent_of' },
        { from: 'TASK-001', to: 'TASK-002', type: 'blocks' },
      ];

      const slice = buildGraphSlice(workItems, relations);

      expect(slice.items).toHaveLength(3);
      expect(slice.relations).toHaveLength(2);
      expect(slice.items.map(n => n.id)).toContain('TASK-001');
      expect(slice.items.map(n => n.id)).toContain('TASK-002');
      expect(slice.items.map(n => n.id)).toContain('EPIC-001');
    });

    it('should handle empty work items and relations', () => {
      const slice = buildGraphSlice([], []);

      expect(slice.items).toHaveLength(0);
      expect(slice.relations).toHaveLength(0);
    });

    it('should preserve all work item properties', () => {
      const workItem = createTestWorkItem('TASK-001');
      const slice = buildGraphSlice([workItem], []);

      expect(slice.items[0]).toEqual(workItem);
    });
  });
});
