/**
 * Unit tests for Response types
 */

import {
  ResponseFormat,
  Meta,
  ErrorObject,
  SuccessResponse,
  ErrorResponse,
  ApiResponse,
} from '@/types/response';

describe('Response Types', () => {
  it('should have valid ResponseFormat values', () => {
    const formats: ResponseFormat[] = ['table', 'json'];
    expect(formats).toHaveLength(2);
    expect(formats).toContain('table');
    expect(formats).toContain('json');
  });

  it('should create valid Meta object with all fields', () => {
    const meta: Meta = {
      total: 42,
      timestamp: '2024-01-01T00:00:00Z',
      query: 'priority:high',
      context: 'production',
    };

    expect(meta.total).toBe(42);
    expect(meta.timestamp).toBe('2024-01-01T00:00:00Z');
    expect(meta.query).toBe('priority:high');
    expect(meta.context).toBe('production');
  });

  it('should create valid Meta object with minimal fields', () => {
    const meta: Meta = {
      timestamp: '2024-01-01T00:00:00Z',
    };

    expect(meta.timestamp).toBe('2024-01-01T00:00:00Z');
    expect(meta.total).toBeUndefined();
  });

  it('should create valid Meta object with dynamic fields', () => {
    const meta: Meta = {
      total: 100,
      customField: 'customValue',
      nestedObject: { key: 'value' },
    };

    expect(meta.total).toBe(100);
    expect(meta.customField).toBe('customValue');
    expect(meta.nestedObject).toEqual({ key: 'value' });
  });

  it('should create valid ErrorObject with all fields', () => {
    const error: ErrorObject = {
      code: 'INVALID_INPUT',
      message: 'The provided input is invalid',
      details: {
        field: 'title',
        expectedType: 'string',
        actualType: 'number',
      },
    };

    expect(error.code).toBe('INVALID_INPUT');
    expect(error.message).toBe('The provided input is invalid');
    expect(error.details).toEqual({
      field: 'title',
      expectedType: 'string',
      actualType: 'number',
    });
  });

  it('should create valid ErrorObject with minimal fields', () => {
    const error: ErrorObject = {
      message: 'Something went wrong',
    };

    expect(error.message).toBe('Something went wrong');
    expect(error.code).toBeUndefined();
    expect(error.details).toBeUndefined();
  });

  it('should create valid SuccessResponse with data and meta', () => {
    const response: SuccessResponse<string[]> = {
      data: ['item1', 'item2', 'item3'],
      meta: {
        total: 3,
        timestamp: '2024-01-01T00:00:00Z',
      },
    };

    expect(response.data).toEqual(['item1', 'item2', 'item3']);
    expect(response.meta?.total).toBe(3);
    expect(response.meta?.timestamp).toBe('2024-01-01T00:00:00Z');
  });

  it('should create valid SuccessResponse with data only', () => {
    const response: SuccessResponse<{ id: string; title: string }> = {
      data: {
        id: 'task-123',
        title: 'Test task',
      },
    };

    expect(response.data.id).toBe('task-123');
    expect(response.data.title).toBe('Test task');
    expect(response.meta).toBeUndefined();
  });

  it('should create valid SuccessResponse with null data', () => {
    const response: SuccessResponse<null> = {
      data: null,
      meta: {
        timestamp: '2024-01-01T00:00:00Z',
      },
    };

    expect(response.data).toBeNull();
    expect(response.meta?.timestamp).toBe('2024-01-01T00:00:00Z');
  });

  it('should create valid ErrorResponse with multiple errors', () => {
    const response: ErrorResponse = {
      errors: [
        {
          code: 'VALIDATION_ERROR',
          message: 'Title is required',
        },
        {
          code: 'VALIDATION_ERROR',
          message: 'Priority must be one of: low, medium, high',
        },
      ],
      meta: {
        timestamp: '2024-01-01T00:00:00Z',
      },
    };

    expect(response.errors).toHaveLength(2);
    expect(response.errors[0].code).toBe('VALIDATION_ERROR');
    expect(response.errors[0].message).toBe('Title is required');
    expect(response.errors[1].message).toBe(
      'Priority must be one of: low, medium, high'
    );
    expect(response.meta?.timestamp).toBe('2024-01-01T00:00:00Z');
  });

  it('should create valid ErrorResponse with single error', () => {
    const response: ErrorResponse = {
      errors: [
        {
          message: 'Network timeout',
          details: { timeout: 5000 },
        },
      ],
    };

    expect(response.errors).toHaveLength(1);
    expect(response.errors[0].message).toBe('Network timeout');
    expect(response.errors[0].details).toEqual({ timeout: 5000 });
    expect(response.meta).toBeUndefined();
  });

  it('should create valid ApiResponse as SuccessResponse', () => {
    const response: ApiResponse<{ count: number }> = {
      data: { count: 42 },
      meta: { timestamp: '2024-01-01T00:00:00Z' },
    };

    expect('data' in response).toBe(true);
    expect('errors' in response).toBe(false);

    if ('data' in response) {
      expect(response.data.count).toBe(42);
      expect(response.meta?.timestamp).toBe('2024-01-01T00:00:00Z');
    }
  });

  it('should create valid ApiResponse as ErrorResponse', () => {
    const response: ApiResponse = {
      errors: [
        {
          code: 'NOT_FOUND',
          message: 'Resource not found',
        },
      ],
    };

    expect('errors' in response).toBe(true);
    expect('data' in response).toBe(false);

    if ('errors' in response) {
      expect(response.errors).toHaveLength(1);
      expect(response.errors[0].code).toBe('NOT_FOUND');
    }
  });

  it('should handle generic type constraints correctly', () => {
    interface WorkItem {
      id: string;
      title: string;
    }

    const workItemResponse: ApiResponse<WorkItem> = {
      data: {
        id: 'item-123',
        title: 'Fix bug in authentication',
      },
    };

    const workItemListResponse: ApiResponse<WorkItem[]> = {
      data: [
        { id: 'item-1', title: 'Task 1' },
        { id: 'item-2', title: 'Task 2' },
      ],
      meta: { total: 2 },
    };

    if ('data' in workItemResponse) {
      expect(workItemResponse.data.id).toBe('item-123');
      expect(workItemResponse.data.title).toBe('Fix bug in authentication');
    }

    if ('data' in workItemListResponse) {
      expect(workItemListResponse.data).toHaveLength(2);
      expect(workItemListResponse.meta?.total).toBe(2);
    }
  });
});
