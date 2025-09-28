# Bug Report: {{TITLE}}

**ID**: bug-{{BUG_ID}}
**Severity**: {{SEVERITY}}
**Priority**: {{PRIORITY}}
**Status**: {{STATUS}}
**Assignee**: {{ASSIGNEE}}
**Reporter**: {{REPORTER}}
**Created**: {{CREATED_DATE}}
**Updated**: {{UPDATED_DATE}}

## Summary

Brief description of the bug and its impact.

## Bug Details

### Environment
- **Environment**: Development / Staging / Production
- **Mastra Version**: [version number]
- **Node.js Version**: [version]
- **OS**: [operating system and version]
- **Browser**: [browser and version, if applicable]

### Reproduction Information
- **Frequency**: Always / Often / Sometimes / Rarely
- **First Observed**: [date first noticed]
- **Affected Components**: [list of Mastra components affected]

## Steps to Reproduce

Provide clear, step-by-step instructions to reproduce the bug:

1. **Step 1**: [Detailed action]
2. **Step 2**: [Detailed action]
3. **Step 3**: [Detailed action]
4. **Step 4**: [Observe the issue]

### Prerequisites
List any setup or configuration required to reproduce:
- [ ] Specific data/configuration needed
- [ ] User permissions or roles required
- [ ] External services that must be running
- [ ] Environment variables that must be set

### Test Data
If specific test data is needed:
```json
{
  "example": "test data",
  "needed": "to reproduce"
}
```

## Expected vs. Actual Behavior

### Expected Behavior
What should happen when following the reproduction steps:
- [Detailed description of expected outcome]
- [Expected system state]
- [Expected user experience]

### Actual Behavior
What actually happens:
- [Detailed description of actual outcome]
- [Actual system state]
- [Actual user experience]

### Visual Evidence
- **Screenshots**: [attach or link to screenshots]
- **Screen Recordings**: [attach or link to recordings]
- **Console Output**: [relevant console logs]

## Error Information

### Error Messages
```
[Paste exact error messages here]
```

### Stack Traces
```
[Paste full stack traces here]
```

### Log Output
```
[Paste relevant log entries here]
```

### Network Requests (if applicable)
```
[Paste failed API requests/responses]
```

## Impact Assessment

### Severity Classification
- **Critical**: System is unusable, data loss, security breach
- **High**: Major functionality broken, severe user impact
- **Medium**: Feature partially broken, workaround exists
- **Low**: Minor issue, cosmetic problems

### Business Impact
- **Users Affected**: [number or percentage of users]
- **Features Affected**: [list of features impacted]
- **Business Operations**: [impact on business operations]
- **Revenue Impact**: [if applicable]

### Technical Impact
- **System Performance**: [performance impact]
- **Data Integrity**: [data consistency issues]
- **Security**: [security implications]
- **Integration**: [impact on external integrations]

## Mastra Component Analysis

### Affected Components
Identify which Mastra components are involved:

#### Agents
- [ ] Agent Name: [agent affected and how]
- [ ] Agent Instructions: [instruction-related issues]
- [ ] Agent Tools: [tool execution problems]
- [ ] Agent Memory: [memory persistence issues]

#### Tools
- [ ] Tool Name: [tool affected and how]
- [ ] Tool Execution: [execution failures]
- [ ] Tool Validation: [schema validation issues]
- [ ] Tool Responses: [incorrect responses]

#### Workflows
- [ ] Workflow Name: [workflow affected and how]
- [ ] Workflow Steps: [step execution issues]
- [ ] Workflow State: [state management problems]
- [ ] Workflow Resume: [suspend/resume issues]

#### APIs and Integration
- [ ] HTTP Endpoints: [endpoint issues]
- [ ] MCP Servers: [MCP-related problems]
- [ ] A2A Communication: [agent-to-agent issues]
- [ ] External APIs: [third-party integration problems]

#### Storage and Memory
- [ ] Database: [storage issues]
- [ ] Memory Provider: [memory system problems]
- [ ] Vector Storage: [vector store issues]
- [ ] Cache: [caching problems]

### Configuration Issues
- [ ] Environment Variables: [config problems]
- [ ] Mastra Configuration: [mastra instance config]
- [ ] Middleware: [middleware-related issues]
- [ ] Authentication: [auth configuration problems]

## Root Cause Analysis

### Suspected Cause
Based on investigation, what is the likely root cause?
- **Code Issue**: [specific code problems]
- **Configuration**: [configuration problems]
- **Environment**: [environment-specific issues]
- **Dependencies**: [third-party dependency issues]
- **Data**: [data-related problems]

### Investigation Notes
Document investigation findings:
- **Code Review**: [findings from code analysis]
- **Log Analysis**: [findings from log review]
- **Database Analysis**: [findings from data review]
- **Network Analysis**: [findings from network traces]

### Related Issues
- **Similar Bugs**: [links to related bug reports]
- **Recent Changes**: [recent code changes that might be related]
- **Known Issues**: [known issues in dependencies]

## Workaround

### Temporary Solution
If a workaround exists:
1. **Step 1**: [workaround action]
2. **Step 2**: [workaround action]
3. **Result**: [what this achieves]

### Workaround Limitations
- [Limitation 1]
- [Limitation 2]
- [When workaround fails]

### Long-term Implications
- [Impact of using workaround long-term]
- [Risk assessment]

## Fix Strategy

### Proposed Solution
High-level approach to fixing the bug:
- **Approach**: [overall fix strategy]
- **Code Changes**: [areas of code to modify]
- **Testing Strategy**: [how to verify the fix]
- **Deployment Plan**: [how to deploy the fix]

### Implementation Plan
1. **Investigation**: [further investigation needed]
2. **Fix Development**: [development approach]
3. **Testing**: [testing approach]
4. **Review**: [review process]
5. **Deployment**: [deployment strategy]

### Risk Assessment
- **Fix Risk**: Low / Medium / High
- **Regression Risk**: [potential for introducing new bugs]
- **Testing Requirements**: [testing needed to verify fix]

## Testing Plan

### Fix Verification
How to verify the bug is fixed:
- [ ] Original reproduction steps no longer reproduce the issue
- [ ] Edge cases work correctly
- [ ] Related functionality still works
- [ ] Performance impact assessed

### Regression Testing
Areas to test to ensure no new issues:
- [ ] Core functionality testing
- [ ] Integration testing
- [ ] Performance testing
- [ ] Security testing

### Test Cases
Specific test cases to add:
```typescript
describe('Bug Fix: {{BUG_ID}}', () => {
  it('should handle the previously failing scenario', async () => {
    // Test case for the bug fix
  });

  it('should not regress related functionality', async () => {
    // Regression test case
  });
});
```

## Acceptance Criteria for Fix

### Primary Fix Criteria
- [ ] Original bug no longer reproduces
- [ ] Error messages are clear and helpful
- [ ] Performance impact is acceptable
- [ ] No new bugs introduced

### Quality Criteria
- [ ] Fix follows coding standards
- [ ] Adequate test coverage added
- [ ] Documentation updated if needed
- [ ] Code review completed

### Deployment Criteria
- [ ] Fix tested in staging environment
- [ ] Rollback plan prepared
- [ ] Monitoring and alerting configured
- [ ] Support team notified

## Communication Plan

### Stakeholder Notification
Who needs to be informed about this bug and its fix:
- [ ] Product team
- [ ] Support team
- [ ] Customer success team
- [ ] Affected customers
- [ ] Development team

### Communication Timeline
- **Discovery**: [when bug was discovered]
- **Initial Assessment**: [when impact was assessed]
- **Fix Planning**: [when fix plan was created]
- **Fix Implementation**: [when fix development started]
- **Fix Deployment**: [when fix will be deployed]
- **Resolution**: [when issue is fully resolved]

## Related Information

### Related Issues
- **Duplicate Bugs**: [links to duplicate reports]
- **Related Features**: [related feature requests]
- **Dependencies**: [dependent issues]

### External References
- **Documentation**: [relevant documentation links]
- **Third-party Issues**: [external bug reports]
- **Community Discussions**: [forum or discussion links]

### Historical Context
- **Previous Fixes**: [related fixes in the past]
- **Technical Debt**: [related technical debt]
- **Architecture Decisions**: [relevant architecture decisions]

## Progress Updates

### Status Log
- **{{DATE}}**: [status update and actions taken]
- **{{DATE}}**: [status update and actions taken]
- **{{DATE}}**: [status update and actions taken]

### Investigation Notes
- **{{DATE}}**: [investigation findings]
- **{{DATE}}**: [investigation findings]

### Fix Progress
- [ ] Root cause identified
- [ ] Fix approach agreed upon
- [ ] Fix implemented
- [ ] Fix tested
- [ ] Fix deployed
- [ ] Fix verified in production

## Post-Resolution

### Resolution Summary
Once fixed, document:
- **Root Cause**: [final determination of root cause]
- **Fix Implementation**: [what was actually implemented]
- **Testing Results**: [testing outcomes]
- **Deployment**: [deployment details]

### Lessons Learned
- **Prevention**: [how to prevent similar bugs]
- **Detection**: [how to detect similar issues earlier]
- **Process Improvements**: [process changes needed]

### Follow-up Actions
- [ ] Update documentation
- [ ] Improve error handling
- [ ] Add monitoring/alerting
- [ ] Update test coverage
- [ ] Review related code areas

---

## Template Usage Instructions

When reporting a new bug:

1. **Copy this template** to `context-network/backlog/active/bug-[ID]-[name].md`
2. **Fill in all relevant sections** - delete sections that don't apply
3. **Include reproduction steps** that are clear and detailed
4. **Attach evidence** (screenshots, logs, error messages)
5. **Assess impact** accurately to help with prioritization
6. **Update regularly** as investigation and fix progress

### Severity Guidelines

**Critical (P0)**:
- System completely unusable
- Data loss or corruption
- Security vulnerabilities
- Complete feature failure for all users

**High (P1)**:
- Major functionality broken
- Significant user impact
- Workaround difficult or impossible
- Performance severely degraded

**Medium (P2)**:
- Feature partially broken
- Moderate user impact
- Workaround exists
- Some users affected

**Low (P3)**:
- Minor functionality issues
- Cosmetic problems
- Easy workaround available
- Minimal user impact

### Priority Guidelines

**High Priority**:
- Critical or High severity bugs
- Affects large number of users
- Blocking other work
- Customer escalations

**Medium Priority**:
- Medium severity bugs
- Affects moderate number of users
- Has workaround
- Part of planned work

**Low Priority**:
- Low severity bugs
- Affects few users
- Enhancement-like fixes
- Technical debt