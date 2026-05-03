# SkillForge — AI Skill 发现与生成引擎

按需从互联网挖掘已验证的 AI 交互知识，自动策展并生成标准格式的 skill 文件。支持用户系统、独立历史记录、AI 实时对话修改。

## 功能

- **智能搜索**：输入你的领域，自动生成精准搜索 query，通过 Tavily + Dashscope（百炼）双引擎并行搜索
- **AI 策展**：去重、去噪、提取可复用的 prompt 模式和工作流结构（3 层策展：丰富结果 → AI 补充 → 种子库回退）
- **格式生成**：输出 Claude Code (CLAUDE.md) 或通用 Markdown 格式
- **冷启动**：搜索不足时回退到 6 个内置种子 skill
- **反馈收集**：用户点赞/点踩，持续迭代策展质量
- **用户系统**：注册/登录/登出，JWT + HTTP-only cookie，每个用户独立历史记录
- **AI 对话修改**：生成 skill 后，通过 SSE 流式对话与 DeepSeek 实时交互，随时修改内容

## 技术栈

- **框架**: Next.js 16 (App Router，所有组件 `'use client'`)
- **数据库**: Turso (边缘 SQLite / libSQL)
- **AI LLM**: DeepSeek API (`deepseek-chat`，temp 0.7)
- **搜索**: Tavily + Dashscope（百炼）双引擎
- **样式**: Tailwind CSS v4（`@tailwindcss/postcss`，无 `tailwind.config.js`）
- **部署**: Docker · Aliyun ECS (Ubuntu 24.04)

## 快速开始

### 1. 获取 API Keys

- **Turso**: https://app.turso.tech 创建数据库，获取 URL 和 Token
- **DeepSeek**: https://platform.deepseek.com 创建 API Key
- **Tavily**: https://app.tavily.com 注册获取 API Key（免费每月 1000 次）
- **Dashscope（百炼）**: https://bailian.console.aliyun.com 获取 API Key（国内访问推荐）

### 2. 配置环境变量

```bash
cp .env.example .env.local
```

```
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-turso-token
DEEPSEEK_API_KEY=sk-your-deepseek-key
TAVILY_API_KEY=tvly-your-tavily-key
DASHSCOPE_API_KEY=sk-your-dashscope-key
JWT_SECRET=your-jwt-secret              # 用于用户登录的 JWT 签名
```

> `JWT_SECRET` 在生产环境必填。本地 dev 模式会自动使用开发密钥。

### 3. 启动

```bash
npm install
npm run dev
```

打开 http://localhost:3000，输入领域描述，开始生成。

## 架构

```
用户输入 domain → POST /api/v1/generate
                    ├── multiSearch()    Tavily + Dashscope 并行搜索，去重
                    ├── curate()         DeepSeek 3 层策展
                    ├── formatSkill()    格式化为 CLAUDE.md / Markdown
                    └── insertSkill()    持久化到 Turso（关联当前用户）
```

## API

### POST /api/v1/generate

生成 skill。

```json
{
  "domain": "Go 后端开发，微服务架构",
  "format": "claude",
  "depth": "quick"
}
```

> `format`: `claude` | `markdown`，`depth`: `quick` | `deep`

### GET /api/v1/skills?limit=20

获取技能列表。已登录用户只返回自己的技能。

### GET /api/v1/skills/:id

获取单个 skill 及来源。

### POST /api/v1/feedback

提交反馈。

```json
{
  "skill_id": "xxx",
  "rating": 1
}
```

> `rating`: `1` (好) | `-1` (差) | `0` (重置)

### POST /api/v1/chat

登录后与 AI 实时对话修改 skill 内容（SSE 流式响应）。

```json
{
  "skillId": "uuid",
  "message": "帮我把介绍部分改得更简洁",
  "history": []
}
```

返回 `text/event-stream`，事件类型：
- `token` — 流式文本块
- `update` — AI 输出 `~~~skill-content` 代码块时自动更新数据库并通知前端
- `done` — 流结束

### Auth

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/v1/auth/register` | POST | `{ email, username, password }` → 注册并自动登录 |
| `/api/v1/auth/login` | POST | `{ email, password }` → 登录，设置 cookie |
| `/api/v1/auth/logout` | POST | 登出，清除 cookie |
| `/api/v1/auth/me` | GET | 获取当前用户信息（未登录返回 `{ user: null }`） |

## 部署

### Docker · Aliyun ECS（当前生产方案）

SkillForge 部署在阿里云 ECS，通过 Docker 运行。

#### 服务器配置

| 配置 | 规格 |
|------|------|
| 实例 | Aliyun ECS（轻量应用服务器） |
| CPU | 2 vCPU |
| 内存 | 2 GB |
| 磁盘 | 40 GB SSD |
| 带宽 | 200 Mbps（BGP） |
| 系统 | Ubuntu 24.04 LTS |
| 公网 IP | `8.136.138.185` |

#### 部署步骤

**1. 安装 Docker**（国内用阿里云镜像源）

```bash
curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://mirrors.aliyun.com/docker-ce/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update && apt install -y docker-ce docker-compose-plugin
```

**2. 配置 Docker 镜像加速**

```bash
cat > /etc/docker/daemon.json <<EOF
{
  "registry-mirrors": [
    "https://docker.1ms.run",
    "https://docker.xuanyuan.me"
  ]
}
EOF
systemctl restart docker
```

**3. 构建并启动**

```bash
# 在项目目录下
docker compose up -d --build
```

应用运行在 `http://8.136.138.185:3000`。

**4. 更新部署**

```bash
git pull                    # 拉取最新代码
docker compose up -d --build  # 重新构建并启动
```

#### Docker 相关文件

- [`Dockerfile`](./Dockerfile) — 多阶段构建（deps → builder → runner），`output: standalone`
- [`docker-compose.yml`](./docker-compose.yml) — 服务编排，含 healthcheck、日志限制
- [`.dockerignore`](./.dockerignore) — 忽略 node_modules、.git、.env 等

#### 环境变量

```
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-turso-token
DEEPSEEK_API_KEY=sk-your-deepseek-key
TAVILY_API_KEY=tvly-your-tavily-key          # 可选，仅 Tavily
DASHSCOPE_API_KEY=sk-your-dashscope-key       # 可选，仅百炼搜索
JWT_SECRET=your-jwt-secret                    # 必填，用户登录 JWT 签名密钥
```

> Dashscope（百炼）是国内阿里云提供的搜索 API，从 ECS 访问延迟极低，和 Tavily 互补使用。

### Zeabur（备选）

1. 注册 [zeabur.com](https://zeabur.com)（国内可访问）
2. 创建项目 → 从 GitHub 导入 `paibwhgs/skillforge`
3. 添加对应的环境变量（含 `JWT_SECRET`）
4. 部署完成后会生成可访问的 URL

## 脚本

```bash
npm run dev     # 开发服务器
npm run build   # 生产构建（standalone 输出）
npm run start   # 启动生产服务器（next start）
npm run serve   # 启动 standalone 构建（node .next/standalone/server.js）
npm run lint    # ESLint 检查
```

## 项目结构

```
app/
├── api/v1/
│   ├── auth/{register,login,logout,me}   # 用户认证
│   ├── chat/                               # SSE 流式对话
│   ├── feedback/                           # 评分反馈
│   ├── generate/                           # 核心生成
│   └── skills/                             # 技能 CRUD
├── history/                                # 历史记录页
├── login/                                  # 登录页
├── register/                               # 注册页
├── page.tsx                                # 首页
└── layout.tsx                              # 根布局
components/                                 # 客户端组件
lib/                                        # 核心库（auth, db, search, curator, llm, formatter）
types/                                      # TypeScript 类型
seeds/                                      # 冷启动种子数据
```

## 成本

| 步骤         | 单次消耗              |
| ------------ | --------------------- |
| Tavily 搜索  | 免费额度内            |
| DeepSeek API | ~¥0.05                |
| **合计**     | **每月 1000 次 ~¥50** |
