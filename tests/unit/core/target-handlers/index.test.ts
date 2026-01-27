/**
 * Unit tests for target-handlers index exports
 */

import { describe, it, expect } from 'vitest';
import {
  BashTargetHandler,
  TelegramTargetHandler,
} from '../../../../src/core/target-handlers/index.js';

describe('Target Handlers Index', () => {
  it('should export BashTargetHandler', () => {
    expect(BashTargetHandler).toBeDefined();
    expect(typeof BashTargetHandler).toBe('function');
    expect(BashTargetHandler.name).toBe('BashTargetHandler');
  });

  it('should export TelegramTargetHandler', () => {
    expect(TelegramTargetHandler).toBeDefined();
    expect(typeof TelegramTargetHandler).toBe('function');
    expect(TelegramTargetHandler.name).toBe('TelegramTargetHandler');
  });

  it('should export correct constructors', () => {
    // Test that these are actual constructors by checking prototype
    expect(BashTargetHandler.prototype).toBeDefined();
    expect(BashTargetHandler.prototype.constructor).toBe(BashTargetHandler);

    expect(TelegramTargetHandler.prototype).toBeDefined();
    expect(TelegramTargetHandler.prototype.constructor).toBe(
      TelegramTargetHandler
    );
  });
});
