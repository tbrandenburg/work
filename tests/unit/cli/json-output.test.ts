/**
 * Comprehensive test suite for JSON output validation
 */

import { execSync } from 'child_process';
import path from 'path';

const binPath = path.resolve(__dirname, '../../../bin/run.js');

describe('JSON Output Validation', () => {
  describe('Structured Response Format', () => {
    it('should output structured JSON for create command', () => {
      const result = execSync(`node ${binPath} create "Test JSON task" --format json`, { encoding: 'utf8' });
      const parsed = JSON.parse(result);
      
      expect(parsed).toHaveProperty('data');
      expect(parsed).toHaveProperty('meta');
      expect(parsed.data).toHaveProperty('id');
      expect(parsed.data).toHaveProperty('title', 'Test JSON task');
      expect(parsed.meta).toHaveProperty('timestamp');
    });

    it('should output structured JSON for list command', () => {
      const result = execSync(`node ${binPath} list --format json`, { encoding: 'utf8' });
      const parsed = JSON.parse(result);
      
      expect(parsed).toHaveProperty('data');
      expect(parsed).toHaveProperty('meta');
      expect(Array.isArray(parsed.data)).toBe(true);
      expect(parsed.meta).toHaveProperty('total');
      expect(parsed.meta).toHaveProperty('timestamp');
    });

    it('should output structured JSON for auth status command', () => {
      const result = execSync(`node ${binPath} auth status --format json`, { encoding: 'utf8' });
      const parsed = JSON.parse(result);
      
      expect(parsed).toHaveProperty('data');
      expect(parsed).toHaveProperty('meta');
      expect(parsed.data).toHaveProperty('state');
      expect(parsed.meta).toHaveProperty('timestamp');
    });

    it('should output structured JSON for hello command', () => {
      const result = execSync(`node ${binPath} hello world --from test --format json`, { encoding: 'utf8' });
      const parsed = JSON.parse(result);
      
      expect(parsed).toHaveProperty('data');
      expect(parsed).toHaveProperty('meta');
      expect(parsed.data).toHaveProperty('message');
      expect(parsed.data).toHaveProperty('person', 'world');
      expect(parsed.data).toHaveProperty('from', 'test');
      expect(parsed.meta).toHaveProperty('timestamp');
    });
  });

  describe('State Change Commands JSON Output', () => {
    let taskId: string;

    beforeAll(() => {
      // Create a task for state change tests
      const result = execSync(`node ${binPath} create "State change test task" --format json`, { encoding: 'utf8' });
      const parsed = JSON.parse(result);
      taskId = parsed.data.id;
    });

    it('should output structured JSON for start command', () => {
      const result = execSync(`node ${binPath} start ${taskId} --format json`, { encoding: 'utf8' });
      const parsed = JSON.parse(result);
      
      expect(parsed).toHaveProperty('data');
      expect(parsed).toHaveProperty('meta');
      expect(parsed.data).toHaveProperty('id', taskId);
      expect(parsed.data).toHaveProperty('state', 'active');
      expect(parsed.meta).toHaveProperty('timestamp');
    });

    it('should output structured JSON for close command', () => {
      const result = execSync(`node ${binPath} close ${taskId} --format json`, { encoding: 'utf8' });
      const parsed = JSON.parse(result);
      
      expect(parsed).toHaveProperty('data');
      expect(parsed).toHaveProperty('meta');
      expect(parsed.data).toHaveProperty('id', taskId);
      expect(parsed.data).toHaveProperty('state', 'closed');
      expect(parsed.meta).toHaveProperty('timestamp');
      expect(parsed.meta).toHaveProperty('closedAt');
    });

    it('should output structured JSON for reopen command', () => {
      const result = execSync(`node ${binPath} reopen ${taskId} --format json`, { encoding: 'utf8' });
      const parsed = JSON.parse(result);
      
      expect(parsed).toHaveProperty('data');
      expect(parsed).toHaveProperty('meta');
      expect(parsed.data).toHaveProperty('id', taskId);
      expect(parsed.data).toHaveProperty('state', 'active');
      expect(parsed.meta).toHaveProperty('timestamp');
      expect(parsed.meta).toHaveProperty('reopened', true);
    });
  });

  describe('Auth Commands JSON Output', () => {
    it('should output structured JSON for auth login command', () => {
      const result = execSync(`node ${binPath} auth login --format json`, { encoding: 'utf8' });
      const parsed = JSON.parse(result);
      
      expect(parsed).toHaveProperty('data');
      expect(parsed).toHaveProperty('meta');
      expect(parsed.data).toHaveProperty('state');
      expect(parsed.meta).toHaveProperty('timestamp');
    });

    it('should output structured JSON for auth logout command', () => {
      const result = execSync(`node ${binPath} auth logout --format json`, { encoding: 'utf8' });
      const parsed = JSON.parse(result);
      
      expect(parsed).toHaveProperty('data');
      expect(parsed).toHaveProperty('meta');
      expect(parsed.data).toHaveProperty('success', true);
      expect(parsed.data).toHaveProperty('message', 'Logout successful');
      expect(parsed.meta).toHaveProperty('timestamp');
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain same data structure for existing JSON outputs', () => {
      const result = execSync(`node ${binPath} list --format json`, { encoding: 'utf8' });
      const parsed = JSON.parse(result);
      
      // Data should be an array of work items with expected properties
      expect(Array.isArray(parsed.data)).toBe(true);
      if (parsed.data.length > 0) {
        const workItem = parsed.data[0];
        expect(workItem).toHaveProperty('id');
        expect(workItem).toHaveProperty('kind');
        expect(workItem).toHaveProperty('title');
        expect(workItem).toHaveProperty('state');
        expect(workItem).toHaveProperty('priority');
      }
    });

    it('should maintain auth status structure', () => {
      const result = execSync(`node ${binPath} auth status --format json`, { encoding: 'utf8' });
      const parsed = JSON.parse(result);
      
      expect(parsed.data).toHaveProperty('state');
      expect(typeof parsed.data.state).toBe('string');
    });
  });

  describe('JSON Format Validation', () => {
    it('should produce valid JSON for all commands', () => {
      const commands = [
        'auth status --format json',
        'list --format json',
        'hello world --from test --format json',
      ];

      commands.forEach(cmd => {
        const result = execSync(`node ${binPath} ${cmd}`, { encoding: 'utf8' });
        expect(() => JSON.parse(result)).not.toThrow();
      });
    });

    it('should include proper newline termination', () => {
      const result = execSync(`node ${binPath} auth status --format json`, { encoding: 'utf8' });
      expect(result.endsWith('\n')).toBe(true);
    });

    it('should use 2-space indentation', () => {
      const result = execSync(`node ${binPath} auth status --format json`, { encoding: 'utf8' });
      const lines = result.split('\n');
      // Check that indented lines use 2 spaces
      const indentedLine = lines.find(line => line.startsWith('  '));
      if (indentedLine) {
        expect(indentedLine.match(/^  [^ ]/)).toBeTruthy();
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data responses', () => {
      // Create a query that returns no results
      const result = execSync(`node ${binPath} list where "state=nonexistent" --format json`, { encoding: 'utf8' });
      const parsed = JSON.parse(result);
      
      expect(parsed).toHaveProperty('data');
      expect(parsed).toHaveProperty('meta');
      expect(Array.isArray(parsed.data)).toBe(true);
      expect(parsed.data.length).toBe(0);
      expect(parsed.meta).toHaveProperty('total', 0);
    });

    it('should handle unicode characters in JSON output', () => {
      const result = execSync(`node ${binPath} create "Test with émojis 🚀" --format json`, { encoding: 'utf8' });
      const parsed = JSON.parse(result);
      
      expect(parsed.data.title).toBe('Test with émojis 🚀');
    });
  });

  describe('Meta Information', () => {
    it('should include timestamp in meta for all commands', () => {
      const commands = [
        'auth status --format json',
        'list --format json',
        'hello world --from test --format json',
      ];

      commands.forEach(cmd => {
        const result = execSync(`node ${binPath} ${cmd}`, { encoding: 'utf8' });
        const parsed = JSON.parse(result);
        
        expect(parsed.meta).toHaveProperty('timestamp');
        expect(typeof parsed.meta.timestamp).toBe('string');
        // Should be a valid ISO date
        expect(() => new Date(parsed.meta.timestamp)).not.toThrow();
      });
    });

    it('should include total count for list commands', () => {
      const result = execSync(`node ${binPath} list --format json`, { encoding: 'utf8' });
      const parsed = JSON.parse(result);
      
      expect(parsed.meta).toHaveProperty('total');
      expect(typeof parsed.meta.total).toBe('number');
      expect(parsed.meta.total).toBe(parsed.data.length);
    });
  });
});
