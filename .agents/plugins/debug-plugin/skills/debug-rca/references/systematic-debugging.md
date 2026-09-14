# Systematic Debugging Protocol

## Principles
1. **Never guess**: Every hypothesis must be falsifiable with concrete data.
2. **Reproduce first**: If you cannot reproduce the bug reliably, you cannot prove that a change fixed it.
3. **One variable at a time**: When experimenting, alter only a single parameter or line of code at each step.

## Step-by-Step Flow
1. **Define the Expected vs Actual Behavior**:
   - What did the user/caller expect?
   - What did the runtime actually return?
2. **Isolate the Boundary**:
   - Determine if the fault lies in HTTP Controller -> Application Service -> Repository -> Database / External API.
3. **Inspect Inputs and Invariants**:
   - Check if undefined, null, NaN, or out-of-range parameters bypassed Zod/TypeScript validation.
4. **Inspect State Transitions**:
   - For database or asynchronous issues, inspect if locks, transactions, or event listeners raced.
