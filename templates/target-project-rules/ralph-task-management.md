# Ralph 任务管理规范

为了支持 Ralph Loop 的长时间自主运行，以及多轮次需求的迭代开发，项目采用 **“指针-实例”** 的任务管理模型。

## 1. 任务状态架构

### 1.1 指针文件 (Pointer)
项目根目录必须包含一个名为 `RALPH_STATE.md` 的文件。它不再存储具体任务，而是作为 **“当前活跃迭代”** 的指针。

> **初始化规则**: 如果该文件不存在，Agent 必须在首次运行时根据下方的模板创建它。如果存在旧版格式文件，请将其重命名备份后再创建新版。

**RALPH_STATE.md 模板**:
```markdown
# Ralph 状态指针

## 📍 当前活跃上下文 (Active Context)
- **迭代名称**: feature-auth
- **规划路径**: docs/planning/feature-auth/
- **任务文件**: docs/planning/feature-auth/04-ralph-tasks.md
- **测试文件**: docs/planning/feature-auth/05-test-plan.md
- **任务规范**: .trae/rules/ralph-task-management.md
- **测试规范**: .trae/rules/ralph-testing-mode.md
- **行为规范**: .trae/rules/ralph-agent-mode.md
- **引导规范**: .trae/rules/ralph-entry-rules.md
- **经验文件**: docs/planning/feature-auth/06-learnings.md
- **上次更新**: {YYYY-MM-DD HH:mm} (当前系统的当地时间)

## 🔄 当前迭代状态 (Current Iteration Status)
- **当前任务**: 未开始 | 进行中 | 完成
- **当前测试**: 未开始 | 进行中 | 完成
> **Strict Mode**: 必须严格实时管理 4-ralph-tasks.md、05-test-plan.md 文档中的状态，严禁在最后统一批量修改。

## 🚦 状态流转规则 (State Transition Rules)
> **AI 必读 (Critical Instruction)**: 
> 1. 如果 `当前任务` = `完成` 且 `当前测试` != `完成`，**必须**立即进入测试阶段。
> 2. **禁止**在测试完成前进行任何部署或交付操作。
> 3. 下一步行动: 读取 `测试文件` (05-test-plan.md)，执行全量回归测试。

## 📝 全局备忘录 (Global Context)
(此区域已弃用，请使用 `docs/planning/<当前迭代>/06-learnings.md` 记录经验)
- 参见: [06-learnings.md](docs/planning/feature-auth/06-learnings.md)
```

### 1.2 实例文件 (Instance)
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

### 2.2 切换迭代时 (Context Switching)
当用户提出新需求，或者当前迭代全部完成时：
1.  **归档旧状态**: 确保当前 `04-ralph-tasks.md` 和 `05-test-plan.md` 全部标记完成。
2.  **继承经验**: 将旧迭代的 `06-learnings.md` 复制到新迭代目录，作为起点。
3.  **更新指针**: 修改 `RALPH_STATE.md` 指向新目录。

### 2.3 执行中 (关键)
> **严格规则**: 任务的完成状态由代码质量决定，而非文档更新。

- **原子验证 (Atomic Verification)**: 每完成一个子任务，**必须**在打钩前进行验证。
  - **验证标准**: 运行相关的单元测试、Lint 检查或编写临时脚本验证逻辑。
  - **无需文档**: 验证过程不需要更新到 `05-test-plan.md`，也不需要保留临时验证脚本。
  - **打钩即承诺**: 当你将任务标记为 `[x]` 时，即代表你承诺该代码块逻辑正确且无语法错误。

- **经验沉淀**: 发现新坑，**立即**更新 `06-learnings.md`。

- **阶段切换**: 当所有功能开发任务都完成后：
  1.  **禁止直接交付**: 严禁直接进行部署、发布或编写交付文档。
  2.  **强制测试**: 必须立即参考 `ralph-testing-mode.md` 进入独立测试阶段。
  3.  **状态更新**:
      - 更新 `RALPH_STATE.md` 中的 `当前任务` 为 `完成`。
      - 更新 `RALPH_STATE.md` 中的 `当前测试` 为 `进行中`。

## 3. 提交规范 (Git Integration)
- 提交时应包含迭代前缀。
- 例如: `feat(auth): [Step 2] 实现登录接口` (对应 feature-auth 迭代)。
