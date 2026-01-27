import { describe, it, expect } from 'vitest';
import {
  WorkError,
  WorkItemNotFoundError,
  ContextNotFoundError,
  InvalidQueryError,
  RelationError,
  QuerySyntaxError,
  UnsupportedOperatorError,
  InvalidDateError,
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

  describe('QuerySyntaxError', () => {
    it('should create a query syntax error', () => {
      const error = new QuerySyntaxError(
        'status=open AND',
        'incomplete expression'
      );

      expect(error.message).toBe(
        'Query syntax error in "status=open AND": incomplete expression'
      );
      expect(error.code).toBe('QUERY_SYNTAX_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('QuerySyntaxError');
      expect(error instanceof WorkError).toBe(true);
      expect(error instanceof QuerySyntaxError).toBe(true);
    });
  });

  describe('UnsupportedOperatorError', () => {
    it('should create an unsupported operator error', () => {
      const error = new UnsupportedOperatorError('!==');

      expect(error.message).toBe('Unsupported operator: !==');
      expect(error.code).toBe('UNSUPPORTED_OPERATOR');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('UnsupportedOperatorError');
      expect(error instanceof WorkError).toBe(true);
      expect(error instanceof UnsupportedOperatorError).toBe(true);
    });
  });

  describe('InvalidDateError', () => {
    it('should create an invalid date error', () => {
      const error = new InvalidDateError('2023-13-45');

      expect(error.message).toBe(
        'Invalid date format: 2023-13-45. Expected ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)'
      );
      expect(error.code).toBe('INVALID_DATE');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('InvalidDateError');
      expect(error instanceof WorkError).toBe(true);
      expect(error instanceof InvalidDateError).toBe(true);
    });
  });
});
