import { execSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Auth Status Command Integration', () => {
  let testDir: string;
  let originalCwd: string;
  let binPath: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    testDir = mkdtempSync(join(tmpdir(), 'work-auth-status-'));
    process.chdir(testDir);
    binPath = join(originalCwd, 'bin/run.js');
    
    // Create .work directory structure for default context
    execSync('mkdir -p .work/projects/default', { stdio: 'pipe' });
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should show auth status in table format', () => {
    const result = execSync(`node ${binPath} auth status`, { encoding: 'utf8' });
    expect(result).toContain('Authentication Status');
    expect(result).toContain('State:  authenticated');
    expect(result).toContain('User:   local-user');
  });

  it('should show auth status in JSON format', () => {
    const result = execSync(`node ${binPath} auth status --format json`, { encoding: 'utf8' });
    const parsed = JSON.parse(result);
    expect(parsed.state).toBe('authenticated');
    expect(parsed.user).toBe('local-user');
  });

  it('should handle error when getting auth status', () => {
    // Test error handling branch with invalid context
    expect(() => {
      execSync(`node ${binPath} auth status nonexistent`, { encoding: 'utf8', stdio: 'pipe' });
    }).toThrow();
  });

  it('should handle invalid format option', () => {
    expect(() => {
      execSync(`node ${binPath} auth status --format invalid`, { stdio: 'pipe' });
    }).toThrow();
  });
});
