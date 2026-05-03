---
name: go-microservice-code-review
description: 'Reviews Go microservice code for idiomatic patterns, concurrency safety, error handling, and production readiness in distributed systems'
---

# Go Microservice Code Review

## When to use

- Reviewing Go code that is part of a microservices architecture
- Evaluating error handling patterns, logging, and observability in Go services
- Checking for idiomatic Go patterns (interfaces, composition over inheritance, zero values)
- Validating concurrency safety (goroutines, channels, sync primitives, context propagation)
- Reviewing gRPC/REST API designs and service boundaries
- Ensuring production readiness: graceful shutdowns, middleware chains, rate limiting, retry logic

## Rules

1. **Enforce interface-first design thinking**: Code should define interfaces before implementations. Interfaces should be small (1-3 methods) and focused on behavior, not data.

2. **Verify context propagation**: Every function that makes an I/O call, spawns a goroutine, or could block must accept `context.Context` as its first parameter. Verify contexts are passed down and `context.WithTimeout`/`WithCancel` is used for all outbound requests.

3. **Check error wrapping and sentinel errors**: Errors must be wrapped with context using `fmt.Errorf("...: %w", err)`. Sentinel errors should be defined with `var ErrSomething = errors.New("...")`. Never use `errors.New` inside functions.

4. **Validate goroutine lifecycle management**: Every goroutine must have a clear exit strategy. Prefer errgroups (`golang.org/x/sync/errgroup`) for goroutine lifecycle tied to request scopes. Check for proper `defer` cleanup.

5. **Enforce service boundary isolation**: Each microservice should have its own `go.mod`, independent database schema, and separate deployment unit.

6. **Review middleware chains for observability**: Every HTTP/gRPC handler chain must include middleware for structured logging, request ID propagation, panic recovery, and metrics.

7. **Check for graceful shutdown patterns**: Services must handle `os.Signal` (SIGTERM, SIGINT) and implement graceful shutdown with configurable timeout.

8. **Validate retry and circuit breaker patterns**: External service calls must have configurable retry logic with exponential backoff and jitter.

## Examples

### Example 1: Context propagation review

**User**: Review this handler

```go
func (s *Service) ProcessOrder(orderID string) (*Order, error) {
    dbResult, err := s.db.Query("SELECT * FROM orders WHERE id = ?", orderID)
    if err != nil {
        return nil, err
    }
    return dbResult, nil
}
```

**Assistant**: Issues found:

1. Missing `context.Context` as first parameter — database operations need context for cancellation/timeout
2. Error not wrapped — use `fmt.Errorf("query order %s: %w", orderID, err)`
3. SQL injection risk — use parameterized queries
4. No timeout on the query — the caller should pass a context with deadline

**Corrected version**:

```go
func (s *Service) ProcessOrder(ctx context.Context, orderID string) (*Order, error) {
    ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel()

    var order Order
    err := s.db.QueryRowContext(ctx, "SELECT * FROM orders WHERE id = ?", orderID).Scan(&order)
    if err != nil {
        return nil, fmt.Errorf("query order %s: %w", orderID, err)
    }
    return &order, nil
}
```

### Example 2: Goroutine lifecycle and graceful shutdown

**User**: Review this worker pool

```go
func (s *Service) StartWorkers() {
    for i := 0; i < 10; i++ {
        go func() {
            for {
                job := <-s.jobChan
                s.processJob(job)
            }
        }()
    }
}
```

**Assistant**: Concurrency issues:

1. No way to stop workers gracefully
2. Channel receive blocks without context
3. No error handling or panic recovery in goroutines
4. No WaitGroup to track completion

## Boundaries

- Do NOT rewrite entire codebases — focus on patterns and specific issues
- Do NOT give generic Go advice unrelated to microservices
- Do NOT suggest microservice decomposition without understanding domain boundaries
- Escalate to user when architectural decisions need human judgment
