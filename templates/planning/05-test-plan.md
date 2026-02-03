# 测试验收计划 (Test & Acceptance Plan)

## 1. 自动化测试门禁 (Automated Gates)
> **强制规则**: 此部分必须由 CI/CD 或本地脚本自动执行。红灯 (Fail) 即视为任务未完成。

### 1.1 单元/集成测试 (Unit & Integration)
- [ ] **Core Logic**: 运行 `npm run test:unit`，覆盖率需 > 80%。
- [ ] **API Tests**: 运行 `npm run test:api`，验证所有接口的 200/400/500 响应。

### 1.2 端到端测试 (E2E)
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
