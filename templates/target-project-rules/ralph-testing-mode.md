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
1.  **状态切换**: 
    - 确保 `RALPH_STATE.md` 中的 `Development` 状态已标记为 `✅ 完成`。
    - 确保 `RALPH_STATE.md` 中的 `Testing` 状态已标记为 `🔄 进行中`。
2.  **加载计划**: 读取 `docs/planning/<迭代>/05-test-plan.md`。

### 2.2 执行测试 (Execution Standards)
-   **全量回归**: 运行所有层级的自动化测试（Unit + Integration + E2E）。
-   **实时记录 (Real-time Recording)**: 每通过一个测试套件（Test Suite）或验证项，**必须立即**执行以下两步操作：
    > **铁律**: 严禁跑完所有测试再一次性打钩。必须“跑一个 -> 改一个”。
    1.  **更新计划**: 更新 `05-test-plan.md`，将对应的 `[ ]` 改为 `[x]`。
    2.  **更新状态**: 更新 `RALPH_STATE.md` 中的 `Testing` 进度 (例如从 `0/20 Cases` 更新为 `5/20 Cases`)。
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
4.  **状态终结**: 更新 `RALPH_STATE.md` 中的 `Testing` 状态为 `✅ 完成`。

## 3. 测试文件与工具规范

### 3.1 单元/集成测试
-   **文件位置**: 与源代码同目录，命名为 `*.test.ts` 或 `*.spec.ts`。
-   **Mock 策略**: 外部 API 调用必须 Mock，禁止在单元测试中发起真实网络请求。

### 3.2 E2E 测试
-   **工具**: 推荐使用 Playwright 或 Cypress。
-   **环境**: 测试应在独立的测试环境或本地模拟环境中运行，严禁在生产环境执行写操作测试。

### 3.3 Web 界面交互测试 (Web UI Interactive Testing)
-   **强制性**: 对于所有 Web 项目，此项为**必选**。
-   **工具**: **必须**使用 Chrome DevTools MCP 进行验证。
-   **执行策略**: 
    -   **Page Matrix**: 必须遍历所有页面路由，执行 Console/DOM 检查。
    -   **Automated Visual**: 使用 MCP 模拟 Mobile/Tablet 视口，验证响应式布局。
-   **执行步骤**:
    1.  **启动服务**: 确保 Web 服务已启动（如 `npm run dev`），并设置 `blocking: false`。
    2.  **连接工具**: 使用 Chrome DevTools MCP 连接到对应端口。
    3.  **验证项目**:
        -   **视觉检查 (Automated Visual Check)**: 使用 `Emulation.setDeviceMetricsOverride` 模拟不同设备，验证无横向滚动和布局错乱。
        -   **控制台监控 (Console Monitor)**: 检查 Console 中是否有红色的 Error/Warning。
        -   **交互模拟 (Simulation)**: 模拟点击、输入，验证 DOM 变化符合预期。

### 3.4 真实用户全流程模拟 (Real User Journey Simulation)
> **目标**: 确保项目具备“生产级服务能力”，而非仅作为演示 Demo。

-   **原则**: 必须使用 MCP 模拟真实用户的完整生命周期，包括边缘情况和错误恢复。
-   **执行要求**:
    1.  **数据持久化**: 模拟刷新、重新登录，验证数据一致性。
    2.  **抗干扰测试**: 使用 `Network.emulateNetworkConditions` 模拟弱网/断网，验证系统恢复能力。

### 3.5 API 接口自动化测试 (API Automation)
> **目标**: 确保后端接口在脱离前端 UI 的情况下依然稳健，并防止越权漏洞。

-   **执行策略**:
    -   **核心接口穷举**: 必须覆盖 `03-tech-design.md` 中定义的所有关键业务接口。
    -   **状态码验证**: 必须验证 200 (Success), 400 (Bad Request), 401 (Auth), 403 (Permission), 500 (Server Error) 等各种状态。
    -   **安全验证 (Security)**:
        -   **越权访问 (IDOR)**: 尝试使用 User A 的 Token 操作 User B 的资源，预期返回 403。
        -   **未授权访问**: 不带 Token 访问受保护接口，预期返回 401。

## 4. 常见问题 (FAQ)

-   **Q: 我在做任务时发现了一个 Bug，需要更新 05-test-plan.md 吗？**
    -   A: 不需要。直接修复 Bug，确保 Track A 验证通过即可。只有当你发现这是一个需要长期关注的回归测试场景时，才添加到 `05-test-plan.md`。

-   **Q: 测试挂起了怎么办？**
    -   A: 立即终止命令。检查是否忘记加 `--watch=false` 或 `CI=true`。
