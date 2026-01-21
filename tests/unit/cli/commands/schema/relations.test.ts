import { execSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Schema Relations Command Integration', () => {
  let testDir: string;
  let originalCwd: string;
  let binPath: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    testDir = mkdtempSync(join(tmpdir(), 'work-schema-relations-'));
    process.chdir(testDir);
    binPath = join(originalCwd, 'bin/run.js');
    
    // Create .work directory structure for default context
    execSync('mkdir -p .work/projects/default', { stdio: 'pipe' });
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should list relation types in table format', () => {
    const result = execSync(`node ${binPath} schema relations`, { encoding: 'utf8' });
    expect(result).toContain('Available Relation Types (4):');
    expect(result).toContain('• blocks');
    expect(result).toContain('• parent_of');
    expect(result).toContain('• duplicates');
    expect(result).toContain('• relates_to');
  });

  it('should list relations in JSON format', () => {
    const result = execSync(`node ${binPath} schema relations --format json`, { encoding: 'utf8' });
    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(4);
    expect(parsed[0].name).toBe('blocks');
    expect(parsed[0].allowedFromKinds).toContain('task');
  });

  it('should handle error when getting relations', () => {
    // Test error handling branch with invalid context
    expect(() => {
      execSync(`node ${binPath} schema relations nonexistent`, { encoding: 'utf8', stdio: 'pipe' });
    }).toThrow();
  });
});
