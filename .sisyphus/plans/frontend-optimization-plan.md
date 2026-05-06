# 前端优化 Plan v2

## 总览

6 项改动：3 个 bug 修复 + 2 个体验优化 + 1 个新功能（社区论坛）。
跳过亮/暗模式（#11）。

---

## P0 — Bug 修复

---

### P0-A: BottomNav「工作室」死链接

**问题**: 「工作室」tab `href: '#'`，点击无反应。

**修复**: `'#'` → `'/workspace'`

**文件**: `components/BottomNav.tsx` (1 行)
**风险**: 极低

---

### P0-B: BottomNav「个人中心」对已登录用户无意义

**问题**: 「个人中心」指向 `/login`，已登录用户也看到登录表单。

**修复**: 改成「社区」tab 指向 `/community`，配合登录页已登录跳转。

| 文件 | 改动 |
|------|------|
| `components/BottomNav.tsx` | icon + label: `account_circle/个人中心` → `forum/社区`, href: `/login` → `/community` |
| `app/login/page.tsx` | 新增已登录检查 → `router.replace('/')` |
| `app/register/page.tsx` | 同上 |

**风险**: 低

---

## P1 — 体验优化

---

### P1-A: 工作区错误重试

**问题**: SSE 流失败后只有「返回首页」，用户需重新输入参数。

**修复**: 添加 `retryCount` state，点击「重新生成」→ `setRetryCount(c => c+1)` → useEffect 重新连接。

**文件**: `app/workspace/page.tsx` (~15 行新增)
**风险**: 低

---

### P1-B: 页面过渡动画

**问题**: `router.push()` 切换页面无动画。

**修复**: 新建 `PageTransition` 组件，用 `usePathname()` 作 key + `.animate-fadeIn` CSS。

| 操作 | 文件 |
|------|------|
| 新建 | `components/PageTransition.tsx` (~10 行) |
| 编辑 | `app/layout.tsx` — 用 `<PageTransition>` 包裹 `{children}` |

**风险**: 低

---

### P1-C: BottomNav 触摸反馈优化

**问题**: 点击 nav item 缺少即时的触摸反馈。

**修复**: 加 `active:scale-90` 按下缩放，`transition-transform`，用 `pathname.startsWith()` 匹配子路由。

**文件**: `components/BottomNav.tsx` (~5 行 Tailwind class)
**风险**: 极低

---

## P2 — 新功能：社区论坛

**目标**: 登录用户可以自由发帖交流 skill。

### DB (lib/db.ts 新增 2 表)

```sql
CREATE TABLE IF NOT EXISTS forum_posts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS forum_comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

### API (新增 6 路由)

| 方法 | 路由 | 权限 |
|------|------|------|
| GET | `/api/v1/community/posts` | public（列表） |
| POST | `/api/v1/community/posts` | require auth |
| GET | `/api/v1/community/posts/[id]` | public（详情+评论） |
| DELETE | `/api/v1/community/posts/[id]` | require auth（仅作者） |
| POST | `/api/v1/community/posts/[id]/comments` | require auth |
| DELETE | `/api/v1/community/comments/[id]` | require auth（仅作者） |

### Pages (新增 3 页面)

| 路由 | 文件 | 说明 |
|------|------|------|
| `/community` | `app/community/page.tsx` | 帖子列表（公开） |
| `/community/new` | `app/community/new/page.tsx` | 发帖（需登录） |
| `/community/[id]` | `app/community/[id]/page.tsx` | 帖子详情+评论 |

### Components (新增 2 个)

| 文件 | 说明 |
|------|------|
| `components/ForumPostCard.tsx` | 帖子卡片（标题、作者、时间戳） |
| `components/CommentSection.tsx` | 评论区（登录可回复） |

### 导航更新

| 文件 | 改动 |
|------|------|
| `components/BottomNav.tsx` | 第 4 tab: 「个人中心」→「社区」, icon: `forum` |
| `components/Header.tsx` | desktop nav 加「社区」链接 |

### 注意

- 纯文本发帖（不引入富文本编辑器）
- 帖子按 `created_at` 倒序
- 用户显示 `username`
- 不限制发帖数量

---

## 实施顺序

```
Phase 1 (~10 min)        P0-A + P0-B + P1-C
    └── BottomNav 修复 + 登录跳转 + 触摸反馈

Phase 2 (~15 min)        P1-A + P1-B
    └── 工作区重试 + 页面过渡动画

Phase 3 (~1.5h)          P2
    └── DB + API + Pages + Components + Nav
```

全部约 **2 小时**。Phase 1/2/3 相互独立。
