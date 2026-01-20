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
      
      expect(query.where).toBe('priority=high');
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
});
