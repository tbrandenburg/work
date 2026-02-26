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
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
function processAgentFromXML(xmlAgent: any): Agent {
  // Process commands
   
  let commands = xmlAgent.commands?.command;
  if (commands && !Array.isArray(commands)) {
    commands = [commands];
  }

  // Process workflows
   
  let workflows = xmlAgent.workflows?.workflow;
  if (workflows && !Array.isArray(workflows)) {
    workflows = [workflows];
  }

  return {
     
    id: xmlAgent['@_id'] || '',
     
    name: xmlAgent['@_name'] || '',
     
    title: xmlAgent['@_title'] || '',
     
    icon: xmlAgent['@_icon'] || undefined,
    persona: {
       
      role: xmlAgent.persona?.role || '',
       
      identity: xmlAgent.persona?.identity || '',
       
      communication_style: xmlAgent.persona?.communication_style || '',
       
      principles: xmlAgent.persona?.principles || '',
    },
     
    commands: commands
      ?  
        commands.map((cmd: any) => ({
           
          trigger: cmd.trigger || '',
           
          description: cmd.description || '',
           
          instructions:
            cmd.instructions &&
            typeof cmd.instructions === 'object' &&
            cmd.instructions.__cdata
              ? cmd.instructions.__cdata
              : cmd.instructions || cmd.__cdata || undefined,
           
          workflow_id: cmd.workflow_id || undefined,
        }))
      : undefined,
     
    activation: xmlAgent.activation
      ? {
          critical:
             
            xmlAgent.activation['@_critical'] === 'MANDATORY' ||
             
            xmlAgent.activation['@_critical'] === 'true',
           
          instructions:
             
            xmlAgent.activation.instructions &&
            typeof xmlAgent.activation.instructions === 'object' &&
            xmlAgent.activation.instructions.__cdata
              ? xmlAgent.activation.instructions.__cdata
              : xmlAgent.activation.instructions ||
                 
                xmlAgent.activation.__cdata ||
                '',
        }
      : undefined,
     
    workflows: workflows
      ?  
        workflows.map((wf: any) => ({
           
          id: wf['@_id'] || '',
          main_file: {
             
            content:
              wf.main_file &&
              typeof wf.main_file === 'object' &&
              wf.main_file.__cdata
                ? wf.main_file.__cdata
                : wf.main_file?.__cdata || wf.main_file || '',
          },
           
          dependencies: wf.dependencies?.file
            ?  
              Array.isArray(wf.dependencies.file)
              ?  
                wf.dependencies.file.map((f: any) => ({
                   
                  path: f['@_path'],
                   
                  content: f.__cdata || f['#text'] || '',
                }))
              : [
                  {
                     
                    path: wf.dependencies.file['@_path'],
                     
                    content:
                       
                      wf.dependencies.file.__cdata ||
                       
                      wf.dependencies.file['#text'] ||
                      '',
                  },
                ]
            : undefined,
        }))
      : undefined,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */

/**
 * Convert XML human element to Human interface
 */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
function processHumanFromXML(xmlHuman: any): Human {
  return {
     
    id: xmlHuman['@_id'] || '',
     
    name: xmlHuman['@_name'] || '',
     
    title: xmlHuman['@_title'] || '',
     
    icon: xmlHuman['@_icon'] || undefined,
    persona: {
       
      role: xmlHuman.persona?.role || '',
       
      identity: xmlHuman.persona?.identity || '',
       
      communication_style: xmlHuman.persona?.communication_style || '',
       
      principles: xmlHuman.persona?.principles || '',
       
      expertise: xmlHuman.persona?.expertise || undefined,
       
      availability: xmlHuman.persona?.availability || undefined,
    },
     
    platforms: xmlHuman.platforms
      ? {
           
          github: xmlHuman.platforms.github || undefined,
           
          slack: xmlHuman.platforms.slack || undefined,
           
          email: xmlHuman.platforms.email || undefined,
           
          teams: xmlHuman.platforms.teams || undefined,
        }
      : undefined,
     
    contact: xmlHuman.contact
      ? {
           
          preferred_method: xmlHuman.contact.preferred_method || undefined,
           
          timezone: xmlHuman.contact.timezone || undefined,
           
          working_hours: xmlHuman.contact.working_hours || undefined,
           
          status: xmlHuman.contact.status || undefined,
        }
      : undefined,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */

/**
 * Convert Team interface to XML structure
 */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unnecessary-type-assertion */
function processTeamToXML(team: Team): any {
   
  const xmlTeam: any = {
    '@_id': team.id,
    '@_name': team.name,
    '@_title': team.title,
    ...(team.icon && { '@_icon': team.icon }),
    description: team.description,
  };

  if (team.agents && team.agents.length > 0) {
     
    xmlTeam.agents = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      agent: team.agents.map(agent => processAgentToXML(agent)),
    };
  }

  if (team.humans && team.humans.length > 0) {
     
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
 
function processAgentToXML(agent: Agent): any {
   
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
     
    xmlAgent.commands = {
       
      command: agent.commands.map((cmd: any) => {
         
        const xmlCmd: any = {
           
          trigger: cmd.trigger,
           
          description: cmd.description,
        };

         
         
        if (cmd.instructions) {
          // Handle both string and already-parsed CDATA objects
          if (typeof cmd.instructions === 'string') {
             
            xmlCmd.instructions = { __cdata: cmd.instructions };
          } else if (
            cmd.instructions &&
            typeof cmd.instructions === 'object' &&
             
            (cmd.instructions as any).__cdata
          ) {
            // Already a CDATA object from parsing, extract string content only
             
            xmlCmd.instructions = {
              __cdata: String((cmd.instructions as any).__cdata),
            };
          } else {
            // Fallback for other types - convert to string then wrap
             
            xmlCmd.instructions = { __cdata: String(cmd.instructions) };
          }
        }

         
        if (cmd.workflow_id) {
           
          xmlCmd.workflow_id = cmd.workflow_id;
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return xmlCmd;
      }),
    };
  }

  if (agent.activation) {
     
    xmlAgent.activation = {
      '@_critical': agent.activation.critical ? 'MANDATORY' : 'false',
      instructions:
        typeof agent.activation.instructions === 'string'
          ? { __cdata: agent.activation.instructions }
          : agent.activation.instructions &&
              typeof agent.activation.instructions === 'object' &&
               
              (agent.activation.instructions as any).__cdata
            ? {
                __cdata: String((agent.activation.instructions as any).__cdata),
              }
            : { __cdata: String(agent.activation.instructions) },
    };
  }

  if (agent.workflows && agent.workflows.length > 0) {
     
    xmlAgent.workflows = {
       
      workflow: agent.workflows.map((wf: any) => {
         
        const xmlWorkflow: any = {
           
           
          '@_id': wf.id,
          main_file:
            typeof wf.main_file.content === 'string'
              ? { __cdata: wf.main_file.content }
              : wf.main_file.content &&
                  typeof wf.main_file.content === 'object' &&
                   
                  (wf.main_file.content as any).__cdata
                ? { __cdata: String((wf.main_file.content as any).__cdata) }
                : { __cdata: String(wf.main_file.content) },
        };

         
        if (wf.dependencies && wf.dependencies.length > 0) {
           
          xmlWorkflow.dependencies = {
             
             
            file: wf.dependencies.map((dep: any) => ({
               
              '@_path': dep.path,
              ...(typeof dep.content === 'string'
                ? { __cdata: dep.content }
                : dep.content &&
                    typeof dep.content === 'object' &&
                     
                    (dep.content as any).__cdata
                  ? { __cdata: String((dep.content as any).__cdata) }
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
