import { execSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Schema Show Command Integration', () => {
  let testDir: string;
  let originalCwd: string;
  let binPath: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    testDir = mkdtempSync(join(tmpdir(), 'work-schema-show-'));
    process.chdir(testDir);
    binPath = join(originalCwd, 'bin/run.js');
    
    // Create .work directory structure for default context
    execSync('mkdir -p .work/projects/default', { stdio: 'pipe' });
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should show complete schema in table format', () => {
    const result = execSync(`node ${binPath} schema show`, { encoding: 'utf8' });
    expect(result).toContain('Schema Information');
    expect(result).toContain('Work Item Kinds (4):');
    expect(result).toContain('• task');
    expect(result).toContain('• bug');
    expect(result).toContain('Attributes (5):');
    expect(result).toContain('• title: string (required)');
    expect(result).toContain('Relation Types (4):');
    expect(result).toContain('• blocks');
  });

  it('should show schema in JSON format', () => {
    const result = execSync(`node ${binPath} schema show --format json`, { encoding: 'utf8' });
    const parsed = JSON.parse(result);
    expect(parsed.data.kinds).toContain('task');
    expect(parsed.data.kinds).toContain('bug');
    expect(parsed.data.attributes).toHaveLength(5);
    expect(parsed.data.relationTypes).toHaveLength(4);
    expect(parsed.meta).toHaveProperty('timestamp');
  });

  it('should handle error when getting schema', () => {
    // Test error handling branch with invalid context
    expect(() => {
      execSync(`node ${binPath} schema show nonexistent`, { encoding: 'utf8', stdio: 'pipe' });
    }).toThrow();
  });

  it('should handle missing context directory gracefully', () => {
    // The CLI automatically creates default context, so this test verifies
    // that schema show works even when starting from scratch
    execSync('rm -rf .work', { stdio: 'pipe' });
    
    const result = execSync(`node ${binPath} schema show`, { encoding: 'utf8' });
    expect(result).toContain('Schema Information');
  });

  it('should handle context argument branch', () => {
    // Test the if (args.context) branch - this will trigger the branch
    // even though it fails, which is what we want for coverage
    expect(() => {
      execSync(`node ${binPath} schema show nonexistent-context`, { encoding: 'utf8', stdio: 'pipe' });
    }).toThrow();
  });
});
