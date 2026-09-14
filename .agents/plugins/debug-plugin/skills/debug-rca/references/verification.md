# Verification Protocol

## The Iron Law of Verification
**NO WORK IS COMPLETE WITHOUT REPRODUCIBLE VERIFICATION EVIDENCE.**

1. Never state "The bug should be fixed" or "This ought to work now".
2. Run the test command via `debug_run_test`.
3. Verify:
   - Exit code is 0.
   - All assertions passed.
   - No silent unhandled promise rejections.
4. Document the exact command and terminal output as evidence in your PR or report.
