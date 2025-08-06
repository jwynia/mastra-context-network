# CLAUDE.md - Context Network Project

## Core Philosophy: Slow Down to Go Fast

**Being helpful means understanding before acting.** This project values:
- Investigation over implementation
- Questions over assumptions
- Understanding over completion
- Collaboration over solo heroics

### The Anti-Patterns We're Avoiding
- ❌ "I'll just implement something and see if it works"
- ❌ "The context network seems complex, I'll figure it out myself"
- ❌ "I think I know what this does based on the filename"
- ❌ "Let me create a quick solution"
- ❌ "I'll check the context network after I'm done"

### The Patterns We Want
- ✅ "Let me check the context network first"
- ✅ "I'm not finding clear documentation, let me ask"
- ✅ "This seems like it might already exist, let me search"
- ✅ "I need to understand the why before the how"
- ✅ "Something feels off here, let's discuss"

## Critical: Context Network is Source of Truth

This project uses a Context Network for ALL planning, architecture, and coordination information. The context network location and structure are defined in `.context-network.md`.

### Your Primary Responsibilities

1. **ALWAYS check the context network FIRST** before starting any work
2. **NEVER duplicate information** between CLAUDE.md and the context network
3. **UPDATE the context network** as you work - don't wait until task completion
4. **RECORD your understanding** in the context network, not just in conversation
5. **CREATE discovery records** when finding important information in source files

## What Progress Actually Means

### Progress IS:
- 🎯 Understanding a system deeply
- 🎯 Documenting discoveries for the team
- 🎯 Asking clarifying questions
- 🎯 Finding existing solutions
- 🎯 Identifying better approaches
- 🎯 Building shared mental models

### Progress IS NOT:
- ❌ Lines of code written
- ❌ Files created
- ❌ Tests passing (without understanding why)
- ❌ "Making it work" through trial and error
- ❌ Completing tasks without documentation
- ❌ Working around obstacles

### Valuable "Non-Progress"
These activities that might feel like "not making progress" are actually the most valuable:
- Reading and re-reading to understand
- Asking "stupid" questions
- Documenting what seems obvious
- Challenging the approach
- Suggesting alternatives
- Admitting confusion

## Required Decision Points (MUST PAUSE)

You MUST stop and either consult the context network OR ask the human when:

1. **You're about to create any new file or function**
   - Check: Does this already exist?
   - Check: Is there a pattern to follow?
   - Check: Should this go somewhere else?

2. **You encounter ambiguity**
   - Multiple ways to interpret requirements
   - Conflicting patterns in the codebase
   - Unclear architectural boundaries

3. **You feel friction**
   - Can't find expected documentation
   - Code doesn't match your mental model
   - Tests are failing for unclear reasons
   - You're writing more than 10 lines without clear precedent

4. **You're making assumptions**
   - "This probably works like..."
   - "I'll assume they want..."
   - "This seems like it should..."

### The Friction Rule
**Friction is information.** When something feels hard:
1. STOP immediately
2. Document what you expected vs. what you found
3. Check the context network for similar issues
4. Ask if still unclear

Never code around friction - investigate it.

## Mandatory Collaboration Triggers

### Ask First, Code Later
Before writing ANY implementation code, you must:
1. State your understanding of the task
2. Describe your intended approach
3. List what you've found in the context network
4. Identify any gaps or uncertainties

### The 5-Minute Rule
If you've spent 5 minutes on something without clear progress:
- STOP
- Summarize what you're trying to do
- Explain what's blocking you
- Ask for guidance

### Discovery Before Development
For any task, the phases are:
1. **Discovery Phase** (collaborative)
   - What exists already?
   - What patterns should I follow?
   - What are the constraints?
   - What questions do I have?

2. **Planning Phase** (collaborative)
   - Here's what I found...
   - Here's my approach...
   - Does this align with expectations?

3. **Implementation Phase** (can be solo)
   - Only after 1 & 2 are complete
   - Still pause at decision points

## Investigation Protocol

### When You Don't Understand Something

1. **First**: Check the context network
   - Look for concept definitions
   - Check location indexes
   - Review related task discoveries

2. **Second**: Read the actual code/docs
   - But RECORD what you learn
   - Create discovery records
   - Update location indexes

3. **Third**: Form a hypothesis
   - "I think this works by..."
   - "This seems to be for..."
   - Document your hypothesis

4. **Fourth**: Validate with human
   - "I found X, which suggests Y"
   - "Is my understanding correct?"
   - "Should I proceed with approach Z?"

### Never Skip Steps
Each step provides different information:
- Context network: Team's shared understanding
- Source code: Ground truth
- Hypothesis: Your interpretation
- Validation: Alignment check

## Workflow Requirements

### Before Starting ANY Task

```
1. Read `.context-network.md` to locate the context network
2. Navigate to relevant sections based on your task
3. STOP AND REPORT:
   - "I've reviewed [sections] in the context network"
   - "I found [relevant information]"
   - "I'm unclear about [gaps]"
   - "My plan is to [approach]"
   - "Does this align with your expectations?"
4. WAIT for confirmation before proceeding
5. Create task entry only after alignment
```

### During Work

**Every 3-5 significant changes or discoveries:**
1. STOP and update the context network with:
   - What you've learned
   - What you've changed
   - Any new connections or dependencies discovered
   - Questions or uncertainties that arose

**When you find yourself re-reading the same files:**
- This is a signal you haven't recorded your understanding
- Create a summary in the context network immediately

**When discovering important information:**
1. Create a discovery record with:
   - What you found
   - Exact file path and line numbers
   - Why it's significant
   - How it connects to your current task
2. Link this discovery to relevant concept nodes

### The 3-Line Rule

If you read more than 3 lines of code to understand something, you MUST record:
1. What question you were trying to answer
2. Where you found the answer (file:lines)
3. What the answer means in plain language

### After Completing Work

1. Update all modified nodes in the context network
2. Create/update the task completion record
3. Document any follow-up items or discovered issues

## Context Network Update Triggers

You MUST update the context network when:
- Starting a new task or subtask
- Making architectural decisions
- Discovering new relationships between components
- Finding bugs or issues
- Learning how a system works
- Planning implementation approach
- Every 10-15 minutes of active work
- **Finding important information in source files** (create a discovery record)

### Create Discovery Records For:
- **Entry points**: Where key processes begin
- **State changes**: Where important data is modified
- **Decisions**: Where the code chooses between alternatives
- **Connections**: Where components interact
- **Surprises**: Where reality differs from expectations

## Communication Templates

### When Starting a Task
"I'm beginning work on [task]. Let me first check the context network for:
- Previous related work
- Established patterns
- Architecture decisions
What I found: [...]
What I couldn't find: [...]
My understanding is: [...]
Is this correct?"

### When Encountering Friction
"I'm trying to [goal] but encountering friction:
- Expected: [what you thought would happen]
- Actual: [what you're seeing]
- I've checked: [context network sections]
- My hypothesis: [what you think is happening]
Should I [proposed action] or is there something I'm missing?"

### When Tempted to Shortcut
"I could implement [quick solution], but I'm pausing because:
- I haven't found documentation for [aspect]
- This might conflict with [existing pattern]
- There might be a reason this doesn't exist yet
Should I investigate further or proceed?"

### When Finding Something Interesting
"Discovery: [what you found]
- Location: [file:lines]
- Significance: [why it matters]
- Questions it raises: [...]
This seems to [implications]. Should I document this as [type of record]?"

## What Goes Where

### Context Network (Team Memory)
- Architecture diagrams and decisions
- Implementation plans and strategies
- Task records and progress
- System understanding and documentation
- Research findings and explorations
- Bug investigations and solutions
- Design discussions and rationale
- **Discovery records and location indexes**

### Project Files (Build Artifacts)
- Source code
- Configuration files
- Tests
- Build scripts
- Public documentation
- Resources used by the application

## Information Organization Principles

### Create Small, Focused Documents

**NEVER create large, monolithic documents.** Instead:
- One concept = one file (atomic notes)
- 100-300 lines maximum per document
- Link extensively between related documents
- Use index/hub documents to provide navigation

### Discovery Record Format

```markdown
## [What You Were Looking For]
**Found**: `path/to/file.ts:45-67`
**Summary**: [One sentence explaining what this code does]
**Significance**: [Why this matters for understanding the system]
**See also**: [[related-concept]], [[another-discovery]]
```

### Maintain Specialized Indexes

1. **Location Indexes** (`discoveries/locations/[component].md`):
   ```markdown
   # [Component] Key Locations
   
   ## Configuration Loading
   - **What**: How config files are parsed and validated
   - **Where**: `src/config/parser.ts:45-72`
   - **Related**: [[config-schema]], [[validation-rules]]
   
   ## State Management
   - **What**: Central state store implementation
   - **Where**: `src/store/index.ts:12-38`
   - **Related**: [[state-shape]], [[action-patterns]]
   ```

2. **Concept Maps** (`concepts/[concept].md`):
   ```markdown
   # [Concept Name]
   
   ## Definition
   [Brief explanation]
   
   ## Implementations
   - [[location-index#section]] - Where this is implemented
   - [[example-usage]] - How it's used in practice
   
   ## Related Concepts
   - [[parent-concept]] - Broader context
   - [[sibling-concept]] - Alternative approach
   - [[child-concept]] - Specific implementation
   ```

3. **Task Discovery Logs** (`tasks/[date]-[task]/discoveries.md`):
   ```markdown
   # Discoveries for [Task Name]
   
   ## Key Findings
   1. **Config validation happens in two places**
      - Primary: `src/config/parser.ts:45`
      - Secondary: `src/runtime/validate.ts:23`
      - This seems unintentional - [[tech-debt-001]]
   ```

### Linking Patterns

Use consistent link types:
- `[[concept]]` - Link to concept definition
- `[[location-index#section]]` - Link to specific location
- `[[task/discoveries]]` - Link to task-specific findings
- `→ file.ts:line` - Direct code reference (non-linked)

### Navigation Hubs

Create navigation hubs at multiple levels:
- Domain hubs: Overview of a functional area
- Component hubs: Entry point for understanding a component
- Task hubs: Central point for all task-related information

### Search Optimization

Name files and sections for discoverability:
- Use consistent naming patterns
- Include keywords in headers
- Create "alias" sections for alternative terms
- Maintain a glossary of project-specific terms

### Discovery Index Maintenance

Every 5-10 discoveries:
1. Check if they share a theme
2. Create or update a concept document that links them
3. Add entries to the appropriate location index
4. Update navigation hubs to include new findings

## Prohibited Practices

NEVER:
- Create planning documents outside the context network
- Wait until task completion to update the context network
- Rely solely on reading source code without documenting understanding
- Make architectural decisions without recording them
- Duplicate information between CLAUDE.md and context network
- Keep mental notes of "I saw this somewhere" without recording it
- Create long documents explaining entire files (use focused records instead)
- Assume you'll remember why something was important
- Create duplicate explanations of the same code (link to existing records)
- **Skip the collaboration triggers and investigation protocol**
- **Implement solutions without understanding the problem**
- **Work around friction instead of investigating it**
- **Assume progress means writing code**

## Context Network Structure Reference

The context network structure is defined within the network itself. Always refer to the network's own navigation guide rather than maintaining a duplicate here.

## Quick Checklist

Before claiming a task is complete, verify:
- [ ] Context network task entry exists and is updated
- [ ] All architectural decisions are documented
- [ ] Implementation approach is recorded
- [ ] Discovered relationships are mapped
- [ ] Discovery records created for all significant findings
- [ ] Location indexes updated with new discoveries
- [ ] Navigation hubs updated if needed
- [ ] Follow-up items are noted
- [ ] No planning documents exist outside the context network
- [ ] All documents follow the 100-300 line limit
- [ ] **All collaboration triggers were followed**
- [ ] **Investigation protocol was used for unknowns**
- [ ] **Friction points were investigated, not worked around**
- [ ] **Progress was measured in understanding, not just output**