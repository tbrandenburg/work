import { WorkEngine } from '../../../src/core/index';

describe('Core Index', () => {
  it('should export WorkEngine', () => {
    expect(WorkEngine).toBeDefined();
    const engine = new WorkEngine();
    expect(engine).toBeInstanceOf(WorkEngine);
  });
});
