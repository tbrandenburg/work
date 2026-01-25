import { execSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Notify Send Command', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    testDir = mkdtempSync(join(tmpdir(), 'work-notify-send-'));
    process.chdir(testDir);
    execSync('mkdir -p .work/projects/default', { stdio: 'pipe' });
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should validate command structure', () => {
    const binPath = join(originalCwd, 'bin/run.js');

    expect(() => {
      execSync(`node ${binPath} notify send invalid query to target`, {
        stdio: 'pipe',
      });
    }).toThrow();
  });

  it('should validate "to" keyword', () => {
    const binPath = join(originalCwd, 'bin/run.js');

    expect(() => {
      execSync(`node ${binPath} notify send where state=new invalid target`, {
        stdio: 'pipe',
      });
    }).toThrow();
  });

  it('should handle missing target gracefully', () => {
    const binPath = join(originalCwd, 'bin/run.js');

    expect(() => {
      execSync(`node ${binPath} notify send where state=new to nonexistent`, {
        stdio: 'pipe',
      });
    }).toThrow();
  });

  it('should show help when requested', () => {
    const binPath = join(originalCwd, 'bin/run.js');

    const output = execSync(`node ${binPath} notify send --help`, {
      encoding: 'utf8',
    });
    expect(output).toContain('Send work item notifications');
    expect(output).toContain('where');
    expect(output).toContain('to');
  });
});
