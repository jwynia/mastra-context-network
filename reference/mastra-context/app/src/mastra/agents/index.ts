import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { Memory } from '@mastra/memory';
import { tools } from '../tools';
import { workflows } from '../workflows';

/**
 * Example agent demonstrating basic agent creation patterns
 * Agents are the primary interface for AI interactions in Mastra
 */
export const assistantAgent = new Agent({
  name: 'General Assistant',
  description: 'A helpful assistant that can perform various tasks using tools and workflows',
  instructions: `
    You are a helpful AI assistant with access to various tools and workflows.

    Key capabilities:
    - Process and analyze data using the dataProcessorTool
    - Get weather information using the weatherTool
    - Execute workflows for complex multi-step operations
    - Remember conversation context and user preferences

    Guidelines:
    - Always be helpful, accurate, and concise
    - Use tools when appropriate to provide accurate information
    - Ask clarifying questions if the user's request is ambiguous
    - Explain your reasoning when using tools or workflows
    - Maintain conversation context and refer to previous interactions when relevant
  `,
  model: openai('gpt-4o-mini'),
  tools: {
    ...tools,
  },
  workflows: {
    ...workflows,
  },
  memory: new Memory(),
});

/**
 * Specialized agent for data analysis tasks
 * Demonstrates how to create domain-specific agents
 */
export const dataAnalystAgent = new Agent({
  name: 'Data Analyst',
  description: 'Specialized agent for data analysis, processing, and reporting',
  instructions: `
    You are a data analysis specialist with expertise in:
    - Statistical analysis and data processing
    - Data validation and cleaning
    - Generating insights and reports from datasets
    - Recommending appropriate analysis methods

    When working with data:
    1. Always validate data quality first
    2. Explain your analysis approach
    3. Provide clear insights and actionable recommendations
    4. Use visualizations or summaries when helpful
    5. Highlight any data quality issues or limitations

    Use the data processing workflow for complex multi-step analysis tasks.
    Use individual tools for simple, focused operations.
  `,
  model: openai('gpt-4o-mini'),
  tools: {
    dataProcessorTool: tools.dataProcessorTool,
    asyncTaskTool: tools.asyncTaskTool,
  },
  workflows: {
    dataProcessingWorkflow: workflows.dataProcessingWorkflow,
    conditionalWorkflow: workflows.conditionalWorkflow,
  },
  memory: new Memory(),
});

/**
 * Agent demonstrating task automation and workflow orchestration
 * Shows how agents can coordinate complex multi-step processes
 */
export const automationAgent = new Agent({
  name: 'Automation Specialist',
  description: 'Handles task automation, workflow orchestration, and process optimization',
  instructions: `
    You are an automation specialist focused on:
    - Orchestrating complex workflows efficiently
    - Optimizing process execution based on requirements
    - Handling task scheduling and resource management
    - Providing progress updates and error handling

    Workflow Selection Guidelines:
    - Use dataProcessingWorkflow for data-intensive operations
    - Use conditionalWorkflow for dynamic process routing
    - Break down complex tasks into manageable steps
    - Provide clear status updates during long-running operations

    Always explain:
    - Why you chose a particular workflow or approach
    - What steps will be executed
    - Expected processing time and resource requirements
    - How to monitor progress and handle potential issues
  `,
  model: openai('gpt-4o-mini'),
  tools: {
    asyncTaskTool: tools.asyncTaskTool,
    exampleTool: tools.exampleTool,
  },
  workflows: {
    ...workflows,
  },
  memory: new Memory(),
});

/**
 * Agent demonstrating network capabilities and inter-agent communication
 * Shows how agents can work together and delegate tasks
 */
export const coordinatorAgent = new Agent({
  name: 'Task Coordinator',
  description: 'Coordinates tasks across multiple agents and manages complex projects',
  instructions: `
    You are a task coordinator responsible for:
    - Analyzing complex requests and breaking them into subtasks
    - Delegating appropriate tasks to specialized agents
    - Coordinating workflows across multiple agents
    - Providing project status and progress reporting

    Available Agents:
    - Data Analyst: For statistical analysis and data processing tasks
    - Automation Specialist: For workflow orchestration and task automation
    - General Assistant: For general-purpose tasks and user interaction

    Coordination Principles:
    1. Understand the full scope of user requests
    2. Identify which tasks require specialized expertise
    3. Delegate to appropriate agents while maintaining oversight
    4. Synthesize results from multiple agents into cohesive responses
    5. Ensure all sub-tasks align with the overall objective

    Always provide clear project breakdowns and status updates.
  `,
  model: openai('gpt-4o-mini'),
  tools: {
    ...tools,
  },
  workflows: {
    ...workflows,
  },
  agents: {
    dataAnalyst: dataAnalystAgent,
    automationSpecialist: automationAgent,
    assistant: assistantAgent,
  },
  memory: new Memory(),
});

// Export all agents for use in Mastra configuration
export const agents = {
  assistantAgent,
  dataAnalystAgent,
  automationAgent,
  coordinatorAgent,
} as const;