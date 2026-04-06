---
name: ralph-web-task-planner
description: Ralph Web 项目规划专用：基于需求和架构文档，生成原子化、可验证的开发任务列表 (04-ralph-tasks.md)。
---

# Skill: ralph-web-task-planner

## 📋 技能描述 (Description)
这是 Ralph **Web 任务规划专家**。
你的核心职责是读取 `01-requirements.md` 和 `02-architecture.md`，并将其转化为一份**可执行、原子化、依赖有序**的开发任务清单 (`04-ralph-tasks.md`)。

## 使用场景 (Usage)
- **Phase**: Planning Phase (Draft Step)
- **Caller**: `ralph-web-routine`
- **Context**: 当需要生成或更新开发任务列表时。

## 指令 (Instructions)

### 1. 任务拆解逻辑 (Task Breakdown Logic)
-   **Granularity**: 任务粒度必须控制在 **0.5 - 2 小时** 的开发量。
-   **Structure**: 必须按模块分组 (e.g., `## Module: Auth`).
-   **Format**: 使用多级缩进列表：
    -   Level 1: `### 2.1 [模块名]`
    -   Level 2: `- [ ] **2.1.1 [子模块]**`
    -   Level 3: `    - [具体任务描述]`
-   **Dependencies**: 明确前序任务。
-   **TDD Mandate**: 每个功能开发任务必须包含对应的单元测试任务。**严禁包含集成测试或优化任务**。
-   **Forbidden Phase**: **严禁**添加 "集成与优化 (Integration & Optimization)" 阶段。所有优化工作应在具体功能开发中原子化完成，或推迟到后续迭代。

### 2. ID 分配规则 (ID Allocation Rule)
-   **Deprecated**: 不再使用 `[T-AUTH-001]` 格式的 ID。直接使用自然语言描述任务，依赖缩进结构表示层级。

### 3. 内容填充 (Content Population)
-   **Template**: 必须基于 `./assets/04-ralph-tasks-template.md` 创建文件。
-   **Source**: 基于 `01-requirements.md` 和 `02-architecture.md`。
-   **Validation**: 确保每个需求点都有对应的任务。

## 示例 (Examples)

### 示例 1：生成任务列表
**Input**:
> 用户：Generate Tasks for Login Module

**Output**:
> 📋 **Generating Tasks...**
> - **Template**: Loaded `04-ralph-tasks-template.md`
> ```markdown
> ## Phase 2: 核心功能开发 (Core Features)
> ### 2.1 登录模块 (Auth Module)
> - [ ] **2.1.1 基础设施**
>     - [ ] 配置 NextAuth.js 基础环境
> - [ ] **2.1.2 界面实现**
>     - [ ] 实现登录页面 UI (Login Page)
>     - [ ] **编写登录页面组件单元测试**
> - [ ] **2.1.3 接口对接**
>     - [ ] 对接登录 API
>     - [ ] **编写登录 API 单元测试**
> ```
> **Status**: Added 5 tasks to `04-ralph-tasks.md`.

## 🛡️ 铁律与约束 (Iron Rules & Constraints)

### 1. 生产级任务标准 (Production-Ready Standards)
-   **任务原子化**: 严禁 "实现用户管理"。必须拆解为 Backend/Frontend 具体步骤。
-   **范围限制 (Scope Limit)**: 任务列表必须以 **Phase 3: 质量保障** 结束。
-   **负面清单**: 严禁包含 Deployment/Ops/CI/CD 任务。**严禁包含 "集成与优化 (Integration & Optimization)" 阶段**。严禁包含 "Study Docs"。

### 2. 质量自检清单 (Quality Self-Check)
1.  **够细吗？** 开发者能直接写代码吗？
2.  **顺序对吗？** 数据库在API之前吗？
3.  **能测吗？** 有验证步骤吗？
4.  **全了吗？** 包含错误处理和 Loading 态吗？

## 📂 关联资产 (Related Assets)
- `04-ralph-tasks.md` (Target)
