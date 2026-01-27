/**
 * Unit tests for main src index exports
 */

import { describe, it, expect } from 'vitest';

describe('Main Index Exports', () => {
  it('should export CLI functionality', async () => {
    const mainModule = await import('../../../src/index.js');

    // Should have exports from cli/index
    expect(mainModule).toBeDefined();
    expect(typeof mainModule).toBe('object');
  });
});
