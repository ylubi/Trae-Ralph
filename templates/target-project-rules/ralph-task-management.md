# Ralph 任务管理规范

为了支持 Ralph Loop 的长时间自主运行，以及多轮次需求的迭代开发，项目采用 **“指针-实例”** 的任务管理模型。

## 1. 任务状态架构

### 1.1 指针文件 (Pointer)
项目根目录必须包含一个名为 `RALPH_STATE.md` 的文件。
> **单一职责**: 它仅用于存储 **聚合状态 (Aggregate State)**（如：当前阶段、总体进度百分比），**严禁** 在此文件中存储具体的任务列表或测试用例详情。
> **量化格式**: `进度` 列必须严格符合 `X/Y (Tasks|Cases)` 格式，禁止使用模糊的定性描述（如“基础测试通过”）。

### 1.2 实例文件 (Instance)
> **单一事实来源 (Single Source of Truth)**: 以下文件是具体任务和测试条目的 **唯一** 存储位置。
- **任务清单**: `docs/planning/<迭代>/04-ralph-tasks.md`
- **测试计划**: `docs/planning/<迭代>/05-test-plan.md`
- **经验日记**: `docs/planning/<迭代>/06-learnings.md`

## 2. Agent 操作规范

### 2.1 启动/恢复时
1.  **读取指针**: 打开根目录 `RALPH_STATE.md`。
2.  **复习经验**: 读取指针指向的 `06-learnings.md`，避免踩坑。
3.  **加载任务**: 读取指针指向的 `04-ralph-tasks.md` 和 `05-test-plan.md`。
    - **强制同步工具状态**: 读取任务文件后，如果你的系统支持 Todo 工具（如 `TodoWrite`），你**必须**调用工具，将 `04-ralph-tasks.md` 中的未完成项（[ ]）同步到你的 Todo 工具中。
    - **禁止**: 不要保留任何不在 `04-ralph-tasks.md` 中的临时任务。
4.  **恢复状态**: 检查该任务文件中最后一个打钩的项 `[x]`，从下一项开始工作。

### 2.2 执行中 (关键)
> **状态铁律**: 代码质量决定任务是否达标，但**文档勾选 (Checkbox)** 决定任务是否在系统层面完成。两者缺一不可。

- **标准循环 (The R-Loop)**:
  - Agent 必须严格遵循 `Load` -> `Implement` -> `Verify` -> `Commit` 的顺序。
  - **禁止跳步**: 严禁在未读取任务 (`Load`) 的情况下直接写代码 (`Implement`)。严禁在未验证 (`Verify`) 的情况下直接提交 (`Commit`)。

- **原子事务 (Atomic Transaction - Step 3)**:
  - 任务状态的更新是一个**原子操作**，必须在**同一次回复 (Turn)** 中完成以下所有动作：
    1.  **Modify**: 更新 `04-ralph-tasks.md` (勾选 `[x]`)。
    2.  **Sync**: 更新 `RALPH_STATE.md` (增加进度计数 `N/Total`)。
    3.  **Verify**: 如果涉及测试，更新 `05-test-plan.md`。
  - **工具推荐**: 如果你需要批量处理或对当前状态感到困惑，**强烈建议**调用 `ralph-state-manager` Skill 来执行 `sync` 操作，它能自动处理上述所有步骤的一致性。
  - **严禁**：只做其中一项而遗漏其他项。如果你的工具调用次数受限，请分批调用，但必须在结束当前回复前完成同步。

- **禁止口头完成**: 严禁在回复中说“已完成”却不调用 `Write` 或 `SearchReplace` 修改文件。这是严重的幻觉行为。
  - **Development 阶段**: 每当你更新 `04-ralph-tasks.md` 中的任务状态（如勾选完成一个任务），你**必须**同时更新 `RALPH_STATE.md` 中的 "Execution & Delivery" 表格。
    - **更新内容**: 更新 `进度` 列 (例如从 `5/12 Tasks` 更新为 `6/12 Tasks`)。
    - **完成判断**: 当所有任务都标记为 `[x]` 时，将 `Development` 状态改为 `✅ 完成`，并将 `Testing` 状态改为 `🔄 进行中`。
  - **Testing 阶段**: 每当你执行测试并更新 `05-test-plan.md` 时，你**必须**同时更新 `RALPH_STATE.md`。
    - **更新内容**: 更新 `进度` 列 (例如从 `0/20 Cases` 更新为 `5/20 Cases`)。
    - **完成判断**: 当所有测试用例都通过时，将 `Testing` 状态改为 `✅ 完成`。

- **禁止批量操作 (No Batching)**:
  - 严禁连续完成 3 个以上任务才去更新一次文档。
  - **必须**保持“做一个，勾一个”的节奏，防止中途上下文丢失导致进度回滚。

- **经验沉淀**: 发现新坑，**立即**更新 `06-learnings.md`。

### 2.3 阶段切换 (Phase Transition)
当 `04-ralph-tasks.md` 中的所有功能开发任务都完成后：
1.  **禁止直接交付**: 严禁直接进行部署、发布或编写交付文档。
2.  **状态流转**:
    - 在 `RALPH_STATE.md` 中将 `Development` 标记为 `✅ 完成`。
    - 在 `RALPH_STATE.md` 中将 `Testing` 标记为 `🔄 进行中`。
3.  **强制测试**: 立即参考 `ralph-testing-mode.md` 进入独立测试阶段。

### 3. 阶段与边界 (Phase Boundaries)

- **Development Phase (`04-ralph-tasks.md`)**:
  - **职责**: 编写功能代码、编写单元测试代码 (Test Implementation)、编写 E2E 脚本 (Scripting)。
  - **允许**: `[ ] 编写 User 模块单元测试`，`[ ] 实现 API 集成`。
  - **禁止**: `[ ] 执行全量验收测试`，`[ ] 运行 05-test-plan 中的所有 Case`。这些属于 Testing Phase。
  - **Handover**: 完成所有任务后，必须执行 Handover 章节中的指令，明确调用 `ralph-testing-mode`。

- **Testing Phase (`05-test-plan.md`)**:
  - **职责**: 执行测试计划，验证系统功能，回归测试。
  - **触发条件**: Development Phase 的最后一个任务必须是“更新 RALPH_STATE.md 进入 Testing 阶段”。
  - **执行**: Agent 必须切换到 `ralph-testing-mode`，逐一运行 `05-test-plan.md` 中的测试用例。

### 4. 任务颗粒度 (Granularity)

## 3. 提交规范 (Git Integration)
- 提交时应包含迭代前缀。
- 例如: `feat(auth): [Step 2] 实现登录接口` (对应 feature-auth 迭代)。
