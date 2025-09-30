## Quick Session Closure Checklist

We're about to close this session and lose anything not captured that we might need later. Are all of the following done?

### Context Network Task Management
- [ ] Context network task entry exists and is updated with current status
- [ ] Task discoveries documented in `/discoveries/records/YYYY-MM-DD-###.md`
- [ ] All architectural decisions are documented (with ADRs if significant)
- [ ] Implementation approach is recorded

### Discovery Layer Updates
- [ ] **Discovery records created** for all insights meeting trigger criteria (see `/discoveries/triggers.md`)
- [ ] **Location indexes updated** with any new component/feature locations found
- [ ] **Learning paths updated** if understanding evolved significantly
- [ ] Code exploration insights captured with file paths and line numbers

### Relationship & Navigation
- [ ] Discovered relationships are mapped between components/concepts
- [ ] Navigation hubs updated if new paths discovered
- [ ] Bidirectional links established where appropriate

### Quality & Boundaries  
- [ ] Follow-up items are noted in appropriate sections
- [ ] **No planning documents exist outside the context network**
- [ ] All documents follow size limits (flag documents >300 lines)
- [ ] **Obsolete content archived** (not just deleted)

### Discovery Triggers Met?
Review `/discoveries/triggers.md` - did any of these happen without documentation?
- [ ] Spent >5 minutes figuring out how something works
- [ ] Read >3 files to understand one feature
- [ ] Found "I know I saw this somewhere" moments
- [ ] Discovered why something was designed a certain way

---

## Next Session Starter Prompt

Once all checklist items are complete, prepare this prompt for the next session:

```
I'm continuing work on [PROJECT_NAME].

Please read the latest task completion record:
context-network/tasks/YYYY-MM-DD-[task-name].md

Then review:
- The backlog: context-network/planning/[backlog-file].md
- Current architecture: context-network/architecture/[relevant-doc].md

I'd like to [NEXT_PHASE_DESCRIPTION].
```

**Example:**
```
I'm continuing the TypeScript Agent development.

Please read the latest task completion record:
context-network/tasks/2025-09-30-inbox-processing-cli-router.md

Then review:
- The backlog: context-network/planning/typescript-agent-backlog.md
- Current architecture: context-network/architecture/tooling_architecture.md

I'd like to implement Phase 2 (Core Utilities) from the backlog.
```

**Tips for next session:**
- Point to specific task record (most important context)
- Reference backlog for "what's next"
- Reference architecture docs for "how it works"
- State clear intent for the session
- Keep it under 4 sentences

$ARGUMENTS