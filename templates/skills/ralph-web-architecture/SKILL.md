---
name: ralph-web-architecture
description: Ralph 流程专用：在 Web 项目规划阶段，强制生成生产级架构设计（Atomic Components, State, API Spec, DB ERD）。仅当处理 02-architecture.md 时触发。
---

# Ralph Web Architecture Expert

此 Skill 专用于解决“架构设计过于简陋”的问题，确保生成的架构具备生产级深度。

## 🎯 触发条件 (Trigger)
-   **环境**: Ralph Flow
-   **项目类型**: Web 项目
-   **阶段**: 规划阶段 (Planning Mode) - 支持 Round 1-5 (Step 3/5)

## 🔄 螺旋迭代指令 (Spiral Instructions)

### Step 3: 竞品调研 (Research)
在 **任意 Round 的 Step 3**，执行 `WebSearch`：
1.  **Round 1**: 搜索 "架构全景图" (Overall Architecture)。
2.  **Round 2**: 搜索 "核心模块设计" (Core Module Design)。
3.  **Round 3**: 搜索 "数据模型最佳实践" (DB Schema Best Practices)。
4.  **Round 4**: 搜索 "性能优化策略" (Performance Tuning)。
5.  **Round 5**: 搜索 "安全合规要求" (Security Compliance)。

### Step 5: 一致性锁定 (Lock)
在 **任意 Round 的 Step 5**，执行 `Ripple Check`：
1.  **Sync**: 确保 `01` 的变更已同步到 `02`。
2.  **Verify**: 确保 API 定义能覆盖所有前端交互。
3.  **Next Round Trigger**:
    *   **Round 1-4**: 输出 "🔒 Round X Locked. Proceeding to Round X+1..."
    *   **Round 5**: 输出 "✅ Final Architecture Locked."

## 🛠️ 生产级架构标准 (Production-Ready Standards)

### 1. 框架惯例优先 (Framework Convention Over Configuration)
设计必须严格遵循所选技术栈的最佳实践（Best Practices）和社区惯例：

-   **Next.js**: 必须使用 App Router (`app/`), Server Components (RSC) 优先, Server Actions 处理表单。
-   **React (SPA)**: 必须明确路由库 (React Router v6+), 状态管理 (Zustand/Jotai), 构建工具 (Vite)。
-   **Vue/Nuxt**: 必须遵循 Composition API, Nuxt Modules, Pinia Store。
-   **Node.js/Express**: 必须明确分层架构 (Controller-Service-Repository), 中间件处理错误。
-   **Python/FastAPI**: 必须使用 Pydantic 模型, Dependency Injection, Async/Await。
-   **Database**:
    -   **PostgreSQL**: 推荐使用 Prisma/TypeORM, 必须定义 Migration 策略。
    -   **MongoDB**: 必须定义 Mongoose Schema, Indexing 策略。

### 2. 前端架构深度 (Frontend Depth)
-   **组件策略**: 必须区分原子组件 (Atomic Design) 与业务组件。
-   **状态管理**: 必须区分服务端状态 (React Query/SWR) 与客户端状态 (Zustand/Redux)。
-   **目录结构**: 必须符合框架规范（如 Next.js 的 `app/` vs React SPA 的 `src/pages/`）。

### 3. 后端架构深度 (Backend Depth)
严禁只列出“Node.js + Postgres”。必须定义：
-   **API 规范 (API Specification)**: 必须遵循 RESTful 或 GraphQL 标准，明确 HTTP Method, Path, Auth Scope, Request/Response Body。
-   **数据库设计 (Database Design)**: 必须提供 ERD (Entity Relationship Diagram) 描述，明确外键约束 (FK)、索引策略 (Index) 和范式化程度。
-   **鉴权策略 (Authentication)**: 必须明确 Token 机制 (JWT/Session)、Refresh Token 流程和 RBAC 角色权限矩阵。

### 4. 基础设施与运维 (Infrastructure & DevOps)
-   **CI/CD**: 必须定义构建流水线 (Build Pipeline)、自动化测试 (Test Pipeline) 和部署策略 (Docker/Vercel)。
-   **监控 (Monitoring)**: 必须包含错误追踪 (Sentry)、日志收集 (Logging) 和性能监控 (Performance) 方案。

## 🤖 质量自检清单 (Quality Self-Check)
在生成或审查架构文档时，Agent 必须自问：
1.  **符合惯例吗？** 如果是 Next.js 项目，我是否错误地推荐了 React Router？如果是 Python 项目，我是否符合 PEP8？
2.  **分层清晰吗？** 前端组件是否混杂了过多的业务逻辑？后端 Controller 是否直接操作了数据库？
2.  **数据规范吗？** 数据库表之间有外键约束吗？索引加了吗？
3.  **安全吗？** 所有的敏感接口都有 Auth 校验吗？CORS 配置了吗？
4.  **可维护吗？** 是否定义了统一的错误处理机制？代码风格有 Linter 约束吗？
5.  **像真的吗？** 这看起来像是一个 Demo 还是一个可以支撑 10 万用户的商业系统？
