# 测试验收计划 (Test & Acceptance Plan)

<!-- 
AI 指令: 
必须严格执行测试状态管理。
1. 运行验证后，必须**立即**更新此文件。
2. 只有当测试通过时，才能将 "[ ]" 改为 "[x]"。
3. 如果测试失败，**不要**标记为 [x]，而应添加关于失败的备注。
4. 此文件即是“完成的定义 (Definition of Done)”。
-->

## 1. 自动化测试门禁 (Automated Gates)
> **强制规则**: 此部分必须由 CI/CD 或本地脚本自动执行。红灯 (Fail) 即视为任务未完成。

### 1.1 后端/逻辑测试 (Backend & Logic)
- [ ] **Unit Tests**: 运行 `npm run test:unit`，验证核心业务逻辑、工具函数，覆盖率需 > 80%。
- [ ] **API Tests**: 运行 `npm run test:api`，验证所有接口的 200/400/500 响应及权限控制。

### 1.2 前端功能测试 (Frontend Functional)
- [ ] **Component Tests (覆盖率: 高)**: 运行 `npm run test:component` (Vitest/Jest + Testing Library)。
    - **页面级 (Page Coverage)**: 必须为每个页面路由 (Route) 编写测试，确保页面能正常渲染且无崩溃。
    - **交互级 (Interaction Coverage)**: 必须测试所有用户可交互元素（按钮、表单、弹窗），验证点击、输入、提交行为。
    - **状态级 (State Coverage)**: 必须验证 Loading、Error、Empty、Success 等各种UI状态。
- [ ] **Hooks/Utils**: 验证自定义 Hooks 和前端工具函数。

### 1.3 端到端测试 (E2E)
- [ ] **关键路径**: 运行 `npm run test:e2e` (Playwright/Cypress)。
    - Case 1: 用户登录 -> 跳转 Dashboard
    - Case 2: 完整下单流程

## 2. MCP 交互式验收 (MCP Interactive Verification)
> **Agent 操作指南**: 此部分由 Agent 使用 MCP 工具（浏览器、数据库终端）像真人一样进行验证。

### 2.1 Web 前端验收 (via Chrome DevTools MCP)
- [ ] **视觉检查**: 打开 `/login` 页面。
    - 验证: 按钮在 Mobile 模式下是否不换行。
    - 动作: 截图保存到 `docs/evidence/login-mobile.png`。
- [ ] **控制台监控**: 打开 Console 面板。
    - 验证: 点击提交按钮时，Console 无红色报错。

### 2.2 数据一致性验收 (via SQL/Terminal MCP)
- [ ] **落库检查**:
    - 动作: 在前端注册新用户 `test_mcp@example.com`。
    - 验证: 连接数据库执行 `SELECT * FROM users WHERE email='test_mcp@example.com'`，确认记录存在。
