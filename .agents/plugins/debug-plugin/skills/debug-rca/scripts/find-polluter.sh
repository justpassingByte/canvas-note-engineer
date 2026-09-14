#!/usr/bin/env bash
# Bisect test files to identify state polluter
VICTIM="$1"
RUNNER="${2:-pnpm test}"

if [ -z "$VICTIM" ]; then
  echo "Usage: ./find-polluter.sh <path-to-failing-test> [test-runner-command]"
  exit 1
fi

echo "==> Verifying if victim test passes in isolation: $VICTIM"
$RUNNER "$VICTIM"
if [ $? -ne 0 ]; then
  echo "Error: Victim test fails alone. Not a pollution issue."
  exit 1
fi
echo "Victim test PASSES in isolation. Pollution investigation confirmed."
