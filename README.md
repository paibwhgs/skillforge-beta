# SkillForge — AI Skill 发现与生成引擎

按需从互联网挖掘已验证的 AI 交互知识，自动策展并生成标准格式的 skill 文件。

## 功能

- **智能搜索**：输入你的领域，自动生成精准搜索 query，通过 Tavily 搜索互联网
- **AI 策展**：去重、去噪、提取可复用的 prompt 模式和工作流结构
- **格式生成**：输出 Claude Code (CLAUDE.md) 或通用 Markdown 格式
- **冷启动**：搜索不足时回退到内置种子库
- **反馈收集**：用户点赞/点踩，持续迭代策展质量

## 技术栈

- **框架**: Next.js 14 (App Router)
- **数据库**: Turso (边缘 SQLite)
- **AI LLM**: DeepSeek API
- **搜索**: Tavily Search API
- **部署**: Vercel

## 快速开始

### 1. 获取 API Keys

- **Turso**: https://app.turso.tech 创建数据库，获取 URL 和 Token
- **DeepSeek**: https://platform.deepseek.com 创建 API Key
- **Tavily**: https://app.tavily.com 注册获取 API Key（免费每月 1000 次搜索）

### 2. 配置环境变量

```bash
cp .env.example .env.local
```

```
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-turso-token
DEEPSEEK_API_KEY=sk-your-deepseek-key
TAVILY_API_KEY=tvly-your-tavily-key
```

### 3. 启动

```bash
npm install
npm run dev
```

打开 http://localhost:3000，输入领域描述，开始生成。

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

获取生成历史。

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

## 部署到 Vercel

部署后在 Vercel 项目设置中添加环境变量即可。

## 成本

| 步骤 | 单次消耗 |
|---|---|
| Tavily 搜索 | 免费额度内 |
| DeepSeek API | ~¥0.05 |
| **合计** | **每月 1000 次 ~¥50** |
