/**
 * Query parsing and execution
 */

import { WorkItem, InvalidQueryError } from '../types/index.js';

export interface QueryOptions {
  where?: string | undefined;
  orderBy?: string | undefined;
  limit?: number | undefined;
}

/**
 * Parse a simple where clause query
 * Supports: state=new, kind=task, priority=high, assignee=user
 */
export function parseQuery(query: string): QueryOptions {
  const options: QueryOptions = {};
  
  if (!query.trim()) {
    return options;
  }
  
  // Simple parsing for now - can be enhanced with a proper parser later
  const parts = query.split(/\s+/);
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    
    if (part === 'where' && i + 1 < parts.length) {
      const nextPart = parts[i + 1];
      if (nextPart) {
        options.where = nextPart;
        i++; // Skip the next part as it's consumed
      }
    } else if (part === 'order' && i + 2 < parts.length && parts[i + 1] === 'by') {
      const orderField = parts[i + 2];
      if (orderField) {
        options.orderBy = orderField;
        i += 2; // Skip the next two parts
      }
    } else if (part === 'limit' && i + 1 < parts.length) {
      const limitStr = parts[i + 1];
      if (limitStr) {
        const limitValue = parseInt(limitStr, 10);
        if (isNaN(limitValue) || limitValue <= 0) {
          throw new InvalidQueryError(query, 'Invalid limit value');
        }
        options.limit = limitValue;
        i++; // Skip the next part
      }
    } else if (part && part.includes('=')) {
      // Direct where clause without 'where' keyword
      options.where = part;
    }
  }
  
  return options;
}

/**
 * Execute a query against work items
 */
export function executeQuery(workItems: WorkItem[], options: QueryOptions): WorkItem[] {
  let results = [...workItems];
  
  // Apply where clause
  if (options.where) {
    results = filterWorkItems(results, options.where);
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
function filterWorkItems(workItems: WorkItem[], whereClause: string): WorkItem[] {
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
