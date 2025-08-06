# Mastra Workflow Data Flow Patterns

## Purpose
This document provides critical guidance on Mastra workflow data flow patterns based on production experience. It addresses the root cause of 90% of workflow failures: incorrect data passing between steps.

## Classification
- **Domain:** Cross-Cutting
- **Stability:** Established
- **Abstraction:** Structural
- **Confidence:** Established
- **Lifecycle Stage:** Active
- **Audience:** Developers, Architects

## Content

### Executive Summary

Mastra workflows operate on a **"relay race" model, not an "accumulator" model**. Each step only receives the output of the previous step - there is no implicit context or data accumulation. Understanding and implementing this pattern correctly is critical for successful workflow execution.

### The Core Mental Model

#### What Developers Often Expect (WRONG)
```typescript
Step1 outputs {A, B} → Step2 can access {A, B} and adds {C} → Step3 can access {A, B, C}
```

#### What Actually Happens (REALITY)
```typescript
Step1 outputs {A, B} → Step2 receives {A, B}, outputs {C} → Step3 receives only {C} ❌
```

### Think "Relay Race" Not "Snowball"

- **Relay Race** ✅: Each runner must explicitly pass the baton to the next
- **Snowball** ❌: Rolling downhill accumulating everything automatically

This mental model shift is essential for avoiding the most common workflow failures.

### The Three Questions Rule

Before implementing any workflow step, ALWAYS ask:

1. **What data do I need?** (from the previous step)
2. **What data do I create?** (my contribution)
3. **What data must I pass forward?** (for future steps)

### Common Failure Pattern

The typical failure scenario:

1. Workflow appears to work through several steps
2. Suddenly a step fails with "undefined" for data that existed earlier
3. Investigation reveals an intermediate step didn't pass the data forward
4. Hours are wasted debugging what should have been a simple data passing issue

#### Real Production Example

```typescript
// Step 2: Detect Format - This caused hours of debugging
const detectFormatStep = createStep({
  execute: async ({ inputData }) => {
    const { fileContent, fileName } = inputData;
    const formatInfo = await detectFormat(fileContent);
    
    // ❌ BUG: Only returned new data, lost fileContent and fileName
    return { formatInfo };
  }
});

// Step 3: Extract Data - Failed because fileContent was undefined
const extractDataStep = createStep({
  execute: async ({ inputData }) => {
    // 💥 inputData.fileContent is undefined!
    const data = await extract(inputData.fileContent); 
  }
});
```

### Code Patterns That Work

#### Pattern 1: The Safe Default (Use This 90% of the Time)

```typescript
const myStep = createStep({
  id: 'my-step',
  execute: async ({ inputData }) => {
    // Do your work
    const myResult = await processData(inputData);
    
    // ALWAYS spread inputData to pass everything forward
    return {
      ...inputData,      // ✅ Pass through everything
      myResult          // ✅ Add your new data
    };
  }
});
```

#### Pattern 2: Selective Pass-Through

```typescript
const myStep = createStep({
  execute: async ({ inputData }) => {
    // Destructure what you need
    const { dataToTransform, ...passThrough } = inputData;
    
    // Transform your data
    const transformed = await transform(dataToTransform);
    
    // Return passThrough data plus your results
    return {
      ...passThrough,    // ✅ Everything except what you transformed
      transformed        // ✅ Your transformation result
    };
  }
});
```

#### Pattern 3: Explicit Field Listing (When You Need Clarity)

```typescript
const myStep = createStep({
  execute: async ({ inputData }) => {
    const result = await process(inputData);
    
    // Explicitly list what to pass forward
    return {
      // From previous steps
      fileName: inputData.fileName,
      projectId: inputData.projectId,
      fileContent: inputData.fileContent,
      formatInfo: inputData.formatInfo,
      // New data from this step
      extractedData: result
    };
  }
});
```

### Debugging Strategy

When you encounter "undefined" in a workflow:

#### 1. Immediate Response
```typescript
// Add this to the failing step
console.log(`[${stepId}] Input fields:`, Object.keys(inputData));
```

#### 2. Trace Backwards
- Find which step last had the missing data
- Check that step's return statement
- The bug is almost always a missing spread operator or field

#### 3. Add Debug Logging
```typescript
const debugStep = createStep({
  execute: async ({ inputData }) => {
    console.log('Input:', Object.keys(inputData));
    const result = await process(inputData);
    const output = { ...inputData, result };
    console.log('Output:', Object.keys(output));
    return output;
  }
});
```

### Prevention Strategies

#### 1. Design First
Before coding, draw the data flow:
```
Input: {projectName, fileName}
  ↓
readFile: adds {fileContent, fileSize}
  ↓ outputs: {projectName, fileName, fileContent, fileSize}
detectFormat: adds {formatInfo}
  ↓ outputs: {projectName, fileName, fileContent, fileSize, formatInfo}
extractData: adds {extractedData}, removes {fileContent, fileSize}
  ↓ outputs: {projectName, fileName, formatInfo, extractedData}
```

#### 2. Use TypeScript Schemas
Define your schemas to catch issues at compile time:
```typescript
const step = createStep({
  inputSchema: z.object({
    fileName: z.string(),
    fileContent: z.string(),
    formatInfo: z.object({...})
  }),
  outputSchema: z.object({
    fileName: z.string(),      // Must include this!
    fileContent: z.string(),   // Must include this!
    formatInfo: z.object({...}), // Must include this!
    extractedData: z.any()     // Plus new data
  })
});
```

#### 3. Create Workflow Utilities
```typescript
// Helper to validate data flow
function validateDataFlow(inputData: any, outputData: any, stepId: string) {
  const inputKeys = Object.keys(inputData);
  const outputKeys = Object.keys(outputData);
  const dropped = inputKeys.filter(k => !outputKeys.includes(k));
  
  if (dropped.length > 0) {
    console.warn(`[${stepId}] WARNING: Dropped fields: ${dropped.join(', ')}`);
  }
}
```

### Best Practices Checklist

#### When Creating Workflow Steps
- [ ] Always use the spread operator in return statements unless explicitly removing fields
- [ ] Document data flow in comments before implementing
- [ ] Use TypeScript schemas for input/output validation
- [ ] Test each step with console.log to verify data flow
- [ ] Consider using the validateDataFlow utility

#### When Debugging Workflows
- [ ] Check data flow first - it's the most common issue
- [ ] Use console.log to trace field presence through steps
- [ ] Look for missing spread operators in return statements
- [ ] Verify that intermediate steps aren't dropping fields
- [ ] Document the fix to prevent recurrence

### Quick Reference Card

```typescript
// ✅ ALWAYS SAFE
return { ...inputData, myNewData };

// ❌ USUALLY BUGS
return { myNewData };

// 🔍 DEBUG PATTERN
console.log('In:', Object.keys(inputData));
console.log('Out:', Object.keys(outputData));

// 📋 MENTAL CHECKLIST
// 1. What do I receive?
// 2. What do I create?
// 3. What must I pass forward?
```

### For AI Coding Assistants

When working with Mastra workflows:

1. **Always use the spread operator** in return statements unless explicitly told not to
2. **Check data flow first** when debugging - it's the most common issue
3. **Suggest the relay race mental model** when explaining workflows
4. **Include data flow validation** in any workflow you create
5. **Draw data flow diagrams** in comments before implementing

#### Example AI Response Pattern

When creating a workflow step:
```typescript
// Data flow: receives {A, B, C} → outputs {A, B, C, D}
const myStep = createStep({
  id: 'my-step',
  execute: async ({ inputData }) => {
    // inputData contains: {A, B, C}
    const D = await processData(inputData.C);
    
    // Must pass through A, B, C and add D
    return {
      ...inputData,  // Passes through {A, B, C}
      D              // Adds new data
    };
  }
});
```

### Common Issues and Solutions

#### Issue: Data doesn't flow automatically
**Root Cause:** Expecting accumulator behavior instead of relay race
**Solution:** Always use spread operator to pass data forward

#### Issue: "undefined" errors in later steps
**Root Cause:** Intermediate step didn't pass required data
**Solution:** Add spread operator to the step that's dropping data

#### Issue: Hard to track data flow
**Root Cause:** No visibility into what each step receives/outputs
**Solution:** Add logging or use the validateDataFlow utility

#### Issue: Schema validation failures
**Root Cause:** Output schema doesn't include all required fields
**Solution:** Ensure output schema includes both passed-through and new fields

## Relationships
- **Parent Nodes:** [cross_cutting/mastra_integration_guide.md]
- **Child Nodes:** None
- **Related Nodes:** 
  - [architecture/workflow_architecture.md] - architectural-view - Workflow architecture patterns
  - [evolution/technical_debt_registry.md] - anti-pattern - Common workflow anti-patterns
  - [decisions/adr_001_workflow_data_passing_strategy.md] - decision - Data passing strategy decision

## Navigation Guidance
- **Access Context:** Reference this document when implementing or debugging Mastra workflows
- **Common Next Steps:** Review workflow architecture patterns or specific implementation examples
- **Related Tasks:** Workflow implementation, debugging workflow failures, designing data flows
- **Update Patterns:** Update when new workflow patterns emerge or common issues are discovered

## Metadata
- **Created:** 2025-08-05
- **Last Updated:** 2025-08-05
- **Updated By:** Claude
- **Sources:** Production experience from Mastra workflow debugging retrospective

## Change History
- 2025-08-05: Initial creation from production lessons learned document