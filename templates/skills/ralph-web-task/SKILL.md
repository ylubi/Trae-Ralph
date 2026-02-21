---
name: ralph-web-task
description: Ralph 流程专用：在 Web 项目规划阶段，强制生成原子化、可验证的任务列表（Frontend/Backend/Integration/QA）。仅当处理 04-ralph-tasks.md 或相关任务列表时触发。
---

# Ralph Web Task Expert

此 Skill 专用于解决“任务拆分过粗、缺乏验证标准”的问题，确保生成的任务列表具备可执行性和可验证性。

## 🎯 触发条件 (Trigger)
-   **环境**: Ralph Flow
-   **项目类型**: Web 项目
-   **阶段**: 规划阶段 (Planning Mode) - 支持 Round 1-5 (Step 2/5)

## 🔄 螺旋迭代指令 (Spiral Instructions)

### Ripple Sync
在 **任意 Round 的 Step 2-5**，执行：
1.  **Monitor**: 监控 `01` 和 `02` 的变更。
2.  **Auto-Update**: 自动将新需求和架构变更为任务。
    *   **Diff Check**: 对比 `01-requirements.md` 和 `02-architecture.md` 的变更。
    *   **Auto-Tasking**:
    *   若 `01` 新增了 "Admin Audit Page" -> **Add Task**: `FE: Implement Audit Log Page UI`.
    *   若 `02` 新增了 "GET /api/audit-logs" -> **Add Task**: `BE: Implement Audit Log API & Controller`.
    *   若 `02` 新增了 "audit_logs table" -> **Add Task**: `BE: Create Migration for Audit Logs`.
3.  **Strict Mapping**: 确保每一个新增的 Requirement 和 API 都有对应的 Task，**严禁**遗漏。

## 📋 标准任务格式 (Standard Task Format)
所有生成的任务必须严格遵循以下 Markdown 结构，采用 **模块 -> 任务组 -> 原子操作** 的三层结构：

```markdown
### <模块编号> <模块名称>
- [ ] **<任务编号> <任务组名称>**
    - <原子操作 1> (e.g., 实现 GET /api/...)
    - <原子操作 2> (e.g., 编写单元测试...)
    - <原子操作 3> (e.g., 增加相关文档...)
```

**示例**:
```markdown
### 2.4 任务管理 API
- [ ] **2.4.1 任务查询 API**
    - 实现 GET /api/v1/tasks (列表, 筛选, 分页)
    - 实现 GET /api/v1/tasks/:id (详情)
    - 编写 TaskController 单元测试

### 2.5 用户与收藏 API
- [ ] **2.5.1 用户 API**
    - 实现 GET /api/v1/users/me (获取当前用户)
    - 实现 PUT /api/v1/users/me (更新用户资料)
```

## ��️ 生产级任务标准 (Production-Ready Standards)

### 1. 任务原子化 (Task Atomicity)
严禁使用“实现用户管理”这种大颗粒度任务。必须拆解为：
-   **Backend**: `Implement User Model & Migration` -> `Implement Register API` -> `Implement Login API`.
-   **Frontend**: `Create Login Page UI` -> `Integrate Login API` -> `Handle Token Storage` -> `Add Route Guard`.
-   **粒度标准**: 每个任务的预估耗时应在 1-4 小时之间。

### 2. 执行顺序 (Execution Order)
必须遵循依赖关系：
1.  **Infrastructure**: ESLint, Prettier, Husky, CI/CD, DB Setup.
2.  **Backend Core**: Models, Migrations, Seeders.
3.  **Backend API**: Controllers, Routes, Services, Unit Tests.
4.  **Frontend Base**: Components, Layouts, Routing.
5.  **Integration**: API Integration, State Management.
6.  **QA**: E2E Tests, MCP Tests, Bug Fixes.

### 4. 负面清单 (Negative Constraints)
以下任务 **严禁** 出现在 `04-ralph-tasks.md` 中：
1.  **Deployment / Ops**: 如 "Deploy to Vercel", "Setup Docker Production", "Configure Nginx", "Release v1.0".
    *   **原因**: 规划阶段仅关注**开发实现**。部署是 Ops 阶段的事。
2.  **Documentation for Delivery**: 如 "Write User Manual", "Update README for Release".
    *   **原因**: 交付文档应在测试通过后编写。
3.  **Non-Atomic Tasks**: 如 "Finish Project", "Write Code".
4.  **Vague Research**: 如 "Learn React", "Study Docs".

### 5. 流程终点 (Process Endpoint)
任务列表的最后一项 **必须** 是：
- [ ] **准备进入测试阶段**
    - 检查所有功能代码是否已提交。
    - 确认 `05-test-plan.md` 已就绪。
    - 触发 `ralph-testing-mode`。

## 🤖 质量自检清单 (Quality Self-Check)
在生成或审查任务列表时，Agent 必须自问：
1.  **够细吗？** 开发者拿到这个任务，能直接开始写代码吗？还是需要先去问“具体要做什么”？
2.  **顺序对吗？** 是否出现了“先写前端页面，再设计数据库”的错误顺序？
3.  **能测吗？** 完成这个任务后，我怎么知道我做对了？有测试用例或验证步骤吗？
4.  **全了吗？** 是否遗漏了错误处理、Loading 状态、空状态等边缘情况的任务？
