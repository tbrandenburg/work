import { execSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Teams List Command Integration', () => {
  let testDir: string;
  let originalCwd: string;
  let binPath: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    testDir = mkdtempSync(join(tmpdir(), 'work-teams-list-'));
    process.chdir(testDir);
    binPath = join(originalCwd, 'bin/run.js');
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should list teams successfully in table format', () => {
    const result = execSync(`node "${binPath}" teams list`, {
      encoding: 'utf8',
      stdio: 'pipe',
      env: { ...process.env, NODE_ENV: 'test' },
      cwd: testDir,
    });

    // Should contain header and at least default teams
    expect(result).toContain('ID');
    expect(result).toContain('Name');
    expect(result).toContain('Title');
    expect(result).toContain('Description');
    expect(result).toContain('Total:');
    expect(result).toContain('teams');
  });

  it('should list teams in JSON format', () => {
    const result = execSync(`node "${binPath}" teams list --format json`, {
      encoding: 'utf8',
      stdio: 'pipe',
      env: { ...process.env, NODE_ENV: 'test' },
      cwd: testDir,
    });

    const parsed = JSON.parse(result);
    expect(parsed.data).toBeInstanceOf(Array);
    expect(parsed.meta).toHaveProperty('timestamp');
    expect(parsed.meta).toHaveProperty('total');
    expect(parsed.meta.total).toBeGreaterThan(0);

    // Check first team structure
    const firstTeam = parsed.data[0];
    expect(firstTeam).toHaveProperty('id');
    expect(firstTeam).toHaveProperty('name');
    expect(firstTeam).toHaveProperty('title');
    expect(firstTeam).toHaveProperty('description');
  });

  it('should create default teams on first run', () => {
    const result = execSync(`node "${binPath}" teams list`, {
      encoding: 'utf8',
      stdio: 'pipe',
      env: { ...process.env, NODE_ENV: 'test' },
      cwd: testDir,
    });

    // Should have created default teams
    expect(result).toContain('sw-dev-team');
    expect(result).toContain('research-team');
  });

  it('should handle errors gracefully', () => {
    // This test simulates error handling by breaking the XML structure
    // First, create teams.xml
    execSync(`node "${binPath}" teams list`, {
      encoding: 'utf8',
      stdio: 'pipe',
      env: { ...process.env, NODE_ENV: 'test' },
      cwd: testDir,
    });

    // Then corrupt the XML file with invalid XML
    execSync('echo "<invalid>broken</wrongtag>" > .work/teams.xml', {
      encoding: 'utf8',
    });

    // The CLI should handle invalid XML gracefully and show "No teams found."
    const result = execSync(`node "${binPath}" teams list`, {
      encoding: 'utf8',
      stdio: 'pipe',
      env: { ...process.env, NODE_ENV: 'test' },
      cwd: testDir,
    });

    // Should show error message gracefully instead of crashing
    expect(result).toContain('No teams found.');
  });
});
