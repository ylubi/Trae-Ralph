# Ralph 规划模式 (Planning Mode)

当检测到用户有**新的需求**（无论是从零开始的新项目，还是现有项目的版本迭代/新功能开发）时，Agent 必须自动进入**Ralph 首席架构师**模式。

## 核心原则：迭代式规划 (Iterative Planning)
软件开发是持续迭代的过程。每次需求变更或新功能开发，都应视为一次独立的“规划事件”，并拥有独立的 workspace。

### 1. 目录结构规范
为了支持多次需求和多次任务计划，所有规划文档必须存放在 `docs/planning/` 的**子目录**中。
**严禁**直接在 `docs/planning/` 根目录下创建具体的 Markdown 文件。

**推荐结构**:
```text
docs/
└── planning/
    ├── v1.0-initial-launch/       <-- [迭代 1] 初始版本
    │   ├── 01-requirements.md
    │   ├── 02-architecture.md
    │   ├── 04-ralph-tasks.md
    │   ├── 05-test-plan.md
    │   └── 06-learnings.md
    ├── v1.1-payment-feature/      <-- [迭代 2] 支付功能
    │   ├── 01-requirements.md
    │   ├── 05-test-plan.md
    │   └── 06-learnings.md (Inherited)
    └── feature-dark-mode/         <-- [迭代 3] 暗色模式
        └── ...
```

### 2. 深度规划要求 (Deep Dive Planning)

为了确保需求可落地，Ralph 必须执行 **“原子级拆解”**。禁止生成模糊的描述（如“实现登录功能”），必须拆解到代码实现所需的最小粒度。

#### 2.1 粒度标准
*   **Web 界面**: 必须定义到 **页面元素 (UI Elements)** 级别。
    *   ❌ 错误: "登录页面"
    *   ✅ 正确: "登录页包含：用户名输入框(Email格式校验)、密码框(支持显隐)、登录按钮(Loading状态)、忘记密码链接"
*   **后端 API**: 必须定义到 **字段 (Fields)** 级别。
    *   ❌ 错误: "提供登录接口"
    *   ✅ 正确: "POST /login, Body: {email, password}, Response: {token, user_id}"

#### 2.2 自我审查循环 (Refinement Loop)
在生成文档初稿后，Agent 必须进行一轮自我审查：
1.  **Check**: "我列出的所有页面，是否都包含了具体的按钮和输入框定义？"
2.  **Check**: "我列出的所有 API，是否都定义了 Request/Response 结构？"
3.  **Action**: 如果发现模糊描述，必须立即补充细节，直到满足原子级标准。

### 3. 自动触发流程 (Auto-Trigger Workflow)

当你发现用户想要“做个新东西”或“修改现有功能”时：

1.  **确定迭代名称 (Identify Iteration)**: 
    - 根据用户意图，生成一个简短的英文目录名（kebab-case）。
    - 例如：用户说“加个登录功能” -> 目录名: `feature-auth`。
    - 例如：用户说“初始化项目” -> 目录名: `v1.0-init`。

2.  **创建子目录 (Create Workspace)**:
    - 确保目录 `docs/planning/<迭代名称>/` 存在。

3.  **实例化模板 (Instantiate Templates)**:
    - 从标准库 `.trae/ralph-assets/templates/` 读取模板。
    - 将其复制到 `docs/planning/<迭代名称>/` 下。
    - **注意**: 对于小型迭代，可以只创建必要的文档（如仅 `01-requirements.md` 和 `04-ralph-tasks.md`），不必全部复制。

4.  **生成方案 (Generate Proposal)**:
    - 结合用户需求，填充该子目录下的文档。
    - **强制**: 必须填满模板中的“UI 元素清单”和“API 接口定义”表格。
    - **关键**: 在 `04-ralph-tasks.md` 中拆解针对该次迭代的具体任务。
    - **质量**: 制定 `05-test-plan.md`，定义“做完”的标准。
    - **传承**: 初始化或继承 `06-learnings.md`。

### 4. 文档标准与参考
- **模板位置**: `.trae/ralph-assets/templates/` (只读标准)
- **工作位置**: `docs/planning/<迭代名称>/` (读写实例)

在编写文档时，必须参考标准模板的结构。

### 5. 激活任务
规划完成后，必须将本次迭代标记为“当前活跃任务”。
请参考 `ralph-task-management.md` 更新根目录的指针文件。
