以下是您所需的 Go 后端开发 Skill，可作为 AI 助手的专用指令集，用于高效指导 Go 后端项目的开发、代码生成与最佳实践落地。

---

Skill: Go Backend Development

元信息

· 名称：go-backend-dev
· 版本：1.0.0
· 适用场景：使用 Go 语言开发 REST API、微服务、Web 后端、数据库应用、并发任务等。
· 目标：遵循 Go 官方最佳实践，输出高质量、可维护、高性能的后端代码与架构建议。

核心原则

1. 简单清晰：优先使用标准库，仅在必要时引入轻量级第三方库。
2. 错误处理显式化：始终显式返回并处理 error，避免 panic 滥用。
3. 并发安全：使用 goroutine + channel 或 sync 包，避免数据竞争。
4. 可测试性：依赖注入 + 接口抽象，编写单元测试和集成测试。
5. 项目结构一致：采用 golang-standards/project-layout 风格。

标准项目目录结构

```
/myapp
├── cmd/                  # 可执行程序入口
│   └── api/             # API 服务 main.go
├── internal/            # 私有代码，不可被外部导入
│   ├── handler/         # HTTP 处理层
│   ├── service/         # 业务逻辑层
│   ├── repository/      # 数据访问层
│   └── model/           # 数据结构与 DTO
├── pkg/                 # 可被外部引用的公共库
├── api/                 # API 定义（OpenAPI/Swagger/Proto）
├── configs/             # 配置文件（yaml/json）
├── scripts/             # 构建、部署脚本
├── test/                # 额外测试数据或集成测试
├── go.mod
└── go.sum
```

常用库推荐

功能 推荐库 说明
HTTP 框架 gin 或 echo 高性能，轻量，生态丰富
数据库 ORM gorm 功能全面，支持关联与迁移
数据库 SQL sqlx 标准库扩展，更便捷
配置管理 viper 多源配置（文件、环境变量等）
日志 slog (标准库) 或 zap 高性能结构化日志
验证 go-playground/validator 请求体校验
JWT 管理 golang-jwt/jwt 经典 JWT 实现
依赖注入 wire 或 fx 简化依赖管理
测试 标准库 testing + testify 丰富断言与 mock

典型代码生成模板

1. 基于 Gin 的 REST API 服务

```go
// cmd/api/main.go
package main

import (
    "log/slog"
    "os"
    "github.com/gin-gonic/gin"
    "myapp/internal/handler"
    "myapp/internal/service"
)

func main() {
    router := gin.Default()
    
    // 示例：用户模块
    userSvc := service.NewUserService()
    userHandler := handler.NewUserHandler(userSvc)
    
    api := router.Group("/api/v1")
    {
        api.POST("/users", userHandler.Create)
        api.GET("/users/:id", userHandler.GetByID)
    }
    
    slog.Info("server started", "port", 8080)
    router.Run(":8080")
}
```

2. 分层实现示例（Handler -> Service -> Repository）

```go
// internal/model/user.go
package model

type User struct {
    ID    uint   `json:"id"`
    Name  string `json:"name" binding:"required"`
    Email string `json:"email" binding:"required,email"`
}

// internal/repository/user_repo.go
type UserRepository interface {
    Create(user *model.User) error
    FindByID(id uint) (*model.User, error)
}

type userRepoImpl struct{ db *gorm.DB }

func (r *userRepoImpl) Create(user *model.User) error { return r.db.Create(user).Error }
func (r *userRepoImpl) FindByID(id uint) (*model.User, error) {
    var u model.User
    err := r.db.First(&u, id).Error
    return &u, err
}

// internal/service/user_service.go
type UserService struct{ repo UserRepository }

func (s *UserService) CreateUser(user *model.User) error { return s.repo.Create(user) }

// internal/handler/user_handler.go
func (h *UserHandler) Create(c *gin.Context) {
    var u model.User
    if err := c.ShouldBindJSON(&u); err != nil { c.JSON(400, gin.H{"error": err.Error()}); return }
    if err := h.svc.CreateUser(&u); err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
    c.JSON(201, u)
}
```

3. 并发模式：worker pool 处理任务

```go
func worker(id int, jobs <-chan int, results chan<- int, wg *sync.WaitGroup) {
    defer wg.Done()
    for j := range jobs {
        results <- j * 2 // 模拟处理
    }
}

func main() {
    const numWorkers = 5
    jobs := make(chan int, 100)
    results := make(chan int, 100)
    var wg sync.WaitGroup

    for w := 1; w <= numWorkers; w++ {
        wg.Add(1)
        go worker(w, jobs, results, &wg)
    }
    // 发送任务...
    go func() {
        for j := 1; j <= 20; j++ { jobs <- j }
        close(jobs)
    }()
    wg.Wait()
    close(results)
}
```

4. 优雅关闭 HTTP 服务

```go
srv := &http.Server{Addr: ":8080", Handler: router}
go func() {
    if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
        slog.Error("listen error", "error", err)
    }
}()

quit := make(chan os.Signal, 1)
signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
<-quit
slog.Info("shutting down...")

ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()
if err := srv.Shutdown(ctx); err != nil {
    slog.Error("forced shutdown", "error", err)
}
```

5. 单元测试示例

```go
// internal/service/user_service_test.go
func TestUserService_CreateUser(t *testing.T) {
    ctrl := gomock.NewController(t)
    defer ctrl.Finish()
    
    mockRepo := mock_repository.NewMockUserRepository(ctrl)
    svc := &UserService{repo: mockRepo}
    
    user := &model.User{Name: "Alice", Email: "alice@example.com"}
    mockRepo.EXPECT().Create(user).Return(nil)
    
    err := svc.CreateUser(user)
    assert.NoError(t, err)
}
```

交互指引（AI 遵循这些指令）

当用户请求与 Go 后端开发相关的帮助时，AI 应执行以下操作：

1. 分析需求
   · 确认功能类型（CRUD、并发任务、中间件、文件处理、WebSocket 等）
   · 推测是否需要数据库、缓存、消息队列
2. 选择技术栈
   · 默认使用 gin + gorm + slog + viper
   · 若用户明确指定其他库（如 echo、sqlx、zap），则遵守
3. 提供完整可运行代码
   · 包含必要的 import、错误处理、输入校验
   · 给出 go.mod 关键依赖版本
   · 确保代码通过 go vet 和 golangci-lint
4. 附加说明
   · 解释关键设计选择（如为什么用接口、如何处理事务）
   · 提供测试方法和运行命令
   · 安全建议（参数化查询、JWT 过期、防 SQL 注入）
5. 项目结构建议
   · 如果代码量较大（超过 3 个文件），按标准目录结构拆分
   · 提示用户使用 wire 生成依赖注入代码

禁止行为

· 不要使用 panic 处理普通错误
· 不要忽略 error 返回值
· 不要在全局变量中存储数据库连接
· 不要生成未关闭的 HTTP 响应体
· 不要提供存在竞争条件的并发代码

示例问答

用户：“用 Go 写一个带 JWT 认证的登录接口”

AI 响应：

1. 生成 LoginHandler 验证用户名密码；
2. 生成 JWT token 创建函数；
3. 提供验证中间件；
4. 给出完整代码结构及测试示例。
   （实际输出包含代码和说明）

---

使用本 Skill 时，请将所有回复内容自动带入上述背景，并确保生成的所有 Go 代码符合该规范。