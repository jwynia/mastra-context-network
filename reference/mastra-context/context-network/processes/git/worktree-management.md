# Git Worktree Management for Mastra Projects

## Worktree Strategy

Git worktrees enable **parallel development** by creating multiple working directories from a single repository. This is especially valuable for Mastra projects where you might need to:

- Test different agent configurations simultaneously
- Compare workflow implementations
- Develop features while maintaining a stable main environment
- Run integration tests across different branches

## Directory Structure

### Recommended Layout
```
projects/
├── mastra/                     # Main repository (main branch)
│   ├── .git/                   # Git repository data
│   ├── src/
│   ├── packages/
│   └── examples/
├── mastra-auth-feature/        # Worktree for authentication feature
│   ├── src/                    # Linked to feature/user-auth branch
│   └── .env                    # Feature-specific environment
├── mastra-workflow-redesign/   # Worktree for workflow changes
│   ├── src/                    # Linked to refactor/workflow-engine branch
│   └── .env                    # Separate configuration
└── mastra-hotfix/             # Worktree for critical fixes
    ├── src/                    # Linked to hotfix/security-patch branch
    └── .env                    # Production-like configuration
```

### Benefits of This Structure
- **Parallel Development**: Work on multiple features simultaneously
- **Environment Isolation**: Each worktree can have different configurations
- **Testing Flexibility**: Run different versions side by side
- **Context Preservation**: No need to stash/commit when switching features

## Worktree Lifecycle

### 1. Creating Worktrees

#### For New Features
```bash
# From main repository
cd mastra
git checkout main
git pull origin main

# Create feature branch and worktree in one command
git worktree add -b feature/user-authentication ../mastra-auth feature/user-authentication

# Or create worktree for existing branch
git worktree add ../mastra-auth feature/user-authentication
```

#### For Hotfixes
```bash
# Create hotfix from latest main
git worktree add -b hotfix/critical-fix ../mastra-hotfix main

# Or from specific tag/commit
git worktree add -b hotfix/security-patch ../mastra-hotfix v1.2.3
```

#### For Experiments
```bash
# Create experimental worktree for testing ideas
git worktree add -b experiment/new-agent-pattern ../mastra-experiment main
```

### 2. Worktree Configuration

#### Environment Setup
```bash
# Navigate to new worktree
cd ../mastra-auth

# Copy and customize environment
cp ../mastra/.env.example .env

# Edit for feature-specific needs
cat > .env << EOF
# Feature-specific configuration
NODE_ENV=development
PORT=3001  # Avoid conflicts with main
DATABASE_URL=file:./mastra-auth.db  # Separate database
LOG_LEVEL=debug
FEATURE_AUTH_ENABLED=true
EOF
```

#### Dependency Management
```bash
# Install dependencies (usually same as main)
npm install

# Or link to main node_modules to save space
ln -s ../mastra/node_modules ./node_modules

# Install feature-specific dependencies if needed
npm install specific-auth-library
```

### 3. Development Workflow

#### Daily Development
```bash
# Start development in feature worktree
cd ../mastra-auth

# Sync with main branch regularly
git fetch origin
git rebase origin/main

# Normal development cycle
git add .
git commit -m "feat(auth): implement JWT middleware"
git push origin feature/user-authentication

# Test in isolation
npm test
npm run dev  # Runs on PORT=3001
```

#### Cross-Worktree Operations
```bash
# Check status across all worktrees
for dir in ../mastra*; do
  echo "=== $(basename $dir) ==="
  cd "$dir" && git branch --show-current && git status --short
done

# Fetch updates for all worktrees
cd ../mastra
git fetch origin

# Each worktree can then update independently
cd ../mastra-auth && git rebase origin/main
cd ../mastra-workflow && git rebase origin/main
```

### 4. Worktree Cleanup

#### Completing Features
```bash
# After feature is merged, clean up
cd ../mastra
git checkout main
git pull origin main  # Get merged changes

# Remove feature worktree
git worktree remove ../mastra-auth

# Remove local branch (if merged)
git branch -d feature/user-authentication

# Remove remote branch (if not auto-deleted)
git push origin --delete feature/user-authentication
```

#### Abandoned Features
```bash
# Force remove worktree and branch
git worktree remove --force ../mastra-abandoned
git branch -D feature/abandoned-feature

# Clean up any remote branches
git push origin --delete feature/abandoned-feature
```

## Advanced Worktree Patterns

### 1. Release Preparation Worktree

```bash
# Create release preparation worktree
git worktree add -b release/v2.0.0 ../mastra-release main

cd ../mastra-release

# Prepare release
# - Update version numbers
# - Update changelogs
# - Run comprehensive tests
# - Build documentation

git add .
git commit -m "chore: prepare v2.0.0 release"

# Create release PR
gh pr create --title "Release v2.0.0" --body "Release preparation for v2.0.0"
```

### 2. Integration Testing Worktree

```bash
# Create integration testing worktree
git worktree add -b integration/multi-feature ../mastra-integration main

cd ../mastra-integration

# Merge multiple feature branches for testing
git merge feature/user-auth
git merge feature/new-workflow
git merge feature/api-improvements

# Run comprehensive integration tests
npm run test:integration
npm run test:e2e

# If conflicts or issues, fix them
# If successful, features can be merged to main
```

### 3. Performance Testing Worktree

```bash
# Create performance testing worktree
git worktree add -b perf/load-testing ../mastra-perf main

cd ../mastra-perf

# Configure for performance testing
cat > .env << EOF
NODE_ENV=production
DATABASE_URL=postgresql://localhost/mastra_perf
LOG_LEVEL=warn
TELEMETRY_ENABLED=true
EOF

# Run performance tests
npm run build
npm run test:performance
npm run benchmark
```

## Mastra-Specific Worktree Strategies

### 1. Agent Development Worktrees

```bash
# Create worktree for new agent development
git worktree add -b feature/customer-service-agent ../mastra-cs-agent main

cd ../mastra-cs-agent

# Develop agent in isolation
cat > src/mastra/agents/customer-service.ts << EOF
export const customerServiceAgent = new Agent({
  name: 'Customer Service Agent',
  description: 'Handles customer support queries',
  // ... agent configuration
});
EOF

# Test agent without affecting main
npm test -- --grep "customer service"
npm run dev  # Test in live environment
```

### 2. Workflow Testing Worktrees

```bash
# Create worktree for workflow development
git worktree add -b feature/data-pipeline ../mastra-pipeline main

cd ../mastra-pipeline

# Develop and test workflows
# Can run multiple workflow versions simultaneously
# Main worktree: existing workflows
# Feature worktree: new workflow engine
```

### 3. API Version Worktrees

```bash
# Create worktree for API version development
git worktree add -b feature/api-v2 ../mastra-api-v2 main

cd ../mastra-api-v2

# Develop new API version
# Configure different port
PORT=3002

# Can run v1 (main) and v2 (worktree) APIs simultaneously
# Useful for migration testing
```

## Troubleshooting Worktrees

### Common Issues

#### 1. Worktree Path Already Exists
```bash
# Error: 'worktree already exists'
# Solution: Remove directory first
rm -rf ../mastra-feature
git worktree add ../mastra-feature feature/branch

# Or use different path
git worktree add ../mastra-feature-v2 feature/branch
```

#### 2. Branch Checked Out in Another Worktree
```bash
# Error: 'branch is already checked out'
# Solution: Check which worktree has the branch
git worktree list

# Remove other worktree first, or use different branch
git worktree remove ../other-worktree
```

#### 3. Stale Worktree References
```bash
# Clean up stale worktree references
git worktree prune

# List all worktrees to verify
git worktree list
```

#### 4. Database Conflicts Between Worktrees
```bash
# Use separate databases for each worktree
# In main worktree:
DATABASE_URL=file:./mastra.db

# In feature worktree:
DATABASE_URL=file:./mastra-feature.db

# Or use different database names
DATABASE_URL=postgresql://localhost/mastra_main
DATABASE_URL=postgresql://localhost/mastra_feature
```

### Best Practices

#### 1. Naming Conventions
```bash
# Use descriptive directory names
../mastra-auth-feature      # Clear purpose
../mastra-workflow-refactor # Clear scope
../mastra-hotfix-security   # Clear priority

# Avoid generic names
../mastra-feature           # Unclear
../mastra-test             # Too generic
../mastra-temp             # No context
```

#### 2. Environment Management
```bash
# Use consistent port patterns
# Main: 3000
# Feature 1: 3001
# Feature 2: 3002
# Hotfix: 3009 (easy to remember for urgent work)

# Use descriptive database names
DATABASE_URL=file:./mastra-main.db
DATABASE_URL=file:./mastra-auth-feature.db
DATABASE_URL=file:./mastra-workflow-test.db
```

#### 3. Resource Management
```bash
# Monitor disk usage (worktrees share .git but have separate node_modules)
du -sh ../mastra*

# Link node_modules to save space (if dependencies are identical)
cd ../mastra-feature
rm -rf node_modules
ln -s ../mastra/node_modules ./node_modules

# Use separate node_modules only when needed
npm install  # Only if different dependencies required
```

#### 4. Process Management
```bash
# Keep track of running processes across worktrees
ps aux | grep node  # Check for multiple dev servers

# Use different ports and process managers
# Main: npm run dev (port 3000)
# Feature: PORT=3001 npm run dev
# Hotfix: PORT=3009 npm run dev
```

## Automation Scripts

### Worktree Helper Script
```bash
#!/bin/bash
# scripts/worktree-helper.sh

function create_feature_worktree() {
  local feature_name=$1
  local base_branch=${2:-main}

  # Validate input
  if [[ -z "$feature_name" ]]; then
    echo "Usage: create_feature_worktree <feature-name> [base-branch]"
    return 1
  fi

  # Create branch and worktree
  local branch_name="feature/$feature_name"
  local worktree_path="../mastra-$feature_name"

  git worktree add -b "$branch_name" "$worktree_path" "$base_branch"

  # Setup environment
  cd "$worktree_path"
  cp ../mastra/.env.example .env

  # Find available port
  local port=3001
  while nc -z localhost $port 2>/dev/null; do
    ((port++))
  done

  # Update .env with unique port
  sed -i "s/PORT=3000/PORT=$port/" .env
  sed -i "s/mastra.db/mastra-$feature_name.db/" .env

  echo "Created worktree at $worktree_path"
  echo "Branch: $branch_name"
  echo "Port: $port"
  echo "Database: mastra-$feature_name.db"
}

function cleanup_worktree() {
  local worktree_path=$1

  if [[ -z "$worktree_path" ]]; then
    echo "Usage: cleanup_worktree <worktree-path>"
    return 1
  fi

  # Get branch name before removing worktree
  local branch_name=$(cd "$worktree_path" && git branch --show-current)

  # Remove worktree
  git worktree remove "$worktree_path"

  # Remove branch if merged
  git branch -d "$branch_name" 2>/dev/null || echo "Branch $branch_name not fully merged"

  echo "Cleaned up worktree $worktree_path and branch $branch_name"
}

function list_worktrees() {
  echo "Active worktrees:"
  git worktree list

  echo -e "\nWorktree status:"
  for worktree in $(git worktree list --porcelain | grep "worktree " | cut -d' ' -f2); do
    if [[ -d "$worktree" ]]; then
      echo "=== $(basename $worktree) ==="
      cd "$worktree" && git status --short
    fi
  done
}
```

## See Also

- [[branch-per-feature.md]] - Overall branching strategy
- [[development-environment.md]] - Environment setup and configuration
- [[testing-strategies.md]] - Testing across multiple worktrees