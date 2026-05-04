# SkillForge Product Requirements

## Overview
SkillForge is an AI-powered platform that transforms a domain description into a structured, usable "Skill" file (similar to CLAUDE.md rulesets) by searching the web or using direct AI knowledge.

## Core Functionality

### 1. Skill Generation
- **Input**: Domain description (e.g., "Go backend development, microservices").
- **Modes**:
    - **Internet Search**: Uses Tavily + Dashscope for real-time web curation.
    - **AI Direct**: Uses DeepSeek's internal knowledge.
- **Output**: Claude Code format (YAML frontmatter + Markdown) or standard Markdown.
- **Storage**: Turso (libSQL) database.

### 2. Skill Management
- **Viewer/Editor**: View source, edit, copy, and download.
- **Source Tracking**: Collapsible section showing search references.
- **Feedback**: Rating and feedback system.

### 3. Real-time AI Chat Modification (Logged-in only)
- **Dialogue-driven Edits**: Use chat to refine generated skills.
- **Streaming**: SSE responses for real-time updates.
- **Auto-update**: AI uses specific markers (`~~~skill-content`) to update content.
- **Interruption**: Support for stopping generation.

### 4. User System
- **Auth**: Custom JWT + HTTP-only cookie implementation (no external deps).
- **History**: Independent history per user.
- **Guest Mode**: Generation only; no chat-based modification or history.

## Technical Stack
- **Framework**: Next.js 15 (App Router, Turbopack).
- **Styling**: Tailwind CSS v4.
- **Database**: Turso (libSQL).
- **LLM**: DeepSeek.
- **Search**: Tavily + Dashscope.
- **Auth**: Node.js crypto (pbkdf2 + HMAC JWT).
- **Deployment**: Docker.