/**
 * Graph operations and validation
 */

import { WorkItem, Relation, RelationError } from '../types/index.js';

/**
 * Validate a relation to ensure it follows graph invariants
 */
export function validateRelation(
  relation: Relation,
  workItems: WorkItem[]
): void {
  const { from, to, type } = relation;

  // Check that both work items exist
  const fromItem = workItems.find(item => item.id === from);
  const toItem = workItems.find(item => item.id === to);

  if (!fromItem) {
    throw new RelationError(`Source work item not found: ${from}`);
  }

  if (!toItem) {
    throw new RelationError(`Target work item not found: ${to}`);
  }

  // Prevent self-references
  if (from === to) {
    throw new RelationError('Work item cannot have a relation to itself');
  }

  // Validate relation type constraints
  switch (type) {
    case 'parent_of':
      // Parent cannot be a task if child is an epic
      if (fromItem.kind === 'task' && toItem.kind === 'epic') {
        throw new RelationError('Task cannot be parent of epic');
      }
      break;

    case 'child_of':
      // Child cannot be an epic if parent is a task
      if (fromItem.kind === 'epic' && toItem.kind === 'task') {
        throw new RelationError('Epic cannot be child of task');
      }
      break;

    case 'blocks':
    case 'blocked_by':
    case 'duplicates':
    case 'duplicate_of':
    case 'relates_to':
      // These relations have no special constraints
      break;

    default:
      throw new RelationError(`Unknown relation type: ${type as string}`);
  }
}

/**
 * Detect cycles in parent/child relationships
 */
export function detectCycles(
  relations: Relation[],
  newRelation?: Relation
): boolean {
  const allRelations = newRelation ? [...relations, newRelation] : relations;

  // Build adjacency list for parent_of relations
  const graph = new Map<string, string[]>();

  for (const relation of allRelations) {
    if (relation.type === 'parent_of') {
      const children = graph.get(relation.from) || [];
      children.push(relation.to);
      graph.set(relation.from, children);
    }
  }

  // DFS to detect cycles
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCycleDFS(node: string): boolean {
    if (recursionStack.has(node)) {
      return true; // Back edge found - cycle detected
    }

    if (visited.has(node)) {
      return false; // Already processed
    }

    visited.add(node);
    recursionStack.add(node);

    const children = graph.get(node) || [];
    for (const child of children) {
      if (hasCycleDFS(child)) {
        return true;
      }
    }

    recursionStack.delete(node);
    return false;
  }

  // Check all nodes
  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      if (hasCycleDFS(node)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Build a graph slice containing work items and their relations
 */
export function buildGraphSlice(
  workItems: WorkItem[],
  relations: Relation[]
): {
  items: WorkItem[];
  relations: Relation[];
} {
  // For now, return all items and relations
  // In the future, this could be optimized to return only relevant subsets
  return {
    items: [...workItems],
    relations: [...relations],
  };
}

/**
 * Get all work items related to a specific item
 */
export function getRelatedItems(
  workItemId: string,
  workItems: WorkItem[],
  relations: Relation[]
): WorkItem[] {
  const relatedIds = new Set<string>();

  // Find all directly related items
  for (const relation of relations) {
    if (relation.from === workItemId) {
      relatedIds.add(relation.to);
    } else if (relation.to === workItemId) {
      relatedIds.add(relation.from);
    }
  }

  // Return the work items
  return workItems.filter(item => relatedIds.has(item.id));
}
