# Create Feature Branch with Worktree

You are a git workflow specialist responsible for creating feature branches with worktrees following the established branch-per-feature pattern.

## Task
$ARGUMENTS

## Process

### Phase 1: Branch Planning
1. **Parse the request** to understand:
   - Feature name and description
   - Base branch (default: main)
   - Estimated development time
   - Dependencies on other features

2. **Validate branch requirements**:
   - Feature name follows naming conventions
   - No conflicts with existing branches
   - Base branch is appropriate
   - Feature scope is reasonable

3. **Plan worktree setup**:
   - Determine worktree directory name
   - Check for directory conflicts
   - Plan environment configuration
   - Identify port assignments

### Phase 2: Branch and Worktree Creation
1. **Create feature branch**:
   - Ensure base branch is up to date
   - Create feature branch with proper naming
   - Push branch to remote with upstream tracking

2. **Create worktree**:
   - Create worktree in appropriate directory
   - Set up development environment
   - Configure unique port and database

3. **Environment setup**:
   - Copy and customize .env file
   - Install dependencies if needed
   - Verify development server works

### Phase 3: Documentation and Integration
1. **Update project tracking**:
   - Create task file in backlog (if applicable)
   - Document branch purpose and scope
   - Link to related issues or features

2. **Setup development environment**:
   - Verify all services work in worktree
   - Test Mastra components load correctly
   - Confirm no conflicts with main development

## Implementation

### Branch Naming Convention
Follow the pattern: `type/short-description`

**Types:**
- `feature/` - New features or enhancements
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates
- `test/` - Test additions or improvements
- `chore/` - Maintenance tasks

**Examples:**
```bash
feature/user-authentication
feature/data-export-workflow
fix/memory-leak-in-agent
refactor/tool-composition-pattern
```

### Worktree Directory Naming
Follow the pattern: `../mastra-[feature-name]`

**Examples:**
```bash
../mastra-user-auth
../mastra-data-export
../mastra-memory-fix
../mastra-tool-refactor
```

### Step-by-Step Implementation

#### 1. Prepare Base Branch
```bash
# Ensure we're in the main repository
cd /path/to/mastra

# Switch to base branch and update
git checkout main
git pull origin main

# Verify clean working directory
git status
```

#### 2. Create Feature Branch
```bash
# Create and checkout feature branch
FEATURE_NAME="[parsed-from-request]"
BRANCH_TYPE="[feature|fix|refactor|etc]"
BRANCH_NAME="${BRANCH_TYPE}/${FEATURE_NAME}"

git checkout -b "$BRANCH_NAME"

# Push branch to remote with upstream tracking
git push -u origin "$BRANCH_NAME"
```

#### 3. Create Worktree
```bash
# Create worktree directory
WORKTREE_DIR="../mastra-${FEATURE_NAME}"

git worktree add "$WORKTREE_DIR" "$BRANCH_NAME"

# Navigate to worktree
cd "$WORKTREE_DIR"

# Verify branch
git branch --show-current  # Should show the feature branch
```

#### 4. Environment Setup
```bash
# Copy environment configuration
cp ../mastra/.env.example .env

# Find available port (starting from 3001)
PORT=3001
while nc -z localhost $PORT 2>/dev/null; do
  ((PORT++))
done

# Update .env with unique configuration
sed -i "s/PORT=3000/PORT=$PORT/" .env
sed -i "s/mastra\.db/mastra-${FEATURE_NAME}.db/" .env

echo "# Feature-specific configuration" >> .env
echo "FEATURE_BRANCH=$BRANCH_NAME" >> .env
echo "WORKTREE_DIR=$WORKTREE_DIR" >> .env
```

#### 5. Dependency Setup
```bash
# Install dependencies (link to main if identical)
if [ -f "../mastra/package-lock.json" ]; then
  # Link node_modules to save space (if dependencies are identical)
  ln -s ../mastra/node_modules ./node_modules
else
  # Install separately if different dependencies expected
  npm install
fi
```

#### 6. Verification
```bash
# Test that everything works
npm run lint
npm test -- --run  # Quick test run

# Start development server to verify
npm run dev &
DEV_PID=$!

# Wait a moment and test
sleep 5
curl -f "http://localhost:$PORT/health" || echo "Server not responding"

# Stop dev server
kill $DEV_PID 2>/dev/null || true
```

### Environment Configuration Template

#### .env Configuration
```bash
# Base configuration
NODE_ENV=development
PORT=[ASSIGNED_PORT]
LOG_LEVEL=debug

# Database configuration (unique per worktree)
DATABASE_URL=file:./mastra-[FEATURE_NAME].db

# Feature-specific flags
FEATURE_BRANCH=[BRANCH_NAME]
WORKTREE_DIR=[WORKTREE_DIR]

# Optional: Feature flags for development
EXPERIMENTAL_FEATURES=true
DEBUG_MODE=true

# Copy other settings from main .env.example
# ... (other environment variables)
```

### Task Documentation Template

If creating a corresponding task file:

```bash
# Create task file in backlog
TASK_ID=$(date +%s | tail -c 4)  # Simple ID from timestamp
TASK_FILE="context-network/backlog/active/task-${TASK_ID}-${FEATURE_NAME}.md"

# Copy task template and customize
cp context-network/backlog/templates/task-template.md "$TASK_FILE"

# Update task file with branch information
sed -i "s/{{TASK_ID}}/$TASK_ID/g" "$TASK_FILE"
sed -i "s/{{TITLE}}/Implement $FEATURE_NAME/g" "$TASK_FILE"
sed -i "s/{{TYPE}}/feature/g" "$TASK_FILE"
sed -i "s/{{STATUS}}/in-progress/g" "$TASK_FILE"
sed -i "s/{{CREATED_DATE}}/$(date -Iseconds)/g" "$TASK_FILE"

# Add branch information to task
echo "" >> "$TASK_FILE"
echo "## Git Branch Information" >> "$TASK_FILE"
echo "- **Branch**: $BRANCH_NAME" >> "$TASK_FILE"
echo "- **Worktree**: $WORKTREE_DIR" >> "$TASK_FILE"
echo "- **Port**: $PORT" >> "$TASK_FILE"
echo "- **Database**: mastra-${FEATURE_NAME}.db" >> "$TASK_FILE"
```

## Mastra-Specific Setup

### Component Development Setup
```bash
# Create component directories if needed for the feature
mkdir -p src/mastra/{agents,tools,workflows,mcp}

# Create placeholder files for new components
if [[ "$FEATURE_NAME" == *"agent"* ]]; then
  touch "src/mastra/agents/${FEATURE_NAME}.ts"
fi

if [[ "$FEATURE_NAME" == *"tool"* ]]; then
  touch "src/mastra/tools/${FEATURE_NAME}.ts"
fi

if [[ "$FEATURE_NAME" == *"workflow"* ]]; then
  touch "src/mastra/workflows/${FEATURE_NAME}.ts"
fi
```

### Testing Setup
```bash
# Create test directories
mkdir -p tests/{unit,integration}/mastra

# Create test placeholder files
if [[ "$FEATURE_NAME" == *"agent"* ]]; then
  touch "tests/unit/mastra/agents/${FEATURE_NAME}.test.ts"
fi

if [[ "$FEATURE_NAME" == *"tool"* ]]; then
  touch "tests/unit/mastra/tools/${FEATURE_NAME}.test.ts"
fi
```

## Quality Checklist

### Branch Setup
- [ ] Branch name follows conventions
- [ ] Branch created from correct base
- [ ] Branch pushed to remote with upstream tracking
- [ ] No conflicts with existing branches

### Worktree Setup
- [ ] Worktree created in correct location
- [ ] Worktree directory follows naming convention
- [ ] Environment variables configured uniquely
- [ ] No port conflicts with other worktrees

### Development Environment
- [ ] Dependencies installed or linked correctly
- [ ] Environment variables properly configured
- [ ] Development server starts without errors
- [ ] Database configuration is unique
- [ ] No conflicts with main development environment

### Documentation
- [ ] Task file created (if applicable)
- [ ] Branch purpose documented
- [ ] Environment configuration documented
- [ ] Development setup instructions clear

## Common Usage Patterns

### Starting New Feature
```bash
# Command: /feature-branch user-authentication
# Creates: feature/user-authentication branch
# Worktree: ../mastra-user-auth
# Port: 3001 (or next available)
```

### Bug Fix Branch
```bash
# Command: /feature-branch memory-leak fix
# Creates: fix/memory-leak branch
# Worktree: ../mastra-memory-leak
# Port: 3002 (or next available)
```

### Refactoring Branch
```bash
# Command: /feature-branch tool-composition refactor
# Creates: refactor/tool-composition branch
# Worktree: ../mastra-tool-composition
# Port: 3003 (or next available)
```

## Cleanup Instructions

When feature is complete, provide cleanup instructions:

```bash
# After feature is merged, clean up worktree:
cd ../mastra
git checkout main
git pull origin main

# Remove worktree
git worktree remove ../mastra-[FEATURE_NAME]

# Remove local branch (if merged)
git branch -d [BRANCH_NAME]

# Remove remote branch (if not auto-deleted)
git push origin --delete [BRANCH_NAME]

# Clean up task files (move to completed)
mv context-network/backlog/active/task-*-[FEATURE_NAME].md \
   context-network/backlog/completed/$(date +%Y-q%q)/
```

## Success Criteria

### Setup Success
- [ ] Branch created successfully
- [ ] Worktree functioning properly
- [ ] Environment configured uniquely
- [ ] Development server runs without conflicts
- [ ] All Mastra components load correctly

### Development Ready
- [ ] Code can be edited and tested
- [ ] Hot reload works properly
- [ ] Database operations work
- [ ] No interference with main development
- [ ] Task tracking in place (if applicable)

## Notes

### Important Considerations
- Each worktree needs unique port and database configuration
- Environment variables should be customized per worktree
- Dependencies can be linked to save disk space if identical
- Regular syncing with main branch recommended
- Clean up completed worktrees promptly

### Common Issues
- Port conflicts between worktrees
- Database file conflicts
- Node modules compatibility issues
- Environment variable confusion
- Forgetting to clean up old worktrees