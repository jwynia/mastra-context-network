# TypeScript LLM Agent Context Network Template
This project is a specialized template for building intelligent TypeScript agents using the Mastra framework with OpenRouter as the model provider (more info at https://jwynia.github.io/context-networks/). It provides a structured approach to managing the complex web of decisions, designs, and domain knowledge that underlies LLM agent development.

Unlike generic context networks, this template is tailored to address the unique knowledge management challenges of LLM agent development: model selection strategies, agent architecture patterns, tool integration complexities, workflow orchestration decisions, and the gap between "how we designed the agent" and "what we built" creates dangerous knowledge silos in the rapidly evolving AI agent ecosystem.

## Project Structure

This template uses a clear separation between planning and implementation:

```
project-root/
├── .context-network.md          # Discovery file
├── README.md                    # This file
├── .gitignore                   # Root-level git ignores
├── .devcontainer/               # Development container config
├── context-network/             # All planning & architecture docs
└── app/                         # Your TypeScript LLM agent project goes here
```

The `app/` directory is where your actual TypeScript LLM agent project will live - everything that would normally be in a Mastra agent project root. This keeps the context network and development tooling separate from your agent implementation code.

## Getting Started

To use this TypeScript LLM Agent context network template:

1. **Clone this template** for your new TypeScript LLM agent project
2. **Connect with an LLM agent** that has file access to all files in the project folder (via IDE coding tools like Cursor or VSCode with Cline)
3. **Set up the prompts** (see below) to ensure the agent understands context networks
4. **Initialize your agent project** in the `app/` directory using Mastra:
   - `cd app && npm init` for a basic TypeScript project
   - `cd app && npm install @mastra/core @mastra/cli` for Mastra framework
   - `cd app && npx @mastra/cli init` to initialize Mastra project structure
   - Set up OpenRouter API key: `export OPENROUTER_API_KEY=your_key_here`
5. **Start a planning conversation** describing your LLM agent goals, capabilities, and constraints
6. **Let the agent enhance the context network** with your project-specific agent information
7. **Begin development tasks** with clear separation between planning (context network) and implementation (app/)

This template maintains a clear boundary between knowledge artifacts (context network) and implementation artifacts (app/), allowing your team to document "why" and "how" separately from the TypeScript agent code that represents "what is."

## Cost
Because context networks are a relatively cutting-edge approach to collaboration with LLM AI agents, these tools do cost money and some of the best of them can cost more money than you may be expecting. The costs on such things are dropping and much of what we're doing with context networks is figuring out the ways to work that will be more widespread next year and beyond, when these costs drop. If these tools are too expensive for your budget, that probably means you need to wait a bit.

## Tools
Cursor (https://www.cursor.com/) is an all-in-one that comes with LLM chat and an agent that can act on the files.

Cursor is built on VSCode (https://code.visualstudio.com/), which is a more generic code/text editor that can have plugins added. One we use a lot with context networks is Cline (https://cline.bot/). Cline's agent can be pointed at a wide range of LLM APIs that you use your own keys/billing for or their own management of that. For LLM agent development, we recommend using OpenRouter (https://openrouter.ai/) which provides access to multiple LLM providers through a unified API, perfect for building agents that need access to different models for different tasks.

## Patterns
### Prompts
For whatever agent you use, you need to include instructions in the system prompt or custom instructions that tell it about context networks and how to navigate them. The prompt in /inbox/custom-instructions-prompt.md is the one a lot of people are using for Cline with Claude Sonnet as the model.

Add it in either your agent's configuration screen or via its file-based prompt management system.

### TypeScript LLM Agent Specific Documentation Patterns
This template includes specialized patterns for LLM agent documentation:

1. **Agent Architecture Decision Records** - Document agent design patterns and model selection choices
2. **Tool Integration Strategies** - Document tool composition, external API integrations, and capability decisions
3. **Workflow Orchestration Patterns** - Document step-based execution, branching logic, and parallel processing
4. **Model Selection Guidelines** - Document OpenRouter model choices, cost optimization, and performance tuning
5. **Memory Management Strategy** - Document conversation persistence, context handling, and semantic search
6. **Security and Safety Patterns** - Document prompt injection protection, input sanitization, and API security
7. **Agent Performance Registry** - Track model performance, cost optimization, and capability improvements

### Plan/Act and Specific Scope
Cline and many other agents have multiple modes, usually offering one that lets you have a conversation with it separate from it taking action on files. In Cline, that's "Plan". In that mode, it won't make any changes to your files.

Use that mode aggressively to get to a specific plan for what will happen when you toggle to act. That plan should have a clear definition of what "done" will look like, should be as close to a single action as possible.

That often means that the action is to detail out a list of tasks that you'll actually have the agent do separately, one at a time. The "do one thing" can mean break the existing scope down another level to get to a more detailed plan. 

Basically, the more specific the action that Act mode or its equivalent is given, the better job it will do at managing token budget, at not volunteering to do a bunch of extra things,  and the more likely it does something you've already had a chance to approve.

### Monitor and Interrupt
The more you actually read and monitor what your agent is doing for anything that you disagree with or sounds incorrect and step in to interrupt, the better your context network will mature. Like hiring a new assistant, where for the first few weeks, you have to tell them your preferences and ways you want things done, it pays off over the long haul.

Interrupt, flip to Plan mode, and ask things like:

* How can we document into the context network a way of working so we don't repeat (the problem/misunderstanding above)?
* I'd really prefer we always write out a plan with tasks before doing things ad hoc. How can we clarify what's in the context network to make that our process going forward?


### Retrospective
At the end of tasks and periodically AS a new task, ask how things could be improved. For task end, "What from this conversation and task should be documented in the context network?" For periodic retrospectives, "What have we learned in this project that could be used to improve the context network for our efforts going forward?"

## TypeScript LLM Agent Project Success Metrics

This context network template helps measure success through:

- **Time to first functional agent** for new LLM agent developers
- **Agent architecture decision speed** and confidence
- **Model selection consistency** and cost optimization across team members
- **Frequency of "archaeology" requests** (digging for lost agent design knowledge)
- **Documentation coverage** of agents, tools, workflows, and integrations
- **Decision traceability** for model choices and agent architecture decisions
- **Documentation update frequency** relative to agent code and capability changes
- **Developer confidence** in building and modifying intelligent agents
- **Stakeholder understanding** of agent capabilities, limitations, and costs
- **Reduction in repeated LLM integration and agent architecture mistakes**
- **Tool integration management** clarity and reliability
- **Agent deployment and monitoring** understanding and effectiveness
- **Cost optimization** through intelligent model selection and usage patterns
- **Agent response quality** and consistency improvements over time

By maintaining a well-structured context network alongside your TypeScript LLM agent codebase, your team builds a shared brain that enables faster agent development, better architectural decisions, and more confident evolution of intelligent agent systems in the rapidly advancing AI ecosystem.
