import { vi, describe, it, expect } from 'vitest';
import { parseTeamsXML, buildTeamsXML } from '../../../src/core/xml-utils';
import { TeamsData, Agent, Command } from '../../../src/types/teams';

describe('XML Utils - CDATA Handling', () => {
  describe('parseTeamsXML - CDATA extraction', () => {
    it('should extract string content from CDATA objects in command instructions', () => {
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<teams version="1.0">
  <team id="test-team" name="Test Team" title="Test" icon="🧪">
    <description>Test team</description>
    <agents>
      <agent id="test-agent" name="Test Agent" title="Test Agent">
        <persona>
          <role>Test role</role>
          <identity>Test identity</identity>
          <communication_style>Test style</communication_style>
          <principles>Test principles</principles>
        </persona>
        <commands>
          <command>
            <trigger>test-command</trigger>
            <description>Test command</description>
            <instructions><![CDATA[
1. First instruction
2. Second instruction
3. Third instruction
]]></instructions>
          </command>
        </commands>
      </agent>
    </agents>
  </team>
</teams>`;

      const result = parseTeamsXML(xmlContent);

      expect(result.teams).toHaveLength(1);
      const team = result.teams[0];
      expect(team.agents).toHaveLength(1);
      const agent = team.agents![0];
      expect(agent.commands).toHaveLength(1);
      const command = agent.commands![0];

      // The key test: instructions should be extracted as a string, not CDATA object
      expect(typeof command.instructions).toBe('string');
      expect(command.instructions).toContain('1. First instruction');
      expect(command.instructions).toContain('2. Second instruction');
      expect(command.instructions).toContain('3. Third instruction');

      // Ensure it's not a CDATA object
      expect(command.instructions).not.toHaveProperty('__cdata');
    });

    it('should extract string content from CDATA objects in activation instructions', () => {
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<teams version="1.0">
  <team id="test-team" name="Test Team" title="Test" icon="🧪">
    <description>Test team</description>
    <agents>
      <agent id="test-agent" name="Test Agent" title="Test Agent">
        <persona>
          <role>Test role</role>
          <identity>Test identity</identity>
          <communication_style>Test style</communication_style>
          <principles>Test principles</principles>
        </persona>
        <activation critical="true">
          <instructions><![CDATA[Activation instructions here]]></instructions>
        </activation>
      </agent>
    </agents>
  </team>
</teams>`;

      const result = parseTeamsXML(xmlContent);

      const agent = result.teams[0].agents![0];
      expect(agent.activation).toBeDefined();
      expect(typeof agent.activation!.instructions).toBe('string');
      expect(agent.activation!.instructions).toBe(
        'Activation instructions here'
      );
      expect(agent.activation!.instructions).not.toHaveProperty('__cdata');
    });

    it('should handle workflow main_file CDATA content correctly', () => {
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<teams version="1.0">
  <team id="test-team" name="Test Team" title="Test" icon="🧪">
    <description>Test team</description>
    <agents>
      <agent id="test-agent" name="Test Agent" title="Test Agent">
        <persona>
          <role>Test role</role>
          <identity>Test identity</identity>
          <communication_style>Test style</communication_style>
          <principles>Test principles</principles>
        </persona>
        <workflows>
          <workflow id="test-workflow">
            <main_file><![CDATA[const workflow = () => { console.log('test'); };]]></main_file>
          </workflow>
        </workflows>
      </agent>
    </agents>
  </team>
</teams>`;

      const result = parseTeamsXML(xmlContent);

      const agent = result.teams[0].agents![0];
      expect(agent.workflows).toHaveLength(1);
      const workflow = agent.workflows![0];
      expect(typeof workflow.main_file.content).toBe('string');
      expect(workflow.main_file.content).toContain('const workflow = () =>');
      expect(workflow.main_file.content).not.toHaveProperty('__cdata');
    });

    it('should handle commands without instructions gracefully', () => {
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<teams version="1.0">
  <team id="test-team" name="Test Team" title="Test" icon="🧪">
    <description>Test team</description>
    <agents>
      <agent id="test-agent" name="Test Agent" title="Test Agent">
        <persona>
          <role>Test role</role>
          <identity>Test identity</identity>
          <communication_style>Test style</communication_style>
          <principles>Test principles</principles>
        </persona>
        <commands>
          <command>
            <trigger>no-instructions</trigger>
            <description>Command without instructions</description>
            <workflow_id>some-workflow</workflow_id>
          </command>
        </commands>
      </agent>
    </agents>
  </team>
</teams>`;

      const result = parseTeamsXML(xmlContent);

      const command = result.teams[0].agents![0].commands![0];
      expect(command.instructions).toBeUndefined();
      expect(command.workflow_id).toBe('some-workflow');
    });
  });

  describe('buildTeamsXML - CDATA generation', () => {
    it('should generate proper CDATA sections for string instructions', () => {
      const teamsData: TeamsData = {
        teams: [
          {
            id: 'test-team',
            name: 'Test Team',
            title: 'Test',
            description: 'Test team',
            icon: '🧪',
            agents: [
              {
                id: 'test-agent',
                name: 'Test Agent',
                title: 'Test Agent',
                persona: {
                  role: 'Test role',
                  identity: 'Test identity',
                  communication_style: 'Test style',
                  principles: 'Test principles',
                },
                commands: [
                  {
                    trigger: 'test-command',
                    description: 'Test command',
                    instructions:
                      '1. First instruction\n2. Second instruction\n3. Third instruction',
                  },
                ],
              },
            ],
          },
        ],
        version: '1.0',
      };

      const result = buildTeamsXML(teamsData);

      // Should contain proper CDATA sections
      expect(result).toContain('<![CDATA[1. First instruction');
      expect(result).toContain('3. Third instruction]]>');

      // Should NOT contain invalid __cdata elements
      expect(result).not.toContain('<__cdata>');
      expect(result).not.toContain('</__cdata>');

      // Should be parseable back to the same structure
      const parsed = parseTeamsXML(result);
      const parsedCommand = parsed.teams[0].agents![0].commands![0];
      expect(parsedCommand.instructions).toContain('1. First instruction');
      expect(parsedCommand.instructions).toContain('3. Third instruction');
    });

    it('should handle undefined instructions without creating CDATA sections', () => {
      const teamsData: TeamsData = {
        teams: [
          {
            id: 'test-team',
            name: 'Test Team',
            title: 'Test',
            description: 'Test team',
            agents: [
              {
                id: 'test-agent',
                name: 'Test Agent',
                title: 'Test Agent',
                persona: {
                  role: 'Test role',
                  identity: 'Test identity',
                  communication_style: 'Test style',
                  principles: 'Test principles',
                },
                commands: [
                  {
                    trigger: 'no-instructions',
                    description: 'Command without instructions',
                    workflow_id: 'some-workflow',
                  },
                ],
              },
            ],
          },
        ],
        version: '1.0',
      };

      const result = buildTeamsXML(teamsData);

      // Should not contain instructions element when undefined
      expect(result).not.toContain('<instructions>');
      expect(result).toContain('<workflow_id>some-workflow</workflow_id>');

      // Should NOT contain any invalid CDATA structures
      expect(result).not.toContain('<__cdata>');
      expect(result).not.toContain('</__cdata>');
    });

    it('should generate proper CDATA for activation instructions', () => {
      const teamsData: TeamsData = {
        teams: [
          {
            id: 'test-team',
            name: 'Test Team',
            title: 'Test',
            description: 'Test team',
            agents: [
              {
                id: 'test-agent',
                name: 'Test Agent',
                title: 'Test Agent',
                persona: {
                  role: 'Test role',
                  identity: 'Test identity',
                  communication_style: 'Test style',
                  principles: 'Test principles',
                },
                activation: {
                  critical: true,
                  instructions: 'Critical activation procedure',
                },
              },
            ],
          },
        ],
        version: '1.0',
      };

      const result = buildTeamsXML(teamsData);

      // Should contain proper CDATA for activation
      expect(result).toContain('<![CDATA[Critical activation procedure]]>');
      expect(result).toContain('critical="MANDATORY"');

      // Should NOT contain invalid __cdata elements
      expect(result).not.toContain('<__cdata>');
      expect(result).not.toContain('</__cdata>');
    });

    it('should handle workflow content with CDATA properly', () => {
      const teamsData: TeamsData = {
        teams: [
          {
            id: 'test-team',
            name: 'Test Team',
            title: 'Test',
            description: 'Test team',
            agents: [
              {
                id: 'test-agent',
                name: 'Test Agent',
                title: 'Test Agent',
                persona: {
                  role: 'Test role',
                  identity: 'Test identity',
                  communication_style: 'Test style',
                  principles: 'Test principles',
                },
                workflows: [
                  {
                    id: 'test-workflow',
                    main_file: {
                      content:
                        'const workflow = () => {\n  console.log("Hello World");\n};',
                    },
                  },
                ],
              },
            ],
          },
        ],
        version: '1.0',
      };

      const result = buildTeamsXML(teamsData);

      // Should contain proper CDATA for workflow content
      expect(result).toContain('<![CDATA[const workflow = () =>');
      expect(result).toContain('console.log("Hello World");');

      // Should NOT contain invalid __cdata elements
      expect(result).not.toContain('<__cdata>');
      expect(result).not.toContain('</__cdata>');
    });
  });

  describe('Round-trip parsing and building', () => {
    it('should maintain CDATA content integrity through parse→build→parse cycles', () => {
      const originalXML = `<?xml version="1.0" encoding="UTF-8"?>
<teams version="1.0">
  <team id="test-team" name="Test Team" title="Test" icon="🧪">
    <description>Test team</description>
    <agents>
      <agent id="test-agent" name="Test Agent" title="Test Agent">
        <persona>
          <role>Test role</role>
          <identity>Test identity</identity>
          <communication_style>Test style</communication_style>
          <principles>Test principles</principles>
        </persona>
        <commands>
          <command>
            <trigger>complex-command</trigger>
            <description>Complex command with special characters</description>
            <instructions><![CDATA[
1. Handle <xml> tags properly
2. Process "quotes" and 'apostrophes'
3. Deal with & ampersands correctly
4. Maintain line breaks and formatting
]]></instructions>
          </command>
        </commands>
      </agent>
    </agents>
  </team>
</teams>`;

      // Parse the original
      const parsed1 = parseTeamsXML(originalXML);

      // Build back to XML
      const rebuiltXML = buildTeamsXML(parsed1);

      // Parse again
      const parsed2 = parseTeamsXML(rebuiltXML);

      // Instructions should be identical and properly formatted
      const instructions1 =
        parsed1.teams[0].agents![0].commands![0].instructions;
      const instructions2 =
        parsed2.teams[0].agents![0].commands![0].instructions;

      expect(instructions1).toBe(instructions2);
      expect(instructions1).toContain('<xml> tags');
      expect(instructions1).toContain('"quotes" and \'apostrophes\'');
      expect(instructions1).toContain('& ampersands');

      // Rebuilt XML should not contain invalid structures
      expect(rebuiltXML).not.toContain('<__cdata>');
      expect(rebuiltXML).not.toContain('</__cdata>');

      // But should contain proper CDATA sections
      expect(rebuiltXML).toContain('<![CDATA[');
      expect(rebuiltXML).toContain(']]>');
    });

    it('should not create double-nested CDATA objects during processing', () => {
      // This test specifically addresses the bug that was fixed
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<teams version="1.0">
  <team id="test-team" name="Test Team" title="Test">
    <description>Test team</description>
    <agents>
      <agent id="test-agent" name="Test Agent" title="Test Agent">
        <persona>
          <role>Test role</role>
          <identity>Test identity</identity>
          <communication_style>Test style</communication_style>
          <principles>Test principles</principles>
        </persona>
        <commands>
          <command>
            <trigger>test-command</trigger>
            <description>Test command</description>
            <instructions><![CDATA[Test instructions]]></instructions>
          </command>
        </commands>
      </agent>
    </agents>
  </team>
</teams>`;

      // Multiple parse→build cycles should not create nested structures
      let currentXML = xmlContent;

      for (let i = 0; i < 3; i++) {
        const parsed = parseTeamsXML(currentXML);
        currentXML = buildTeamsXML(parsed);

        // Each cycle should produce valid XML without __cdata elements
        expect(currentXML).not.toContain('<__cdata>');
        expect(currentXML).not.toContain('</__cdata>');
        expect(currentXML).toContain('<![CDATA[Test instructions]]>');
      }

      // Final parse should still have string instructions
      const finalParsed = parseTeamsXML(currentXML);
      const finalInstructions =
        finalParsed.teams[0].agents![0].commands![0].instructions;
      expect(typeof finalInstructions).toBe('string');
      expect(finalInstructions).toBe('Test instructions');
    });
  });
});
