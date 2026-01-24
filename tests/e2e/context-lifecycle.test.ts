import { execSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Context Lifecycle E2E', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    testDir = mkdtempSync(join(tmpdir(), 'work-e2e-'));
    process.chdir(testDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should handle context commands without persistence', () => {
    const binPath = join(originalCwd, 'bin/run.js');

    // Test context add (should work but not persist)
    const addOutput = execSync(
      `node ${binPath} context add test-ctx --tool local-fs --path ./work-items`,
      { encoding: 'utf8' }
    );
    expect(addOutput).toContain('Added context');

    // Test context list (should show default context due to auto-creation)
    const listOutput = execSync(`node ${binPath} context list`, {
      encoding: 'utf8',
    });
    expect(listOutput).toContain('default');
    expect(listOutput).toContain('Total: 1 contexts');

    // Test context show with non-existent context (should fail gracefully)
    expect(() => {
      execSync(`node ${binPath} context show test-ctx`, { stdio: 'pipe' });
    }).toThrow();

    // Test context remove with non-existent context (should fail gracefully)
    expect(() => {
      execSync(`node ${binPath} context remove test-ctx`, { stdio: 'pipe' });
    }).toThrow();
  });
});
