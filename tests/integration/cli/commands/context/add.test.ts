import { execSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Context Add Command Integration', () => {
  let testDir: string;
  let originalCwd: string;
  let binPath: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    testDir = mkdtempSync(join(tmpdir(), 'work-context-add-'));
    process.chdir(testDir);
    binPath = join(originalCwd, 'bin/run.js');

    // Create .work directory structure for default context
    execSync('mkdir -p .work/projects/default', { stdio: 'pipe' });
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should add local-fs context successfully', () => {
    const result = execSync(
      `node ${binPath} context add test-local --tool local-fs --path ./tasks`,
      { encoding: 'utf8' }
    );
    expect(result.trim()).toBe("Added context 'test-local' using local-fs");
  });

  it('should add local-fs context in JSON format', () => {
    const result = execSync(
      `node ${binPath} context add test-json --tool local-fs --path ./tasks --format json`,
      { encoding: 'utf8' }
    );
    const parsed = JSON.parse(result);
    expect(parsed.data.message).toBe(
      "Added context 'test-json' using local-fs"
    );
    expect(parsed.data.context.name).toBe('test-json');
    expect(parsed.data.context.tool).toBe('local-fs');
    expect(parsed.data.context.path).toBe('./tasks');
    expect(parsed.data.context.authState).toBe('authenticated');
    expect(parsed.meta).toHaveProperty('timestamp');
  });

  it('should add github context successfully', () => {
    const result = execSync(
      `node ${binPath} context add test-github --tool github --url https://github.com/owner/repo`,
      { encoding: 'utf8' }
    );
    expect(result.trim()).toBe("Added context 'test-github' using github");
  });

  it('should add github context in JSON format', () => {
    const result = execSync(
      `node ${binPath} context add test-github-json --tool github --url https://github.com/owner/repo --format json`,
      { encoding: 'utf8' }
    );
    const parsed = JSON.parse(result);
    expect(parsed.data.message).toBe(
      "Added context 'test-github-json' using github"
    );
    expect(parsed.data.context.name).toBe('test-github-json');
    expect(parsed.data.context.tool).toBe('github');
    expect(parsed.data.context.url).toBe('https://github.com/owner/repo');
    expect(parsed.data.context.authState).toBe('unauthenticated');
  });

  it('should error when local-fs tool is missing path', () => {
    expect(() => {
      execSync(`node ${binPath} context add test-no-path --tool local-fs`, {
        stdio: 'pipe',
      });
    }).toThrow();
  });

  it('should error when github tool is missing url', () => {
    expect(() => {
      execSync(`node ${binPath} context add test-no-url --tool github`, {
        stdio: 'pipe',
      });
    }).toThrow();
  });

  it('should error with invalid tool option', () => {
    expect(() => {
      execSync(`node ${binPath} context add test-invalid --tool invalid`, {
        stdio: 'pipe',
      });
    }).toThrow();
  });

  it('should error with missing required name argument', () => {
    expect(() => {
      execSync(`node ${binPath} context add --tool local-fs --path ./tasks`, {
        stdio: 'pipe',
      });
    }).toThrow();
  });

  it('should handle invalid format option', () => {
    expect(() => {
      execSync(
        `node ${binPath} context add test-invalid-format --tool local-fs --path ./tasks --format invalid`,
        { stdio: 'pipe' }
      );
    }).toThrow();
  });
});
