# work teams - Human-AI Team Management Specification

This document specifies the **work teams** feature, which extends the work CLI with human-AI team management capabilities. Teams provide a structured way to organize agents and humans with defined roles, personas, workflows, and expertise areas.

---

## 1. Overview

The teams feature introduces human-centric collaboration to the work CLI by:

- Managing mixed human-AI teams with defined roles and expertise
- Providing agent personas, activation instructions, and custom workflows
- Enabling team-based work assignment and notification
- Supporting extensible team structures through XML configuration

### Core Principles

- **Human-AI Collaboration**: Teams can contain both humans and AI agents
- **Decoupled Architecture**: Teams are independent from existing work item management
- **Extensible Configuration**: XML-based team definitions with embedded workflows
- **Persona-Driven**: Rich persona definitions guide agent behavior and human interactions

---

## 2. File Structure and Storage

Teams are configured in the `.work/` directory using XML files:

```
.work/
├── teams.xml              # Main team configuration file
├── workflows/             # External workflow files (optional)
│   ├── scrum/
│   │   ├── daily-standup.md
│   │   ├── sprint-planning.md
│   │   ├── sprint-review.md
│   │   └── retrospective.md
│   └── research/
│       ├── literature-review.md
│       └── experiment-design.md
└── config.json           # Existing work CLI configuration
```

### teams.xml Schema

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!-- work teams - Team and member definitions -->
<!-- Generated: 2026-02-12T10:00:00Z -->

<teams>
  <team id="team_id" name="Team Name" title="Team Purpose" icon="🚀">
    <description>Brief description of team capabilities and scope</description>

    <agents>
      <agent id="agent_id" name="Agent_Name" title="Role_Title" icon="🤖">
        <persona>
          <role>Primary role description and specialization area</role>
          <identity>Background, experience, and expertise details</identity>
          <communication_style>How the agent communicates and interacts</communication_style>
          <principles>
            Key principles that guide the agent's behavior and decision making
          </principles>
        </persona>

        <commands>
          <command>
            <trigger>Command triggers or fuzzy match patterns</trigger>
            <description>Description of what this menu option does</description>
            <instructions>
              Step-by-step instructions for the command
            </instructions>
            <!-- Alternative: reference external workflow -->
            <workflow_id>workflow_identifier</workflow_id>
          </command>
        </commands>

        <activation critical="MANDATORY">
          <instructions>
            Step-by-step activation instructions for the agent
          </instructions>
        </activation>

        <workflows>
          <workflow id="workflow_identifier">
            <main_file><![CDATA[
---
name: Workflow Name
description: Workflow description
version: 1.0
---

# Workflow Content
Markdown content with YAML frontmatter
            ]]></main_file>
            <dependencies>
              <file path="workflows/scrum/daily-standup.md"><![CDATA[
---
name: Daily Standup
type: meeting
duration: 15min
---

# Daily Standup Workflow
Content goes here...
              ]]></file>
            </dependencies>
          </workflow>
        </workflows>
      </agent>
    </agents>

    <humans>
      <human id="human_id" name="Human Name" title="Role Title" icon="👤">
        <persona>
          <role>Primary role description and specialization area</role>
          <identity>Background, experience, and expertise details</identity>
          <communication_style>How the human communicates and interacts</communication_style>
          <principles>
            Key principles that guide the human behavior and decision making
          </principles>
          <expertise>Technical and domain expertise areas</expertise>
          <availability>Timezone, working hours, availability status</availability>
        </persona>

        <platforms>
          <github>username</github>
          <slack>U123456789</slack>
          <email>user@company.com</email>
        </platforms>

        <contact>
          <preferred_method>slack</preferred_method>
          <timezone>UTC-8</timezone>
          <working_hours>09:00-17:00</working_hours>
        </contact>
      </human>
    </humans>
  </team>
</teams>
```

---

## 3. Pre-installed Teams

The work CLI ships with two pre-configured teams:

### 3.1 Software Development Team (`sw-dev-team`)

```xml
<team id="sw-dev-team" name="Software Development Team"
      title="Agile Software Development" icon="💻">
  <description>
    Full-stack software development team specializing in agile methodologies,
    code review, testing, and deployment automation.
  </description>

  <agents>
    <agent id="tech-lead" name="Alex Chen" title="Technical Lead" icon="🎯">
      <persona>
        <role>Technical architecture, code review, and team coordination</role>
        <identity>Senior engineer with 8+ years experience in distributed systems</identity>
        <communication_style>Direct, analytical, focuses on technical trade-offs</communication_style>
        <principles>
          Code quality, scalability, maintainability, team growth
        </principles>
      </persona>
      <!-- Commands and workflows for code reviews, architecture decisions, etc. -->
    </agent>

    <agent id="scrum-master" name="Jordan Kim" title="Scrum Master" icon="📋">
      <persona>
        <role>Agile process facilitation and team productivity optimization</role>
        <identity>Certified Scrum Master with focus on team dynamics</identity>
        <communication_style>Collaborative, process-oriented, conflict resolution</communication_style>
        <principles>
          Team empowerment, continuous improvement, delivery excellence
        </principles>
      </persona>
      <!-- Commands for sprint planning, retrospectives, daily standups -->
    </agent>

    <agent id="qa-engineer" name="Sam Rodriguez" title="QA Engineer" icon="🔍">
      <persona>
        <role>Quality assurance, test automation, and bug triage</role>
        <identity>QA specialist with expertise in automated testing frameworks</identity>
        <communication_style>Detail-oriented, systematic, quality-focused</communication_style>
        <principles>
          User experience, reliability, comprehensive test coverage
        </principles>
      </persona>
      <!-- Commands for test planning, bug reporting, quality gates -->
    </agent>
  </agents>

  <humans>
    <human id="maintainer" name="Project Maintainer" title="Repository Owner" icon="👑">
      <persona>
        <role>Project oversight, strategic decisions, final approvals</role>
        <identity>Project owner with full repository access</identity>
        <communication_style>Strategic, decision-focused, high-level overview</communication_style>
        <principles>
          Product vision, team coordination, stakeholder communication
        </principles>
        <expertise>Project domain, business requirements, technical strategy</expertise>
        <availability>Primary timezone, responsive during business hours</availability>
      </persona>
    </human>
  </humans>
</team>
```

### 3.2 Research Team (`research-team`)

```xml
<team id="research-team" name="Research Team"
      title="Research and Analysis" icon="🔬">
  <description>
    Interdisciplinary research team focused on literature review,
    experiment design, data analysis, and knowledge synthesis.
  </description>

  <agents>
    <agent id="research-analyst" name="Dr. Riley Park" title="Research Analyst" icon="📊">
      <persona>
        <role>Data analysis, statistical modeling, and insight generation</role>
        <identity>PhD in data science with focus on experimental design</identity>
        <communication_style>Evidence-based, methodical, hypothesis-driven</communication_style>
        <principles>
          Scientific rigor, reproducibility, objective analysis
        </principles>
      </persona>
      <!-- Commands for data analysis, statistical tests, visualization -->
    </agent>

    <agent id="lit-reviewer" name="Dr. Casey Morgan" title="Literature Reviewer" icon="📚">
      <persona>
        <role>Literature review, source evaluation, and knowledge synthesis</role>
        <identity>Research librarian with expertise in academic databases</identity>
        <communication_style>Comprehensive, source-critical, synthesis-focused</communication_style>
        <principles>
          Thorough research, source credibility, comprehensive coverage
        </principles>
      </persona>
      <!-- Commands for literature search, source evaluation, summary generation -->
    </agent>
  </agents>

  <humans>
    <human id="principal-investigator" name="Principal Investigator" title="Research Lead" icon="🧪">
      <persona>
        <role>Research strategy, hypothesis formation, publication oversight</role>
        <identity>Senior researcher with domain expertise</identity>
        <communication_style>Strategic, hypothesis-focused, publication-oriented</communication_style>
        <principles>
          Research integrity, innovation, knowledge contribution
        </principles>
        <expertise>Domain specialization, research methodology, academic publishing</expertise>
        <availability>Academic schedule, project-dependent availability</availability>
      </persona>
    </human>
  </humans>
</team>
```

---

## 4. Command Interface

### 4.1 Core Team Commands

#### List Operations

```bash
# List all teams
work teams list

# List with details
work teams list --detailed

# Show specific team
work teams show <team-name>
work teams show sw-dev-team
```

#### Team Management

```bash
# Create new team
work teams create <team-name> [options]
work teams create mobile-dev --description "Mobile app development" --icon "📱"

# Edit team metadata
work teams edit <team-name> [options]
work teams edit mobile-dev --description "Updated description" --icon "📲"

# Remove team
work teams remove <team-name> [--force]
work teams remove mobile-dev --force
```

### 4.2 Member Management Commands

#### List Members

```bash
# List all team members (humans + agents)
work teams members <team-name>
work teams members sw-dev-team

# Filter by type
work teams members <team-name> --humans-only
work teams members <team-name> --agents-only

# List with roles and status
work teams members sw-dev-team --detailed
```

#### Show Member Details

```bash
# Show specific member (auto-detect type)
work teams member <team-name>/<member-id>
work teams member sw-dev-team/tech-lead

# Show specific human
work teams human <team-name>/<human-id>
work teams human sw-dev-team/maintainer

# Show specific agent
work teams agent <team-name>/<agent-id>
work teams agent sw-dev-team/scrum-master
```

#### Member Attributes

```bash
# Get member persona
work teams member <team-name>/<member-id> --persona
work teams member sw-dev-team/tech-lead --persona

# Get expertise areas
work teams member <team-name>/<member-id> --expertise

# Get contact information (humans only)
work teams human <team-name>/<human-id> --contact-info

# Get platform mappings
work teams member <team-name>/<member-id> --platform github
work teams human sw-dev-team/maintainer --github-username
```

### 4.3 Agent-Specific Commands

```bash
# Get agent activation instructions
work teams agent <team-name>/<agent-name> --activation
work teams agent sw-dev-team/tech-lead --activation

# Get agent persona details
work teams agent <team-name>/<agent-name> --persona

# Get agent commands/menu
work teams agent <team-name>/<agent-name> --commands
work teams agent sw-dev-team/scrum-master --commands

# Get specific workflow
work teams workflow <team-name>/<agent-name>/<workflow-id>
work teams workflow sw-dev-team/scrum-master/sprint-planning

# Get workflow with dependencies
work teams workflow <team-name>/<agent-name>/<workflow-id> --with-deps
```

### 4.4 Human-Specific Commands

```bash
# Add human to team
work teams add-human <team-name> <human-id> [options]
work teams add-human sw-dev-team sarah-chen \
  --name "Sarah Chen" \
  --title "Senior Developer" \
  --github "sarahc-dev" \
  --email "sarah@company.com" \
  --timezone "UTC-8"

# Show availability
work teams human <team-name>/<human-id> --availability
work teams human sw-dev-team/sarah-chen --availability

# Update human details
work teams edit-human <team-name>/<human-id> [options]
work teams edit-human sw-dev-team/sarah-chen \
  --title "Tech Lead" \
  --working-hours "10:00-18:00"
```

### 4.5 Agent Management

```bash
# Add agent to team
work teams add-agent <team-name> <agent-name> [options]
work teams add-agent sw-dev-team ui-specialist \
  --title "UI/UX Specialist" \
  --from-file ui-agent.xml

# Edit agent
work teams edit-agent <team-name>/<agent-name> [options]
work teams edit-agent sw-dev-team/ui-specialist --title "Senior UI Developer"

# Remove agent
work teams remove-agent <team-name>/<agent-name>
work teams remove-agent sw-dev-team/ui-specialist

# Import/Export agents
work teams export-agent <team-name>/<agent-name> --output agent.xml
work teams import-agent <team-name> --file agent.xml
```

### 4.6 Import/Export Operations

```bash
# Export entire team
work teams export <team-name> [options]
work teams export sw-dev-team --output sw-team.xml

# Export specific agent
work teams export <team-name> --agent <agent-name> --output agent.xml

# Import teams from file
work teams import --file teams-backup.xml

# Import with merge strategy
work teams import --file new-teams.xml --merge --conflict-strategy ask
```

### 4.7 Schema and Validation

```bash
# Show teams schema
work teams schema

# Validate teams.xml
work teams validate

# Validate with verbose output
work teams validate --verbose

# Show teams file location
work teams config

# Show config with validation status
work teams config --validate
```

---

## 5. XML Schema Details

### 5.1 Team Structure

Each team requires:

- **Unique ID**: Used for CLI addressing (`team-name/member-name`)
- **Descriptive metadata**: Name, title, icon, description
- **Members**: At least one agent or human
- **Versioning**: Optional schema version for future compatibility

### 5.2 Agent Schema

```xml
<agent id="agent_id" name="Display_Name" title="Role_Title" icon="emoji">
  <persona>
    <role>Primary role and specialization</role>
    <identity>Background and experience</identity>
    <communication_style>Interaction patterns</communication_style>
    <principles>Guiding values and decision criteria</principles>
  </persona>

  <commands>
    <command>
      <trigger>activation_pattern</trigger>
      <description>Command description</description>
      <instructions>Execution steps</instructions>
      <!-- OR -->
      <workflow_id>reference_to_workflow</workflow_id>
    </command>
  </commands>

  <activation critical="MANDATORY">
    <instructions>Agent initialization steps</instructions>
  </activation>

  <workflows>
    <workflow id="workflow_id">
      <main_file><![CDATA[
---
name: Workflow Name
description: Description
version: 1.0
dependencies: [file1.md, file2.md]
---
Workflow content in markdown...
      ]]></main_file>
      <dependencies>
        <file path="relative/path/to/dependency.md"><![CDATA[
Dependency file content...
        ]]></file>
      </dependencies>
    </workflow>
  </workflows>
</agent>
```

### 5.3 Human Schema

```xml
<human id="human_id" name="Display_Name" title="Role_Title" icon="emoji">
  <persona>
    <role>Primary role and responsibilities</role>
    <identity>Background and experience</identity>
    <communication_style>Preferred communication patterns</communication_style>
    <principles>Working principles and values</principles>
    <expertise>Technical and domain expertise areas</expertise>
    <availability>Schedule and availability information</availability>
  </persona>

  <platforms>
    <github>github_username</github>
    <slack>slack_user_id</slack>
    <email>email_address</email>
    <teams>teams_user_id</teams>
  </platforms>

  <contact>
    <preferred_method>slack|email|teams</preferred_method>
    <timezone>UTC_offset_or_name</timezone>
    <working_hours>HH:MM-HH:MM</working_hours>
    <status>available|busy|offline</status>
  </contact>
</human>
```

### 5.4 Workflow Schema

Workflows can be embedded in XML or stored as external files:

#### Embedded Workflows

```xml
<workflow id="daily-standup">
  <main_file><![CDATA[
---
name: Daily Standup
description: Team synchronization meeting
duration: 15min
participants: [team]
---

# Daily Standup Protocol

## Agenda
1. What did you accomplish yesterday?
2. What will you work on today?
3. Are there any blockers?

## Process
- Keep updates brief (2-3 minutes per person)
- Focus on blockers and dependencies
- Schedule detailed discussions after standup
  ]]></main_file>
</workflow>
```

#### External File References

```xml
<workflow id="sprint-planning">
  <main_file path="workflows/scrum/sprint-planning.md" />
  <dependencies>
    <file path="workflows/scrum/estimation-guide.md" />
    <file path="workflows/scrum/definition-of-done.md" />
  </dependencies>
</workflow>
```

---

## 6. Implementation Architecture

### 6.1 Component Structure

```
src/
├── cli/
│   └── teams/          # Team command implementations
│       ├── list.ts
│       ├── show.ts
│       ├── members.ts
│       ├── create.ts
│       └── validate.ts
├── core/
│   └── teams/          # Team management logic
│       ├── parser.ts   # XML parsing and validation
│       ├── manager.ts  # Team operations
│       ├── schema.ts   # XML schema definitions
│       └── types.ts    # TypeScript interfaces
└── types/
    └── teams.ts        # Public team interfaces
```

### 6.2 Key Types

```typescript
interface Team {
  id: string;
  name: string;
  title: string;
  icon: string;
  description: string;
  agents: Agent[];
  humans: Human[];
}

interface Agent {
  id: string;
  name: string;
  title: string;
  icon: string;
  persona: Persona;
  commands: Command[];
  activation: Activation;
  workflows: Workflow[];
}

interface Human {
  id: string;
  name: string;
  title: string;
  icon: string;
  persona: HumanPersona;
  platforms: PlatformMappings;
  contact: ContactInfo;
}

interface Workflow {
  id: string;
  mainFile: WorkflowFile;
  dependencies: WorkflowFile[];
}
```

### 6.3 CLI Integration

Teams commands integrate with existing work CLI architecture:

- Use oclif command framework
- Follow existing error handling patterns
- Integrate with work configuration system
- Support JSON output format for automation

### 6.4 File Management

- **Configuration Location**: `.work/teams.xml`
- **Workflow Storage**: `.work/workflows/` (optional external files)
- **Validation**: Permissive validation (warn but allow)
- **Backup**: Automatic backup before destructive operations

---

## 7. Validation Rules

### 7.1 Structural Validation

- **Team IDs**: Must be unique, alphanumeric with hyphens
- **Member IDs**: Unique within team, alphanumeric with hyphens
- **Required Fields**: All required XML elements must be present
- **Icon Format**: Single emoji character or empty

### 7.2 Content Validation

- **Workflow References**: External file paths validated for existence
- **Platform IDs**: Basic format validation for known platforms
- **Timezone**: Valid timezone names or UTC offsets
- **Working Hours**: Valid time format (HH:MM-HH:MM)

### 7.3 Validation Modes

```bash
# Strict validation (errors block operation)
work teams validate --strict

# Permissive validation (warnings only, default)
work teams validate

# Validation with auto-fix suggestions
work teams validate --suggest-fixes
```

---

## 8. Error Handling

### 8.1 Common Error Scenarios

- **File Not Found**: `.work/teams.xml` missing → offer to create default
- **Parse Errors**: Invalid XML → show line numbers and suggestions
- **Validation Errors**: Schema violations → detailed error messages
- **Duplicate IDs**: ID conflicts → suggest alternatives
- **Missing Dependencies**: Referenced files not found → warn but continue

### 8.2 Error Message Format

```
Error: Invalid team configuration
  File: .work/teams.xml:42
  Issue: Duplicate agent ID 'tech-lead' in team 'sw-dev-team'
  Suggestion: Use unique agent IDs like 'tech-lead-backend' or 'tech-lead-frontend'
```

### 8.3 Recovery Strategies

- **Backup Restoration**: Automatic backup before destructive operations
- **Partial Loading**: Load valid teams when some have errors
- **Default Generation**: Create default teams.xml with pre-installed teams

---

## 9. Future Integration Points

### 9.1 Work Item Integration

Future versions will integrate teams with the existing work item system:

```bash
# Assign work items to team members
work assign TASK-123 --to sw-dev-team/tech-lead
work assign TASK-124 --to sw-dev-team --role qa-engineer

# Filter by team member expertise
work list --assignee-expertise react
work list --team sw-dev-team --role frontend

# Team-based notifications
work notify --team sw-dev-team --priority critical
work notify --role tech-lead --channel slack
```

### 9.2 Context Integration

Teams will integrate with work contexts for scoped operations:

```bash
# Set team context
work context set gh-core --team sw-dev-team

# Team-scoped operations
work list --team-context
work assign --auto-assign --expertise react
```

### 9.3 Workflow Automation

Teams workflows will integrate with work item lifecycle:

```bash
# Trigger team workflows
work workflow run sw-dev-team/scrum-master/daily-standup

# Workflow-driven assignments
work workflow run sw-dev-team/tech-lead/code-review --item PR-456
```

---

## 10. Security and Privacy

### 10.1 Data Storage

- **Local Only**: All team data stored locally in `.work/` directory
- **No Remote Sync**: No automatic synchronization with external services
- **Version Control**: Teams configuration can be committed to git
- **Credential Separation**: Platform tokens stored separately from team definitions

### 10.2 Human Privacy

- **Minimal Data**: Only store essential contact and availability information
- **Optional Fields**: Most human attributes are optional
- **Pseudonymous IDs**: Use role-based IDs rather than real names when possible
- **Platform Isolation**: Platform-specific IDs stored separately

### 10.3 Access Control

- **File Permissions**: Standard file system permissions apply
- **No Authentication**: Teams are managed locally with no built-in authentication
- **Audit Trail**: Operations logged through standard work CLI logging

---

## 11. Migration and Compatibility

### 11.1 Version Compatibility

- **Schema Evolution**: XML schema versioned for backward compatibility
- **Migration Scripts**: Automated migration between schema versions
- **Deprecation Warnings**: Advance notice for breaking changes

### 11.2 Export/Import

```bash
# Export for backup
work teams export --all --output teams-backup.xml

# Import with conflict resolution
work teams import --file teams.xml --on-conflict merge|replace|skip

# Migrate from older versions
work teams migrate --from-version 1.0 --to-version 2.0
```

---

## 12. Performance Requirements

### 12.1 Operation Performance

- **Team List**: <100ms for up to 20 teams
- **Member Queries**: <50ms per member
- **Workflow Loading**: <200ms including dependencies
- **Validation**: <500ms for complete teams.xml

### 12.2 Memory Usage

- **Team Data**: <10MB total for reasonable team sizes
- **Workflow Cache**: <5MB per team for embedded workflows
- **Parser Memory**: <50MB peak during XML processing

---

## 13. Testing Strategy

### 13.1 Unit Tests

- **XML Parser**: Parse valid/invalid XML structures
- **Validation Engine**: Test all validation rules
- **Command Logic**: Test CLI command implementations
- **Type Safety**: Ensure TypeScript type correctness

### 13.2 Integration Tests

- **File Operations**: Test XML read/write operations
- **Command Integration**: Test full CLI command workflows
- **Error Handling**: Test error scenarios and recovery
- **Schema Migration**: Test version upgrade paths

### 13.3 End-to-End Tests

- **User Workflows**: Test complete user scenarios
- **Pre-installed Teams**: Verify default team configurations
- **Import/Export**: Test data portability
- **Performance**: Validate performance requirements

---

## 14. Documentation and Help

### 14.1 Built-in Help

```bash
# Command help
work teams --help
work teams list --help
work teams agent --help

# Schema documentation
work teams schema --format markdown
work teams schema --examples

# Configuration help
work teams config --help
work teams validate --explain
```

### 14.2 Example Files

The CLI includes example team configurations:

```bash
# Generate example teams.xml
work teams init --example

# Show example agent definition
work teams example --agent

# Show example human definition
work teams example --human
```

---

This specification provides a comprehensive foundation for implementing the work teams feature while maintaining consistency with the existing work CLI architecture and principles.
