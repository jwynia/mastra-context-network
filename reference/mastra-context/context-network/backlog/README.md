# Backlog Management System

## Overview

This backlog management system provides structured task breakdown and organization for Mastra-based projects. It emphasizes **granular task definition**, **clear acceptance criteria**, and **estimation accuracy** to enable both human developers and AI agents to work efficiently.

## Directory Structure

```
backlog/
├── README.md              # This file - system overview
├── templates/             # Task and story templates
│   ├── feature-template.md       # Full feature breakdown
│   ├── task-template.md          # Individual task template
│   ├── bug-template.md           # Bug report template
│   └── spike-template.md         # Research/investigation template
├── active/                # Current iteration tasks
│   ├── sprint-current.md         # Current sprint backlog
│   ├── task-001-auth.md          # Individual task files
│   └── task-002-workflow.md     # Organized by task ID
└── completed/             # Completed tasks archive
    ├── 2024-q1/                  # Organized by quarter
    └── task-archives/            # Individual completed tasks
```

## Task Lifecycle

### 1. Backlog Creation
- **Features** start as high-level descriptions in `templates/feature-template.md`
- **Tasks** are broken down from features using `templates/task-template.md`
- **Bugs** are documented using `templates/bug-template.md`
- **Spikes** for research use `templates/spike-template.md`

### 2. Sprint Planning
- Tasks move from templates to `active/sprint-current.md`
- Each task gets a unique ID and individual file in `active/`
- Estimation and priority are refined
- Dependencies and blockers are identified

### 3. Task Execution
- Tasks progress through states: `todo` → `in-progress` → `review` → `done`
- Regular updates to task files track progress
- Blockers and discoveries are documented
- Code references and implementation notes added

### 4. Completion
- Completed tasks move to `completed/` directory
- Sprint retrospectives capture lessons learned
- Metrics and velocity data collected

## Task Sizing and Estimation

### T-Shirt Sizing
- **XS (Extra Small)**: 1-2 hours, simple changes
- **S (Small)**: 2-8 hours, straightforward tasks
- **M (Medium)**: 1-2 days, moderate complexity
- **L (Large)**: 3-5 days, complex features
- **XL (Extra Large)**: 1+ weeks, epic-level work

### Story Points (Fibonacci)
- **1 point**: Trivial change, well understood
- **2 points**: Simple task, clear implementation
- **3 points**: Moderate task, some unknowns
- **5 points**: Complex task, multiple components
- **8 points**: Large task, significant unknowns
- **13 points**: Epic-level, needs breakdown

### Mastra-Specific Sizing Guidelines

**XS Tasks (1-2 hours):**
- Add simple tool with basic validation
- Update agent instructions
- Fix typo in schema definition
- Add simple environment variable

**S Tasks (2-8 hours):**
- Create new tool with complex validation
- Add new workflow step
- Update API endpoint with new parameter
- Write comprehensive tests for existing component

**M Tasks (1-2 days):**
- Implement new agent with multiple tools
- Create multi-step workflow
- Add new MCP server with resources
- Refactor component with interface changes

**L Tasks (3-5 days):**
- Design and implement new agent network
- Build complete API integration
- Implement new storage provider
- Create comprehensive evaluation framework

**XL Tasks (1+ weeks):**
- Redesign workflow engine architecture
- Implement new memory system
- Build distributed agent orchestration
- Create new deployment platform

## Task Breakdown Principles

### 1. SMART Criteria
- **Specific**: Clear, unambiguous task description
- **Measurable**: Concrete acceptance criteria
- **Achievable**: Realistic scope and complexity
- **Relevant**: Aligned with project goals
- **Time-bound**: Clear deadline or iteration

### 2. Definition of Done
Every task must include:
- [ ] Implementation complete
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Code reviewed and approved
- [ ] Integration tested
- [ ] No regressions introduced

### 3. Acceptance Criteria Format
```markdown
## Acceptance Criteria

### Scenario: [User/System Action]
**Given** [Initial state/context]
**When** [Action performed]
**Then** [Expected outcome]
**And** [Additional expected outcomes]

### Technical Requirements
- [ ] Specific technical requirement 1
- [ ] Specific technical requirement 2
- [ ] Performance/security requirement 3
```

## Dependencies and Relationships

### Dependency Types
- **Blocks**: Task A must complete before Task B can start
- **Relates**: Tasks share context or components
- **Duplicates**: Tasks address the same issue
- **Epic**: Large feature broken into smaller tasks

### Dependency Documentation
```markdown
## Dependencies
- **Blocks**: task-002 (needs authentication before API access)
- **Blocked by**: task-001 (requires auth framework)
- **Relates to**: task-005 (shares user management components)
- **Part of Epic**: user-management-system
```

## Sprint and Iteration Management

### Sprint Structure
```markdown
# Sprint [Number] - [Date Range]

## Sprint Goal
[Clear objective for this sprint]

## Capacity
- **Team Velocity**: [Previous velocity] points
- **Sprint Capacity**: [Planned capacity] points
- **Risk Buffer**: [Buffer percentage]%

## Backlog
### High Priority (Must Have)
- [ ] task-001: Authentication middleware (5 points)
- [ ] task-002: User registration API (3 points)

### Medium Priority (Should Have)
- [ ] task-003: Password reset flow (5 points)
- [ ] task-004: Email verification (3 points)

### Low Priority (Could Have)
- [ ] task-005: Social login integration (8 points)

## Stretch Goals
- [ ] task-006: Advanced security features (5 points)
```

### Sprint Ceremonies

#### Sprint Planning
1. Review completed previous sprint
2. Estimate new tasks
3. Select tasks for current sprint
4. Identify dependencies and risks
5. Create sprint backlog

#### Daily Standups
- What did I complete yesterday?
- What will I work on today?
- Are there any blockers?
- Update task files with progress

#### Sprint Review
- Demo completed features
- Review against acceptance criteria
- Gather feedback for next iteration

#### Sprint Retrospective
- What went well?
- What could be improved?
- What actions will we take?
- Update process documentation

## Quality and Risk Management

### Risk Assessment
Each task should assess:
- **Technical Risk**: Implementation complexity, unknown technologies
- **Business Risk**: Impact of delays, dependencies on external factors
- **Quality Risk**: Testing complexity, integration challenges

### Risk Levels
- **Low**: Well-understood, straightforward implementation
- **Medium**: Some unknowns, moderate complexity
- **High**: Significant unknowns, complex dependencies

### Quality Gates
- **Code Quality**: Linting, formatting, type checking pass
- **Test Coverage**: Minimum coverage thresholds met
- **Performance**: No performance regressions
- **Security**: Security review for sensitive changes
- **Documentation**: All changes documented

## Metrics and Tracking

### Velocity Tracking
- **Planned vs. Actual**: Compare estimated vs. actual effort
- **Velocity Trend**: Track team velocity over time
- **Accuracy**: Compare initial estimates to final effort

### Quality Metrics
- **Defect Rate**: Bugs per feature/story point
- **Rework Rate**: Tasks requiring significant changes
- **Cycle Time**: Time from start to completion

### Mastra-Specific Metrics
- **Component Coverage**: Agents, tools, workflows tested
- **Integration Success**: API, MCP, A2A functionality
- **Performance Benchmarks**: Response times, throughput
- **Memory Usage**: Agent memory efficiency

## Automation and Tools Integration

### Task Creation Automation
```bash
#!/bin/bash
# scripts/create-task.sh
TASK_ID=$1
TITLE=$2
TYPE=${3:-task}

if [[ -z "$TASK_ID" || -z "$TITLE" ]]; then
  echo "Usage: create-task.sh <task-id> <title> [type]"
  exit 1
fi

# Create task file from template
cp "context-network/backlog/templates/${TYPE}-template.md" \
   "context-network/backlog/active/task-${TASK_ID}-$(echo $TITLE | tr ' ' '-' | tr '[:upper:]' '[:lower:]').md"

# Update task ID and title in file
sed -i "s/{{TASK_ID}}/$TASK_ID/g" "context-network/backlog/active/task-${TASK_ID}-*.md"
sed -i "s/{{TITLE}}/$TITLE/g" "context-network/backlog/active/task-${TASK_ID}-*.md"

echo "Created task file: task-${TASK_ID}-*.md"
```

### Progress Tracking
```bash
#!/bin/bash
# scripts/sprint-status.sh

echo "=== Sprint Status ==="
echo "Active Tasks:"
grep -l "status: in-progress\|status: todo" context-network/backlog/active/*.md | wc -l

echo "Completed Tasks:"
grep -l "status: done" context-network/backlog/active/*.md | wc -l

echo "Blocked Tasks:"
grep -l "status: blocked" context-network/backlog/active/*.md

echo "Points Completed:"
grep -A1 "status: done" context-network/backlog/active/*.md | grep "points:" | awk '{sum += $2} END {print sum}'
```

## Integration with Development Workflow

### Branch Creation from Tasks
```bash
# Create branch from task
TASK_FILE="context-network/backlog/active/task-001-auth.md"
TASK_ID=$(grep "id:" "$TASK_FILE" | cut -d' ' -f2)
BRANCH_TYPE=$(grep "type:" "$TASK_FILE" | cut -d' ' -f2)
TITLE=$(grep "title:" "$TASK_FILE" | cut -d' ' -f2- | tr ' ' '-' | tr '[:upper:]' '[:lower:]')

git checkout -b "$BRANCH_TYPE/$TITLE"
git worktree add "../mastra-$TITLE" "$BRANCH_TYPE/$TITLE"
```

### Task Completion Workflow
```bash
# scripts/complete-task.sh
TASK_ID=$1

# Update task status
sed -i "s/status: in-progress/status: done/" "context-network/backlog/active/task-${TASK_ID}-*.md"

# Add completion timestamp
echo "completed_at: $(date -Iseconds)" >> "context-network/backlog/active/task-${TASK_ID}-*.md"

# Move to completed directory
mv "context-network/backlog/active/task-${TASK_ID}-*.md" "context-network/backlog/completed/$(date +%Y-q%q)/"

echo "Task $TASK_ID marked as completed"
```

## Best Practices

### Task Writing Guidelines
1. **Clear Titles**: Use action verbs and specific outcomes
2. **Context**: Provide sufficient background and rationale
3. **Scope**: Keep tasks focused and atomic
4. **Dependencies**: Clearly identify relationships
5. **Testing**: Include testing requirements
6. **Documentation**: Specify documentation needs

### Common Pitfalls to Avoid
- **Vague Requirements**: "Improve performance" → "Reduce API response time to <200ms"
- **Missing Context**: Include business justification and user impact
- **Scope Creep**: Keep tasks focused on single objectives
- **Weak Acceptance Criteria**: Make criteria testable and measurable
- **Ignoring Dependencies**: Map out all blocking relationships

### AI Agent Considerations
When writing tasks for AI agents:
- **Explicit Instructions**: Provide step-by-step guidance
- **Code Examples**: Include implementation patterns
- **File Locations**: Specify exact file paths and structures
- **Testing Commands**: Include specific test commands
- **Success Criteria**: Define measurable outcomes

## See Also

- [[feature-template.md]] - Template for feature breakdown
- [[task-template.md]] - Template for individual tasks
- [[sprint-planning.md]] - Detailed sprint planning process
- [[estimation-guide.md]] - Task estimation techniques