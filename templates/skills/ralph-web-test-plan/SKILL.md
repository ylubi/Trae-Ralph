---
name: "web-test-plan"
description: "Ralph 流程专用：仅当在 Web 项目开发且处于规划阶段时触发。强制制定包含 Chrome DevTools MCP 的全面测试计划。"
---

# Web 全面测试计划 (Ralph Testing)

此 Skill 属于 **Ralph 自动化开发流程** 的一部分，专门用于 **规划阶段 (Planning Phase)**。
它的核心职责是确保生成的测试计划 (`05-test-plan.md`) 具备**全覆盖**特性，杜绝漏测。

## ⚠️ 触发条件 (Trigger Conditions)

此 Skill **仅在以下两个条件同时满足时**才会被激活：
1.  **处于 Ralph 流程中** (即正在执行 Ralph 相关的规划或开发任务)。
2.  **当前项目涉及 Web 开发** (Frontend, Fullstack, 或任何有 UI 的 Web 应用)。

> **注意**: 如果当前任务是纯后端、脚本工具或非 Web 项目，请忽略此 Skill。

## 🎯 核心目标 (Core Objectives)

1.  **全页面覆盖 (All Pages)**: 必须枚举项目路由中的每一个页面。
2.  **全功能覆盖 (All Features)**: 针对每个页面，必须枚举所有交互功能（点击、输入、提交、跳转、状态变更）。
3.  **MCP 深度验证 (Deep Verification)**: 必须强制使用 **Chrome DevTools MCP** 对每个页面进行“视觉与控制台”的双重检查。

## 🔬 执行策略：设计驱动穷举 (Design-Driven Exhaustion)

由于规划阶段可能尚未编写代码，测试计划必须基于**设计文档**进行穷举：

1.  **路由穷举 (Route Audit)**:
    *   读取 `docs/planning/iteration-X/03-tech-design.md` 中的【前端路由设计】章节。
    *   如果架构文档未定义路由，则必须根据 `01-requirements.md` 中的页面需求反推所有页面 URL。
    *   **列出**所有规划中的页面清单。

2.  **交互穷举 (Interaction Audit)**:
    *   分析 `01-requirements.md` 中的【用户故事】和【验收标准】。
    *   针对每个页面，提取所有用户可操作的动词 (点击、提交、筛选、排序)。
    *   **强制补充**标准 Web 交互状态：
        *   **Happy Path**: 正常操作流程。
        *   **Sad Path**: 网络错误、校验失败、权限不足。
        *   **Loading State**: 数据加载中的骨架屏/Spinner。
        *   **Empty State**: 无数据时的展示。

3.  **视觉标准 (Visual Standards)**:
    *   基于 `03-tech-design.md` 中的 UI/UX 规范（如有）。
    *   若无明确设计稿，则强制采用通用响应式标准 (Mobile/Desktop 适配)。

4.  **测试边界分离 (Test Scope Separation)**:
    *   **Task Level (`04-ralph-tasks.md`)**: 关注 **单元测试 (Unit)** 和 **实现细节验证**。无需写入此测试计划。
    *   **Plan Level (`05-test-plan.md`)**: 关注 **验收测试 (Acceptance)**、**集成测试 (Integration)** 和 **MCP 视觉/功能验证**。
    *   **原则**: 测试计划是面向**交付结果**的，而非面向开发过程的。它应覆盖所有《需求文档》定义的特性，独立于任务拆分方式。

## 📜 关联规则 (References)
- **任务列表**: `templates/planning/04-ralph-tasks-template.md`
- **测试规范**: `templates/target-project-rules/ralph-testing-mode.md`
- **计划模板**: `templates/planning/05-test-plan.md`

## 🛠️ 内容填充规则 (Content Population Rules)

由于 `05-test-plan.md` 模板已预置了标准化的 3/4/5 章节结构，**此 Skill 的重点不再是“重写结构”，而是“高质量填充”**。

### 3. 交互式验收 (Interactive Verification)
-   **Page Matrix 填充**: 必须根据 `03-tech-design.md` 中的路由设计，将模板中的 `Example Page` 替换为实际的所有页面（如 `/login`, `/dashboard`, `/settings` 等）。
-   **用例具体化**: 将 `Happy Path` / `Sad Path` 替换为具体的业务场景描述。例如：
    -   ❌ `Happy Path`: 点击按钮 -> 成功
    -   ✅ `Happy Path`: 点击“提交订单” -> 按钮变 loading -> 跳转至 `/order/success`
-   **MCP 检查保持**: 严禁删除模板中预置的 `Console Zero Error` 和 `DOM Integrity` 检查项。

### 4 & 5. 自动化与真实能力 (Automation & Real Capabilities)
-   **保留 MCP 指令**: 必须保留模板中关于 `Network.emulateNetworkConditions` 和 `Emulation.setDeviceMetricsOverride` 的 MCP 动作描述。
-   **适配业务**: 根据项目实际情况，微调测试数据（如具体要验证哪个 API 的断网恢复），但**不得降低自动化标准**。

### 6. API 自动化验证 (API Automation)
-   **API 穷举**: 根据 `03-tech-design.md` 的 API 设计，列出所有关键 Endpoint。
-   **状态码检查**: 必须明确预期状态码（200, 201, 400, 401, 403）。
-   **安全测试**: 必须包含至少一个“越权访问 (403)”的测试用例。

---

## 🤖 质量自检清单 (Quality Self-Check)

在生成最终文件前，Agent 必须自问：
1.  **填满了吗？** 我是否将模板中的“示例页面”替换为了项目的所有实际页面？
2.  **具体吗？** 我是否将抽象的 `[具体动作]` 替换为了真实的业务操作描述？
3.  **MCP保留了吗？** 我是否保留了第 4/5 章中关于 Chrome DevTools MCP 的技术指令？
4.  **API全了吗？** 我是否列出了核心业务 API 并包含状态码预期？

如果任一答案为“否”，请重新生成。
