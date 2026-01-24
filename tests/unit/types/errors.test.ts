import {
  WorkError,
  WorkItemNotFoundError,
  ContextNotFoundError,
  InvalidQueryError,
  RelationError,
} from '../../../src/types/errors';

describe('Error Classes', () => {
  describe('WorkError', () => {
    it('should create a work error with message, code, and status', () => {
      const error = new WorkError('Test error', 'TEST_ERROR', 400);

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('WorkError');
      expect(error instanceof Error).toBe(true);
      expect(error instanceof WorkError).toBe(true);
    });

    it('should use default status code 500', () => {
      const error = new WorkError('Test error', 'TEST_ERROR');

      expect(error.statusCode).toBe(500);
    });
  });

  describe('WorkItemNotFoundError', () => {
    it('should create a work item not found error', () => {
      const error = new WorkItemNotFoundError('TASK-001');

      expect(error.message).toBe('Work item not found: TASK-001');
      expect(error.code).toBe('WORK_ITEM_NOT_FOUND');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('WorkItemNotFoundError');
      expect(error instanceof WorkError).toBe(true);
      expect(error instanceof WorkItemNotFoundError).toBe(true);
    });
  });

  describe('ContextNotFoundError', () => {
    it('should create a context not found error', () => {
      const error = new ContextNotFoundError('test-context');

      expect(error.message).toBe('Context not found: test-context');
      expect(error.code).toBe('CONTEXT_NOT_FOUND');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('ContextNotFoundError');
      expect(error instanceof WorkError).toBe(true);
      expect(error instanceof ContextNotFoundError).toBe(true);
    });
  });

  describe('InvalidQueryError', () => {
    it('should create an invalid query error', () => {
      const error = new InvalidQueryError('invalid syntax', 'missing operator');

      expect(error.message).toBe(
        'Invalid query "invalid syntax": missing operator'
      );
      expect(error.code).toBe('INVALID_QUERY');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('InvalidQueryError');
      expect(error instanceof WorkError).toBe(true);
      expect(error instanceof InvalidQueryError).toBe(true);
    });
  });

  describe('RelationError', () => {
    it('should create a relation error', () => {
      const error = new RelationError('Invalid relation');

      expect(error.message).toBe('Invalid relation');
      expect(error.code).toBe('RELATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('RelationError');
      expect(error instanceof WorkError).toBe(true);
      expect(error instanceof RelationError).toBe(true);
    });
  });
});
