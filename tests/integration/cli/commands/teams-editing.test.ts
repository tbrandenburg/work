import { execSync } from 'child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';

describe('Teams Editing Workflow Integration', () => {
  let testDir: string;
  let originalCwd: string;
  let binPath: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    testDir = mkdtempSync(join(tmpdir(), 'work-teams-editing-'));
    process.chdir(testDir);
    binPath = join(originalCwd, 'bin/run.js');

    // Initialize teams by running list command first
    execSync(`node "${binPath}" teams list`, {
      encoding: 'utf8',
      stdio: 'pipe',
      env: { ...process.env, NODE_ENV: 'test' },
      cwd: testDir,
    });
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('Team CRUD Operations', () => {
    it('should create, edit, and remove a team successfully', () => {
      // Create a new team
      const createResult = execSync(
        `node "${binPath}" teams create test-integration-team --name "Integration Test Team" --title "Test Team" --description "A team created for integration testing" --icon "🧪"`,
        {
          encoding: 'utf8',
          stdio: 'pipe',
          env: { ...process.env, NODE_ENV: 'test' },
          cwd: testDir,
        }
      );

      expect(createResult).toContain('Created team test-integration-team');
      expect(createResult).toContain('Integration Test Team');

      // Verify team appears in list
      const listResult = execSync(`node "${binPath}" teams list`, {
        encoding: 'utf8',
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'test' },
        cwd: testDir,
      });

      expect(listResult).toContain('test-integration-team');
      expect(listResult).toContain('Integration Test Team');

      // Edit the team
      const editResult = execSync(
        `node "${binPath}" teams edit test-integration-team --name "Updated Integration Team" --description "Updated description for testing"`,
        {
          encoding: 'utf8',
          stdio: 'pipe',
          env: { ...process.env, NODE_ENV: 'test' },
          cwd: testDir,
        }
      );

      expect(editResult).toContain('Updated team test-integration-team');
      expect(editResult).toContain('Updated Integration Team');

      // Verify changes appear in list
      const listAfterEdit = execSync(`node "${binPath}" teams list`, {
        encoding: 'utf8',
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'test' },
        cwd: testDir,
      });

      expect(listAfterEdit).toContain('Updated Integration Team');
      expect(listAfterEdit).toContain('Updated description');

      // Remove the team
      const removeResult = execSync(
        `node "${binPath}" teams remove test-integration-team`,
        {
          encoding: 'utf8',
          stdio: 'pipe',
          env: { ...process.env, NODE_ENV: 'test' },
          cwd: testDir,
        }
      );

      expect(removeResult).toContain('Removed team test-integration-team');

      // Verify team no longer appears in list
      const listAfterRemove = execSync(`node "${binPath}" teams list`, {
        encoding: 'utf8',
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'test' },
        cwd: testDir,
      });

      expect(listAfterRemove).not.toContain('test-integration-team');
    });

    it('should handle duplicate team creation error', () => {
      // First create a team
      execSync(
        `node "${binPath}" teams create duplicate-test --name "First Team" --title "Test" --description "First team"`,
        {
          encoding: 'utf8',
          stdio: 'pipe',
          env: { ...process.env, NODE_ENV: 'test' },
          cwd: testDir,
        }
      );

      // Try to create same team again
      try {
        execSync(
          `node "${binPath}" teams create duplicate-test --name "Second Team" --title "Test" --description "Second team"`,
          {
            encoding: 'utf8',
            stdio: 'pipe',
            env: { ...process.env, NODE_ENV: 'test' },
            cwd: testDir,
          }
        );
        throw new Error('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain(
          'Team ID already exists: duplicate-test'
        );
      }
    });

    it('should handle team not found error during edit', () => {
      try {
        execSync(
          `node "${binPath}" teams edit nonexistent-team --name "Updated Name"`,
          {
            encoding: 'utf8',
            stdio: 'pipe',
            env: { ...process.env, NODE_ENV: 'test' },
            cwd: testDir,
          }
        );
        throw new Error('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('Team not found: nonexistent-team');
      }
    });
  });

  describe('Agent CRUD Operations', () => {
    beforeEach(() => {
      // Create a test team for agent operations
      execSync(
        `node "${binPath}" teams create agent-test-team --name "Agent Test Team" --title "Test Team" --description "Team for testing agent operations"`,
        {
          encoding: 'utf8',
          stdio: 'pipe',
          env: { ...process.env, NODE_ENV: 'test' },
          cwd: testDir,
        }
      );
    });

    it('should add, edit, and remove an agent successfully', () => {
      // Add an agent
      const addResult = execSync(
        `node "${binPath}" teams add-agent agent-test-team test-agent --name "Test Agent" --title "Software Developer" --role "developer" --identity "experienced developer" --communication "professional" --principles "clean code practices"`,
        {
          encoding: 'utf8',
          stdio: 'pipe',
          env: { ...process.env, NODE_ENV: 'test' },
          cwd: testDir,
        }
      );

      expect(addResult).toContain(
        'Added agent test-agent to team agent-test-team'
      );
      expect(addResult).toContain('Test Agent');

      // Edit the agent
      const editResult = execSync(
        `node "${binPath}" teams edit-agent agent-test-team/test-agent --name "Updated Agent" --title "Senior Developer"`,
        {
          encoding: 'utf8',
          stdio: 'pipe',
          env: { ...process.env, NODE_ENV: 'test' },
          cwd: testDir,
        }
      );

      expect(editResult).toContain(
        'Updated agent test-agent in team agent-test-team'
      );
      expect(editResult).toContain('Updated Agent');

      // Remove the agent
      const removeResult = execSync(
        `node "${binPath}" teams remove-agent agent-test-team/test-agent`,
        {
          encoding: 'utf8',
          stdio: 'pipe',
          env: { ...process.env, NODE_ENV: 'test' },
          cwd: testDir,
        }
      );

      expect(removeResult).toContain(
        'Removed agent test-agent from team agent-test-team'
      );
    });

    it('should handle invalid agent path format', () => {
      try {
        execSync(
          `node "${binPath}" teams edit-agent invalid-path --name "Updated Agent"`,
          {
            encoding: 'utf8',
            stdio: 'pipe',
            env: { ...process.env, NODE_ENV: 'test' },
            cwd: testDir,
          }
        );
        throw new Error('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('Member path must be in format');
      }
    });

    it('should handle agent not found error', () => {
      try {
        execSync(
          `node "${binPath}" teams remove-agent agent-test-team/nonexistent-agent`,
          {
            encoding: 'utf8',
            stdio: 'pipe',
            env: { ...process.env, NODE_ENV: 'test' },
            cwd: testDir,
          }
        );
        throw new Error('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('Member not found');
      }
    });
  });

  describe('Human CRUD Operations', () => {
    beforeEach(() => {
      // Create a test team for human operations
      execSync(
        `node "${binPath}" teams create human-test-team --name "Human Test Team" --title "Test Team" --description "Team for testing human operations"`,
        {
          encoding: 'utf8',
          stdio: 'pipe',
          env: { ...process.env, NODE_ENV: 'test' },
          cwd: testDir,
        }
      );
    });

    it('should add, edit, and remove a human successfully', () => {
      // Add a human
      const addResult = execSync(
        `node "${binPath}" teams add-human human-test-team test-human --name "Test Human" --title "Software Developer" --role "developer" --identity "senior developer" --communication "collaborative" --availability "full-time"`,
        {
          encoding: 'utf8',
          stdio: 'pipe',
          env: { ...process.env, NODE_ENV: 'test' },
          cwd: testDir,
        }
      );

      expect(addResult).toContain(
        'Added human test-human to team human-test-team'
      );
      expect(addResult).toContain('Test Human');

      // Edit the human
      const editResult = execSync(
        `node "${binPath}" teams edit-human human-test-team/test-human --name "Updated Human" --title "Senior Developer"`,
        {
          encoding: 'utf8',
          stdio: 'pipe',
          env: { ...process.env, NODE_ENV: 'test' },
          cwd: testDir,
        }
      );

      expect(editResult).toContain(
        'Updated human test-human in team human-test-team'
      );
      expect(editResult).toContain('Updated Human');

      // Remove the human
      const removeResult = execSync(
        `node "${binPath}" teams remove-human human-test-team/test-human`,
        {
          encoding: 'utf8',
          stdio: 'pipe',
          env: { ...process.env, NODE_ENV: 'test' },
          cwd: testDir,
        }
      );

      expect(removeResult).toContain(
        'Removed human test-human from team human-test-team'
      );
    });

    it('should handle human not found error', () => {
      try {
        execSync(
          `node "${binPath}" teams edit-human human-test-team/nonexistent-human --name "Updated Human"`,
          {
            encoding: 'utf8',
            stdio: 'pipe',
            env: { ...process.env, NODE_ENV: 'test' },
            cwd: testDir,
          }
        );
        throw new Error('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('Member not found');
      }
    });
  });

  describe('Import/Export Operations', () => {
    it('should export and import teams successfully', () => {
      // Create a test team with agent and human
      execSync(
        `node "${binPath}" teams create export-test-team --name "Export Test Team" --title "Test Team" --description "Team for testing export/import"`,
        {
          encoding: 'utf8',
          stdio: 'pipe',
          env: { ...process.env, NODE_ENV: 'test' },
          cwd: testDir,
        }
      );

      execSync(
        `node "${binPath}" teams add-agent export-test-team export-agent --name "Export Agent" --title "Developer" --role "developer" --identity "test agent" --communication "professional"`,
        {
          encoding: 'utf8',
          stdio: 'pipe',
          env: { ...process.env, NODE_ENV: 'test' },
          cwd: testDir,
        }
      );

      // Export teams
      const exportResult = execSync(
        `node "${binPath}" teams export teams-backup.xml`,
        {
          encoding: 'utf8',
          stdio: 'pipe',
          env: { ...process.env, NODE_ENV: 'test' },
          cwd: testDir,
        }
      );

      expect(exportResult).toContain('Exported');

      // Remove the team
      execSync(`node "${binPath}" teams remove export-test-team`, {
        encoding: 'utf8',
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'test' },
        cwd: testDir,
      });

      // Verify team is gone
      const listBeforeImport = execSync(`node "${binPath}" teams list`, {
        encoding: 'utf8',
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'test' },
        cwd: testDir,
      });
      expect(listBeforeImport).not.toContain('export-test-team');

      // Import teams back
      const importBackResult = execSync(
        `node "${binPath}" teams import teams-backup.xml`,
        {
          encoding: 'utf8',
          stdio: 'pipe',
          env: { ...process.env, NODE_ENV: 'test' },
          cwd: testDir,
        }
      );

      expect(exportResult).toContain('Exported');

      // Remove the team
      execSync(`node "${binPath}" teams remove export-test-team`, {
        encoding: 'utf8',
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'test' },
        cwd: testDir,
      });

      // Verify team is gone
      const listBefore = execSync(`node "${binPath}" teams list`, {
        encoding: 'utf8',
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'test' },
        cwd: testDir,
      });
      expect(listBefore).not.toContain('export-test-team');

      // Import teams back
      const importResult = execSync(
        `node "${binPath}" teams import teams-backup.xml`,
        {
          encoding: 'utf8',
          stdio: 'pipe',
          env: { ...process.env, NODE_ENV: 'test' },
          cwd: testDir,
        }
      );

      expect(importBackResult).toContain('Imported');

      // Verify team is back
      const listAfter = execSync(`node "${binPath}" teams list`, {
        encoding: 'utf8',
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'test' },
        cwd: testDir,
      });
      expect(listAfter).toContain('export-test-team');
      expect(listAfter).toContain('Export Test Team');
    });

    it('should handle invalid import file', () => {
      try {
        execSync(`node "${binPath}" teams import nonexistent-file.xml`, {
          encoding: 'utf8',
          stdio: 'pipe',
          env: { ...process.env, NODE_ENV: 'test' },
          cwd: testDir,
        });
        throw new Error('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('Import file not found');
      }
    });
  });

  describe('Complex Workflow', () => {
    it('should handle complete team lifecycle with multiple agents and humans', () => {
      // Create team
      execSync(
        `node "${binPath}" teams create full-lifecycle-team --name "Full Lifecycle Team" --title "Complete Team" --description "Team for testing complete lifecycle"`,
        {
          encoding: 'utf8',
          stdio: 'pipe',
          env: { ...process.env, NODE_ENV: 'test' },
          cwd: testDir,
        }
      );

      // Add multiple agents
      execSync(
        `node "${binPath}" teams add-agent full-lifecycle-team agent1 --name "First Agent" --title "Developer" --role "developer" --identity "frontend specialist" --communication "friendly"`,
        {
          encoding: 'utf8',
          stdio: 'pipe',
          env: { ...process.env, NODE_ENV: 'test' },
          cwd: testDir,
        }
      );

      execSync(
        `node "${binPath}" teams add-agent full-lifecycle-team agent2 --name "Second Agent" --title "Designer" --role "designer" --identity "UI/UX specialist" --communication "creative"`,
        {
          encoding: 'utf8',
          stdio: 'pipe',
          env: { ...process.env, NODE_ENV: 'test' },
          cwd: testDir,
        }
      );

      // Add humans
      execSync(
        `node "${binPath}" teams add-human full-lifecycle-team human1 --name "First Human" --title "Product Manager" --role "pm" --identity "product strategist" --communication "organized" --availability "full-time"`,
        {
          encoding: 'utf8',
          stdio: 'pipe',
          env: { ...process.env, NODE_ENV: 'test' },
          cwd: testDir,
        }
      );

      // Edit some members
      execSync(
        `node "${binPath}" teams edit-agent full-lifecycle-team/agent1 --title "Senior Developer"`,
        {
          encoding: 'utf8',
          stdio: 'pipe',
          env: { ...process.env, NODE_ENV: 'test' },
          cwd: testDir,
        }
      );

      // Export the complete team
      const exportResult = execSync(
        `node "${binPath}" teams export complete-team-backup.json`,
        {
          encoding: 'utf8',
          stdio: 'pipe',
          env: { ...process.env, NODE_ENV: 'test' },
          cwd: testDir,
        }
      );

      expect(exportResult).toContain('Exported 3');

      // Remove some members
      execSync(
        `node "${binPath}" teams remove-agent full-lifecycle-team/agent2`,
        {
          encoding: 'utf8',
          stdio: 'pipe',
          env: { ...process.env, NODE_ENV: 'test' },
          cwd: testDir,
        }
      );

      execSync(
        `node "${binPath}" teams remove-human full-lifecycle-team/human1`,
        {
          encoding: 'utf8',
          stdio: 'pipe',
          env: { ...process.env, NODE_ENV: 'test' },
          cwd: testDir,
        }
      );

      // Finally remove the team
      const removeTeamResult = execSync(
        `node "${binPath}" teams remove full-lifecycle-team`,
        {
          encoding: 'utf8',
          stdio: 'pipe',
          env: { ...process.env, NODE_ENV: 'test' },
          cwd: testDir,
        }
      );

      expect(removeTeamResult).toContain('Removed team full-lifecycle-team');

      // Verify everything is clean
      const finalList = execSync(`node "${binPath}" teams list`, {
        encoding: 'utf8',
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'test' },
        cwd: testDir,
      });

      expect(finalList).not.toContain('full-lifecycle-team');
    });
  });
});
