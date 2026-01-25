/**
 * Consolidated JSON Output Validation Test Suite
 * Combines essential JSON output tests from json-output.test.ts and universal-json-support.test.ts
 */

import { execSync } from 'child_process';
import path from 'path';

const binPath = path.resolve(__dirname, '../../../bin/run.js');

describe('JSON Output Validation', () => {
  describe('Structured Response Format', () => {
    it('should output structured JSON for create command', () => {
      const result = execSync(
        `node ${binPath} create "Test JSON task" --format json`,
        { encoding: 'utf8' }
      );
      const parsed = JSON.parse(result);

      expect(parsed).toHaveProperty('data');
      expect(parsed).toHaveProperty('meta');
      expect(parsed.data).toHaveProperty('id');
      expect(parsed.data).toHaveProperty('title', 'Test JSON task');
      expect(parsed.meta).toHaveProperty('timestamp');
    });

    it('should output structured JSON for list command', () => {
      const result = execSync(`node ${binPath} list --format json`, {
        encoding: 'utf8',
      });
      const parsed = JSON.parse(result);

      expect(parsed).toHaveProperty('data');
      expect(parsed).toHaveProperty('meta');
      expect(Array.isArray(parsed.data)).toBe(true);
      expect(parsed.meta).toHaveProperty('total');
      expect(parsed.meta).toHaveProperty('timestamp');
    });

    it('should output structured JSON for auth status command', () => {
      const result = execSync(`node ${binPath} auth status --format json`, {
        encoding: 'utf8',
      });
      const parsed = JSON.parse(result);

      expect(parsed).toHaveProperty('data');
      expect(parsed).toHaveProperty('meta');
      expect(parsed.data).toHaveProperty('state');
      expect(parsed.meta).toHaveProperty('timestamp');
    });
  });

  describe('Core Commands JSON Support', () => {
    it('should support JSON output for hello command', () => {
      const result = execSync(`node ${binPath} hello --from test --format json`, {
        encoding: 'utf8',
      });
      const parsed = JSON.parse(result);

      expect(parsed).toHaveProperty('data');
      expect(parsed).toHaveProperty('meta');
      expect(parsed.meta).toHaveProperty('timestamp');
    });

    it('should support JSON output for auth login command', () => {
      const result = execSync(`node ${binPath} auth login --format json`, {
        encoding: 'utf8',
      });
      const parsed = JSON.parse(result);

      expect(parsed).toHaveProperty('data');
      expect(parsed).toHaveProperty('meta');
      expect(parsed.meta).toHaveProperty('timestamp');
    });

    it('should support JSON output for auth logout command', () => {
      const result = execSync(`node ${binPath} auth logout --format json`, {
        encoding: 'utf8',
      });
      const parsed = JSON.parse(result);

      expect(parsed).toHaveProperty('data');
      expect(parsed).toHaveProperty('meta');
      expect(parsed.meta).toHaveProperty('timestamp');
    });
  });

  describe('JSON Format Validation', () => {
    it('should produce valid JSON for all commands', () => {
      const commands = [
        'hello --from test',
        'list',
        'auth status',
        'context list',
        'schema show'
      ];

      commands.forEach(cmd => {
        const result = execSync(`node ${binPath} ${cmd} --format json`, {
          encoding: 'utf8',
        });
        
        expect(() => JSON.parse(result)).not.toThrow();
        const parsed = JSON.parse(result);
        expect(parsed).toHaveProperty('data');
        expect(parsed).toHaveProperty('meta');
      });
    });

    it('should include proper newline termination', () => {
      const result = execSync(`node ${binPath} hello --from test --format json`, {
        encoding: 'utf8',
      });
      
      expect(result.endsWith('\n')).toBe(true);
    });

    it('should use 2-space indentation', () => {
      const result = execSync(`node ${binPath} hello --from test --format json`, {
        encoding: 'utf8',
      });
      
      expect(result).toContain('  "data"');
      expect(result).toContain('  "meta"');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data responses', () => {
      const result = execSync(`node ${binPath} list --format json`, {
        encoding: 'utf8',
      });
      const parsed = JSON.parse(result);

      expect(parsed).toHaveProperty('data');
      expect(parsed).toHaveProperty('meta');
      expect(Array.isArray(parsed.data)).toBe(true);
      expect(parsed.meta).toHaveProperty('total', parsed.data.length);
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain same data structure for existing JSON outputs', () => {
      const result = execSync(`node ${binPath} auth status --format json`, {
        encoding: 'utf8',
      });
      const parsed = JSON.parse(result);

      // Verify backward compatibility structure
      expect(parsed).toHaveProperty('data');
      expect(parsed).toHaveProperty('meta');
      expect(parsed.data).toHaveProperty('state');
      expect(parsed.meta).toHaveProperty('timestamp');
    });
  });
});
