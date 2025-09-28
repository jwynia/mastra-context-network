# Technical Debt Registry

## Purpose
This document provides an index of all known technical debt items in the system, their impact, and remediation plans.

## Classification
- **Domain:** Evolution
- **Stability:** Dynamic
- **Abstraction:** Structural
- **Confidence:** Established

## Content

### What is Technical Debt?

Technical debt refers to the implied cost of additional rework caused by choosing an easy or expedient solution now instead of using a better approach that would take longer. Like financial debt, technical debt incurs "interest" in the form of extra effort needed in future development.

This registry tracks known technical debt items to ensure they are:
- Explicitly documented rather than implicit
- Assessed for their impact
- Prioritized appropriately
- Addressed according to a plan

### How to Use This Registry

This registry organizes technical debt items in multiple ways to help you find relevant information:

1. **By Priority**: Find the most critical debt items to address
2. **By Area**: Find debt related to specific areas of the system
3. **By Type**: Find specific types of technical debt
4. **By Impact**: Find debt based on what aspects of the system it affects

### Technical Debt Summary

| ID | Title | Type | Priority | Area | Suggested Timeframe |
|----|-------|------|----------|------|---------------------|
| TD_001 | Workflow Data Accumulation Assumption | Architecture Debt | High | Workflows | Next Sprint |
| TD_002 | Kuzu Database Installation Disabled | Infrastructure Debt | Medium | DevContainer | Next Month |
| TD_003 | Manual Git Configuration Required | Infrastructure Debt | Low | DevContainer | Future |
| TD_004 | Multiple TypeScript Configuration Files | Code Debt | Low | Configuration | Future |

### Technical Debt by Priority

#### Critical
- *None yet*

#### High
- **TD_001**: Workflow Data Accumulation Assumption - Developers often assume Mastra workflows accumulate data across steps like a snowball, when they actually operate on a relay race model

#### Medium
- **TD_002**: Kuzu Database Installation Disabled - Graph database unavailable due to upstream archive format changes

#### Low
- **TD_003**: Manual Git Configuration Required - Hardcoded git user configuration in devcontainer setup
- **TD_004**: Multiple TypeScript Configuration Files - Separate configs for Deno and Node.js runtimes

### Technical Debt by Area

#### Workflows
- **TD_001**: Workflow Data Accumulation Assumption - Anti-pattern where developers expect automatic data accumulation between workflow steps

#### DevContainer
- **TD_002**: Kuzu Database Installation Disabled - Semantic analysis features unavailable
- **TD_003**: Manual Git Configuration Required - User-specific configuration hardcoded

#### Configuration
- **TD_004**: Multiple TypeScript Configuration Files - Runtime separation requires multiple config maintenance

### Technical Debt by Type

#### Architecture Debt
- **TD_001**: Workflow Data Accumulation Assumption - Fundamental misunderstanding of Mastra's relay race workflow architecture leads to 90% of workflow failures

#### Code Debt
- *None yet*

#### Test Debt
- *None yet*

#### Documentation Debt
- *None yet*

#### Infrastructure Debt
- **TD_002**: Kuzu Database Installation Disabled - Upstream package distribution changes broke installation
- **TD_003**: Manual Git Configuration Required - Devcontainer setup not portable across developers

#### Code Debt
- **TD_004**: Multiple TypeScript Configuration Files - Dual runtime approach requires configuration duplication

#### Process Debt
- *None yet*

### Technical Debt by Impact

#### Performance Impact
- *None yet*

#### Maintainability Impact
- *None yet*

#### Reliability Impact
- *None yet*

#### Security Impact
- *None yet*

#### Developer Experience Impact
- **TD_001**: Workflow Data Accumulation Assumption - Causes hours of debugging for what should be simple data passing issues, significantly impacting developer productivity
- **TD_002**: Kuzu Database Installation Disabled - Semantic analysis features unavailable, reducing development capabilities
- **TD_003**: Manual Git Configuration Required - New developers need manual configuration setup

### Recording New Technical Debt

To record a new technical debt item:

1. Copy the template from `meta/templates/technical_debt_template.md`
2. Name the file `td_NNN_short_title.md` where NNN is the next available number
3. Fill in all sections of the template
4. Add the debt item to this registry in all relevant sections
5. Ensure the appropriate stakeholders are aware of the new debt item

### Updating Technical Debt Status

When a debt item's status changes:

1. Update the debt item document with the new status and any progress
2. Update this registry to reflect any changes in priority or categorization
3. If the debt has been fully addressed, move it to the "Addressed Debt" section with the date resolved

### Addressed Technical Debt

This section tracks debt items that have been fully addressed, serving as a record of improvements and learning opportunities.

| ID | Title | Type | Resolved Date | Resolution Summary |
|----|-------|------|--------------|-------------------|
| *None yet* |

## Relationships
- **Parent Nodes:** None
- **Child Nodes:** 
  - [All individual technical debt items] - contains - Individual debt records
- **Related Nodes:** 
  - [decisions/decision_index.md] - influences - Decisions may create or address technical debt
  - [evolution/refactoring_plans.md] - implements - Refactoring plans often address technical debt
  - [meta/templates/technical_debt_template.md] - uses - Template for creating new debt items

## Navigation Guidance
- **Access Context:** Use this document when planning work, prioritizing improvements, or understanding system limitations
- **Common Next Steps:** After reviewing this registry, typically explore specific debt items of interest or related refactoring plans
- **Related Tasks:** Sprint planning, technical roadmapping, system improvement initiatives
- **Update Patterns:** This document should be updated whenever a new debt item is added or an existing item's status changes

## Metadata
- **Created:** [Date]
- **Last Updated:** [Date]
- **Updated By:** [Role/Agent]

## Change History
- [Date]: Initial creation of technical debt registry
