import { execSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Auth Logout Command Integration', () => {
  let testDir: string;
  let originalCwd: string;
  let binPath: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    testDir = mkdtempSync(join(tmpdir(), 'work-auth-logout-'));
    process.chdir(testDir);
    binPath = join(originalCwd, 'bin/run.js');
    
    // Create .work directory structure for default context
    execSync('mkdir -p .work/projects/default', { stdio: 'pipe' });
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should logout successfully with default context', () => {
    const result = execSync(`node ${binPath} auth logout`, { encoding: 'utf8' });
    expect(result).toContain('✅ Logout successful');
  });

  it('should handle logout error', () => {
    // Test error handling branch with invalid context
    expect(() => {
      execSync(`node ${binPath} auth logout nonexistent`, { encoding: 'utf8', stdio: 'pipe' });
    }).toThrow();
  });
});
