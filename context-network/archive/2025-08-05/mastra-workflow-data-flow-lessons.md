# Mastra Workflow Data Flow: Critical Lessons Learned

## Executive Summary

After extensive debugging, we discovered that **90% of Mastra workflow failures are caused by data not being passed correctly between steps**. This document captures the key learnings and provides actionable guidance for coding agents working with Mastra workflows.

## The Core Problem

**Mastra workflows operate on a "relay race" model, not an "accumulator" model.** Each step only receives the output of the previous step - there is no implicit context or data accumulation.

### What This Means in Practice

```typescript
// What developers expect (WRONG):
Step1 outputs {A, B} → Step2 can access {A, B} and adds {C} → Step3 can access {A, B, C}

// What actually happens (REALITY):
Step1 outputs {A, B} → Step2 receives {A, B}, outputs {C} → Step3 receives only {C} ❌
```

## Common Failure Pattern

The typical failure looks like this:

1. Workflow appears to work through several steps
2. Suddenly a step fails with "undefined" for data that existed earlier
3. Investigation reveals an intermediate step didn't pass the data forward
4. Hours are wasted debugging what should have been a simple data passing issue

### Real Example from Production

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

## The Solution: Mental Model Shift

### Think "Relay Race" Not "Snowball"

- **Relay Race** ✅: Each runner must explicitly pass the baton to the next
- **Snowball** ❌: Rolling downhill accumulating everything automatically

### The Three Questions Rule

Before implementing any workflow step, ALWAYS ask:

1. **What data do I need?** (from the previous step)
2. **What data do I create?** (my contribution)
3. **What data must I pass forward?** (for future steps)

## Code Patterns That Work

### Pattern 1: The Safe Default (Use This 90% of the Time)

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

### Pattern 2: Selective Pass-Through

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

### Pattern 3: Explicit Field Listing (When You Need Clarity)

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

## Debugging Strategy

When you encounter "undefined" in a workflow:

### 1. Immediate Response
```typescript
// Add this to the failing step
console.log(`[${stepId}] Input fields:`, Object.keys(inputData));
```

### 2. Trace Backwards
- Find which step last had the missing data
- Check that step's return statement
- The bug is almost always a missing spread operator or field

### 3. Add Debug Logging
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

## Prevention Strategies

### 1. Design First
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

### 2. Use TypeScript Schemas
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

### 3. Create Workflow Utilities
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

## For AI Coding Assistants

When working with Mastra workflows:

1. **Always use the spread operator** in return statements unless explicitly told not to
2. **Check data flow first** when debugging - it's the most common issue
3. **Suggest the relay race mental model** when explaining workflows
4. **Include data flow validation** in any workflow you create
5. **Draw data flow diagrams** in comments before implementing

### Example AI Response Pattern

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

## Key Takeaways

1. **Data doesn't flow automatically** - you must explicitly pass it
2. **Each step is isolated** - it only sees the previous step's output
3. **Use spread operator by default** - `return { ...inputData, newData }`
4. **Debug data flow first** - it's the cause of most "undefined" errors
5. **Document data flow** - comments save debugging time

## Quick Reference Card

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

---

*This document is based on production experience debugging Mastra workflows. Following these patterns will prevent the majority of workflow failures and save significant debugging time.*