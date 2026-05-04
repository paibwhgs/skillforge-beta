---
name: go-backend
description: Go (Golang) 后端开发全流程指导。包括项目脚手架、Web 框架选型、数据库操作、API 设计、错误处理、测试与部署。当用户要求：编写 Go 后端代码、创建 Go Web 项目、实现 API 接口、设计 Go 项目结构、选择 Go 框架或 ORM、编写 Go 测试时使用。
---

# Go Backend

## 快速开始

```bash
python scripts/scaffold.py <project-name> --module <go-module-prefix>
```

新建标准 Go 后端项目结构，包含 `cmd/`、`internal/`、`config/`、`migrations/` 目录和一组基础代码（main.go, config, handler, service, repository, middleware, model）。

生成后：
```bash
cd <project-name>
go mod tidy
go run ./cmd/<project-name>
```

## 项目布局

```
cmd/{app}/main.go          # 程序入口（signal 优雅关闭）
internal/
  config/                  # 配置加载（viper/yaml + 环境变量覆盖）
  model/                   # 数据模型/实体定义
  handler/                 # HTTP Handler（请求解析 + 响应）
  service/                 # 业务逻辑层
  repository/              # 数据访问层
  middleware/              # HTTP 中间件
config/config.yaml         # 默认配置文件
migrations/                # 数据库迁移脚本
```

**原则：** 业务逻辑在 `service` 层，数据操作在 `repository` 层，HTTP 细节在 `handler` 层。层间用接口依赖注入。

## Web 框架选型

- **Gin** — 国内最主流，Radix Tree 路由，成熟生态。推荐新手和微服务场景
- **Fiber** — 极致性能，API 类 Express.js，Go 1.22+ 可用
- **Echo** — 内置中间件丰富（CORS、JWT、CSRF）
- **chi** — 完全兼容 `net/http`，最小依赖，灵活组合
- **stdlib net/http** — Go 1.22+ 原生支持方法/路径参数，小项目无需框架

> 详情见 `references/frameworks.md`，包括各框架的最小示例代码

## 数据库操作

- **GORM** — ORM 最普遍，自动迁移/关联/钩子，适合 CRUD 为主的项目
- **sqlx** — 接近原生 SQL，减少样板代码，适合查询复杂的项目
- **pgx** — PostgreSQL 原生驱动，极致性能和 PG 特性支持
- **sqlc** — SQL → 类型安全 Go 代码生成，零运行时反射

> 详情见 `references/database.md`，包括 CRUD 示例、事务模式、连接池配置

事务注意用闭包模式（`db.Transaction(func(tx) error)`），避免忘记回滚。

## API 设计（Go 1.22+ stdlib 路由）

```go
mux := http.NewServeMux()
mux.HandleFunc("GET /api/v1/users", h.ListUsers)
mux.HandleFunc("GET /api/v1/users/{id}", h.GetUser)
mux.HandleFunc("POST /api/v1/users", h.CreateUser)
mux.HandleFunc("PUT /api/v1/users/{id}", h.UpdateUser)
mux.HandleFunc("DELETE /api/v1/users/{id}", h.DeleteUser)
```

### 统一响应格式

```go
type APIResponse struct {
    Code    int         `json:"code"`
    Message string      `json:"message"`
    Data    interface{} `json:"data,omitempty"`
}
```

- 成功：`{"code": 200, "message": "success", "data": {...}}`
- 错误：`{"code": 400, "message": "invalid request"}`
- 分页：`{"code": 200, "message": "success", "data": {"items":[], "total": 100, "page": 1, "size": 20}}`

## 错误处理

```go
// 自定义业务错误
type AppError struct {
    Code    int    `json:"code"`
    Message string `json:"message"`
}

func (e *AppError) Error() string { return e.Message }

var (
    ErrNotFound     = &AppError{404, "resource not found"}
    ErrInvalidInput = &AppError{400, "invalid input"}
    ErrUnauthorized = &AppError{401, "unauthorized"}
)

// service 层返回业务错误
func (s *Service) GetUser(id int) (*User, error) {
    user, err := s.repo.FindByID(id)
    if errors.Is(err, sql.ErrNoRows) {
        return nil, ErrNotFound
    }
    return user, nil
}

// handler 层统一处理
func writeError(w http.ResponseWriter, err error) {
    var appErr *AppError
    if errors.As(err, &appErr) {
        writeJSON(w, appErr.Code, appErr)
        return
    }
    writeJSON(w, 500, ErrInternal)
}
```

**原则：** handler 层不做业务判断，只做序列化。service 层不关心 HTTP 状态码。

## 配置管理（Viper）

```go
viper.SetConfigName("config")
viper.SetConfigType("yaml")
viper.AddConfigPath(".")
viper.AddConfigPath("config/")
viper.AutomaticEnv()  // 环境变量覆盖

// 环境变量 KEY 映射：db.dsn → DB_DSN
```

**优先级：** 环境变量 > 命令行flag > 配置文件 > 默认值

## 测试

- **单元测试**：表格驱动测试 + testify 断言
- **Handler 测试**：`httptest.NewRecorder()` 模拟 HTTP
- **Mock**：testify/mock 或 mockgen，按接口生成
- **集成测试**：testcontainers-go 启动真实 PostgreSQL
- **运行**：`go test ./... -v -race`

> 测试模式和完整示例见 `references/testing.md`

## 常用工具链

| 工具 | 用途 | 安装 |
|------|------|------|
| `golangci-lint` | 代码检查 | `go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest` |
| `goose` / `golang-migrate` | 数据库迁移 | `go install github.com/golang-migrate/migrate/v4/cmd/migrate@latest` |
| `swaggo/swag` | Swagger 文档 | `go install github.com/swaggo/swag/cmd/swag@latest` |
| `mockgen` | 接口 Mock 生成 | `go install go.uber.org/mock/mockgen@latest` |
| `air` | 热重载 | `go install github.com/air-verse/air@latest` |

## 标准 Go 风格规范

- 文件命名：`snake_case.go`
- 包名：小写单数（`user` 而非 `users`）
- 导出判断：大写 = public，小写 = private
- 错误处理：不要忽略 `err`，用 `errors.Is()`/`errors.As()` 判断
- `defer` 在创建资源后立即调用
- 优先 `io` 接口（`io.Reader`, `io.Writer`）而非具体类型
- `context.Context` 显式传递，不做 struct 字段
- 避免 `init()`，用显式初始化函数
