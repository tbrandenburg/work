/**
 * Custom error class definitions following TypeScript best practices
 */

export class WorkError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code: string, statusCode: number = 500) {
    super(message);
    this.name = 'WorkError';
    this.code = code;
    this.statusCode = statusCode;

    // Restore prototype chain for proper instanceof checks
    Object.setPrototypeOf(this, WorkError.prototype);
  }
}

export class WorkItemNotFoundError extends WorkError {
  constructor(id: string) {
    super(`Work item not found: ${id}`, 'WORK_ITEM_NOT_FOUND', 404);
    this.name = 'WorkItemNotFoundError';
    Object.setPrototypeOf(this, WorkItemNotFoundError.prototype);
  }
}

export class ContextNotFoundError extends WorkError {
  constructor(name: string) {
    super(`Context not found: ${name}`, 'CONTEXT_NOT_FOUND', 404);
    this.name = 'ContextNotFoundError';
    Object.setPrototypeOf(this, ContextNotFoundError.prototype);
  }
}

export class InvalidQueryError extends WorkError {
  constructor(query: string, reason: string) {
    super(`Invalid query "${query}": ${reason}`, 'INVALID_QUERY', 400);
    this.name = 'InvalidQueryError';
    Object.setPrototypeOf(this, InvalidQueryError.prototype);
  }
}

export class RelationError extends WorkError {
  constructor(message: string) {
    super(message, 'RELATION_ERROR', 400);
    this.name = 'RelationError';
    Object.setPrototypeOf(this, RelationError.prototype);
  }
}

export class QuerySyntaxError extends WorkError {
  constructor(query: string, reason: string) {
    super(
      `Query syntax error in "${query}": ${reason}`,
      'QUERY_SYNTAX_ERROR',
      400
    );
    this.name = 'QuerySyntaxError';
    Object.setPrototypeOf(this, QuerySyntaxError.prototype);
  }
}

export class UnsupportedOperatorError extends WorkError {
  constructor(operator: string) {
    super(`Unsupported operator: ${operator}`, 'UNSUPPORTED_OPERATOR', 400);
    this.name = 'UnsupportedOperatorError';
    Object.setPrototypeOf(this, UnsupportedOperatorError.prototype);
  }
}

export class InvalidDateError extends WorkError {
  constructor(dateString: string) {
    super(
      `Invalid date format: ${dateString}. Expected ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)`,
      'INVALID_DATE',
      400
    );
    this.name = 'InvalidDateError';
    Object.setPrototypeOf(this, InvalidDateError.prototype);
  }
}
