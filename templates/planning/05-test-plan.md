# 测试验收计划 (Test & Acceptance Plan)

<!-- 
AI 指令: 
此文件对应 Ralph 的 "Track B: 交付级验收" 阶段。
1. 何时执行: 仅当 `04-ralph-tasks.md` 中的所有任务完成后，才开始执行此计划。
2. 执行规则: 遵循 `ralph-testing-mode.md` 中的非交互式命令规范。
3. 状态更新: 运行测试后，根据结果更新 [ ] 为 [x]。只有全部 [x] 后，迭代才算完成。
-->

## 测试状态图例
- [ ] 待开始 (Pending)
- [x] 已完成 (Completed)
- [~] 进行中 (In Progress)

## 1. 自动化测试门禁 (Automated Gates)
> **强制规则**: 运行全量测试套件，确保无回归问题。

- [ ] **全量回归 (All Regression)**: 运行 `npm run test:all` (或等效 CI 命令)，确保所有 Unit/Integration 测试通过。
- [ ] **关键路径 E2E**: 运行核心业务流程的端到端测试。

## 2. 关键业务验收 (Key Acceptance Criteria)
> **说明**: 此处列出本迭代必须交付的核心价值点。

- [ ] **Case 1**: [描述关键场景，例如：用户能成功登录并跳转]
- [ ] **Case 2**: [描述关键场景]

## 3. 交互式验收 (Interactive Verification via MCP)
> **AI 指令**: 
> 1.  若为 Web 项目，**必须**激活 `web-test-plan` Skill。
> 2.  **必须**遍历项目中的**每一个**前端路由/页面，生成独立的测试区块。
> 3.  **必须**使用 Chrome DevTools MCP 进行验证。

### 3.1 页面级测试矩阵 (Page-Level Matrix)

#### 示例页面: `/login` (请替换为实际页面)
- [ ] **1.1 Chrome DevTools MCP 基础检查 (Mandatory)**
    - **Console Zero Error**: 页面加载及交互过程中，控制台不得有任何红色报错。
    - **DOM Integrity**: 核心业务元素（如表单、按钮、列表）必须在 DOM 中正确渲染。
- [ ] **1.2 交互功能验证 (Functional)**
    - [ ] **Happy Path**: [具体动作] -> [预期 DOM 变化]
    - [ ] **Sad Path**: [具体动作] -> [预期 DOM 变化]
    - [ ] **State Check**: [验证 Loading/Empty 状态]

### 3.2 全局流程串联 (End-to-End Flows)
- [ ] **<业务闭环名称>**: [步骤 1] -> [步骤 2] -> [步骤 3] -> [最终结果]

## 4. 真实服务能力验证 (Real Service Capability via MCP)
> **目标**: 使用 MCP 模拟真实用户行为，验证数据持久化和错误恢复能力。

- [ ] **数据持久化闭环**:
    - **动作 (via MCP)**: 模拟完整操作流 (注册 -> 退出 -> 登录)。
    - **验证 (via MCP)**: 重新登录后，检查 DOM 中是否依然存在之前创建的数据。
- [ ] **错误恢复 (Resilience)**:
    - **动作 (via MCP)**: 模拟网络离线 (`Network.emulateNetworkConditions`) -> 执行操作 -> 恢复网络。
    - **验证 (via MCP)**: 验证系统是否自动重试或允许手动重试，而非永久卡死。

## 5. 响应式与视觉自动化验证 (Automated Visual & Responsive Verification)
> **目标**: 使用 MCP 模拟不同设备视口，替代人工手动截图。

- [ ] **Mobile 适配检查 (iPhone SE/12)**:
    - **动作 (via MCP)**: 设置视口宽 375px (`Emulation.setDeviceMetricsOverride`)。
    - **验证 (via MCP)**: 检查水平滚动条是否为 0 (无溢出)，汉堡菜单是否可见。
- [ ] **Tablet 适配检查 (iPad)**:
    - **动作 (via MCP)**: 设置视口宽 768px。
    - **验证 (via MCP)**: 检查栅格布局是否正确折叠 (如 3列变 2列)。
- [ ] **Theme/Dark Mode**:
    - **动作 (via MCP)**: 模拟系统暗色模式。
    - **验证 (via MCP)**: 检查背景色/文字颜色对比度是否符合标准。

## 6. API 接口自动化验证 (API Automation Testing)
> **AI 指令**: 必须基于 `03-tech-design.md` 中的 API 定义，穷举关键接口测试用例。
> **工具推荐**: 使用 `newman` (Postman CLI) 或编写脚本 (`axios`/`fetch`) 进行批量验证。

### 6.1 核心业务接口 (Core Business APIs)
- [ ] **Auth**: 
    - `POST /api/auth/login` (200 OK, Returns Token)
    - `POST /api/auth/login` (401 Unauthorized, Invalid Credentials)
- [ ] **<Resource A>**:
    - `GET /api/<resource>` (200 OK, List format correct)
    - `POST /api/<resource>` (201 Created, Data persisted)
    - `POST /api/<resource>` (400 Bad Request, Validation failed)

### 6.2 权限与安全接口 (Security & Permissions)
- [ ] **Guest Access**: 未登录访问受保护接口 -> 401/403
- [ ] **Cross-User Access**: 用户 A 尝试修改 用户 B 的资源 -> 403 Forbidden
