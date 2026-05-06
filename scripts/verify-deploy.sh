#!/bin/bash
# SkillForge 预部署验证脚本
# 在 deploy.sh 构建之前自动运行，检查环境就绪状态
#
# 检查项:
#   1. .env / .env.local 文件是否存在
#   2. Docker 是否可用
#   3. Docker Compose 是否可用
#   4. npm build 是否成功
#   5. npm typecheck 是否通过
#
# 用法: bash scripts/verify-deploy.sh

set -euo pipefail

echo "=== Pre-Deploy Verification ==="
FAILED=0

# 检查 env 文件
if [ -f .env ] || [ -f .env.local ]; then
  echo "[PASS] Env file exists"
else
  echo "[FAIL] No .env or .env.local found"
  FAILED=$((FAILED + 1))
fi

# 检查 Docker
if command -v docker &>/dev/null; then
  echo "[PASS] Docker available"
else
  echo "[FAIL] Docker not found"
  FAILED=$((FAILED + 1))
fi

if docker compose version &>/dev/null; then
  echo "[PASS] Docker Compose available"
else
  echo "[FAIL] Docker Compose not found"
  FAILED=$((FAILED + 1))
fi

# 检查 npm build
if npm run build &>/dev/null; then
  echo "[PASS] npm build succeeds"
else
  echo "[FAIL] npm build failed"
  FAILED=$((FAILED + 1))
fi

# 检查 typecheck
if npm run typecheck &>/dev/null; then
  echo "[PASS] npm run typecheck passes"
else
  echo "[FAIL] npm run typecheck failed"
  FAILED=$((FAILED + 1))
fi

echo "---"
if [ $FAILED -eq 0 ]; then
  echo "Result: ALL PASS ($FAILED failures)"
  exit 0
else
  echo "Result: $FAILED failures — fix before deploying"
  exit 1
fi
