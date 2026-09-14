# Root Cause Tracing: Backward Call Stack Traversal

## Core Technique
When an exception occurs deep in the call stack:
1. Do not apply a bandage at the throw site (e.g. `if (!val) return;`).
2. Ask: **Why was `val` undefined here? Who passed it?**
3. Trace upward through each frame:
   - Frame N (Error thrown)
   - Frame N-1 (Function caller)
   - Frame N-2 (Service handler)
   - Frame 1 (HTTP Request parser / API input)
4. Fix the origin of corruption at Frame 1 or 2 rather than masking it at Frame N.
