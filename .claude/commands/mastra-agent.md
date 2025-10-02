# Create Mastra Agent

You are a Mastra framework specialist responsible for creating new agents following established patterns and best practices.

## Task
$ARGUMENTS

## Process

### Phase 1: Requirements Analysis
1. **Parse the request** to understand:
   - Agent name and purpose
   - Required capabilities (tools, workflows, memory)
   - Target domain or use case
   - Integration requirements

2. **Validate requirements** against Mastra patterns:
   - Agent purpose is specific and focused
   - Tool composition makes sense for the domain
   - Memory requirements are appropriate
   - Instructions are clear and actionable

3. **Check existing components**:
   - Look for similar agents in the codebase
   - Identify reusable tools and workflows
   - Check for naming conflicts

### Phase 2: Agent Design
1. **Design agent architecture**:
   - Define agent name, description, and instructions
   - Select appropriate model (default: gpt-4o-mini)
   - Plan tool composition strategy
   - Determine memory requirements
   - Identify workflow dependencies

2. **Create detailed instructions**:
   - Define agent's role and capabilities
   - Explain when to use each tool
   - Set response patterns and behavior guidelines
   - Include domain-specific knowledge

3. **Plan integration**:
   - How agent fits into existing system
   - Dependencies on other agents/components
   - API exposure requirements

### Phase 3: Implementation
1. **Create agent file** in `src/mastra/agents/`:
   - Follow naming convention: `[purpose]-agent.ts`
   - Implement using established patterns
   - Include proper TypeScript typing
   - Add comprehensive JSDoc documentation

2. **Update agent registry** in `src/mastra/agents/index.ts`:
   - Export new agent
   - Add to agents object for Mastra configuration

3. **Update main Mastra configuration** in `src/mastra/index.ts`:
   - Register agent in Mastra instance
   - Ensure proper dependency injection

### Phase 4: Documentation and Testing
1. **Create comprehensive documentation**:
   - Agent purpose and capabilities
   - Usage examples
   - Tool and workflow descriptions
   - Integration instructions

2. **Implement tests**:
   - Unit tests for agent configuration
   - Integration tests for tool usage
   - Mock tests for external dependencies

3. **Update project documentation**:
   - README updates if needed
   - API documentation updates
   - Usage examples

## Implementation Guidelines

### Agent Structure Template
```typescript
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { Memory } from '@mastra/memory';

export const [agentName]Agent = new Agent({
  name: '[Agent Display Name]',
  description: '[Clear description of agent purpose and capabilities]',
  instructions: `
    [Comprehensive instructions including:]
    - Agent role and expertise
    - Available tools and when to use them
    - Response patterns and behavior
    - Domain-specific guidelines
    - Error handling approach
  `,
  model: openai('gpt-4o-mini'),
  tools: {
    // Include relevant tools for agent's domain
  },
  workflows: {
    // Include relevant workflows if needed
  },
  memory: new Memory({
    // Configure memory if conversation persistence needed
  }),
  // Include sub-agents if delegation is required
  agents: {
    // Sub-agents for specialized tasks
  },
});
```

### Tool Selection Guidelines
- **Data Processing**: Include data validation, transformation, and analysis tools
- **API Integration**: Include HTTP request tools and integration helpers
- **Content Generation**: Include text processing and formatting tools
- **Specialized Domain**: Include domain-specific tools for the agent's expertise

### Instruction Writing Best Practices
1. **Be Specific**: Clear, actionable instructions
2. **Include Context**: Explain the agent's domain and purpose
3. **Tool Guidance**: When and how to use each tool
4. **Response Format**: Expected response structure and style
5. **Error Handling**: How to handle failures and edge cases
6. **Examples**: Include usage examples in instructions

### Memory Configuration
```typescript
// For conversational agents
memory: new Memory({
  maxTokens: 8000,
  maxMessages: 20,
})

// For agents that don't need conversation history
// Omit memory property

// For agents with special memory needs
memory: new Memory({
  maxTokens: 16000,
  maxMessages: 50,
  summarization: true,
})
```

## Quality Checklist

### Agent Implementation
- [ ] Agent follows naming conventions
- [ ] Clear, specific purpose and description
- [ ] Comprehensive instructions with examples
- [ ] Appropriate tool composition
- [ ] Proper memory configuration
- [ ] TypeScript types are correct
- [ ] JSDoc documentation complete

### Integration
- [ ] Agent exported from agents/index.ts
- [ ] Registered in main Mastra configuration
- [ ] No naming conflicts with existing agents
- [ ] Dependencies properly resolved

### Testing
- [ ] Unit tests for agent configuration
- [ ] Tests for tool usage patterns
- [ ] Integration tests with Mastra instance
- [ ] Mock tests for external dependencies
- [ ] Error handling tests

### Documentation
- [ ] Agent purpose clearly documented
- [ ] Usage examples provided
- [ ] Tool capabilities explained
- [ ] Integration instructions clear
- [ ] API documentation updated

## File Locations

### Agent Implementation
- **Agent File**: `src/mastra/agents/[agent-name].ts`
- **Agent Registry**: `src/mastra/agents/index.ts`
- **Main Config**: `src/mastra/index.ts`

### Tests
- **Unit Tests**: `src/mastra/agents/__tests__/[agent-name].test.ts`
- **Integration Tests**: `tests/integration/agents/[agent-name].test.ts`

### Documentation
- **Agent Docs**: Update relevant documentation files
- **API Docs**: Update API documentation if agent is exposed
- **Examples**: Add usage examples to documentation

## Common Agent Patterns

### 1. Data Analysis Agent
```typescript
export const dataAnalystAgent = new Agent({
  name: 'Data Analyst',
  description: 'Specialized in data analysis, visualization, and insights',
  instructions: `
    You are a data analysis expert. Use the following approach:
    1. Validate data quality first
    2. Apply appropriate statistical methods
    3. Generate clear insights and recommendations
    4. Provide visualizations when helpful
  `,
  tools: {
    dataValidationTool,
    statisticalAnalysisTool,
    visualizationTool,
  },
  memory: new Memory(),
});
```

### 2. API Integration Agent
```typescript
export const apiIntegrationAgent = new Agent({
  name: 'API Integration Specialist',
  description: 'Handles external API integrations and data synchronization',
  instructions: `
    You specialize in API integrations. Your process:
    1. Validate API endpoints and authentication
    2. Handle rate limiting and retries
    3. Transform data between formats
    4. Provide clear error messages
  `,
  tools: {
    httpRequestTool,
    dataTransformTool,
    authenticationTool,
  },
});
```

### 3. Coordinator Agent
```typescript
export const coordinatorAgent = new Agent({
  name: 'Task Coordinator',
  description: 'Coordinates complex tasks across multiple specialized agents',
  instructions: `
    You coordinate complex projects by:
    1. Breaking down requests into subtasks
    2. Delegating to appropriate specialists
    3. Monitoring progress and dependencies
    4. Synthesizing results into cohesive responses
  `,
  tools: {
    taskPlanningTool,
    progressTrackingTool,
  },
  agents: {
    dataAnalyst: dataAnalystAgent,
    apiSpecialist: apiIntegrationAgent,
  },
  memory: new Memory(),
});
```

## Success Criteria

### Functional Success
- [ ] Agent integrates properly with Mastra framework
- [ ] All tools function correctly within agent context
- [ ] Memory persistence works as expected
- [ ] Agent follows established patterns

### Code Quality Success
- [ ] Code follows project style guidelines
- [ ] Comprehensive test coverage
- [ ] Clear documentation
- [ ] No TypeScript errors

### Integration Success
- [ ] Agent works with existing system
- [ ] No conflicts with other components
- [ ] Proper error handling
- [ ] Performance meets requirements

## Notes

### Important Considerations
- Agents should have focused, specific purposes
- Tool composition should match agent expertise
- Instructions should be comprehensive but concise
- Memory configuration should match usage patterns
- Integration with existing system should be seamless

### Common Pitfalls
- Overly broad agent purposes
- Insufficient or unclear instructions
- Poor tool selection for agent domain
- Missing error handling
- Inadequate testing