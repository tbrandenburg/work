/**
 * Query parsing and execution
 */

import { WorkItem } from '../types/index.js';
import {
  InvalidQueryError,
  QuerySyntaxError,
  UnsupportedOperatorError,
  InvalidDateError,
} from '../types/errors.js';

export interface QueryOptions {
  where?: QueryCondition | string | undefined; // Temporary: support both old and new
  orderBy?: string | undefined;
  limit?: number | undefined;
}

export type ComparisonOperator = '=' | '!=' | '>' | '<' | '>=' | '<=';

export type LogicalOperator = 'AND' | 'OR' | 'NOT';

export interface QueryCondition {
  readonly type: 'comparison' | 'logical';
}

export interface ComparisonCondition extends QueryCondition {
  readonly type: 'comparison';
  readonly field: string;
  readonly operator: ComparisonOperator;
  readonly value: string | number | Date;
}

export interface LogicalCondition extends QueryCondition {
  readonly type: 'logical';
  readonly operator: LogicalOperator;
  readonly left?: QueryCondition;
  readonly right?: QueryCondition;
  readonly operand?: QueryCondition; // For NOT operator
}

export type TokenType =
  | 'FIELD'
  | 'OPERATOR'
  | 'VALUE'
  | 'LOGICAL'
  | 'LPAREN'
  | 'RPAREN'
  | 'EOF';

export interface Token {
  readonly type: TokenType;
  readonly value: string;
  readonly position: number;
}

/**
 * Tokenize a query string into tokens for parsing
 */
function tokenizeQuery(query: string): Token[] {
  const tokens: Token[] = [];
  let position = 0;

  while (position < query.length) {
    const char = query[position];
    if (!char) break; // Safety check

    // Skip whitespace
    if (/\s/.test(char)) {
      position++;
      continue;
    }

    // Handle operators (check longer operators first)
    if (position < query.length - 1) {
      const twoChar = query.slice(position, position + 2);
      if (['>=', '<=', '!='].includes(twoChar)) {
        tokens.push({ type: 'OPERATOR', value: twoChar, position });
        position += 2;
        continue;
      }
    }

    // Handle single character operators
    if (['=', '>', '<'].includes(char)) {
      tokens.push({ type: 'OPERATOR', value: char, position });
      position++;
      continue;
    }

    // Handle parentheses
    if (char === '(') {
      tokens.push({ type: 'LPAREN', value: '(', position });
      position++;
      continue;
    }

    if (char === ')') {
      tokens.push({ type: 'RPAREN', value: ')', position });
      position++;
      continue;
    }

    // Handle quoted strings
    if (char === '"' || char === "'") {
      const quote = char;
      let value = '';
      position++; // Skip opening quote

      while (position < query.length && query[position] !== quote) {
        const currentChar = query[position];
        if (!currentChar) break;

        if (currentChar === '\\' && position + 1 < query.length) {
          // Handle escape sequences
          position++;
          const nextChar = query[position];
          if (nextChar) {
            value += nextChar;
          }
        } else {
          value += currentChar;
        }
        position++;
      }

      if (position < query.length) {
        position++; // Skip closing quote
      }

      tokens.push({
        type: 'VALUE',
        value,
        position: position - value.length - 2,
      });
      continue;
    }

    // Handle words (fields, values, logical operators)
    let word = '';
    const startPos = position;

    while (
      position < query.length &&
      /[a-zA-Z0-9_.:T-]/.test(query[position] || '')
    ) {
      const wordChar = query[position];
      if (!wordChar) break;
      word += wordChar;
      position++;
    }

    if (word) {
      // Check if it's a logical operator
      if (['AND', 'OR', 'NOT'].includes(word.toUpperCase())) {
        tokens.push({
          type: 'LOGICAL',
          value: word.toUpperCase(),
          position: startPos,
        });
      } else {
        // Determine if it's a field or value based on context
        const lastToken = tokens[tokens.length - 1];
        if (lastToken && lastToken.type === 'OPERATOR') {
          tokens.push({ type: 'VALUE', value: word, position: startPos });
        } else {
          tokens.push({ type: 'FIELD', value: word, position: startPos });
        }
      }
      continue;
    }

    // Skip unknown characters
    position++;
  }

  tokens.push({ type: 'EOF', value: '', position });
  return tokens;
}

/**
 * Parse a where clause into a QueryCondition AST
 * Implements recursive descent parser for logical expressions
 */
function parseWhereClause(whereClause: string): QueryCondition {
  const tokens = tokenizeQuery(whereClause);
  let position = 0;

  function currentToken(): Token {
    return (
      tokens[position] || {
        type: 'EOF',
        value: '',
        position: whereClause.length,
      }
    );
  }

  function consumeToken(): Token {
    const token = currentToken();
    position++;
    return token;
  }

  function parseExpression(): QueryCondition {
    return parseOrExpression();
  }

  function parseOrExpression(): QueryCondition {
    let left = parseAndExpression();

    while (currentToken().type === 'LOGICAL' && currentToken().value === 'OR') {
      consumeToken(); // consume OR
      const right = parseAndExpression();
      left = {
        type: 'logical',
        operator: 'OR',
        left,
        right,
      } as LogicalCondition;
    }

    return left;
  }

  function parseAndExpression(): QueryCondition {
    let left = parseNotExpression();

    while (
      currentToken().type === 'LOGICAL' &&
      currentToken().value === 'AND'
    ) {
      consumeToken(); // consume AND
      const right = parseNotExpression();
      left = {
        type: 'logical',
        operator: 'AND',
        left,
        right,
      } as LogicalCondition;
    }

    return left;
  }

  function parseNotExpression(): QueryCondition {
    if (currentToken().type === 'LOGICAL' && currentToken().value === 'NOT') {
      consumeToken(); // consume NOT
      const operand = parseComparisonExpression();
      return {
        type: 'logical',
        operator: 'NOT',
        operand,
      } as LogicalCondition;
    }

    return parseComparisonExpression();
  }

  function parseComparisonExpression(): QueryCondition {
    // Handle parentheses
    if (currentToken().type === 'LPAREN') {
      consumeToken(); // consume (
      const expr = parseExpression();
      if (currentToken().type !== 'RPAREN') {
        throw new QuerySyntaxError(
          whereClause,
          `Expected ')' at position ${currentToken().position}`
        );
      }
      consumeToken(); // consume )
      return expr;
    }

    // Parse field operator value
    const fieldToken = currentToken();
    if (fieldToken.type !== 'FIELD') {
      throw new QuerySyntaxError(
        whereClause,
        `Expected field name at position ${fieldToken.position}`
      );
    }
    consumeToken();

    const operatorToken = currentToken();
    if (operatorToken.type !== 'OPERATOR') {
      throw new QuerySyntaxError(
        whereClause,
        `Expected operator at position ${operatorToken.position}`
      );
    }

    const operator = operatorToken.value as ComparisonOperator;
    if (!['=', '!=', '>', '<', '>=', '<='].includes(operator)) {
      throw new UnsupportedOperatorError(operator);
    }
    consumeToken();

    const valueToken = currentToken();
    if (valueToken.type !== 'VALUE') {
      throw new QuerySyntaxError(
        whereClause,
        `Expected value at position ${valueToken.position}`
      );
    }
    consumeToken();

    return {
      type: 'comparison',
      field: fieldToken.value,
      operator,
      value: parseValue(valueToken.value),
    } as ComparisonCondition;
  }

  const result = parseExpression();

  // Ensure we consumed all tokens except EOF
  if (currentToken().type !== 'EOF') {
    throw new QuerySyntaxError(
      whereClause,
      `Unexpected token '${currentToken().value}' at position ${currentToken().position}`
    );
  }

  return result;
}

/**
 * Parse a value string into appropriate type (string, number, or Date)
 * Supports ISO 8601 date format (YYYY-MM-DD, YYYY-MM-DDTHH:mm:ss)
 */
function parseValue(value: string): string | number | Date {
  // Handle priority values specially
  if (['critical', 'high', 'medium', 'low'].includes(value)) {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return priorityOrder[value as keyof typeof priorityOrder] || 0;
  }

  // Try to parse as number first
  const numValue = Number(value);
  if (!isNaN(numValue) && isFinite(numValue)) {
    return numValue;
  }

  // Try to parse as ISO 8601 date
  if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/.test(value)) {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new InvalidDateError(value);
    }
    return date;
  }

  // Return as string
  return value;
}

/**
 * Evaluate a QueryCondition against a WorkItem
 * Recursively walks the AST tree and applies conditions
 */
function evaluateCondition(condition: QueryCondition, item: WorkItem): boolean {
  if (condition.type === 'comparison') {
    const comp = condition as ComparisonCondition;
    const fieldValue = getFieldValue(item, comp.field);
    const conditionValue = comp.value;

    // Convert both values to the same type for comparison
    if (conditionValue instanceof Date && typeof fieldValue === 'string') {
      // Convert string field value to Date for date comparisons
      const fieldDate = new Date(fieldValue);
      if (!isNaN(fieldDate.getTime())) {
        return compareValues(fieldDate, conditionValue, comp.operator);
      }
    } else if (
      typeof conditionValue === 'string' &&
      fieldValue instanceof Date
    ) {
      // Convert condition value to Date if field is Date
      const conditionDate = new Date(conditionValue);
      if (!isNaN(conditionDate.getTime())) {
        return compareValues(fieldValue, conditionDate, comp.operator);
      }
    }

    return compareValues(fieldValue, conditionValue, comp.operator);
  } else if (condition.type === 'logical') {
    const logical = condition as LogicalCondition;

    switch (logical.operator) {
      case 'AND':
        return logical.left && logical.right
          ? evaluateCondition(logical.left, item) &&
              evaluateCondition(logical.right, item)
          : false;
      case 'OR':
        return logical.left && logical.right
          ? evaluateCondition(logical.left, item) ||
              evaluateCondition(logical.right, item)
          : false;
      case 'NOT':
        return logical.operand
          ? !evaluateCondition(logical.operand, item)
          : false;
      default:
        throw new UnsupportedOperatorError(logical.operator);
    }
  }

  return false;
}

/**
 * Compare two values using the specified operator
 */
function compareValues(
  fieldValue: string | number | Date,
  conditionValue: string | number | Date,
  operator: ComparisonOperator
): boolean {
  switch (operator) {
    case '=':
      return fieldValue === conditionValue;
    case '!=':
      return fieldValue !== conditionValue;
    case '>':
      return fieldValue > conditionValue;
    case '<':
      return fieldValue < conditionValue;
    case '>=':
      return fieldValue >= conditionValue;
    case '<=':
      return fieldValue <= conditionValue;
    default:
      throw new UnsupportedOperatorError(operator);
  }
}

/**
 * Get field value from WorkItem with proper type conversion
 */
function getFieldValue(item: WorkItem, field: string): string | number | Date {
  switch (field) {
    case 'id':
      return item.id;
    case 'title':
      return item.title;
    case 'description':
      return item.description || '';
    case 'state':
      return item.state;
    case 'kind':
      return item.kind;
    case 'priority': {
      // Priority ordering: critical > high > medium > low
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[item.priority] || 0;
    }
    case 'assignee':
      return item.assignee || '';
    case 'agent':
      return item.agent || '';
    case 'createdAt':
      return item.createdAt; // Return as string, conversion handled in evaluateCondition
    case 'updatedAt':
      return item.updatedAt; // Return as string, conversion handled in evaluateCondition
    case 'label':
      // For labels, we need special handling in the comparison
      return item.labels.join(',');
    default:
      return '';
  }
}

/**
 * Parse a query string with enhanced where clause support
 * Supports: comparison operators (>, <, >=, <=, !=), logical operators (AND, OR, NOT)
 */
export function parseQuery(query: string): QueryOptions {
  const options: QueryOptions = {};

  if (!query.trim()) {
    return options;
  }

  // Enhanced parsing with support for logical operators
  const parts = query.split(/\s+/);

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (part === 'where' && i + 1 < parts.length) {
      // Find the end of the where clause (before 'order' or 'limit')
      let whereEnd = parts.length;
      for (let j = i + 1; j < parts.length; j++) {
        if (parts[j] === 'order' || parts[j] === 'limit') {
          whereEnd = j;
          break;
        }
      }

      const whereClause = parts.slice(i + 1, whereEnd).join(' ');

      // Check if it contains advanced operators or patterns - if so, use new parser
      const hasLogicalOps =
        whereClause.includes(' AND ') ||
        whereClause.includes(' OR ') ||
        whereClause.startsWith('NOT ');
      const hasComparisonOps =
        whereClause.includes('>=') ||
        whereClause.includes('<=') ||
        whereClause.includes('!=') ||
        (whereClause.includes('>') && !whereClause.includes('>=')) ||
        (whereClause.includes('<') && !whereClause.includes('<='));
      const hasDatePattern = /\d{4}-\d{2}-\d{2}/.test(whereClause);
      const hasPriorityComparison = /priority[><=!]+/.test(whereClause);
      const hasQuotedStrings =
        whereClause.includes('"') || whereClause.includes("'");

      if (
        hasLogicalOps ||
        hasComparisonOps ||
        hasDatePattern ||
        hasPriorityComparison ||
        hasQuotedStrings
      ) {
        // Use enhanced parser for complex queries
        options.where = parseWhereClause(whereClause);
      } else {
        // Simple case - use as string for backward compatibility
        options.where = whereClause;
      }

      i = whereEnd - 1; // Continue parsing from after where clause
    } else if (
      part === 'order' &&
      i + 2 < parts.length &&
      parts[i + 1] === 'by'
    ) {
      const orderField = parts[i + 2];
      if (orderField && orderField.trim()) {
        options.orderBy = orderField;
        i += 2; // Skip the next two parts
      }
    } else if (part === 'limit' && i + 1 < parts.length) {
      const limitStr = parts[i + 1];
      if (limitStr && limitStr.trim()) {
        const limitValue = parseInt(limitStr, 10);
        if (isNaN(limitValue) || limitValue <= 0) {
          throw new InvalidQueryError(query, 'Invalid limit value');
        }
        options.limit = limitValue;
        i++; // Skip the next part
      }
    } else if (part && part.includes('=')) {
      // Direct where clause without 'where' keyword
      // Check if it contains advanced operators
      if (
        part.includes('>=') ||
        part.includes('<=') ||
        part.includes('!=') ||
        part.includes('>') ||
        part.includes('<')
      ) {
        // Use enhanced parser for comparison operators
        options.where = parseWhereClause(part);
      } else {
        options.where = part;
      }
    }
  }

  return options;
}

/**
 * Execute a query against work items
 */
export function executeQuery(
  workItems: WorkItem[],
  options: QueryOptions
): WorkItem[] {
  let results = [...workItems];

  // Apply where clause
  if (options.where) {
    if (typeof options.where === 'string') {
      results = filterWorkItems(results, options.where);
    } else {
      // Use new QueryCondition evaluation
      results = results.filter(item =>
        evaluateCondition(options.where as QueryCondition, item)
      );
    }
  }

  // Apply ordering
  if (options.orderBy) {
    results = orderWorkItems(results, options.orderBy);
  }

  // Apply limit
  if (options.limit) {
    results = results.slice(0, options.limit);
  }

  return results;
}

/**
 * Filter work items based on a where clause
 */
function filterWorkItems(
  workItems: WorkItem[],
  whereClause: string
): WorkItem[] {
  const conditions = whereClause.split(',').map(c => c.trim());

  return workItems.filter(item => {
    return conditions.every(condition => {
      const [field, value] = condition.split('=').map(s => s.trim());

      if (!field || !value) {
        return true; // Skip invalid conditions
      }

      switch (field) {
        case 'state':
          return item.state === value;
        case 'kind':
          return item.kind === value;
        case 'priority':
          return item.priority === value;
        case 'assignee':
          return item.assignee === value;
        case 'agent':
          return item.agent === value;
        case 'id':
          return item.id === value;
        default:
          // Check labels
          if (field === 'label') {
            return item.labels.includes(value);
          }
          return true; // Unknown field, don't filter
      }
    });
  });
}

/**
 * Order work items based on a field
 */
function orderWorkItems(workItems: WorkItem[], orderBy: string): WorkItem[] {
  const [field, direction = 'asc'] = orderBy.split(':');
  const isDesc = direction.toLowerCase() === 'desc';

  return workItems.sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (field) {
      case 'id':
        aValue = a.id;
        bValue = b.id;
        break;
      case 'title':
        aValue = a.title;
        bValue = b.title;
        break;
      case 'state':
        aValue = a.state;
        bValue = b.state;
        break;
      case 'kind':
        aValue = a.kind;
        bValue = b.kind;
        break;
      case 'priority': {
        // Priority ordering: critical > high > medium > low
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        aValue = priorityOrder[a.priority];
        bValue = priorityOrder[b.priority];
        break;
      }
      case 'createdAt':
        aValue = a.createdAt;
        bValue = b.createdAt;
        break;
      case 'updatedAt':
        aValue = a.updatedAt;
        bValue = b.updatedAt;
        break;
      default:
        return 0; // Unknown field, no ordering
    }

    if (aValue < bValue) {
      return isDesc ? 1 : -1;
    }
    if (aValue > bValue) {
      return isDesc ? -1 : 1;
    }
    return 0;
  });
}
