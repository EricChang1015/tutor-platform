#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")" && pwd)
cd "$ROOT_DIR"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

TESTS=(
  "node test_admin_user_management.js"
  "node test_admin_fixes.js"
  "node test_modal_fixes.js"
  "node test_frontend_upload.js"
  "node test_avatar_upload.js"
  "node test-demo.js"
  "bash -lc ./test_all_apis.sh"
  "bash -lc ./test_timezone_apis.sh"
)

PASSED=()
FAILED=()

echo -e "${YELLOW}==> Ensuring services are running (docker-compose up -d)...${NC}"
docker-compose up -d >/dev/null 2>&1 || true
sleep 2

COUNTER=1
for CMD in "${TESTS[@]}"; do
  NAME="$CMD"
  echo -e "\n${YELLOW}[$COUNTER/${#TESTS[@]}] Running: ${NAME}${NC}"
  set +e
  bash -lc "$CMD"
  CODE=$?
  set -e
  if [ $CODE -eq 0 ]; then
    echo -e "${GREEN}✔ PASS:${NC} $NAME"
    PASSED+=("$NAME")
  else
    echo -e "${RED}✘ FAIL:${NC} $NAME (exit $CODE)"
    FAILED+=("$NAME")
  fi
  COUNTER=$((COUNTER+1))

done

echo -e "\n${YELLOW}================ Test Summary ================${NC}"
echo -e "${GREEN}Passed:${NC} ${#PASSED[@]}"
for P in "${PASSED[@]}"; do echo "  - $P"; done

echo -e "${RED}Failed:${NC} ${#FAILED[@]}"
for F in "${FAILED[@]}"; do echo "  - $F"; done

if [ ${#FAILED[@]} -eq 0 ]; then
  echo -e "\n${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "\n${RED}Some tests failed.${NC}"
  exit 1
fi

