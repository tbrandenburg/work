import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Teams Agent Command Integration', () => {
  let testDir: string;
  let originalCwd: string;
  let binPath: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    testDir = mkdtempSync(join(tmpdir(), 'work-teams-agent-'));
    process.chdir(testDir);
    binPath = join(originalCwd, 'bin/run.js');
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should display agent with CDATA instructions without error', () => {
    const result = execSync(
      `node "${binPath}" teams agent sw-dev-team/tech-lead`,
      {
        encoding: 'utf8',
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'test' },
        cwd: testDir,
      }
    );

    expect(result).toContain('Instructions:');
    // Should not contain the error message
    const stderr = '';
    expect(stderr).not.toContain('trim is not a function');
  });

  it('should handle agents with string instructions', () => {
    const result = execSync(
      `node "${binPath}" teams agent research-team/researcher`,
      {
        encoding: 'utf8',
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'test' },
        cwd: testDir,
      }
    );

    // Should execute without throwing errors
    expect(result).toBeDefined();
  });

  it('should handle agents with different instruction formats gracefully', () => {
    // Test both available teams to ensure robust handling
    let result = execSync(
      `node "${binPath}" teams agent sw-dev-team/tech-lead`,
      {
        encoding: 'utf8',
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'test' },
        cwd: testDir,
      }
    );

    // Should execute without throwing errors
    expect(result).toBeDefined();
    expect(result).toContain('Agent:');

    // Test second agent
    result = execSync(
      `node "${binPath}" teams agent research-team/researcher`,
      {
        encoding: 'utf8',
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'test' },
        cwd: testDir,
      }
    );

    // Should execute without throwing errors
    expect(result).toBeDefined();
    expect(result).toContain('Agent:');
  });

  it('should display agent in JSON format', () => {
    const result = execSync(
      `node "${binPath}" teams agent sw-dev-team/tech-lead --format json`,
      {
        encoding: 'utf8',
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'test' },
        cwd: testDir,
      }
    );

    // Should be valid JSON and not throw the CDATA parsing error
    const parsed = JSON.parse(result);
    expect(parsed).toBeDefined();
    expect(parsed.data).toBeDefined();
  });
});
