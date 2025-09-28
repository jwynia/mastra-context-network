# Branch-Per-Feature Git Workflow

## Overview

This project uses a **branch-per-feature workflow** with **git worktrees** for efficient parallel development. Each feature, bug fix, or enhancement gets its own branch and dedicated working directory.

## Core Principles

### 1. Feature Isolation
- Every feature/bug fix gets a dedicated branch
- Branches are created from `main` (or specified base branch)
- Features are developed in isolation to prevent conflicts
- Code reviews happen via Pull Requests before merging

### 2. Worktree Usage
- Each feature branch gets its own worktree (working directory)
- Enables parallel development on multiple features
- Prevents context switching overhead
- Allows testing different features simultaneously

### 3. Clean History
- Use meaningful commit messages
- Squash related commits before merging
- Maintain linear history when possible
- Tag significant releases

## Workflow Steps

### Starting a New Feature

#### 1. Create Feature Branch
```bash
# From main repository
git checkout main
git pull origin main

# Create and checkout feature branch
git checkout -b feature/user-authentication

# Push branch to remote
git push -u origin feature/user-authentication
```

#### 2. Create Worktree
```bash
# Create worktree in parallel directory
git worktree add ../mastra-user-auth feature/user-authentication

# Navigate to worktree
cd ../mastra-user-auth

# Verify you're on the feature branch
git branch --show-current  # Should show: feature/user-authentication
```

#### 3. Set Up Development Environment
```bash
# Install dependencies (if different from main)
npm install

# Copy environment configuration
cp ../mastra/.env.example .env
# Update .env with feature-specific settings if needed

# Start development server
npm run dev
```

### During Development

#### 1. Regular Commits
```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add JWT token validation middleware

- Implement token validation using jsonwebtoken
- Add middleware to authenticate API requests
- Include error handling for expired/invalid tokens
- Add tests for authentication middleware"

# Push to remote regularly
git push origin feature/user-authentication
```

#### 2. Sync with Main Branch
```bash
# Fetch latest changes
git fetch origin

# Rebase feature branch on latest main (keeps linear history)
git rebase origin/main

# If conflicts occur, resolve them:
# 1. Fix conflicts in files
# 2. git add <resolved-files>
# 3. git rebase --continue

# Force push (only safe for feature branches)
git push --force-with-lease origin feature/user-authentication
```

#### 3. Keep Worktree Updated
```bash
# In main repository, fetch updates
cd ../mastra
git fetch origin
git checkout main
git pull origin main

# In feature worktree, rebase
cd ../mastra-user-auth
git rebase origin/main
```

### Completing a Feature

#### 1. Final Preparation
```bash
# Ensure all tests pass
npm test

# Run linting and formatting
npm run lint
npm run format

# Build to verify no build errors
npm run build

# Final commit if needed
git add .
git commit -m "test: add comprehensive auth middleware tests"
```

#### 2. Create Pull Request
```bash
# Push final changes
git push origin feature/user-authentication

# Create PR via GitHub CLI (if available)
gh pr create \
  --title "feat: implement user authentication system" \
  --body "
## Summary
Implements JWT-based authentication system with:
- Token validation middleware
- Protected route handlers
- Comprehensive error handling
- Full test coverage

## Changes
- Added JWT token validation middleware
- Implemented protected API endpoints
- Added authentication tests
- Updated API documentation

## Testing
- All existing tests pass
- New authentication tests added
- Manual testing completed

## Breaking Changes
None

Closes #123
"

# Or create via web interface at github.com
```

#### 3. Code Review Process
- Wait for review approval
- Address any feedback by making additional commits
- Ensure CI/CD checks pass
- Request re-review if significant changes made

#### 4. Merge and Cleanup
```bash
# After PR approval and merge, clean up
cd ../mastra-user-auth

# Switch back to main repository
cd ../mastra
git checkout main
git pull origin main

# Remove merged branch (local)
git branch -d feature/user-authentication

# Remove worktree
git worktree remove ../mastra-user-auth

# Remove remote branch (if not auto-deleted)
git push origin --delete feature/user-authentication
```

## Branch Naming Conventions

### Format: `type/short-description`

**Types:**
- `feature/` - New features or enhancements
- `fix/` - Bug fixes
- `refactor/` - Code refactoring without functional changes
- `docs/` - Documentation updates
- `test/` - Test additions or improvements
- `chore/` - Maintenance tasks, dependency updates
- `hotfix/` - Critical fixes for production

**Examples:**
```bash
feature/user-authentication
feature/data-export-workflow
fix/memory-leak-in-agent
fix/schema-validation-error
refactor/tool-composition-pattern
docs/api-reference-update
test/workflow-integration-tests
chore/update-dependencies
hotfix/critical-security-patch
```

### Description Guidelines:
- Use lowercase with hyphens
- Be descriptive but concise
- Avoid issue numbers in branch names
- Use present tense verbs

## Commit Message Conventions

### Format: `type(scope): subject`

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting, missing semicolons, etc.
- `refactor` - Code change that neither fixes a bug nor adds a feature
- `test` - Adding missing tests
- `chore` - Maintenance
- `perf` - Performance improvement
- `ci` - CI/CD changes

**Examples:**
```bash
feat(auth): add JWT token validation middleware
fix(memory): resolve memory leak in conversation storage
docs(api): update authentication endpoint documentation
refactor(tools): simplify tool registration pattern
test(workflows): add integration tests for data processing
chore(deps): update mastra dependencies to latest
```

## Worktree Management

### Creating Worktrees
```bash
# Create worktree for existing branch
git worktree add ../feature-directory existing-branch

# Create worktree with new branch
git worktree add -b new-feature ../feature-directory main

# List all worktrees
git worktree list

# Example output:
# /path/to/mastra         (main)
# /path/to/feature-auth   feature/user-authentication
# /path/to/fix-memory     fix/memory-leak-in-agent
```

### Working with Multiple Worktrees
```bash
# Navigate between worktrees
cd ../mastra-auth      # Work on authentication
cd ../mastra-memory    # Work on memory fix
cd ../mastra           # Main development

# Check status across worktrees
for dir in ../mastra*; do
  echo "=== $dir ==="
  cd "$dir" && git status --short
done
```

### Cleaning Up Worktrees
```bash
# Remove worktree (must be outside the directory)
cd ../mastra
git worktree remove ../mastra-auth

# Remove worktree and delete branch
git worktree remove --force ../mastra-auth
git branch -D feature/user-authentication

# Prune removed worktrees
git worktree prune
```

## Advanced Workflows

### Working on Multiple Related Features
```bash
# Create feature branches that depend on each other
git checkout main
git checkout -b feature/auth-base
git worktree add ../mastra-auth-base feature/auth-base

# After base feature is developed
git checkout -b feature/auth-middleware feature/auth-base
git worktree add ../mastra-auth-middleware feature/auth-middleware

# Base feature gets merged first, then rebase middleware
cd ../mastra-auth-middleware
git rebase main  # After base feature is merged
```

### Hotfix Workflow
```bash
# Critical fix needed in production
git checkout main
git pull origin main
git checkout -b hotfix/security-patch
git worktree add ../mastra-hotfix hotfix/security-patch

# Make minimal fix
cd ../mastra-hotfix
# ... make changes ...
git add .
git commit -m "fix(security): patch authentication vulnerability"

# Fast-track review and merge
git push origin hotfix/security-patch
# Create urgent PR for immediate review
```

### Experimental Feature Development
```bash
# Create experimental branch for exploration
git checkout -b experiment/new-architecture main
git worktree add ../mastra-experiment experiment/new-architecture

# Work freely without affecting main development
cd ../mastra-experiment
# ... experimental changes ...

# If successful, create proper feature branch
git checkout -b feature/new-architecture main
# Cherry-pick or reimplement changes properly
```

## Integration with Mastra Development

### Environment Isolation
Each worktree can have different configurations:

```bash
# In main worktree (.env)
NODE_ENV=development
PORT=3000
DATABASE_URL=file:./mastra.db

# In feature worktree (.env)
NODE_ENV=development
PORT=3001  # Different port to avoid conflicts
DATABASE_URL=file:./mastra-feature.db  # Separate database
FEATURE_FLAG_NEW_AUTH=true
```

### Testing Across Worktrees
```bash
# Test main application
cd ../mastra && npm test

# Test feature in isolation
cd ../mastra-auth && npm test

# Test feature integration
cd ../mastra-auth && npm run test:integration
```

### Mastra Component Development
```bash
# Develop new agent in feature branch
cd ../mastra-agent-feature

# Add new agent
cat > src/mastra/agents/new-agent.ts << EOF
export const newAgent = new Agent({
  name: 'New Feature Agent',
  // ... agent configuration
});
EOF

# Update main Mastra configuration
# Edit src/mastra/index.ts to include new agent

# Test new agent
npm test -- --grep "new agent"
```

## Troubleshooting

### Common Issues

#### 1. Worktree Creation Fails
```bash
# Error: 'path' already exists
# Solution: Remove existing directory
rm -rf ../mastra-feature
git worktree add ../mastra-feature feature/new-feature
```

#### 2. Branch Conflicts During Rebase
```bash
# Stop rebase and assess
git rebase --abort

# Try merge instead (creates merge commit)
git merge origin/main

# Or resolve conflicts manually
git rebase origin/main
# Fix conflicts, then:
git add .
git rebase --continue
```

#### 3. Worktree Database Conflicts
```bash
# Use separate database files for each worktree
# In feature worktree .env:
DATABASE_URL=file:./mastra-feature.db

# Or use memory database for testing
DATABASE_URL=:memory:
```

#### 4. Port Conflicts
```bash
# Use different ports for each worktree
# Main worktree: PORT=3000
# Feature worktree: PORT=3001
# Another feature: PORT=3002
```

### Best Practices

1. **Keep Branches Small**: Aim for features that can be completed in 1-2 weeks
2. **Regular Rebasing**: Rebase on main at least daily to avoid large conflicts
3. **Clear Commits**: Each commit should represent a logical unit of work
4. **Test Before Push**: Always run tests before pushing changes
5. **Clean Workspace**: Remove merged branches and unused worktrees regularly
6. **Document Changes**: Update documentation as part of feature development

## See Also

- [[pull-request-process.md]] - Detailed PR workflow and review process
- [[git-hooks.md]] - Automated quality checks and validations
- [[release-process.md]] - How to prepare and deploy releases