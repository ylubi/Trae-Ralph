# Ralph 测试模式规则 (Ralph Testing Mode)

本规则定义了项目的**独立测试阶段**和**质量交付门禁**。它与 `ralph-task-management.md` 中的“原子验证”互为补充。

## 1. 测试双轨制架构 (Dual-Track Testing Architecture)

| 轨道 (Track) | **Track A: 任务级验证 (Task Verification)** | **Track B: 交付级验收 (Release Acceptance)** |
| :--- | :--- | :--- |
| **归属** | `ralph-task-management.md` | **本文件 (ralph-testing-mode.md)** |
| **目标** | 确保当前代码块逻辑正确 (Local Correctness) | 确保系统整体功能完好 (Global Stability) |
| **时机** | 开发过程中，完成每个 Task 前 | 所有 Task 完成后，或手动触发回归测试时 |
| **动作** | 运行单元测试、Lint、简单脚本 | 运行全量测试套件、E2E 测试、集成测试 |
| **记录** | **无需记录** (打钩即代表通过) | **必须记录** (更新 `05-test-plan.md`) |

## 2. 独立测试阶段流程 (Independent Testing Phase)

当 `04-ralph-tasks.md` 中的所有功能开发任务标记为 `[x]` 后，Agent **必须**显式进入测试阶段。

### 2.1 启动测试模式
1.  **状态切换**: 将 Ralph 状态报告中的 `<current-task>` 更新为 `执行全量回归测试`。
2.  **加载计划**: 读取 `docs/planning/<迭代>/05-test-plan.md`。

### 2.2 执行测试 (Execution Standards)
-   **全量回归**: 运行所有层级的自动化测试（Unit + Integration + E2E）。
-   **非交互原则**: 
    -   严禁使用 `npm start` 或 `npm test` (watch mode)。
    -   **必须**使用 CI 模式参数，例如：
        -   `npm test -- --watch=false`
        -   `CI=true npm run test:all`
        -   `npx playwright test`
-   **错误处理**:
    -   如果测试失败，**不要**修改测试代码（除非确认是测试用例本身过期）。
    -   优先修复业务代码，确保通过原有测试。

### 2.3 验收与交付 (Acceptance & Delivery)
只有当以下条件满足时，迭代才算真正结束：
1.  **自动化门禁**: 所有 CI 测试通过 (Green)。
2.  **计划更新**: `05-test-plan.md` 中的所有检查项均已标记为 `[x]`。
3.  **人工验收**: 如果有需要人工介入的测试（如 UI 视觉检查），已截图并保存证据。
4.  **状态更新**: 更新 `RALPH_STATE.md` 中的 `当前测试` 为 `完成`。

## 3. 测试文件与工具规范

### 3.1 单元/集成测试
-   **文件位置**: 与源代码同目录，命名为 `*.test.ts` 或 `*.spec.ts`。
-   **Mock 策略**: 外部 API 调用必须 Mock，禁止在单元测试中发起真实网络请求。

### 3.2 E2E 测试
-   **工具**: 推荐使用 Playwright 或 Cypress。
-   **环境**: 测试应在独立的测试环境或本地模拟环境中运行，严禁在生产环境执行写操作测试。

### 3.3 Web 界面交互测试 (Web UI Interactive Testing)
-   **工具**: 使用 MCP Chrome DevTools 进行交互式验证。
-   **场景**: 适用于需要视觉确认、DOM 状态检查或控制台错误监控的场景。
-   **执行步骤**:
    1.  **启动服务**: 确保 Web 服务已启动（如 `npm run dev`），并设置 `blocking: false`。
    2.  **连接工具**: 使用 Chrome DevTools MCP 连接到对应端口。
    3.  **验证项目**:
        -   **视觉检查 (Visual Check)**: 截图关键页面，检查布局是否崩坏。
        -   **控制台监控 (Console Monitor)**: 检查 Console 中是否有红色的 Error/Warning。
        -   **交互模拟 (Simulation)**: 模拟点击、输入，验证页面响应。

### 3.4 真实用户全流程模拟 (Real User Journey Simulation)
> **目标**: 确保项目具备“生产级服务能力”，而非仅作为演示 Demo。

-   **原则**: 必须模拟真实用户的完整生命周期，包括边缘情况和错误恢复。
-   **执行要求**:
    1.  **数据持久化**: 验证数据在页面刷新、重新登录后是否依然存在且正确。
    2.  **全链路操作**: 从“注册 -> 使用核心功能 -> 退出 -> 再次登录”必须形成闭环。
    3.  **抗干扰测试**: 模拟网络延迟、非法输入、重复点击，验证系统的健壮性。
    4.  **清理机制**: 测试完成后，必须能够清理产生的测试数据，不污染环境。

## 4. 常见问题 (FAQ)

-   **Q: 我在做任务时发现了一个 Bug，需要更新 05-test-plan.md 吗？**
    -   A: 不需要。直接修复 Bug，确保 Track A 验证通过即可。只有当你发现这是一个需要长期关注的回归测试场景时，才添加到 `05-test-plan.md`。

-   **Q: 测试挂起了怎么办？**
    -   A: 立即终止命令。检查是否忘记加 `--watch=false` 或 `CI=true`。
