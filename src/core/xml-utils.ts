/**
 * XML parsing and writing utilities for teams.xml using fast-xml-parser.
 *
 * Configured with safe defaults and CDATA handling for workflow content.
 * Follows security best practices by disabling DTD processing and external entities.
 */

import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { TeamsData, Team, Agent, Human } from '../types/teams.js';

// Parser configuration with safe defaults and CDATA support
const parserOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  cdataPropName: '__cdata',
  commentPropName: '#comment',
  ignoreDeclaration: true,
  ignorePiTags: true,
  parseTagValue: true,
  parseNodeValue: true,
  parseAttributeValue: true,
  trimValues: true,
  parseTrueNumberOnly: false,
  arrayMode: false,
  alwaysCreateTextNode: false,
  // Security: Disable DTD processing and external entities
  processEntities: false,
  htmlEntities: false,
  ignoreNameSpace: true,
  allowBooleanAttributes: false,
};

// Builder configuration matching parser settings
const builderOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  cdataPropName: '__cdata',
  commentPropName: '#comment',
  format: true,
  indentBy: '  ',
  processEntities: false,
  suppressEmptyNode: false,
  suppressUnpairedNode: true,
  suppressBooleanAttributes: false,
  tagValueProcessor: (_tagName: string, tagValue: unknown): string => {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return String(tagValue ?? '');
  },
  attributeValueProcessor: (_attrName: string, attrValue: unknown): string => {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return String(attrValue ?? '');
  },
};

/**
 * Parse XML string into TeamsData object structure.
 * Handles CDATA sections and validates basic XML structure.
 */
export function parseTeamsXML(xmlContent: string): TeamsData {
  const parser = new XMLParser(parserOptions);

  try {
    // Using any type with eslint disable for XML parser output
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unnecessary-type-assertion
    const result = parser.parse(xmlContent) as any;

    if (!result || typeof result !== 'object') {
      throw new Error('Invalid XML structure: Root element missing');
    }

    // Handle root element (teams or root)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const rootData = result.teams || result;

    if (!rootData) {
      throw new Error('Invalid XML structure: teams element missing');
    }

    // Ensure teams is always an array for consistent processing
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    let teams = rootData.team;
    if (!teams) {
      teams = [];
    } else if (!Array.isArray(teams)) {
      teams = [teams];
    }

    // Process teams to convert XML structure to TypeScript interfaces
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const processedTeams: Team[] = teams.map((team: any) =>
      processTeamFromXML(team)
    );

    return {
      teams: processedTeams,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      version: rootData['@_version'] || undefined,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`XML parsing failed: ${error.message}`);
    }
    throw new Error('XML parsing failed: Unknown error');
  }
}

/**
 * Build XML string from TeamsData object structure.
 * Generates properly formatted XML with CDATA sections for workflows.
 */
export function buildTeamsXML(teamsData: TeamsData): string {
  const builder = new XMLBuilder(builderOptions);

  try {
    // Convert TeamsData to XML-friendly structure
    const xmlData = {
      teams: {
        ...(teamsData.version && { '@_version': teamsData.version }),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        team: teamsData.teams.map(team => processTeamToXML(team)),
      },
    };

    const xmlContent = builder.build(xmlData);

    // Ensure proper XML declaration
    if (!xmlContent.startsWith('<?xml')) {
      return `<?xml version="1.0" encoding="UTF-8"?>\\n${xmlContent}`;
    }

    return xmlContent;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`XML building failed: ${error.message}`);
    }
    throw new Error('XML building failed: Unknown error');
  }
}

/**
 * Validate XML structure against expected schema.
 * Performs basic validation of required elements and attributes.
 */
export function validateXMLStructure(xmlContent: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  try {
    const teamsData = parseTeamsXML(xmlContent);

    if (!teamsData.teams || !Array.isArray(teamsData.teams)) {
      errors.push('teams element must contain team array');
    }

    for (const [index, team] of teamsData.teams.entries()) {
      const teamPrefix = `Team ${index + 1}`;

      if (!team.id) {
        errors.push(`${teamPrefix}: id attribute is required`);
      }

      if (!team.name) {
        errors.push(`${teamPrefix}: name attribute is required`);
      }

      if (!team.title) {
        errors.push(`${teamPrefix}: title attribute is required`);
      }

      if (!team.description) {
        errors.push(`${teamPrefix}: description element is required`);
      }

      // Validate at least one member exists
      const hasMembers =
        (team.agents && team.agents.length > 0) ||
        (team.humans && team.humans.length > 0);
      if (!hasMembers) {
        errors.push(`${teamPrefix}: must contain at least one agent or human`);
      }

      // Validate agents
      if (team.agents) {
        for (const [agentIndex, agent] of team.agents.entries()) {
          const agentPrefix = `${teamPrefix} Agent ${agentIndex + 1}`;

          if (!agent.id) {
            errors.push(`${agentPrefix}: id attribute is required`);
          }

          if (!agent.name) {
            errors.push(`${agentPrefix}: name attribute is required`);
          }
        }
      }

      // Validate humans
      if (team.humans) {
        for (const [humanIndex, human] of team.humans.entries()) {
          const humanPrefix = `${teamPrefix} Human ${humanIndex + 1}`;

          if (!human.id) {
            errors.push(`${humanPrefix}: id attribute is required`);
          }

          if (!human.name) {
            errors.push(`${humanPrefix}: name attribute is required`);
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown parsing error';
    return {
      isValid: false,
      errors: [`XML parsing error: ${message}`],
    };
  }
}

/**
 * Convert XML team element to Team interface
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function processTeamFromXML(xmlTeam: any): Team {
  // Process agents
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  let agents = xmlTeam.agents?.agent;
  if (agents && !Array.isArray(agents)) {
    agents = [agents];
  }

  // Process humans
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  let humans = xmlTeam.humans?.human;
  if (humans && !Array.isArray(humans)) {
    humans = [humans];
  }

  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    id: xmlTeam['@_id'] || '',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    name: xmlTeam['@_name'] || '',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    title: xmlTeam['@_title'] || '',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    icon: xmlTeam['@_icon'] || undefined,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    description: xmlTeam.description || '',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    agents: agents
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        agents.map((agent: any) => processAgentFromXML(agent))
      : undefined,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    humans: humans
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        humans.map((human: any) => processHumanFromXML(human))
      : undefined,
  };
}

/**
 * Convert XML agent element to Agent interface
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function processAgentFromXML(xmlAgent: any): Agent {
  // Process commands
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  let commands = xmlAgent.commands?.command;
  if (commands && !Array.isArray(commands)) {
    commands = [commands];
  }

  // Process workflows
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  let workflows = xmlAgent.workflows?.workflow;
  if (workflows && !Array.isArray(workflows)) {
    workflows = [workflows];
  }

  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    id: xmlAgent['@_id'] || '',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    name: xmlAgent['@_name'] || '',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    title: xmlAgent['@_title'] || '',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    icon: xmlAgent['@_icon'] || undefined,
    persona: {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      role: xmlAgent.persona?.role || '',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      identity: xmlAgent.persona?.identity || '',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      communication_style: xmlAgent.persona?.communication_style || '',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      principles: xmlAgent.persona?.principles || '',
    },
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    commands: commands
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        commands.map((cmd: any) => ({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          trigger: cmd.trigger || '',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          description: cmd.description || '',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          instructions: cmd.instructions || cmd.__cdata || undefined,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          workflow_id: cmd.workflow_id || undefined,
        }))
      : undefined,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    activation: xmlAgent.activation
      ? {
          critical:
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            xmlAgent.activation['@_critical'] === 'MANDATORY' ||
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            xmlAgent.activation['@_critical'] === 'true',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          instructions:
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            xmlAgent.activation.instructions ||
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            xmlAgent.activation.__cdata ||
            '',
        }
      : undefined,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    workflows: workflows
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        workflows.map((wf: any) => ({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          id: wf['@_id'] || '',
          main_file: {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            content: wf.main_file?.__cdata || wf.main_file || '',
          },
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          dependencies: wf.dependencies?.file
            ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              Array.isArray(wf.dependencies.file)
              ? // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                wf.dependencies.file.map((f: any) => ({
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                  path: f['@_path'],
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                  content: f.__cdata || f['#text'] || '',
                }))
              : [
                  {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    path: wf.dependencies.file['@_path'],
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    content:
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                      wf.dependencies.file.__cdata ||
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                      wf.dependencies.file['#text'] ||
                      '',
                  },
                ]
            : undefined,
        }))
      : undefined,
  };
}

/**
 * Convert XML human element to Human interface
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function processHumanFromXML(xmlHuman: any): Human {
  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    id: xmlHuman['@_id'] || '',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    name: xmlHuman['@_name'] || '',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    title: xmlHuman['@_title'] || '',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    icon: xmlHuman['@_icon'] || undefined,
    persona: {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      role: xmlHuman.persona?.role || '',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      identity: xmlHuman.persona?.identity || '',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      communication_style: xmlHuman.persona?.communication_style || '',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      principles: xmlHuman.persona?.principles || '',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      expertise: xmlHuman.persona?.expertise || undefined,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      availability: xmlHuman.persona?.availability || undefined,
    },
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    platforms: xmlHuman.platforms
      ? {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          github: xmlHuman.platforms.github || undefined,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          slack: xmlHuman.platforms.slack || undefined,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          email: xmlHuman.platforms.email || undefined,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          teams: xmlHuman.platforms.teams || undefined,
        }
      : undefined,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    contact: xmlHuman.contact
      ? {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          preferred_method: xmlHuman.contact.preferred_method || undefined,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          timezone: xmlHuman.contact.timezone || undefined,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          working_hours: xmlHuman.contact.working_hours || undefined,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          status: xmlHuman.contact.status || undefined,
        }
      : undefined,
  };
}

/**
 * Convert Team interface to XML structure
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function processTeamToXML(team: Team): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const xmlTeam: any = {
    '@_id': team.id,
    '@_name': team.name,
    '@_title': team.title,
    ...(team.icon && { '@_icon': team.icon }),
    description: team.description,
  };

  if (team.agents && team.agents.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    xmlTeam.agents = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      agent: team.agents.map(agent => processAgentToXML(agent)),
    };
  }

  if (team.humans && team.humans.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    xmlTeam.humans = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      human: team.humans.map(human => processHumanToXML(human)),
    };
  }

  return xmlTeam;
}

/**
 * Convert Agent interface to XML structure
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function processAgentToXML(agent: Agent): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const xmlAgent: any = {
    '@_id': agent.id,
    '@_name': agent.name,
    '@_title': agent.title,
    ...(agent.icon && { '@_icon': agent.icon }),
    persona: {
      role: agent.persona.role,
      identity: agent.persona.identity,
      communication_style: agent.persona.communication_style,
      principles: agent.persona.principles,
    },
  };

  if (agent.commands && agent.commands.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    xmlAgent.commands = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      command: agent.commands.map((cmd: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const xmlCmd: any = {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          trigger: cmd.trigger,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          description: cmd.description,
        };

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (cmd.instructions) {
          // Handle both string and already-parsed CDATA objects
          if (typeof cmd.instructions === 'string') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            xmlCmd.instructions = { __cdata: cmd.instructions };
          } else if (
            cmd.instructions &&
            typeof cmd.instructions === 'object' &&
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
            (cmd.instructions as any).__cdata
          ) {
            // Already a CDATA object from parsing, use as-is
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            xmlCmd.instructions = cmd.instructions;
          } else {
            // Fallback for other types - convert to string then wrap
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            xmlCmd.instructions = { __cdata: String(cmd.instructions) };
          }
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (cmd.workflow_id) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          xmlCmd.workflow_id = cmd.workflow_id;
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return xmlCmd;
      }),
    };
  }

  if (agent.activation) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    xmlAgent.activation = {
      '@_critical': agent.activation.critical ? 'MANDATORY' : 'false',
      instructions:
        typeof agent.activation.instructions === 'string'
          ? { __cdata: agent.activation.instructions }
          : agent.activation.instructions &&
              typeof agent.activation.instructions === 'object' &&
              // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
              (agent.activation.instructions as any).__cdata
            ? agent.activation.instructions
            : { __cdata: String(agent.activation.instructions) },
    };
  }

  if (agent.workflows && agent.workflows.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    xmlAgent.workflows = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      workflow: agent.workflows.map((wf: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const xmlWorkflow: any = {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          '@_id': wf.id,
          main_file:
            typeof wf.main_file.content === 'string'
              ? { __cdata: wf.main_file.content }
              : wf.main_file.content &&
                  typeof wf.main_file.content === 'object' &&
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
                  (wf.main_file.content as any).__cdata
                ? wf.main_file.content
                : { __cdata: String(wf.main_file.content) },
        };

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (wf.dependencies && wf.dependencies.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          xmlWorkflow.dependencies = {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
            file: wf.dependencies.map((dep: any) => ({
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
              '@_path': dep.path,
              ...(typeof dep.content === 'string'
                ? { __cdata: dep.content }
                : dep.content &&
                    typeof dep.content === 'object' &&
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
                    (dep.content as any).__cdata
                  ? dep.content
                  : { __cdata: String(dep.content) }),
            })),
          };
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return xmlWorkflow;
      }),
    };
  }

  return xmlAgent;
}

/**
 * Convert Human interface to XML structure
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function processHumanToXML(human: Human): any {
  return {
    '@_id': human.id,
    '@_name': human.name,
    '@_title': human.title,
    ...(human.icon && { '@_icon': human.icon }),
    persona: {
      role: human.persona.role,
      identity: human.persona.identity,
      communication_style: human.persona.communication_style,
      principles: human.persona.principles,
      ...(human.persona.expertise && { expertise: human.persona.expertise }),
      ...(human.persona.availability && {
        availability: human.persona.availability,
      }),
    },
    ...(human.platforms && {
      platforms: {
        ...(human.platforms.github && { github: human.platforms.github }),
        ...(human.platforms.slack && { slack: human.platforms.slack }),
        ...(human.platforms.email && { email: human.platforms.email }),
        ...(human.platforms.teams && { teams: human.platforms.teams }),
      },
    }),
    ...(human.contact && {
      contact: {
        ...(human.contact.preferred_method && {
          preferred_method: human.contact.preferred_method,
        }),
        ...(human.contact.timezone && { timezone: human.contact.timezone }),
        ...(human.contact.working_hours && {
          working_hours: human.contact.working_hours,
        }),
        ...(human.contact.status && { status: human.contact.status }),
      },
    }),
  };
}
