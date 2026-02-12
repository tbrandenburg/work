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

export class ACPError extends WorkError {
  constructor(
    message: string,
    code: string = 'ACP_ERROR',
    statusCode: number = 500
  ) {
    super(message, code, statusCode);
    this.name = 'ACPError';
    Object.setPrototypeOf(this, ACPError.prototype);
  }
}

export class ACPTimeoutError extends ACPError {
  constructor(timeout: number) {
    super(`ACP process timed out after ${timeout} seconds`, 'ACP_TIMEOUT', 408);
    this.name = 'ACPTimeoutError';
    Object.setPrototypeOf(this, ACPTimeoutError.prototype);
  }
}

export class ACPInitError extends ACPError {
  constructor(message: string) {
    super(
      `Failed to initialize ACP connection: ${message}`,
      'ACP_INIT_ERROR',
      500
    );
    this.name = 'ACPInitError';
    Object.setPrototypeOf(this, ACPInitError.prototype);
  }
}

export class ACPSessionError extends ACPError {
  constructor(message: string) {
    super(`ACP session error: ${message}`, 'ACP_SESSION_ERROR', 500);
    this.name = 'ACPSessionError';
    Object.setPrototypeOf(this, ACPSessionError.prototype);
  }
}

// Team-specific error classes
export class TeamNotFoundError extends WorkError {
  constructor(name: string) {
    super(`Team not found: ${name}`, 'TEAM_NOT_FOUND', 404);
    this.name = 'TeamNotFoundError';
    Object.setPrototypeOf(this, TeamNotFoundError.prototype);
  }
}

export class AgentNotFoundError extends WorkError {
  constructor(teamName: string, agentName: string) {
    super(`Agent not found: ${teamName}/${agentName}`, 'AGENT_NOT_FOUND', 404);
    this.name = 'AgentNotFoundError';
    Object.setPrototypeOf(this, AgentNotFoundError.prototype);
  }
}

export class HumanNotFoundError extends WorkError {
  constructor(teamName: string, humanName: string) {
    super(`Human not found: ${teamName}/${humanName}`, 'HUMAN_NOT_FOUND', 404);
    this.name = 'HumanNotFoundError';
    Object.setPrototypeOf(this, HumanNotFoundError.prototype);
  }
}

export class MemberNotFoundError extends WorkError {
  constructor(teamName: string, memberName: string) {
    super(
      `Member not found: ${teamName}/${memberName}`,
      'MEMBER_NOT_FOUND',
      404
    );
    this.name = 'MemberNotFoundError';
    Object.setPrototypeOf(this, MemberNotFoundError.prototype);
  }
}

export class TeamValidationError extends WorkError {
  constructor(message: string) {
    super(`Team validation failed: ${message}`, 'TEAM_VALIDATION_ERROR', 400);
    this.name = 'TeamValidationError';
    Object.setPrototypeOf(this, TeamValidationError.prototype);
  }
}

export class WorkflowNotFoundError extends WorkError {
  constructor(teamName: string, agentName: string, workflowId: string) {
    super(
      `Workflow not found: ${teamName}/${agentName}/${workflowId}`,
      'WORKFLOW_NOT_FOUND',
      404
    );
    this.name = 'WorkflowNotFoundError';
    Object.setPrototypeOf(this, WorkflowNotFoundError.prototype);
  }
}
