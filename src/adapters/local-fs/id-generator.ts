/**
 * Work item ID generation with sequential numbering
 */

import { promises as fs } from 'fs';
import path from 'path';
import { WorkItemKind } from '../../types/index.js';
import { ensureWorkDir } from './storage.js';

const ID_COUNTER_FILE = 'id-counter.json';

interface IdCounters {
  task: number;
  bug: number;
  epic: number;
  story: number;
}

const DEFAULT_COUNTERS: IdCounters = {
  task: 0,
  bug: 0,
  epic: 0,
  story: 0,
};

export async function generateId(kind: WorkItemKind, workDir: string): Promise<string> {
  // Ensure the work directory exists before any file operations
  await ensureWorkDir(workDir);
  
  const counterPath = path.join(workDir, ID_COUNTER_FILE);
  
  let counters: IdCounters;
  
  try {
    const data = await fs.readFile(counterPath, 'utf-8');
    counters = { ...DEFAULT_COUNTERS, ...(JSON.parse(data) as Partial<IdCounters>) };
  } catch (error) {
    // File doesn't exist or is invalid, start with defaults
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      counters = { ...DEFAULT_COUNTERS };
    } else {
      throw error;
    }
  }
  
  // Increment counter for this kind
  counters[kind] += 1;
  
  // Save updated counters
  await fs.writeFile(counterPath, JSON.stringify(counters, null, 2));
  
  // Generate ID with format: KIND-NNN (e.g., TASK-001, BUG-042)
  const prefix = kind.toUpperCase();
  const number = counters[kind].toString().padStart(3, '0');
  
  return `${prefix}-${number}`;
}
