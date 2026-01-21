import { execSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Schema Kinds Command Integration', () => {
  let testDir: string;
  let originalCwd: string;
  let binPath: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    testDir = mkdtempSync(join(tmpdir(), 'work-schema-kinds-'));
    process.chdir(testDir);
    binPath = join(originalCwd, 'bin/run.js');
    
    // Create .work directory structure for default context
    execSync('mkdir -p .work/projects/default', { stdio: 'pipe' });
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should list work item kinds in table format', () => {
    const result = execSync(`node ${binPath} schema kinds`, { encoding: 'utf8' });
    expect(result).toContain('Available Work Item Kinds (4):');
    expect(result).toContain('• task');
    expect(result).toContain('• bug');
    expect(result).toContain('• feature');
    expect(result).toContain('• epic');
  });

  it('should list kinds in JSON format', () => {
    const result = execSync(`node ${binPath} schema kinds --format json`, { encoding: 'utf8' });
    const parsed = JSON.parse(result);
    expect(parsed).toContain('task');
    expect(parsed).toContain('bug');
    expect(parsed).toContain('feature');
    expect(parsed).toContain('epic');
  });

  it('should handle error when getting kinds', () => {
    // Test error handling branch with invalid context
    expect(() => {
      execSync(`node ${binPath} schema kinds nonexistent`, { encoding: 'utf8', stdio: 'pipe' });
    }).toThrow();
  });

  it('should handle context argument branch', () => {
    // Test the if (args.context) branch - this will trigger the branch
    // even though it fails, which is what we want for coverage
    expect(() => {
      execSync(`node ${binPath} schema kinds nonexistent-context`, { encoding: 'utf8', stdio: 'pipe' });
    }).toThrow();
  });
});
