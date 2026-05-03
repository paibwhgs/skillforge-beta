#!/bin/bash
# SkillForge 一键部署脚本
# 用法: 在本地运行 bash scripts/deploy.sh <服务器IP>
#
# 前置条件:
#   本地: Docker installed
#   服务器: Docker + docker-compose installed, 已配置 SSH 密钥登录
#
# 流程:
#   1. 在本地构建 Docker 镜像并保存为 tar
#   2. scp 上传到服务器
#   3. SSH 到服务器加载镜像并启动

set -e

SERVER_IP=${1:-"your-server-ip"}
SSH_USER=${2:-"root"}
APP_NAME="skillforge"
IMAGE_TAR="${APP_NAME}.tar"

echo "📦 Step 1: 构建 Docker 镜像..."
docker build -t ${APP_NAME}:latest -f Dockerfile .

echo "💾 Step 2: 保存镜像为 tar 包..."
docker save ${APP_NAME}:latest -o ${IMAGE_TAR}

echo "📤 Step 3: 上传到服务器 ${SERVER_IP}..."
scp ${IMAGE_TAR} ${SSH_USER}@${SERVER_IP}:~/
scp docker-compose.yml ${SSH_USER}@${SERVER_IP}:~/${APP_NAME}/
scp .env.example ${SSH_USER}@${SERVER_IP}:~/${APP_NAME}/.env.example

echo "🔧 Step 4: 在服务器上加载并启动..."
ssh ${SSH_USER}@${SERVER_IP} << 'EOF'
  cd ~/skillforge
  docker load -i ~/skillforge.tar
  echo "✅ 镜像加载完成"

  # 如果不存在 .env 则从示例创建
  if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  请编辑 ~/skillforge/.env 填入真实 API Keys"
  fi

  docker compose up -d
  echo "✅ 服务已启动"
EOF

echo "🧹 清理本地 tar 包..."
rm ${IMAGE_TAR}

echo ""
echo "========================"
echo "✅ 部署完成！"
echo "   服务器: http://${SERVER_IP}:3000"
echo "========================"
