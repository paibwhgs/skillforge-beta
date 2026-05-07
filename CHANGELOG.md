# 更新日志

## [Unreleased] — 2026-05-07/08

### Added
- **文档上传** — 支持拖拽/点击上传 .md、.txt、.pdf 文件作为生成上下文
- **Tavily 备用 API Key** — 主 Key 配额耗尽自动切换到 `TAVILY_API_KEY_2`
- **多文件技能输出** — LLM 可自动将代码示例/工具对比/脚本分包到 `references/` 和 `scripts/`
- **日间/夜间主题切换** — Header 新增 ☀️/🌙 按钮，偏好存 localStorage
- **社区页面 UI 重设计** — 精选帖子、彩色头像环、搜索过滤、双列网格
- **输入校验** — 前端拦截明显无效输入（重复字符、纯符号），AI 辅助校验深层过滤
- **PWA 支持** — manifest、Service Worker、SVG 图标
- **收藏夹功能** — 创建/管理收藏夹，卡片点击收藏选择放入哪个收藏夹
- **Skill 生成源模型标注** — 详情页显示生成该 skill 使用的引擎/模型

### Changed
- **SKILL.md 精简化** — 限制 150 行以内，只含核心触发+规则，多余内容自动分包
- **文档页重写** — 8 章节 + 粘性侧边导航 + 滚动高亮
- **模型列表清理** — 保留 OpenCodeGo/DeepSeek V4 Flash，移除官方 DeepSeek API
- **Anthropic 官方格式对齐** — YAML frontmatter 只含 name + description
- **个人中心** — 从冗余的 skill 列表改为账号信息 + 快捷入口
- **默认 Chat 引擎** — 改为 `opencode-go`

### Fixed
- 手机端缺少文档入口 — BottomNav 新增"文档"按钮
- 帖子/收藏夹删除改用弹窗确认而非浏览器 alert
- OpenCLAW 格式文档描述不准确
- 多模型对比工作区生成后提示选择保留版本
- 移动端触摸目标 44px、徽章行 flex-wrap、分页放大
