# Go Backend AI Assistant Skill

## When to use
- Initializing a new Go microservice, CLI tool, or web API
- Refactoring legacy Go code (pre-1.18) to modern, idiomatic patterns
- Implementing LLM/AI features (prompt templating, streaming endpoints, agent orchestration)
- Writing concurrent handlers, middleware, database layers, or infrastructure glue code
- Generating table-driven tests, API contracts, or project scaffolding

## Rules
1. **Spec-First & Atomic Generation**: Define requirements, tech stack, and acceptance criteria before generating code. Break tasks into blocks under 50 lines. Generate one logical component at a time (e.g., model → repository → service → handler → test).
2. **Enforce Modern Go Idioms**: Adhere strictly to the project's `go.mod` version. Use composition over inheritance, `errors.Is`/`errors.As` for error checking, `%w` for error wrapping, and `slog` for structured logging. Propagate `context.Context` explicitly through all I/O boundaries. Avoid `interface{}`; prefer generics or domain-specific types.
3. **Concurrency & Resource Safety**: Never spawn goroutines without explicit lifecycle management. Use `errgroup` or `sync.WaitGroup` paired with context cancellation. Set read/write deadlines for all network connections (HTTP, WebSocket, gRPC). Implement graceful shutdown with configurable timeouts.
4. **Self-Verification & Testing**: Generate table-driven tests alongside business logic. Before marking a task complete, run `go vet`, `golangci-lint`, and `go test -race`. Prompt the AI to "double-check assumptions and produce a verification table" for complex routing or state transitions.
5. **Production-Ready LLM Integration**: Never hardcode prompts. Use `text/template` or external YAML/JSON configs for dynamic prompt rendering. Handle streaming/SSE responses with proper line-by-line parsing, `finish_reason` validation, and context-aware cancellation. Wrap all LLM client calls with retries, exponential backoff, and structured error fallbacks.
6. **Context & Architecture Synchronization**: Maintain a living `structure.md` or `CLAUDE.md` documenting directory layout, naming conventions, and framework constraints. Update it after every refactor. Use explicit file references (`@file.go`) to anchor AI context instead of pasting large code blocks.

## Examples
### Example 1: Spec-First API Endpoint Generation
**User**: 帮我写个用户登录接口
**Assistant**: I need a specification to generate production-ready code. Please provide:
1. Tech stack (e.g., Gin/Chi, pgx/Ent, JWT library)
2. Request/Response schema (fields, validation rules)
3. Error handling expectations (HTTP status codes, error format)
4. Security constraints (rate limiting, password hashing algorithm)
Once provided, I will generate the handler, service layer, and table-driven tests atomically.

### Example 2: Modern Error Handling & Context Propagation
**User**: 优化这段查询用户的代码，加上错误处理和日志
**Assistant**: 
**Before**:
```go
func GetUser(id string) (*User, error) {
    row := db.QueryRow("SELECT name, email FROM users WHERE id = ?", id)
    err := row.Scan(&user.Name, &user.Email)
    if err != nil {
        log.Println("error:", err)
        return nil, errors.New("not found")
    }
    return user, nil
}
```
**After**:
```go
func GetUser(ctx context.Context, db *sql.DB, id string) (*User, error) {
    query := "SELECT name, email FROM users WHERE id = $1"
    row := db.QueryRowContext(ctx, query, id)
    var u User
    if err := row.Scan(&u.Name, &u.Email); err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            slog.WarnContext(ctx, "user not found", "id", id)
            return nil, fmt.Errorf("get user %s: %w", id, ErrNotFound)
        }
        slog.ErrorContext(ctx, "db scan failed", "id", id, "error", err)
        return nil, fmt.Errorf("get user %s: %w", id, err)
    }
    return &u, nil
}
```
*Verification*: Uses `context.Context`, `%w` wrapping, `errors.Is` for sentinel checks, and `slog` with structured fields.

### Example 3: LLM Prompt Management & Streaming Handler
**User**: 写一个调用大模型的接口，支持流式输出
**Assistant**: I will implement a streaming handler using `text/template` for prompt management, proper connection deadlines, and safe goroutine cleanup.
```go
// prompt_tpl.go
var SystemTpl = template.Must(template.New("system").Parse(`
You are a helpful backend assistant.
Project context: {{.ProjectName}}
Current version: {{.GoVersion}}
`))

// handler.go
func StreamChat(w http.ResponseWriter, r *http.Request) {
    ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
    defer cancel()

    w.Header().Set("Content-Type", "text/event-stream")
    w.Header().Set("Cache-Control", "no-cache")
    w.Header().Set("Connection", "keep-alive")
    
    flusher, ok := w.(http.Flusher)
    if !ok { /* return 500 */ }

    var buf bytes.Buffer
    if err := SystemTpl.Execute(&buf, map[string]string{"ProjectName": "billing-api", "GoVersion": "1.22"}); err != nil {
        /* handle error */
    }

    // Stream loop with ctx.Done() check and proper finish_reason handling
    // ... client.Stream(ctx, buf.String(), func(chunk string, done bool) {
    //     fmt.Fprintf(w, "data: %s\n\n", chunk)
    //     flusher.Flush()
    // })
}
```
*Verification*: Template-driven prompt, explicit timeout, `Flusher` interface check, context cancellation, and avoids goroutine leaks.

## Boundaries
- **Don't** generate monolithic files (>200 lines) or mix business logic with HTTP routing in a single pass
- **Don't** use deprecated patterns (`interface{}`, `fmt.Errorf` without `%w`, raw string concatenation for prompts, bare `go func()`)
- **Stop** when the code passes `go vet`, `golangci-lint`, and local unit tests. Do not proceed to deployment or infrastructure changes without explicit human approval
- **Escalate** distributed transaction design, cryptographic key management, production database migrations, or complex multi-agent orchestration to senior engineering review

## Sources
- [Claude Prompting Best Practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- [Golang Best Practices - Claude Code Skill](https://mcpmarket.com/tools/skills/go-idioms-best-practices-1)
- [Modern Go Evolution Guide (Tony Bai)](https://tonybai.com/2026/03/02/modern-go-evolution-guide-1-0-to-1-26/)
- [Go Elegant Prompt Template Management](https://cloud.tencent.com/developer/article/2633015)
- [AI Era: Go Developer Breakthrough](https://cloud.tencent.com/developer/article/2661183)
- [AI Coding Backend Development Practices](https://developer.aliyun.com/article/1705051)
- [Go Modular AI Agent Framework](https://www.cnblogs.com/blfbuaa/p/19636559)
- [8 Prompt Techniques for AI Programming Efficiency](https://juejin.cn/post/7633783248477470756)