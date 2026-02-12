/**
 * Type definitions for the work teams XML-based team management system.
 *
 * These types represent the structure defined in docs/work-teams-specification.md
 * and follow the readonly pattern established in src/types/context.ts.
 */

export interface Persona {
  readonly role: string;
  readonly identity: string;
  readonly communication_style: string;
  readonly principles: string;
}

export interface HumanPersona extends Persona {
  readonly expertise?: string | undefined;
  readonly availability?: string | undefined;
}

export interface Command {
  readonly trigger: string;
  readonly description: string;
  readonly instructions?: string | undefined;
  readonly workflow_id?: string | undefined;
}

export interface Activation {
  readonly critical: boolean;
  readonly instructions: string;
}

export interface WorkflowFile {
  readonly path?: string | undefined;
  readonly content: string; // CDATA content
}

export interface Workflow {
  readonly id: string;
  readonly main_file: WorkflowFile;
  readonly dependencies?: readonly WorkflowFile[] | undefined;
}

export interface PlatformMappings {
  readonly github?: string | undefined;
  readonly slack?: string | undefined;
  readonly email?: string | undefined;
  readonly teams?: string | undefined;
}

export interface ContactInfo {
  readonly preferred_method?: string | undefined;
  readonly timezone?: string | undefined;
  readonly working_hours?: string | undefined;
  readonly status?: string | undefined;
}

export interface Agent {
  readonly id: string;
  readonly name: string;
  readonly title: string;
  readonly icon?: string | undefined;
  readonly persona: Persona;
  readonly commands?: readonly Command[] | undefined;
  readonly activation?: Activation | undefined;
  readonly workflows?: readonly Workflow[] | undefined;
}

export interface Human {
  readonly id: string;
  readonly name: string;
  readonly title: string;
  readonly icon?: string | undefined;
  readonly persona: HumanPersona;
  readonly platforms?: PlatformMappings | undefined;
  readonly contact?: ContactInfo | undefined;
}

export interface Team {
  readonly id: string;
  readonly name: string;
  readonly title: string;
  readonly icon?: string | undefined;
  readonly description: string;
  readonly agents?: readonly Agent[] | undefined;
  readonly humans?: readonly Human[] | undefined;
}

export interface TeamsData {
  readonly teams: readonly Team[];
  readonly version?: string | undefined;
}

// Member union type for commands that work with any member
export type Member = Agent | Human;

// Helper type guards
export const isAgent = (member: Member): member is Agent => {
  return (
    'activation' in member || 'commands' in member || 'workflows' in member
  );
};

export const isHuman = (member: Member): member is Human => {
  return 'platforms' in member || 'contact' in member;
};

// Request types for editing operations
export interface CreateTeamRequest {
  readonly id: string;
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly icon?: string | undefined;
}

export interface UpdateTeamRequest {
  readonly name?: string | undefined;
  readonly title?: string | undefined;
  readonly description?: string | undefined;
  readonly icon?: string | undefined;
}

export interface CreateAgentRequest {
  readonly id: string;
  readonly name: string;
  readonly title: string;
  readonly icon?: string | undefined;
  readonly persona: Persona;
  readonly commands?: readonly Command[] | undefined;
  readonly activation?: Activation | undefined;
  readonly workflows?: readonly Workflow[] | undefined;
}

export interface UpdateAgentRequest {
  readonly name?: string | undefined;
  readonly title?: string | undefined;
  readonly icon?: string | undefined;
  readonly persona?: Persona | undefined;
  readonly commands?: readonly Command[] | undefined;
  readonly activation?: Activation | undefined;
  readonly workflows?: readonly Workflow[] | undefined;
}

export interface CreateHumanRequest {
  readonly id: string;
  readonly name: string;
  readonly title: string;
  readonly icon?: string | undefined;
  readonly persona: HumanPersona;
  readonly platforms?: PlatformMappings | undefined;
  readonly contact?: ContactInfo | undefined;
}

export interface UpdateHumanRequest {
  readonly name?: string | undefined;
  readonly title?: string | undefined;
  readonly icon?: string | undefined;
  readonly persona?: HumanPersona | undefined;
  readonly platforms?: PlatformMappings | undefined;
  readonly contact?: ContactInfo | undefined;
}
