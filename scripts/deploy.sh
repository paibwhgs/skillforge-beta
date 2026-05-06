#!/bin/bash
# SkillForge 一键部署脚本
# 用法: 在本地运行 bash scripts/deploy.sh [--dry-run] <服务器IP> [SSH用户]
#
# 前置条件:
#   本地: Docker installed
#   服务器: Docker + docker-compose installed, 已配置 SSH 密钥登录
#
# 流程:
#   1. 运行预部署验证
#   2. 在本地构建 Docker 镜像并保存为 tar
#   3. scp 上传到服务器
#   4. SSH 到服务器加载镜像并启动

set -euo pipefail

DRY_RUN=false
if [ "${1:-}" = "--dry-run" ]; then
  DRY_RUN=true
  shift
fi

SERVER_IP=${1:-"your-server-ip"}
SSH_USER=${2:-"root"}
APP_NAME="skillforge"
APP_DIR="${APP_DIR:-~/skillforge}"
IMAGE_TAR="${APP_NAME}.tar"

run() {
  if [ "$DRY_RUN" = true ]; then
    echo "[DRY-RUN] $*"
  else
    "$@"
  fi
}

echo "=== Pre-Deploy Verification ==="
if [ "$DRY_RUN" = true ]; then
  echo "[DRY-RUN] bash scripts/verify-deploy.sh"
else
  bash scripts/verify-deploy.sh
fi
echo ""

echo "📦 Step 1: 构建 Docker 镜像..."
run docker build -t ${APP_NAME}:latest -f Dockerfile .

echo "💾 Step 2: 保存镜像为 tar 包..."
run docker save ${APP_NAME}:latest -o ${IMAGE_TAR}

echo "📤 Step 3: 上传到服务器 ${SERVER_IP}..."
run scp ${IMAGE_TAR} ${SSH_USER}@${SERVER_IP}:~/
run scp docker-compose.yml ${SSH_USER}@${SERVER_IP}:${APP_DIR}/
run scp .env.example ${SSH_USER}@${SERVER_IP}:${APP_DIR}/.env.example

echo "🔧 Step 4: 在服务器上加载并启动..."
if [ "$DRY_RUN" = true ]; then
  echo "[DRY-RUN] ssh ${SSH_USER}@${SERVER_IP} << EOF"
  echo "  cd ${APP_DIR}"
  echo "  docker load -i ~/${IMAGE_TAR}"
  echo "  (check .env status)"
  echo "  docker compose up -d"
  echo "EOF"
else
  ssh ${SSH_USER}@${SERVER_IP} << EOF
    cd ${APP_DIR}
    docker load -i ~/${IMAGE_TAR}
    echo "✅ 镜像加载完成"

    if [ ! -f .env ]; then
      cp .env.example .env
      echo "⚠️  请编辑 ${APP_DIR}/.env 填入真实 API Keys"
    fi

    docker compose up -d
    echo "✅ 服务已启动"
EOF
fi

echo "🧹 清理本地 tar 包..."
run rm ${IMAGE_TAR}

echo ""
echo "========================"
echo "✅ 部署完成！"
echo "   服务器: http://${SERVER_IP}:3000"
echo "========================"
