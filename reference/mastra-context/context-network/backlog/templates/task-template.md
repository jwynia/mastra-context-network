# Task: {{TITLE}}

**ID**: task-{{TASK_ID}}
**Type**: {{TYPE}}
**Priority**: {{PRIORITY}}
**Status**: {{STATUS}}
**Assignee**: {{ASSIGNEE}}
**Estimate**: {{ESTIMATE}}
**Created**: {{CREATED_DATE}}
**Updated**: {{UPDATED_DATE}}

## Summary

Brief description of what this task accomplishes and why it's needed.

## Context

### Background
Provide context for why this task is necessary:
- What problem does it solve?
- How does it fit into the larger feature/epic?
- What is the business/technical justification?

### Related Work
- **Feature**: [link to parent feature]
- **Epic**: [link to parent epic]
- **Dependencies**: [list of blocking tasks]
- **Related Tasks**: [list of related tasks]

## Requirements

### Functional Requirements
What the implementation must do:
1. **Requirement 1**: Detailed description
2. **Requirement 2**: Detailed description
3. **Requirement 3**: Detailed description

### Non-Functional Requirements
- **Performance**: [specific performance requirements]
- **Security**: [security considerations]
- **Accessibility**: [accessibility requirements]
- **Compatibility**: [compatibility requirements]

### Mastra-Specific Requirements
For Mastra projects, specify which components are affected:

#### Agents
- [ ] Create new agent: [agent name and purpose]
- [ ] Modify existing agent: [agent name and changes needed]
- [ ] Agent instructions updates: [instruction changes]
- [ ] Agent tool composition: [tools to add/remove]

#### Tools
- [ ] Create new tool: [tool name and functionality]
- [ ] Modify existing tool: [tool name and changes]
- [ ] Tool schema updates: [input/output schema changes]
- [ ] Tool error handling: [error scenarios to handle]

#### Workflows
- [ ] Create new workflow: [workflow name and purpose]
- [ ] Modify existing workflow: [workflow name and changes]
- [ ] Add workflow steps: [step descriptions]
- [ ] Update workflow schemas: [schema changes]

#### APIs and Integration
- [ ] Create API endpoints: [endpoint paths and methods]
- [ ] Modify existing endpoints: [changes needed]
- [ ] MCP server updates: [MCP changes]
- [ ] A2A communication: [agent-to-agent features]

#### Storage and Memory
- [ ] Database schema changes: [schema modifications]
- [ ] Memory configuration: [memory setup changes]
- [ ] Data migration: [migration requirements]
- [ ] Storage provider updates: [storage changes]

## Acceptance Criteria

### Primary Scenarios

#### Scenario 1: [Main Success Path]
**Given** [initial conditions]
**When** [action is performed]
**Then** [expected result]
**And** [additional expected outcomes]

#### Scenario 2: [Alternative Path]
**Given** [initial conditions]
**When** [action is performed]
**Then** [expected result]
**And** [additional expected outcomes]

#### Scenario 3: [Error/Edge Case]
**Given** [initial conditions]
**When** [action is performed]
**Then** [expected error handling]
**And** [additional expected behaviors]

### Technical Acceptance Criteria
- [ ] Implementation follows project coding standards
- [ ] All functions have proper error handling
- [ ] Input validation implemented with Zod schemas
- [ ] TypeScript types are properly defined
- [ ] Code is documented with JSDoc comments
- [ ] Unit tests achieve minimum coverage (80%+)
- [ ] Integration tests verify component interaction
- [ ] Performance requirements are met
- [ ] Security requirements are satisfied

### Quality Gates
- [ ] Code compiles without errors
- [ ] All tests pass (unit, integration, E2E)
- [ ] Linting passes with no errors
- [ ] Type checking passes with no errors
- [ ] Security scan passes (if applicable)
- [ ] Code review completed and approved
- [ ] Documentation updated
- [ ] Manual testing completed

## Implementation Plan

### Approach
Describe the high-level implementation approach:
- **Architecture**: How will this fit into the existing system?
- **Design Patterns**: What patterns will be used?
- **Dependencies**: What external libraries or systems are needed?
- **Data Flow**: How will data move through the system?

### Implementation Steps
1. **Step 1**: [Detailed description]
   - Specific actions to take
   - Files to create/modify
   - Expected outcome

2. **Step 2**: [Detailed description]
   - Specific actions to take
   - Files to create/modify
   - Expected outcome

3. **Step 3**: [Detailed description]
   - Specific actions to take
   - Files to create/modify
   - Expected outcome

### File Changes
List specific files that will be created or modified:

#### New Files
- `src/mastra/agents/{{agent-name}}.ts` - Agent implementation
- `src/mastra/tools/{{tool-name}}.ts` - Tool implementation
- `src/mastra/workflows/{{workflow-name}}.ts` - Workflow implementation
- `src/api/{{endpoint-name}}.ts` - API endpoint
- `tests/{{component}}.test.ts` - Test file

#### Modified Files
- `src/mastra/index.ts` - Register new components
- `src/api/index.ts` - Add new routes
- `README.md` - Update documentation
- `package.json` - Add dependencies (if needed)

## Technical Implementation Details

### Code Examples

#### Tool Implementation Example (if creating a tool)
```typescript
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const {{toolName}}Tool = createTool({
  id: '{{tool-id}}',
  description: '{{tool-description}}',
  inputSchema: z.object({
    // Define input schema
    param1: z.string().describe('Parameter description'),
    param2: z.number().optional().describe('Optional parameter'),
  }),
  execute: async ({ context }) => {
    // Implementation logic
    const { param1, param2 } = context;

    try {
      // Tool logic here
      const result = await performOperation(param1, param2);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'OPERATION_FAILED',
          message: error.message,
        },
      };
    }
  },
});
```

#### Agent Implementation Example (if creating an agent)
```typescript
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { Memory } from '@mastra/memory';

export const {{agentName}}Agent = new Agent({
  name: '{{Agent Name}}',
  description: '{{Agent description}}',
  instructions: `
    {{Detailed agent instructions}}
  `,
  model: openai('gpt-4o-mini'),
  tools: {
    // Add relevant tools
    {{toolName}}Tool,
  },
  workflows: {
    // Add relevant workflows
  },
  memory: new Memory(),
});
```

#### Workflow Implementation Example (if creating a workflow)
```typescript
import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';

export const {{workflowName}}Workflow = createWorkflow({
  id: '{{workflow-id}}',
  description: '{{workflow-description}}',
  inputSchema: z.object({
    // Define input schema
  }),
  outputSchema: z.object({
    // Define output schema
  }),
});

const step1 = createStep({
  id: 'step-1',
  description: 'First step description',
  inputSchema: z.object({
    // Step input schema
  }),
  outputSchema: z.object({
    // Step output schema
  }),
  execute: async ({ inputData }) => {
    // Step implementation
    return { /* step output */ };
  },
});

{{workflowName}}Workflow.then(step1).commit();
```

### Configuration Changes
If this task requires configuration changes:

#### Environment Variables
```bash
# New environment variables to add to .env
{{ENV_VAR_NAME}}={{default_value}}
{{ANOTHER_VAR}}={{default_value}}
```

#### Package Dependencies
```json
// New dependencies to add to package.json
{
  "dependencies": {
    "{{package-name}}": "^{{version}}"
  },
  "devDependencies": {
    "{{dev-package}}": "^{{version}}"
  }
}
```

## Testing Plan

### Unit Tests
Describe unit tests to be written:
- **Test File**: `tests/{{component}}.test.ts`
- **Test Coverage**: [specific functions/methods to test]
- **Test Scenarios**: [key scenarios to verify]

#### Test Examples
```typescript
describe('{{ComponentName}}', () => {
  it('should handle valid input correctly', async () => {
    // Test implementation
  });

  it('should handle invalid input gracefully', async () => {
    // Test implementation
  });

  it('should handle errors appropriately', async () => {
    // Test implementation
  });
});
```

### Integration Tests
- **Integration Points**: [systems/components being integrated]
- **Test Scenarios**: [integration scenarios to verify]
- **Mock Requirements**: [external dependencies to mock]

### Manual Testing
- **Test Cases**: [manual test scenarios]
- **Test Environment**: [where to test]
- **Test Data**: [test data requirements]

### Mastra-Specific Testing
- **Agent Testing**: Verify agent responses and tool usage
- **Tool Testing**: Test tool execution with various inputs
- **Workflow Testing**: Verify workflow step execution
- **API Testing**: Test HTTP endpoints and MCP integration
- **Memory Testing**: Verify conversation persistence

## Dependencies

### Technical Dependencies
- **Internal**: [internal components this depends on]
- **External**: [external libraries or services]
- **Infrastructure**: [infrastructure requirements]

### Task Dependencies
- **Blocks**: [tasks that this task blocks]
- **Blocked by**: [tasks that block this task]
- **Related**: [tasks that are related but not blocking]

### Resource Dependencies
- **Team Members**: [specific expertise needed]
- **External Teams**: [other teams' involvement needed]
- **Tools/Systems**: [access to specific tools or systems]

## Risks and Mitigation

### Technical Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| [Risk description] | High/Med/Low | High/Med/Low | [Mitigation strategy] |

### Timeline Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| [Risk description] | High/Med/Low | High/Med/Low | [Mitigation strategy] |

### Quality Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| [Risk description] | High/Med/Low | High/Med/Low | [Mitigation strategy] |

## Progress Tracking

### Status Updates
- **{{DATE}}**: [status update]
- **{{DATE}}**: [status update]
- **{{DATE}}**: [status update]

### Blockers and Issues
- **Issue 1**: [description and resolution plan]
- **Issue 2**: [description and resolution plan]

### Completed Milestones
- [ ] Milestone 1: [description]
- [ ] Milestone 2: [description]
- [ ] Milestone 3: [description]

## Documentation

### Documentation Updates Required
- [ ] API documentation updates
- [ ] User guide updates
- [ ] Technical documentation updates
- [ ] Code comments and inline documentation
- [ ] README updates

### Documentation Locations
- **API Docs**: [location of API documentation]
- **User Docs**: [location of user documentation]
- **Technical Docs**: [location of technical documentation]

## Definition of Done

### Implementation Complete
- [ ] All code written and committed
- [ ] Code follows project standards
- [ ] Error handling implemented
- [ ] Input validation added
- [ ] TypeScript types defined
- [ ] Code documented

### Testing Complete
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Manual testing completed
- [ ] Performance testing completed (if applicable)
- [ ] Security testing completed (if applicable)
- [ ] All tests passing in CI/CD

### Review and Quality
- [ ] Code review completed
- [ ] Linting passes
- [ ] Type checking passes
- [ ] Security scan passes (if applicable)
- [ ] Performance benchmarks met

### Documentation and Deployment
- [ ] Documentation updated
- [ ] Deployment guide updated (if needed)
- [ ] Configuration documented
- [ ] Ready for production deployment

---

## Template Usage Instructions

When creating a new task:

1. **Copy this template** to `context-network/backlog/active/task-[ID]-[name].md`
2. **Replace all {{PLACEHOLDER}}** values with actual information
3. **Delete sections** that don't apply to your specific task
4. **Customize sections** based on task type (feature, bug, refactor, etc.)
5. **Link to related work** (features, epics, other tasks)
6. **Update regularly** as work progresses

### Placeholder Definitions
- `{{TITLE}}`: Descriptive task title using action verbs
- `{{TASK_ID}}`: Unique task identifier (001, 002, etc.)
- `{{TYPE}}`: feature/bug/refactor/test/docs/chore
- `{{PRIORITY}}`: High/Medium/Low
- `{{STATUS}}`: todo/in-progress/review/blocked/done
- `{{ASSIGNEE}}`: Person responsible for the task
- `{{ESTIMATE}}`: Size (XS/S/M/L/XL) or story points (1,2,3,5,8)
- `{{CREATED_DATE}}`: When task was created
- `{{UPDATED_DATE}}`: Last modification date