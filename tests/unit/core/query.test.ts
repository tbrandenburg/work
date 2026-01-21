import { parseQuery } from '../../../src/core/query';

describe('Query System', () => {
  describe('parseQuery', () => {
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
        value: 3 // high = 3
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

  describe('parseQuery with enhanced where clauses', () => {
    it('should parse simple comparison with new parser', () => {
      const query = parseQuery('where priority>medium');
      
      expect(query.where).toEqual({
        type: 'comparison',
        field: 'priority',
        operator: '>',
        value: 2 // medium = 2
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
          value: 'active'
        },
        right: {
          type: 'comparison',
          field: 'priority',
          operator: '=',
          value: 3 // high = 3
        }
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
          value: 3 // high = 3
        },
        right: {
          type: 'comparison',
          field: 'priority',
          operator: '=',
          value: 4 // critical = 4
        }
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
          value: 'closed'
        }
      });
    });

    it('should handle comparison operators', () => {
      const operators = ['>=', '<=', '!=', '>', '<'];
      
      operators.forEach(op => {
        const query = parseQuery(`where priority${op}medium`);
        
        expect(query.where).toEqual({
          type: 'comparison',
          field: 'priority',
          operator: op,
          value: 2 // medium = 2
        });
      });
    });

    it('should fall back to string for simple queries', () => {
      const query = parseQuery('where state=active');
      
      expect(typeof query.where).toBe('string');
      expect(query.where).toBe('state=active');
    });
  });

  describe('parseQuery with date parsing', () => {
    it('should parse ISO date values', () => {
      const query = parseQuery('where createdAt>2024-01-01');
      
      expect(query.where).toEqual({
        type: 'comparison',
        field: 'createdAt',
        operator: '>',
        value: new Date('2024-01-01T00:00:00.000Z')
      });
    });

    it('should parse ISO datetime values', () => {
      const query = parseQuery('where updatedAt>=2024-01-01T10:30:00Z');
      
      expect(query.where).toEqual({
        type: 'comparison',
        field: 'updatedAt',
        operator: '>=',
        value: new Date('2024-01-01T10:30:00.000Z')
      });
    });

    it('should parse numeric values', () => {
      const query = parseQuery('where id>100');
      
      expect(query.where).toEqual({
        type: 'comparison',
        field: 'id',
        operator: '>',
        value: 100
      });
    });

    it('should throw error for invalid date format during execution', () => {
      // Test that invalid dates throw proper errors
      expect(() => {
        parseQuery('where createdAt>2024-99-99');
      }).toThrow('Invalid date format: 2024-99-99');
    });
  });

  describe('executeQuery with QueryCondition evaluation', () => {
    const mockWorkItems = [
      {
        id: '1',
        kind: 'task' as const,
        title: 'Task 1',
        state: 'active' as const,
        priority: 'high' as const,
        createdAt: '2024-01-01T10:00:00.000Z',
        updatedAt: '2024-01-01T10:00:00.000Z',
        labels: ['urgent']
      },
      {
        id: '2',
        kind: 'bug' as const,
        title: 'Bug 2',
        state: 'closed' as const,
        priority: 'medium' as const,
        createdAt: '2024-01-02T10:00:00.000Z',
        updatedAt: '2024-01-02T10:00:00.000Z',
        labels: ['backend']
      }
    ];

    it('should evaluate comparison operators', () => {
      const { executeQuery } = require('../../../src/core/query');
      
      const query = parseQuery('where priority>medium');
      const results = executeQuery(mockWorkItems, query);
      
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('1');
    });

    it('should evaluate logical AND expressions', () => {
      const { executeQuery } = require('../../../src/core/query');
      
      const query = parseQuery('where state=active AND priority=high');
      const results = executeQuery(mockWorkItems, query);
      
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('1');
    });

    it('should evaluate logical OR expressions', () => {
      const { executeQuery } = require('../../../src/core/query');
      
      const query = parseQuery('where priority=high OR priority=medium');
      const results = executeQuery(mockWorkItems, query);
      
      expect(results).toHaveLength(2);
    });

    it('should evaluate NOT expressions', () => {
      const { executeQuery } = require('../../../src/core/query');
      
      const query = parseQuery('where NOT state=closed');
      const results = executeQuery(mockWorkItems, query);
      
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('1');
    });

    it('should evaluate date comparisons', () => {
      const { executeQuery } = require('../../../src/core/query');
      
      const query = parseQuery('where createdAt>2024-01-01T12:00:00');
      const results = executeQuery(mockWorkItems, query);
      
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('2'); // Only item 2 was created after 12:00
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle syntax errors gracefully', () => {
      // These should fall back to string parsing for backward compatibility
      const query1 = parseQuery('where field=');
      expect(typeof query1.where).toBe('string');
      
      const query2 = parseQuery('where =value');
      expect(typeof query2.where).toBe('string');
    });

    it('should handle unsupported operators in evaluation', () => {
      const { executeQuery } = require('../../../src/core/query');
      const mockItems = [{ id: '1', state: 'active', priority: 'high' }];
      
      // Create a malformed query condition (this would normally not be created by the parser)
      const malformedQuery = {
        where: {
          type: 'comparison',
          field: 'state',
          operator: '~=', // Invalid operator
          value: 'active'
        }
      };
      
      expect(() => executeQuery(mockItems, malformedQuery)).toThrow('Unsupported operator');
    });

    it('should handle complex nested expressions', () => {
      const query = parseQuery('where (state=active OR state=new) AND priority>=high');
      
      // This should parse correctly with proper precedence
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
            value: 'active'
          },
          right: {
            type: 'comparison',
            field: 'state',
            operator: '=',
            value: 'new'
          }
        },
        right: {
          type: 'comparison',
          field: 'priority',
          operator: '>=',
          value: 3 // high = 3
        }
      });
    });

    it('should handle quoted strings with special characters', () => {
      // Quoted strings should trigger the new parser
      const query = parseQuery('where title="Task with spaces and symbols: @#$%"');
      
      expect(query.where).toEqual({
        type: 'comparison',
        field: 'title',
        operator: '=',
        value: 'Task with spaces and symbols: @#$%'
      });
    });

    it('should handle mixed case logical operators', () => {
      const query1 = parseQuery('where state=active and priority=high');
      const query2 = parseQuery('where state=active And priority=high');
      
      // Should normalize to uppercase
      expect(query1.where).toEqual(query2.where);
    });

    it('should handle edge case date formats', () => {
      const query1 = parseQuery('where createdAt>2024-12-31T23:59:59.999Z');
      const query2 = parseQuery('where createdAt>=2024-01-01T00:00:00Z');
      
      expect(query1.where).toEqual({
        type: 'comparison',
        field: 'createdAt',
        operator: '>',
        value: new Date('2024-12-31T23:59:59.999Z')
      });
      
      expect(query2.where).toEqual({
        type: 'comparison',
        field: 'createdAt',
        operator: '>=',
        value: new Date('2024-01-01T00:00:00.000Z')
      });
    });

    it('should handle numeric field comparisons', () => {
      const query = parseQuery('where id>=100');
      
      expect(query.where).toEqual({
        type: 'comparison',
        field: 'id',
        operator: '>=',
        value: 100
      });
    });

    it('should handle label field specially', () => {
      const { executeQuery } = require('../../../src/core/query');
      const mockItems = [
        { id: '1', labels: ['urgent', 'backend'], state: 'active' },
        { id: '2', labels: ['frontend'], state: 'active' }
      ];
      
      const query = parseQuery('where label=urgent');
      const results = executeQuery(mockItems, query);
      
      // Should find items containing the label
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('1');
    });
  });

  describe('Performance and coverage', () => {
    it('should handle large numbers of conditions efficiently', () => {
      // Test with a complex query that exercises all operators
      const complexQuery = 'where (priority=high OR priority=critical) AND state!=closed AND createdAt>2024-01-01 AND NOT assignee=""';
      
      const query = parseQuery(complexQuery);
      expect(query.where).toBeDefined();
      expect(typeof query.where).toBe('object');
    });

    it('should maintain backward compatibility with simple queries', () => {
      // Simple queries without advanced features should still work
      // Note: queries with priority values will use new parser due to priority detection
      const simpleQueries = [
        { query: 'state=active', expectString: true },
        { query: 'assignee=user123', expectString: true },
        { query: 'priority=high', expectString: false }, // Uses new parser due to priority detection
      ];
      
      simpleQueries.forEach(test => {
        const query = parseQuery(`where ${test.query}`);
        if (test.expectString) {
          expect(typeof query.where).toBe('string');
          expect(query.where).toBe(test.query);
        } else {
          expect(typeof query.where).toBe('object');
        }
      });
    });

    it('should handle all comparison operators correctly', () => {
      const { executeQuery } = require('../../../src/core/query');
      const mockItems = [
        { id: '1', priority: 'low', createdAt: '2024-01-01T10:00:00.000Z' },
        { id: '2', priority: 'medium', createdAt: '2024-01-02T10:00:00.000Z' },
        { id: '3', priority: 'high', createdAt: '2024-01-03T10:00:00.000Z' },
        { id: '4', priority: 'critical', createdAt: '2024-01-04T10:00:00.000Z' }
      ];
      
      // Test all operators
      const tests = [
        { query: 'priority=medium', expectedIds: ['2'] },
        { query: 'priority!=medium', expectedIds: ['1', '3', '4'] },
        { query: 'priority>medium', expectedIds: ['3', '4'] },
        { query: 'priority<high', expectedIds: ['1', '2'] },
        { query: 'priority>=high', expectedIds: ['3', '4'] },
        { query: 'priority<=medium', expectedIds: ['1', '2'] }
      ];
      
      tests.forEach(test => {
        const query = parseQuery(`where ${test.query}`);
        const results = executeQuery(mockItems, query);
        const resultIds = results.map((item: any) => item.id).sort();
        expect(resultIds).toEqual(test.expectedIds.sort());
      });
    });
  });

  // TODO: Add tokenizeQuery tests when function becomes public in Task 4
});
