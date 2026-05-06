# SkillForge 项目优化

## TL;DR

> **Quick Summary**: 基于 `/init-deep` 全面扫描发现�?9 类改进点，对 SkillForge Next.js 16 项目进行系统性优化——Docker 构建效率、缺失的框架边界、统一认证中间件、环境变量整理、类型检查、空目录清理、AGENTS.md 扩展、部署脚本优化、构建上下文清理�?>
> **Deliverables**:
> - Dockerfile 修复 + `.dockerignore` 清理
> - `app/error.tsx` + `app/not-found.tsx`
> - `app/middleware.ts` 三档鉴权
> - `.env.example` 补齐 + 环境变量文档
> - `package.json` 添加 `typecheck` 脚本
> - 实现 `app/api/v1/feedback/route.ts`
> - 删除 `app/my-skills/` 空目�?> - `components/AGENTS.md` + `app/AGENTS.md`
> - `scripts/deploy.sh` 优化 + `scripts/verify-deploy.sh`
> - `package.json` rename `serve` �?`start:standalone`
>
> **Estimated Effort**: Medium
> **Parallel Execution**: YES �?3 waves
> **Critical Path**: Task 1 �?Task 3 �?Task 9

---

## Context

### Original Request
用户要求基于 `/init-deep` 扫描结果，为 SkillForge 项目制定涵盖全部 9 类改进点的优化计划�?
### Interview Summary
**Key Discussions**:
- Scope: 全部 9 类改进点（Docker、Next.js 边界、中间件、环境变量、类型检查、空目录、AGENTS.md、部署脚本、项目解耦）
- 测试策略: 仅类型检查（`tsc --noEmit`），不引入测试框�?- 中间�? 三档鉴权 �?`require`（chat 401）、`optional`（generate/skills/me 有则附用户）、`public`（auth 端点、静态文件）
- feedback 路由: 实现（创�?route.ts，不删除�?- loading.tsx: 跳过（客户端组件页面不支�?page-level loading.tsx�?- Area 9: 清理 `stitch-designs/` �?`examples/` 的构建上下文

**Research Findings**:
- `oh-my-openagent/` �?`superpowers/` 不存在于当前工作区（`F:\claude-migration\skillforge`），已从计划中排�?- `stitch-designs/` 存在（HTML/CSS 设计稿），`examples/` 存在（示例输出），均不参与构�?- `app/api/v1/feedback/` 目录存在但无 `route.ts`，READM 声称该端点可�?- `app/my-skills/` 目录存在但无 `page.tsx`
- `lib/packager.ts` �?CLAUDE.md 中被引用但实际不存在（过时文档）
- `.env.example` 缺少 `TAVILY_API_KEY`；已�?`OPENCODE_GO_API_KEY`
- Dockerfile `deps` stage 是孤儿阶段（无任何阶段从�?COPY�?- `.dockerignore` �?`.next` 重复列出
- 所有页面都�?`'use client'`，仅 `app/layout.tsx` 是服务端组件

### Metis Review
**Identified Gaps** (addressed):
- Area 9 验证: `oh-my-openagent/` �?`superpowers/` 不在本工作区 �?重新定位为清�?`stitch-designs/` + `examples/`
- `lib/AGENTS.md` 不存�?�?已验证，在当前工作区也不存在（之前写入的�?`E:\桌面\skillforge`�?- Auth 分类矩阵: 已定义三档（require/optional/public），每个路由明确分类
- loading.tsx: 已跳过（客户端组件不支持�?- Typecheck 前置条件: `tsconfig.json` 包含 `.next/types/`，需�?build 或排�?- feedback 路由处置: 已决定实�?- `OPENCODE_GO_API_KEY` 验证: 已确认在 `.env.example` 中存�?
---

## Work Objectives

### Core Objective
�?SkillForge 项目执行 9 类系统优化，提升构建效率、用户体验、代码健壮性和开发者体验�?
### Concrete Deliverables
- 修复后的 `Dockerfile`（移除孤�?deps stage�?- 清理后的 `.dockerignore`（添�?`stitch-designs/`、`examples/`，去�?`.next`�?- `app/error.tsx` �?全局错误边界
- `app/not-found.tsx` �?自定�?404 页面
- `app/middleware.ts` �?三档 JWT 鉴权
- 补齐后的 `.env.example`（添�?`TAVILY_API_KEY`�?- `app/api/v1/feedback/route.ts` �?反馈端点实现
- 删除 `app/my-skills/` 空目�?- `components/AGENTS.md` �?UI 组件文档
- `app/AGENTS.md` �?路由层文�?- `package.json` 新增 `typecheck` 脚本
- `package.json` `serve` 重命名为 `start:standalone`
- `scripts/verify-deploy.sh` �?部署前验证脚�?
### Definition of Done
- [ ] `npm run typecheck` 返回 exit 0
- [ ] `docker build -t test .` 成功，构建上下文小于 500 文件
- [ ] `curl /api/v1/generate` 不需登录即可返回 200
- [ ] `curl /api/v1/chat` �?auth 返回 401
- [ ] `curl /nonexistent-page` 返回自定�?404 页面
- [ ] `curl /api/v1/feedback` 正确接收并存储反�?
### Must Have
- Dockerfile 修复 + .dockerignore 清理
- error.tsx + not-found.tsx
- middleware.ts 三档鉴权
- .env.example 补齐
- typecheck 脚本
- feedback route 实现
- 空目录清理（my-skills/�?
### Must NOT Have (Guardrails)
- **Middleware 只做鉴权** �?不添�?rate-limiting、CORS、logging、header 管理
- **不改变现有鉴权行�?* �?generate/ 公开、skills/ 公开、chat/ 需登录、auth/me 可选，语义必须完全保持
- **不创�?loading.tsx** �?客户端组件不支持 page-level loading.tsx
- **不引入测试框�?* �?�?`tsc --noEmit`
- **不安装新 npm �?* �?优化不引入新依赖
- **不添�?CI/CD 基础设施** �?部署脚本修复仅限脚本本身
- **不创建大�?AGENTS.md** �?最多新�?2 个子目录文件（`components/`、`app/`�?- **不修�?`lib/auth.ts` 的鉴权逻辑** �?middleware 复用现有 `verifyToken()`/`getAuthUser()`

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** �?所有验证都�?agent 通过 curl/Playwright/bash 执行�?
### Test Decision
- **Infrastructure exists**: NO
- **Automated tests**: None（仅类型检查）
- **Framework**: `tsc --noEmit`
- **Typecheck**: 每个实现任务完成后运�?`npm run typecheck`

### QA Policy
每个任务必须包含 agent 执行�?QA Scenarios。证据保存到 `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`�?
- **API/Backend**: 使用 Bash (curl) �?发送请求、断言 status + response 字段
- **Frontend/UI**: 使用 Playwright �?导航、交互、断言 DOM、截�?- **CLI/Build**: 使用 Bash �?运行命令、验�?exit code + 输出

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately �?独立任务, MAX PARALLEL):
├── Task 1: Dockerfile 修复 + .dockerignore 清理 [quick]
├── Task 2: .env.example 补齐 + 环境变量文档 [quick]
├── Task 3: package.json 添加 typecheck 脚本 [quick]
├── Task 4: 删除 app/my-skills/ 空目�?[quick]
├── Task 5: 实现 app/api/v1/feedback/route.ts [deep]
└── Task 6: 创建 app/error.tsx + app/not-found.tsx [visual-engineering]

Wave 2 (After Wave 1 �?依赖 Task 5/6 的鉴权信�?:
├── Task 7: 创建 app/middleware.ts 三档鉴权 [deep]
├── Task 8: 优化 scripts/deploy.sh + 创建 verify-deploy.sh [quick]
└── Task 9: package.json rename serve �?start:standalone [quick]

Wave 3 (After Wave 2 �?文档�?:
├── Task 10: 创建 components/AGENTS.md [writing]
├── Task 11: 创建 app/AGENTS.md [writing]
└── Task 12: 更新 README.md（feedback 端点 + serve rename）[writing]

Wave FINAL (After ALL �?2 parallel reviews + user okay):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Real QA verification (unspecified-high)
-> Present results -> Get explicit user okay
```

Critical Path: Task 1 �?Task 5 �?Task 7 �?F1-F2 �?user okay
Parallel Speedup: ~50% faster than sequential
Max Concurrent: 6 (Wave 1)

---

## TODOs

- [x] 1. Dockerfile 修复 + .dockerignore 清理

  **What to do**:
  - 读取 `Dockerfile`，移�?orphan `deps` stage（lines 1-4: `FROM node:20-alpine AS deps` ... 该阶段无任何后续阶段从中 COPY�?  - 读取 `.dockerignore`，添�?`stitch-designs/`、`examples/`、`.claude/`、`.vercel/`、`*.tar.gz`、`dev-server.log`
  - 移除 `.dockerignore` 中重复的 `.next` 条目（当前出现两次）
  - 验证 `Dockerfile` 结构：deps 移除后，`builder` stage 应直接从 `FROM node:20-alpine` 开�?
  **Must NOT do**:
  - 不要直接删除 deps stage 而不先阅读完整的 Dockerfile（确保没有隐藏的 COPY --from=deps�?  - 不要修改 `builder` �?`runner` stage 的逻辑
  - 不要添加�?stage

  **Recommended Agent Profile**:
  > 简单文件编辑，单文件修�?  - **Category**: `quick`
    - Reason: 仅涉�?Dockerfile�? 文件�? .dockerignore�? 文件）的独立编辑，无依赖
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `git-master`: 不需�?git 操作

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4, 5, 6)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `Dockerfile` �?完整读取以确�?deps stage 的孤立状态和 builder/runner stage �?COPY 来源
  - `.dockerignore` �?查看当前条目列表，确认重复的 `.next` 及缺少的目录
  - `docker-compose.yml` �?确认 `build: .` 引用�?Dockerfile 上下�?
  **Acceptance Criteria**:
  - [ ] Dockerfile 不再包含 `AS deps` stage
  - [ ] `.dockerignore` 包含 `stitch-designs/`、`examples/`、`.claude/`、`*.tar.gz`、`dev-server.log`
  - [ ] `.dockerignore` �?`.next` 只出现一�?
  **QA Scenarios**:

  ```
  Scenario: Docker build succeeds after deps stage removal
    Tool: Bash
    Preconditions: Docker daemon running
    Steps:
      1. Run: docker build -t skillforge-test .
      2. Check exit code = 0
      3. Check output does NOT contain "AS deps"
      4. Check output does NOT contain any COPY --from error
    Expected Result: Build exits 0, no reference to removed deps stage
    Failure Indicators: Exit code != 0, or error "COPY --from=deps" not found
    Evidence: .sisyphus/evidence/task-1-docker-build.txt

  Scenario: Build context size reduced
    Tool: Bash
    Preconditions: Clean state (no previous builds)
    Steps:
      1. Run: docker build -t skillforge-test . 2>&1 | Select-String "Sending build context"
      2. Assert: context size < 5MB (indicating stitch-designs/examples excluded)
    Expected Result: Build context references only app source files
    Failure Indicators: Context > 10MB (large files still included)
    Evidence: .sisyphus/evidence/task-1-build-context.txt
  ```

  **Commit**: YES
  - Message: `fix(docker): remove orphan deps stage, clean .dockerignore`
  - Files: `Dockerfile`, `.dockerignore`

- [x] 2. .env.example 补齐 + 环境变量说明

  **What to do**:
  - 读取 `.env.example`，添加缺失的 `TAVILY_API_KEY=tvly-your-tavily-key`
  - �?`.env.example` 顶部添加注释说明 `.env.local`（本地开发）�?`.env`（Docker 部署）的区别
  - 可选：�?README.md 中补�?`OPENCODE_GO_API_KEY` 的说明（�?key 已存在于 .env.example �?README 环境变量章节未列出）

  **Must NOT do**:
  - 不要修改 `.env.local`（包含真实密钥）
  - 不要�?.env.example 中放置真实密钥�?  - 不要删除已有的任�?key

  **Recommended Agent Profile**:
  > 单文件编�?+ 可�?README 更新
  - **Category**: `quick`
    - Reason: 仅涉�?.env.example�? 文件）的简单编辑，README 更新为可�?  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4, 5, 6)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `.env.example` �?查看当前 key 列表
  - `README.md:85-120` �?环境变量章节，确认哪�?key 被说明哪些遗�?  - `.env.local` �?仅读�?key 名称（不读值），确认哪些实际被使用

  **Acceptance Criteria**:
  - [ ] `.env.example` 包含 `TAVILY_API_KEY=tvly-your-tavily-key`
  - [ ] `.env.example` 顶部有注释说�?`.env.local` vs `.env` 的使用场�?  - [ ] `.env.example` �?key 数量与实际代码中 `process.env.X` 的使用一�?
  **QA Scenarios**:

  ```
  Scenario: .env.example contains all required keys
    Tool: Bash
    Preconditions: None
    Steps:
      1. Read .env.example and extract all KEY= lines
      2. Grep codebase for process.env. usage: grep -r "process\.env\." --include="*.ts" --include="*.tsx" lib/ app/ | Select-String -Pattern "[A-Z_]+" 
      3. Assert every process.env key found in code has a corresponding entry in .env.example
    Expected Result: All process.env keys match .env.example entries
    Failure Indicators: Key used in code but missing from .env.example
    Evidence: .sisyphus/evidence/task-2-env-audit.txt
  ```

  **Commit**: YES
  - Message: `fix(env): add missing TAVILY_API_KEY to .env.example, document env file usage`
  - Files: `.env.example`

- [x] 3. package.json 添加 typecheck 脚本

  **What to do**:
  - 读取 `package.json` �?`tsconfig.json`
  - 由于 `tsconfig.json` 包含 `"include": [".next/types/**/*.ts"]`，该路径仅在 `next build` 后存�?  - 方案：创�?`tsconfig.typecheck.json`（extends �?tsconfig，exclude `.next/`），�?`package.json` 添加 `"typecheck": "tsc --noEmit --project tsconfig.typecheck.json"`
  - 或者更简单：添加 `"typecheck": "tsc --noEmit"` 但要求先运行 build；在脚本中添加前置检�?
  **Must NOT do**:
  - 不要修改�?`tsconfig.json`（可能影�?Next.js 构建�?  - 不要安装新的 npm �?  - 不要�?`typecheck` 脚本直接修改任何源文�?
  **Recommended Agent Profile**:
  > TypeScript 配置任务，需要理�?tsconfig 继承
  - **Category**: `quick`
    - Reason: 创建 1 个配置文�?+ 修改 1 �?package.json，逻辑简�?  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4, 5, 6)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `package.json:5-10` �?scripts 部分，确认当前脚本列�?  - `tsconfig.json` �?查看 includes/excludes/compilerOptions，确�?`.next/types/` 引用

  **Acceptance Criteria**:
  - [ ] `package.json` �?scripts 中包�?`"typecheck"` 条目
  - [ ] `npm run typecheck` 在干净构建后返�?exit 0

  **QA Scenarios**:

  ```
  Scenario: typecheck passes on clean codebase
    Tool: Bash
    Preconditions: npm run build 已成功执行（生成 .next/types/�?    Steps:
      1. Run: npm run typecheck
      2. Assert exit code = 0
      3. Assert output has no "error TS" lines
    Expected Result: Exit 0, no type errors
    Failure Indicators: Exit != 0, or TypeScript errors in output
    Evidence: .sisyphus/evidence/task-3-typecheck-pass.txt

  Scenario: typecheck catches intentional error
    Tool: Bash
    Preconditions: typecheck passes cleanly
    Steps:
      1. Create temp file with type error: echo "const x: number = 'oops'" > lib/__typecheck_test__.ts
      2. Run: npm run typecheck
      3. Assert exit code != 0
      4. Remove temp file
    Expected Result: Exit != 0, error message referencing the temp file
    Failure Indicators: Exit 0 (typecheck didn't catch the error)
    Evidence: .sisyphus/evidence/task-3-typecheck-fail.txt
  ```

  **Commit**: YES
  - Message: `chore: add typecheck script with tsconfig.typecheck.json`
  - Files: `package.json`, `tsconfig.typecheck.json`

- [x] 4. 删除 app/my-skills/ 空目�?
  **What to do**:
  - 确认 `app/my-skills/` 目录为空（无 page.tsx、layout.tsx、route.ts 等任何文件）
  - 删除该空目录
  - 检�?README.md �?AGENTS.md 中是否有引用 `my-skills` 路由的描述，若无则无需修改文档

  **Must NOT do**:
  - 不要删除任何有文件内容的目录
  - 如果目录非空（有任何文件），停止并报�?
  **Recommended Agent Profile**:
  > 单目录删除，无代码变�?  - **Category**: `quick`
    - Reason: 验证 + 删除一个空目录
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 5, 6)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `app/my-skills/` �?确认目录为空

  **Acceptance Criteria**:
  - [ ] `app/my-skills/` 目录不存�?  - [ ] `npm run dev` 启动后无 404 或编译错误（该目录为空，删除不影响路由）

  **QA Scenarios**:

  ```
  Scenario: Directory removed, build still works
    Tool: Bash
    Preconditions: None
    Steps:
      1. Assert: Test-Path "app/my-skills" returns $false
      2. Run: npm run build
      3. Assert exit code = 0
    Expected Result: Build succeeds without my-skills directory
    Failure Indicators: Build error referencing my-skills
    Evidence: .sisyphus/evidence/task-4-removed.txt
  ```

  **Commit**: YES
  - Message: `chore: remove empty app/my-skills directory`
  - Files: 删除 `app/my-skills/`

- [x] 5. 实现 app/api/v1/feedback/route.ts

  **What to do**:
  - 创建 `app/api/v1/feedback/route.ts`
  - 实现 `POST` handler：接�?`{ skillId: string, rating: number, feedback?: string }`
  - 复用 `lib/db.ts` 中的 `insertFeedback()` 或类似函数（如不存在，新增一�?`insertFeedback()` 函数�?  - 复用 `lib/auth.ts` 中的 `getAuthUser()` 获取当前用户（可选登录，未登录也可提交反馈）
  - 返回 `{ success: true }` 或适当的错误响�?  - 参�?`app/api/v1/chat/route.ts` �?`app/api/v1/skills/route.ts` 的代码风�?
  **Must NOT do**:
  - 不要创建新的 DB 表（使用现有表结构，或仅�?`initDB()` 中添加字段）
  - 不要引入新的 npm 依赖
  - 不要强制要求登录才能提交反馈

  **Recommended Agent Profile**:
  > 需要理�?DB schema、auth 模式、现有路由风�?�?中等复杂�?  - **Category**: `deep`
    - Reason: 需要跨 `lib/db.ts`（DB schema）、`lib/auth.ts`（鉴权模式）、现有路由风格多文件理解，非简�?CRUD
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `git-master`: 不需�?git 操作

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 4, 6)
  - **Blocks**: Task 7 (middleware 需测试 feedback 路由的鉴权行�?
  - **Blocked By**: None

  **References**:
  - `lib/db.ts` �?查看 `initDB()` 中的表结构、CRUD 函数签名。如 feedback 表不存在，确�?`skill_feedback` 或相关表
  - `lib/auth.ts:getAuthUser()` �?复用现有鉴权逻辑（可选登录模式）
  - `app/api/v1/chat/route.ts` �?POST handler 代码风格参考（鉴权检查、错误处理模式）
  - `app/api/v1/skills/[id]/route.ts` �?PATCH 请求模式参考（bookmark toggle，类�?rating update�?  - `types/index.ts` �?查看现有类型定义（FeedbackRequest、GenerateRequest 等）

  **Acceptance Criteria**:
  - [ ] `POST /api/v1/feedback` 返回 200 + `{ success: true }`
  - [ ] 未登录用户也可提�?feedback
  - [ ] 无效 rating（非 1/-1/0）返�?400
  - [ ] `npm run typecheck` 通过

  **QA Scenarios**:

  ```
  Scenario: Happy path �?submit feedback with auth
    Tool: Bash (curl)
    Preconditions: 已注册用户，已登录（�?token cookie），已知 skill_id
    Steps:
      1. Login to get cookie: curl -s -c cookies.txt -X POST localhost:3000/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"test123"}'
      2. Submit feedback: curl -s -b cookies.txt -X POST localhost:3000/api/v1/feedback -H "Content-Type: application/json" -d '{"skillId":"<known-id>","rating":1,"feedback":"Great skill"}'
      3. Assert response.status = 200
      4. Assert response.body contains "success": true
    Expected Result: 200, feedback stored
    Failure Indicators: 401, 500, or response missing success field
    Evidence: .sisyphus/evidence/task-5-feedback-happy.txt

  Scenario: Submit feedback without auth (optional login)
    Tool: Bash (curl)
    Preconditions: 已知 skill_id
    Steps:
      1. curl -s -X POST localhost:3000/api/v1/feedback -H "Content-Type: application/json" -d '{"skillId":"<known-id>","rating":-1}'
      2. Assert response.status = 200
    Expected Result: 200, feedback stored without user association
    Failure Indicators: 401 (unexpected auth requirement)
    Evidence: .sisyphus/evidence/task-5-feedback-noauth.txt

  Scenario: Invalid rating rejected
    Tool: Bash (curl)
    Preconditions: None
    Steps:
      1. curl -s -X POST localhost:3000/api/v1/feedback -H "Content-Type: application/json" -d '{"skillId":"<known-id>","rating":99}'
      2. Assert response.status = 400
      3. Assert response.body contains error message
    Expected Result: 400, validation error
    Failure Indicators: 200 (accepted invalid rating)
    Evidence: .sisyphus/evidence/task-5-feedback-invalid.txt
  ```

  **Commit**: YES
  - Message: `feat(api): implement POST /api/v1/feedback endpoint`
  - Files: `app/api/v1/feedback/route.ts`, `lib/db.ts` (if new function added)

- [x] 6. 创建 app/error.tsx + app/not-found.tsx

  **What to do**:
  - 创建 `app/error.tsx`：`'use client'` 组件，展示友好的错误提示 + "返回首页" 按钮
  - 创建 `app/not-found.tsx`：展�?"页面未找�? + 返回首页链接
  - 参�?`components/` 中现有组件的样式（Tailwind v4、dark theme、`forge-*` 色彩系统�?  - �?`app/globals.css` 中复�?`.glass-panel`、`.forge-gradient-border` 等工具类
  - error.tsx 需�?`reset()` 函数支持重试

  **Must NOT do**:
  - 不要创建 loading.tsx（客户端组件不支�?page-level loading�?  - 不要�?error.tsx 中暴露技术细节（堆栈跟踪、文件路径）
  - 不要�?error.tsx 放在�?`'use client'` 模式�?
  **Recommended Agent Profile**:
  > 前端 UI 组件，需要匹配现有设计系�?  - **Category**: `visual-engineering`
    - Reason: 需要匹配现�?Tailwind v4 dark theme、glass-panel 风格、forge-* 色彩系统
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: 设计 UI 组件，匹配现有设计语言
  - **Skills Evaluated but Omitted**:
    - `playwright`: 不需要浏览器自动�?
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 4, 5)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `components/` �?查看现有组件�?Tailwind 类名模式（`SearchInput.tsx`、`Header.tsx`�?  - `app/globals.css` �?复用 `.glass-panel`、`.forge-gradient-border`、`.animate-fadeIn` 等工具类
  - `app/layout.tsx` �?了解根布局结构，确�?error/not-found �?layout 保持一致的字体和主�?
  **Acceptance Criteria**:
  - [ ] `app/error.tsx` 存在，以 `'use client'` 开�?  - [ ] `app/not-found.tsx` 存在
  - [ ] `curl localhost:3000/nonexistent-path` 返回 200（不�?404 HTML，Next.js �?not-found 返回 200 状态码是预期行为）
  - [ ] 两个组件都使�?Tailwind v4 类名�?dark theme

  **QA Scenarios**:

  ```
  Scenario: Custom 404 page shown for nonexistent route
    Tool: Playwright
    Preconditions: npm run dev 运行�?    Steps:
      1. Navigate to: http://localhost:3000/this-page-does-not-exist-12345
      2. Wait for page to load (timeout: 5s)
      3. Assert: page contains "Not Found" or "未找�? or "页面不存�?
      4. Assert: there is a link back to home page "/" or button
      5. Screenshot: not-found page
    Expected Result: Friendly 404 page, not blank white screen
    Failure Indicators: Blank page, Next.js default error, or page contains raw error stack
    Evidence: .sisyphus/evidence/task-6-not-found.png

  Scenario: Error boundary catches runtime error
    Tool: Playwright
    Preconditions: npm run dev 运行�?    Steps:
      1. Navigate to: http://localhost:3000
      2. Use Playwright to evaluate JS that triggers error in a component 
         (or: navigate to a known error-triggering state)
      3. Assert: error page is shown (not white screen)
      4. Assert: "Try Again" or "重试" button is present
      5. Screenshot: error page
    Expected Result: Friendly error UI with retry option
    Failure Indicators: White screen, uncaught error in console only
    Evidence: .sisyphus/evidence/task-6-error-boundary.png
  ```

  **Commit**: YES
  - Message: `feat(ui): add global error boundary and custom 404 page`
  - Files: `app/error.tsx`, `app/not-found.tsx`

- [x] 7. 创建 app/middleware.ts 三档鉴权

  **What to do**:
  - 创建 `app/middleware.ts`
  - 实现 JWT 验证逻辑，复�?`lib/auth.ts` 中的 `verifyToken()`（或直接读取 cookie 解析 JWT�?  - 三档分类�?    - **require**: `POST /api/v1/chat` �?无有�?token 返回 401 JSON
    - **optional**: `POST /api/v1/generate`, `POST /api/v1/generate/stream`, `GET /api/v1/skills`, `GET /api/v1/skills/:id`, `GET /api/v1/auth/me` �?�?token 则附加用户信息到 header (`x-user-id`)，无则继�?    - **public**: `/api/v1/auth/login`, `/api/v1/auth/register`, `/api/v1/auth/logout`, `POST /api/v1/feedback`, 所有非 API 路由、静态文�?�?直接放行
  - 使用 Next.js middleware matcher 精确匹配 API 路由，避免对静态资源执行鉴�?  - 在请求中设置 `x-user-id` header 供下�?route handler 使用

  **Must NOT do**:
  - 不要修改 `lib/auth.ts` 的鉴权逻辑
  - 不要将现�?route handler 中的 `getAuthUser()` 调用移除（middleware 注入 header，handler 仍可自行调用�?  - 不要�?static files、`_next/*`、`favicon.ico` 执行鉴权
  - 不要�?middleware 中添�?rate-limiting、CORS、logging 等非鉴权功能
  - middleware 必须保持轻量（只�?JWT 验证），不要进行 DB 查询

  **Recommended Agent Profile**:
  > 需要理�?Next.js middleware 机制、JWT 验证、现有鉴权行�?�?架构级任�?  - **Category**: `deep`
    - Reason: 跨多个路由的鉴权行为分析，需要理�?Next.js middleware 约定、JWT 解析、路由匹配模�?  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `git-master`: 不需�?git 操作

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (after Tasks 5, 6)
  - **Blocks**: Task 8 (deploy script 可能需验证 middleware 行为)
  - **Blocked By**: Task 5 (feedback route 必须存在才能正确分类), Task 6 (边界文件必须存在，middleware 可能需要调�?matcher)

  **References**:
  - `lib/auth.ts:signToken()` / `verifyToken()` �?JWT 签名和验证逻辑，middleware 需复用
  - `app/api/v1/chat/route.ts` �?查看当前如何执行鉴权（`getAuthUser()` 调用模式�?  - `app/api/v1/generate/route.ts` �?查看当前 generate 路由的鉴权状态（公开但附用户�?  - `app/api/v1/skills/route.ts` �?查看 skills 列表的鉴权行�?  - `app/api/v1/auth/me/route.ts` �?查看 me 端点的可选鉴权模�?
  **Acceptance Criteria**:
  - [ ] `POST /api/v1/chat` �?cookie �?401 JSON
  - [ ] `POST /api/v1/generate` �?cookie �?200（公开�?  - [ ] `GET /api/v1/skills` 有有�?cookie �?200 + 用户关联�?skills
  - [ ] `POST /api/v1/auth/login` 不受 middleware 影响
  - [ ] `GET /_next/static/...` 不触�?middleware
  - [ ] `npm run typecheck` 通过

  **QA Scenarios**:

  ```
  Scenario: Protected route returns 401 without auth
    Tool: Bash (curl)
    Preconditions: 无登�?cookie
    Steps:
      1. curl -s -o /dev/null -w "%{http_code}" -X POST localhost:3000/api/v1/chat -H "Content-Type: application/json" -d '{"skillId":"test"}'
      2. Assert response code = 401
      3. Assert response body contains JSON error message
    Expected Result: 401 JSON
    Failure Indicators: 200 (should require auth), 500
    Evidence: .sisyphus/evidence/task-7-chat-401.txt

  Scenario: Public route works without auth
    Tool: Bash (curl)
    Preconditions: 无登�?cookie
    Steps:
      1. curl -s -o /dev/null -w "%{http_code}" -X POST localhost:3000/api/v1/generate -H "Content-Type: application/json" -d '{"domain":"test","mode":"direct"}'
      2. Assert response code = 200
    Expected Result: 200, generate works without auth
    Failure Indicators: 401 (middleware incorrectly blocking public route)
    Evidence: .sisyphus/evidence/task-7-generate-200.txt

  Scenario: Optional auth attaches user when logged in
    Tool: Bash (curl)
    Preconditions: 已登录用户，�?token cookie
    Steps:
      1. Login and capture cookie
      2. curl -s -b cookies.txt localhost:3000/api/v1/auth/me
      3. Assert response contains user email
      4. Assert response status = 200
    Expected Result: User info returned
    Failure Indicators: null user despite valid cookie
    Evidence: .sisyphus/evidence/task-7-me-optional.txt

  Scenario: Static files bypass middleware
    Tool: Bash (curl)
    Preconditions: npm run build
    Steps:
      1. curl -s -o /dev/null -w "%{http_code}" localhost:3000/favicon.ico
      2. Assert response code = 200 (not 401)
    Expected Result: Static file served without auth check
    Failure Indicators: 401 (middleware incorrectly intercepting static file)
    Evidence: .sisyphus/evidence/task-7-static-bypass.txt
  ```

  **Commit**: YES
  - Message: `feat(auth): add unified middleware with three-tier JWT auth`
  - Files: `app/middleware.ts`

- [x] 8. 优化 scripts/deploy.sh + 创建 scripts/verify-deploy.sh

  **What to do**:
  - 读取 `scripts/deploy.sh`，改进：
    - 添加 `set -euo pipefail` 确保错误时退�?    - 添加构建前验证步骤（调用 `verify-deploy.sh`�?    - 添加 `.env` 文件存在性检查（在服务器端）
    - 将硬编码�?`~/skillforge/` 路径改为变量 `$APP_DIR`
    - 添加 `--dry-run` 标志支持
  - 创建 `scripts/verify-deploy.sh`�?    - 检�?`.env`（或 `.env.example` 作为模板）是否包含所有必需 key
    - 检�?`docker` �?`docker compose` 是否可用
    - 检�?`npm run build` 是否成功
    - 检�?`npm run typecheck` 是否通过
    - 输出通过/失败的摘�?
  **Must NOT do**:
  - 不要改变 deploy.sh 的核心流程（SCP tar �?SSH load �?docker compose up�?  - 不要�?deploy.sh 中放入服务器凭据
  - 不要引入 CI/CD 平台（GitHub Actions 等）

  **Recommended Agent Profile**:
  > Shell 脚本编写 + 错误处理模式
  - **Category**: `quick`
    - Reason: 修改 1 个脚�?+ 创建 1 个新脚本，逻辑线�?  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 8, 9)
  - **Blocks**: None
  - **Blocked By**: Task 3 (typecheck 必须存在才能�?verify-deploy.sh 调用)

  **References**:
  - `scripts/deploy.sh` �?完整读取当前脚本
  - `package.json:scripts` �?确认 `build`、`typecheck` 脚本名称
  - `.env.example` �?verify-deploy.sh 需检查的必需 key 列表
  - `docker-compose.yml` �?确认服务名称�?env_file 引用

  **Acceptance Criteria**:
  - [ ] `scripts/deploy.sh` �?`set -euo pipefail` 开�?  - [ ] `scripts/verify-deploy.sh` 存在且可执行
  - [ ] `bash scripts/verify-deploy.sh` 返回 exit 0（本地验证）
  - [ ] hardcoded 路径已替换为 `$APP_DIR` 变量

  **QA Scenarios**:

  ```
  Scenario: verify-deploy.sh passes locally
    Tool: Bash
    Preconditions: npm run build 已完�? docker daemon 运行, .env 文件存在
    Steps:
      1. Run: bash scripts/verify-deploy.sh
      2. Assert exit code = 0
      3. Assert output contains "PASS" for typecheck, build, docker, env checks
    Expected Result: All checks pass
    Failure Indicators: Non-zero exit
    Evidence: .sisyphus/evidence/task-8-verify-pass.txt

  Scenario: deploy.sh supports --dry-run
    Tool: Bash
    Preconditions: None
    Steps:
      1. Run: bash scripts/deploy.sh --dry-run
      2. Assert no actual SCP or SSH commands execute
      3. Assert output shows "DRY RUN" and lists what WOULD happen
    Expected Result: Dry run shows planned actions without executing
    Failure Indicators: Actual SCP/SSH executed, or script errors
    Evidence: .sisyphus/evidence/task-8-dryrun.txt
  ```

  **Commit**: YES
  - Message: `fix(deploy): add error handling, verification script, and dry-run support`
  - Files: `scripts/deploy.sh`, `scripts/verify-deploy.sh`

- [x] 9. package.json rename serve �?start:standalone

  **What to do**:
  - 读取 `package.json`，将 `"serve"` 脚本重命名为 `"start:standalone"`
  - 保留原脚本内容不变（`node .next/standalone/server.js`�?  - 确保 Dockerfile 中的 `CMD` 不依�?`npm run serve`（验证后 Dockerfile 使用的是直接�?`node server.js`，不受影响）
  - 检�?README.md 中是否有引用 `npm run serve`，如有则更新�?`npm run start:standalone`

  **Must NOT do**:
  - 不要修改 Dockerfile �?CMD（Docker 使用 `node server.js`，不依赖 npm 脚本�?  - 不要修改 `serve` 脚本的逻辑内容

- [x] 8. �Ż� scripts/deploy.sh + ���� scripts/verify-deploy.sh
  > 简单重命名 + 验证
  - **Category**: `quick`
    - Reason: 修改 1 �?package.json + 可�?README 更新
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 7, 8)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `package.json:9` �?`"serve"` 脚本
  - `Dockerfile` �?确认 CMD 不依�?npm run serve
  - `README.md` �?搜索 `npm run serve` 引用

  **Acceptance Criteria**:
  - [ ] `package.json` 中不再有 `"serve"` 脚本
  - [ ] `package.json` 中有 `"start:standalone": "node .next/standalone/server.js"`
  - [ ] `npm run start:standalone` 在构建后可正常运�?
  **QA Scenarios**:

  ```
  Scenario: start:standalone works after build
    Tool: Bash
    Preconditions: npm run build 已完�?    Steps:
      1. Run: npm run start:standalone (background, kill after 5s)
      2. Check process exits without error
      3. curl localhost:3000 during runtime returns 200
    Expected Result: Server starts and responds on port 3000
    Failure Indicators: Script not found, process crash, port not responding
    Evidence: .sisyphus/evidence/task-9-start-standalone.txt
  ```

  **Commit**: YES
  - Message: `refactor: rename serve script to start:standalone for clarity`
  - Files: `package.json`, `README.md` (if applicable)

- [x] 10. 创建 components/AGENTS.md

  **What to do**:
  - 读取 `components/` 目录下所�?`.tsx` 文件（共 10 个）
  - 为每个组件提取：文件名、导出名、用途、props 签名（如有）
  - 总结组件共用的模式：命名导出、`'use client'`、Tailwind v4 类名风格
  - 写入 `components/AGENTS.md`，结构：Overview �?Component List �?Conventions �?Anti-Patterns
  - 参�?`AGENTS.md` 根文件风格（电报体、非通用、项目特定）

  **Must NOT do**:
  - 不要重复�?AGENTS.md 中已有的内容
  - 不要为每个组件写 JSDoc 级别的文�?  - 不要超过 60 �?
  **Recommended Agent Profile**:
  > 文档编写，需阅读 10 个组件文�?  - **Category**: `writing`
    - Reason: 纯文档编写，需要阅读源码提取信�?  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 11, 12)
  - **Blocks**: None
  - **Blocked By**: None（只读不写源码）

  **References**:
  - `components/SearchInput.tsx` �?最复杂的组件，�?format/depth/mode 选择�?  - `components/SkillPreview.tsx` �?渲染生成结果的组�?  - `components/ChatPanel.tsx` �?SSE 流式聊天面板
  - `components/AuthProvider.tsx` �?React Context 鉴权状�?  - `components/BottomNav.tsx` �?移动端底部导�?  - `AGENTS.md:65-72` �?根文�?Anti-Patterns 章节参考风�?  - `lib/AGENTS.md` �?参考同级的 AGENTS.md 结构

  **Acceptance Criteria**:
  - [ ] `components/AGENTS.md` 存在
  - [ ] 不超�?60 �?  - [ ] 不重复根 AGENTS.md 的内�?  - [ ] 包含每个组件�?1-2 行描�?
  **QA Scenarios**:

  ```
  Scenario: AGENTS.md covers all components
    Tool: Bash
    Preconditions: None
    Steps:
      1. Count .tsx files in components/: (Get-ChildItem components/*.tsx).Count
      2. Count component mentions in components/AGENTS.md (grep for component names)
      3. Assert match
    Expected Result: Every .tsx file has a corresponding description
    Failure Indicators: Missing component mention
    Evidence: .sisyphus/evidence/task-10-coverage.txt
  ```

  **Commit**: YES (grouped with T11, T12)
  - Message: `docs: add AGENTS.md for components/ and app/, update README`
  - Files: `components/AGENTS.md`, `app/AGENTS.md`, `README.md`

- [x] 11. 创建 app/AGENTS.md

  **What to do**:
  - 读取 `app/` 目录结构（pages + API routes�?  - 总结 app 层的组织模式：所有页�?`'use client'`、路由结构、API 路由约定
  - 写入 `app/AGENTS.md`，结构：Overview �?Route Map �?Conventions �?Anti-Patterns
  - 重点标注：middleware 鉴权分类（Task 7 实现后）、feedback 端点（Task 5 实现后）
  - 参�?`lib/AGENTS.md` 的简洁风�?
  **Must NOT do**:
  - 不要重复�?AGENTS.md �?Architecture 章节的路由列�?  - 不要列出每个 API 端点的完整请�?响应格式（那�?README 的工作）
  - 不要超过 60 �?
  **Recommended Agent Profile**:
  > 文档编写，需阅读路由结构
  - **Category**: `writing`
    - Reason: 纯文档编写，基于现有代码结构
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 10, 12)
  - **Blocks**: None
  - **Blocked By**: Task 7（middleware 鉴权信息需要更新）�?但实际上可以不依赖，文档只描述现�?
  **References**:
  - `app/` directory listing �?页面�?API 路由结构
  - `AGENTS.md:74-86` �?根文�?Architecture 章节（避免重复）
  - `lib/AGENTS.md` �?参考同�?AGENTS.md 结构

  **Acceptance Criteria**:
  - [ ] `app/AGENTS.md` 存在
  - [ ] 不超�?60 �?  - [ ] 包含路由一览表
  - [ ] 标注�?middleware 的鉴权分�?
  **QA Scenarios**:

  ```
  Scenario: AGENTS.md covers all app routes
    Tool: Bash
    Preconditions: Tasks 5-7 已完�?    Steps:
      1. List app/ directories: Get-ChildItem -Directory -Recurse -Depth 2 app/ | Where-Object { $_.Name -ne 'api' }
      2. Check each page route is mentioned in app/AGENTS.md
    Expected Result: All existing routes documented
    Failure Indicators: Missing route mention
    Evidence: .sisyphus/evidence/task-11-coverage.txt
  ```

  **Commit**: YES (grouped with T10, T12)
  - Message: `docs: add AGENTS.md for components/ and app/, update README`
  - Files: `components/AGENTS.md`, `app/AGENTS.md`, `README.md`

- [x] 12. 更新 README.md

  **What to do**:
  - 读取 `README.md`，更新以下部分：
    - 环境变量章节：补�?`TAVILY_API_KEY` 到列表，添加 `.env.local` vs `.env` 的区别说�?    - API 章节：确�?feedback 端点已列出（`POST /api/v1/feedback`），如果不在则添�?    - 脚本章节：将 `npm run serve` 改为 `npm run start:standalone`，添�?`npm run typecheck`
    - 部署章节：如有引�?`serve`，更新为 `start:standalone`
  - 移除对已删除�?`app/my-skills/` 路由的引用（如果有）

  **Must NOT do**:
  - 不要重写 README 的整体结�?  - 不要�?README 中放入真实密钥�?
  **Recommended Agent Profile**:
  > 文档更新，跨多个章节的精确编�?  - **Category**: `writing`
    - Reason: 纯文档编辑，需精确匹配多个章节
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 10, 11)
  - **Blocks**: None
  - **Blocked By**: None（README 更新可独立进行，但最好等 T1-T9 完成以获取准确信息）

  **References**:
  - `README.md` �?完整读取，定位环境变量、API、脚本、部署章�?  - `.env.example` (更新�? �?引用最新的 key 列表
  - `package.json` (更新�? �?引用最新的 scripts

  **Acceptance Criteria**:
  - [ ] README 环境变量章节列出所�?7 �?key（含 TAVILY_API_KEY�?  - [ ] README API 章节包含 feedback 端点
  - [ ] README 脚本章节�?`serve` 已替换为 `start:standalone`
  - [ ] README 脚本章节中添加了 `npm run typecheck`

  **QA Scenarios**:

  ```
  Scenario: README references match actual files
    Tool: Bash
    Preconditions: All previous tasks completed
    Steps:
      1. Check every script name in README exists in package.json scripts
      2. Check every API endpoint in README has a corresponding route.ts
      3. Check every env key in README matches .env.example
    Expected Result: No stale references
    Failure Indicators: README mentions non-existent script/endpoint/key
    Evidence: .sisyphus/evidence/task-12-readme-audit.txt
  ```

  **Commit**: YES (grouped with T10, T11)
  - Message: `docs: add AGENTS.md for components/ and app/, update README`
  - Files: `components/AGENTS.md`, `app/AGENTS.md`, `README.md`

---

## Final Verification Wave

> 2 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [x] F1. **Plan Compliance Audit** �?`oracle`
  读取计划端到端。对每条 "Must Have" 验证实现存在。对每条 "Must NOT Have" 搜索代码库查找禁用模�?�?如果发现�?file:line 拒绝。检查证据文件存在于 `.sisyphus/evidence/` 中。对比交付物与计划�?  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Real QA Verification** �?`unspecified-high`
  从清洁状态开始。执行每个任务的所�?QA 场景。测试跨任务集成（middleware 鉴权 + feedback 端点 + 404 页面）。测试边界情况：�?auth cookie、格式错误的 JWT、空 feedback body�?  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

---

## Commit Strategy

- **Wave 1**: 每个任务独立提交（无依赖�?  - T1: `fix(docker): remove orphan deps stage, clean .dockerignore`
  - T2: `fix(env): add missing TAVILY_API_KEY to .env.example`
  - T3: `chore: add typecheck script`
  - T4: `chore: remove empty app/my-skills directory`
  - T5: `feat(api): implement POST /api/v1/feedback endpoint`
  - T6: `feat(ui): add global error boundary and custom 404 page`
- **Wave 2**: 任务独立提交
  - T7: `feat(auth): add unified middleware with three-tier JWT auth`
  - T8: `fix(deploy): optimize deploy script, add pre-deploy verification`
  - T9: `refactor: rename serve script to start:standalone`
- **Wave 3**: 文档合并提交
  - T10-T12: `docs: add AGENTS.md for components/ and app/, update README`

---

## Success Criteria

### Verification Commands
```bash
npm run typecheck                                         # Expected: exit 0
docker build -t test . 2>&1 | Select-String "error"      # Expected: no output
curl -s -o /dev/null -w "%{http_code}" localhost:3000/api/v1/generate -X POST -H "Content-Type: application/json" -d '{"domain":"test"}'  # Expected: 200
curl -s -o /dev/null -w "%{http_code}" localhost:3000/api/v1/chat -X POST    # Expected: 401
curl -s localhost:3000/nonexistent-path | Select-String "Not Found"           # Expected: match
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] `npm run typecheck` passes
- [ ] Docker build succeeds
- [ ] Middleware preserves existing auth behavior
- [ ] Feedback endpoint stores data correctly
