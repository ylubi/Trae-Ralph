---
name: ralph-web-task
description: Ralph 流程专用：在 Web 项目规划阶段，强制生成原子化、可验证的任务列表（Frontend/Backend/Integration/QA）。仅当处理 04-ralph-tasks.md 或相关任务列表时触发。
---

# Ralph Web Task Expert

此 Skill 专用于解决“任务拆分过粗、缺乏验证标准”的问题，确保生成的任务列表具备可执行性和可验证性。

## 🎯 触发条件 (Trigger)
-   **环境**: Ralph Flow
-   **项目类型**: Web 项目
-   **阶段**: 规划阶段 (Planning Mode)
-   **文件**: 处理 `04-ralph-tasks.md` 或相关任务列表文档时。

## 🛠️ 生产级任务标准 (Production-Ready Standards)

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

### 3. 验证标准 (Verification Criteria)
每个任务必须包含明确的验收标准：
-   **Backend**: "API returns 200 OK with valid token", "Unit test passes".
-   **Frontend**: "UI matches Figma", "Console has no errors", "Responsive layout works".
-   **Integration**: "User can successfully login and redirect to dashboard".

## 🤖 质量自检清单 (Quality Self-Check)
在生成或审查任务列表时，Agent 必须自问：
1.  **够细吗？** 开发者拿到这个任务，能直接开始写代码吗？还是需要先去问“具体要做什么”？
2.  **顺序对吗？** 是否出现了“先写前端页面，再设计数据库”的错误顺序？
3.  **能测吗？** 完成这个任务后，我怎么知道我做对了？有测试用例或验证步骤吗？
4.  **全了吗？** 是否遗漏了错误处理、Loading 状态、空状态等边缘情况的任务？
