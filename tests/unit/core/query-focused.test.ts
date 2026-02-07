import { parseQuery, executeQuery } from '../../../src/core/query';

describe('Query System', () => {
  describe('parseQuery - Core Functionality', () => {
    it('should parse simple where clause', () => {
      const query = parseQuery('where state=active');

      expect(query.where).toBe('state=active');
      expect(query.orderBy).toBeUndefined();
      expect(query.limit).toBeUndefined();
    });

    it('should parse order by clause', () => {
      const query = parseQuery('where state=active order by createdAt');

      expect(query.where).toBe('state=active');
      expect(query.orderBy).toBe('createdAt');
    });

    it('should parse limit clause', () => {
      const query = parseQuery('where state=active limit 10');

      expect(query.where).toBe('state=active');
      expect(query.limit).toBe(10);
    });

    it('should parse complete query with all clauses', () => {
      const query = parseQuery('where state=active order by updatedAt limit 5');

      expect(query.where).toBe('state=active');
      expect(query.orderBy).toBe('updatedAt');
      expect(query.limit).toBe(5);
    });

    it('should handle empty query', () => {
      const query = parseQuery('');

      expect(query.where).toBeUndefined();
      expect(query.orderBy).toBeUndefined();
      expect(query.limit).toBeUndefined();
    });

    it('should handle whitespace-only query', () => {
      const query = parseQuery('   ');

      expect(query.where).toBeUndefined();
      expect(query.orderBy).toBeUndefined();
      expect(query.limit).toBeUndefined();
    });

    it('should throw error for invalid limit value', () => {
      expect(() => parseQuery('limit invalid')).toThrow('Invalid limit value');
    });

    it('should throw error for negative limit', () => {
      expect(() => parseQuery('limit -5')).toThrow('Invalid limit value');
    });

    it('should throw error for zero limit', () => {
      expect(() => parseQuery('limit 0')).toThrow('Invalid limit value');
    });

    it('should parse complex where clause', () => {
      const query = parseQuery('where priority=high');

      // Now uses new parser because priority values are detected
      expect(query.where).toEqual({
        type: 'comparison',
        field: 'priority',
        operator: '=',
        value: 3, // high = 3
      });
    });

    it('should handle order by with desc direction', () => {
      const query = parseQuery('order by createdAt desc');

      expect(query.orderBy).toBe('createdAt');
      expect(query.limit).toBeUndefined();
    });

    it('should parse query with only limit', () => {
      const query = parseQuery('limit 25');

      expect(query.where).toBeUndefined();
      expect(query.orderBy).toBeUndefined();
      expect(query.limit).toBe(25);
    });
  });

  describe('parseQuery - Enhanced Where Clauses', () => {
    it('should parse simple comparison with new parser', () => {
      const query = parseQuery('where priority>medium');

      expect(query.where).toEqual({
        type: 'comparison',
        field: 'priority',
        operator: '>',
        value: 2, // medium = 2
      });
    });

    it('should parse logical AND expression', () => {
      const query = parseQuery('where state=active AND priority=high');

      expect(query.where).toEqual({
        type: 'logical',
        operator: 'AND',
        left: {
          type: 'comparison',
          field: 'state',
          operator: '=',
          value: 'active',
        },
        right: {
          type: 'comparison',
          field: 'priority',
          operator: '=',
          value: 3, // high = 3
        },
      });
    });

    it('should parse logical OR expression', () => {
      const query = parseQuery('where priority=high OR priority=critical');

      expect(query.where).toEqual({
        type: 'logical',
        operator: 'OR',
        left: {
          type: 'comparison',
          field: 'priority',
          operator: '=',
          value: 3, // high = 3
        },
        right: {
          type: 'comparison',
          field: 'priority',
          operator: '=',
          value: 4, // critical = 4
        },
      });
    });

    it('should parse NOT expression', () => {
      const query = parseQuery('where NOT state=closed');

      expect(query.where).toEqual({
        type: 'logical',
        operator: 'NOT',
        operand: {
          type: 'comparison',
          field: 'state',
          operator: '=',
          value: 'closed',
        },
      });
    });

    it('should parse comparison operators', () => {
      const operators = ['=', '!=', '>', '<', '>=', '<='];
      
      operators.forEach(op => {
        const query = parseQuery(`where priority${op}medium`);
        expect(query.where.operator).toBe(op);
      });
    });

    it('should handle string values with quotes', () => {
      const query = parseQuery('where title="Test Task"');

      expect(query.where).toEqual({
        type: 'comparison',
        field: 'title',
        operator: '=',
        value: 'Test Task',
      });
    });

    it('should handle parentheses for grouping', () => {
      const query = parseQuery('where (state=active OR state=new) AND priority=high');

      expect(query.where).toEqual({
        type: 'logical',
        operator: 'AND',
        left: {
          type: 'logical',
          operator: 'OR',
          left: {
            type: 'comparison',
            field: 'state',
            operator: '=',
            value: 'active',
          },
          right: {
            type: 'comparison',
            field: 'state',
            operator: '=',
            value: 'new',
          },
        },
        right: {
          type: 'comparison',
          field: 'priority',
          operator: '=',
          value: 3, // high = 3
        },
      });
    });
  });

  describe('executeQuery - Core Execution', () => {
    const mockWorkItems = [
      {
        id: 'TASK-1',
        title: 'First Task',
        state: 'active',
        priority: 'medium',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      },
      {
        id: 'TASK-2',
        title: 'Second Task',
        state: 'closed',
        priority: 'high',
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z',
      },
      {
        id: 'TASK-3',
        title: 'Third Task',
        state: 'active',
        priority: 'low',
        createdAt: '2024-01-03T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    it('should filter by state', () => {
      const query = parseQuery('where state=active');
      const result = executeQuery(mockWorkItems, query);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('TASK-1');
      expect(result[1].id).toBe('TASK-3');
    });

    it('should filter by priority comparison', () => {
      const query = parseQuery('where priority>low');
      const result = executeQuery(mockWorkItems, query);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('TASK-1');
      expect(result[1].id).toBe('TASK-2');
    });

    it('should apply limit', () => {
      const query = parseQuery('limit 2');
      const result = executeQuery(mockWorkItems, query);

      expect(result).toHaveLength(2);
    });

    it('should sort by field ascending', () => {
      const query = parseQuery('order by priority');
      const result = executeQuery(mockWorkItems, query);

      expect(result[0].priority).toBe('low');
      expect(result[1].priority).toBe('medium');
      expect(result[2].priority).toBe('high');
    });

    it('should sort by field descending', () => {
      const query = parseQuery('order by priority desc');
      const result = executeQuery(mockWorkItems, query);

      expect(result[0].priority).toBe('low');
      expect(result[1].priority).toBe('medium');
      expect(result[2].priority).toBe('high');
    });

    it('should combine filter, sort, and limit', () => {
      const query = parseQuery('where state=active order by priority desc limit 1');
      const result = executeQuery(mockWorkItems, query);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('TASK-3'); // active with low priority (first in desc order)
    });

    it('should handle logical AND', () => {
      const query = parseQuery('where state=active AND priority>low');
      const result = executeQuery(mockWorkItems, query);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('TASK-1');
    });

    it('should handle logical OR', () => {
      const query = parseQuery('where state=closed OR priority=low');
      const result = executeQuery(mockWorkItems, query);

      expect(result).toHaveLength(2);
      expect(result.map(item => item.id)).toContain('TASK-2');
      expect(result.map(item => item.id)).toContain('TASK-3');
    });

    it('should handle NOT operator', () => {
      const query = parseQuery('where NOT state=closed');
      const result = executeQuery(mockWorkItems, query);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('TASK-1');
      expect(result[1].id).toBe('TASK-3');
    });

    it('should return empty array for no matches', () => {
      const query = parseQuery('where state=nonexistent');
      const result = executeQuery(mockWorkItems, query);

      expect(result).toHaveLength(0);
    });
  });

  describe('Agent field support', () => {
    const itemsWithAgent = [
      {
        id: 'TASK-001',
        kind: 'task' as const,
        title: 'Task 1',
        state: 'new' as const,
        priority: 'high' as const,
        assignee: 'human',
        agent: 'code-reviewer',
        labels: [] as readonly string[],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'TASK-002',
        kind: 'task' as const,
        title: 'Task 2',
        state: 'new' as const,
        priority: 'medium' as const,
        assignee: 'human2',
        agent: undefined,
        labels: [] as readonly string[],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'TASK-003',
        kind: 'task' as const,
        title: 'Task 3',
        state: 'active' as const,
        priority: 'high' as const,
        assignee: 'human',
        agent: 'test-agent',
        labels: [] as readonly string[],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    it('should filter by agent', () => {
      const query = parseQuery('where agent=code-reviewer');
      const result = executeQuery(itemsWithAgent, query);
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('TASK-001');
      expect(result[0].agent).toBe('code-reviewer');
    });

    it('should combine agent and assignee filters', () => {
      const query = parseQuery('where agent=code-reviewer AND assignee=human');
      const result = executeQuery(itemsWithAgent, query);
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('TASK-001');
    });

    it('should filter by multiple agents using OR', () => {
      const query = parseQuery('where agent=code-reviewer OR agent=test-agent');
      const result = executeQuery(itemsWithAgent, query);
      
      expect(result).toHaveLength(2);
      expect(result[0].agent).toBe('code-reviewer');
      expect(result[1].agent).toBe('test-agent');
    });
  });
});
