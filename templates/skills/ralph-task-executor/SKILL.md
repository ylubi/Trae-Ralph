---
name: ralph-task-executor
description: Ralph 通用任务执行器：基于 R-Loop (Load-Implement-Verify-Commit) 协议，逐个执行 `04-ralph-tasks.md` 中的开发任务。
---

# Skill: ralph-task-executor

## 📋 技能描述 (Description)
这是 Ralph **开发阶段 (Implementation Phase)** 的核心执行引擎。
你的职责是**严格按顺序**执行 `04-ralph-tasks.md` 中的任务，通过 **R-Loop** 协议确保代码质量与进度。

## 使用场景 (Usage)
- **Phase**: Implementation Phase (Round 3 Finished)
- **Action**: "Start Development", "Run Tasks"
- **Trigger**: 当用户请求执行 `04-ralph-tasks.md` 中的任务时。

## 指令 (Instructions)

### R-Loop 执行协议 (R-Loop Protocol)
请严格遵循以下无限循环逻辑，直到所有任务完成：

#### 1. LOAD (加载与锁定)
-   **Action**: 读取 `04-ralph-tasks.md`。
-   **Strict Search**: 从文件顶部开始，找到**第一个**状态为 `[ ]` (Pending) 的任务。
    -   **Constraint**: 严禁挑选“看起来容易”的任务。必须是**物理顺序上**的第一个未完成项。
    -   **Double Check**: 如果 Agent 试图选择 Task N，但 Task N-1 仍是 `[ ]`，系统必须报错并强制回滚到 Task N-1。
-   **Focus**: 锁定当前任务 ID (e.g., `T-AUTH-001`)。
-   **Status Update**: 将该任务标记为 `[~]` (In Progress)。

#### 2. IMPLEMENT (实现)
-   **Think**: 分析任务需求，决定修改哪些文件。
-   **Check Deps**: 确认该任务的前置依赖是否已完成。
    -   如果依赖未就绪 -> 执行 **[阻塞协议]**。
-   **Code**: 编写/修改代码。
-   **Constraint**: 仅修改与当前任务相关的代码，严禁“顺手”修改其他模块。

#### 3. VERIFY (验证)
-   **Self-Check**: 运行相关的单元测试或手动验证脚本。
    -   **Strict TDD**: 如果任务描述中包含“编写测试”或“TDD”，必须**先编写并运行测试**。
    -   **No Skip**: 严禁跳过单元测试环节。如果项目中有 `npm test` 或类似命令，必须在提交前执行。
-   **Lint**: 确保无 ESLint/TS 报错。
-   **Build**: 确保项目可编译。
-   **Fail Handling**: 如果验证失败，回到 **IMPLEMENT** 步骤修复，直到通过。

#### 4. COMMIT (提交)
-   **Git Commit**: 提交代码，Message 必须包含任务编号 (e.g., "feat: implement user login api (Task 2.1.1)").
-   **Status Update**: 将 `04-ralph-tasks.md` 中的任务标记为 `[x]` (Completed)。
-   **Sync**:
    1.  **Count**: 重新扫描 `04-ralph-tasks.md`，计算 `[x]` 的数量与总任务数。
    2.  **Verify**: 确保 `RALPH_STATE.md` 中的进度与实际文件一致。如果不一致，**强制覆盖** `RALPH_STATE.md`。
    3.  **Update**: 更新 `RALPH_STATE.md` 中的 "Execution & Delivery" 进度 (e.g., `5/20 Tasks`).

#### 5. LOOP (循环)
-   **Next**: 回到 **LOAD** 步骤，寻找下一个任务。
-   **Exit**: 如果所有任务均为 `[x]`，输出 "🎉 All Tasks Completed" 并触发 `ralph-test-executor`。

### 阻塞协议 (Blocking Protocol)
当且仅当当前任务 (Task N) 因**客观原因**无法执行时：
1.  **Mark**: 将 Task N 标记为 `[-]` (Blocked)。
2.  **Comment**: 在任务后追加注释 `(Blocked by: <Reason>)`。
3.  **Notify**: 告知用户任务被阻塞的原因。
4.  **Skip**: 允许暂时跳过 Task N，进入 **LOAD** 步骤寻找 Task N+1。
5.  **Review**: 在每一轮 Loop 结束时，重新检查所有 `[-]` 任务是否已解除阻塞。

### 异常处理 (Exception Handling)
-   **Error**: 如果遇到无法解决的技术难题，停止 Loop，向用户求助，并提供详细的错误日志和尝试过的方案。

## 示例 (Examples)

### 示例 1：严格顺序执行
**Input**:
> 用户：Start Implementation

**Output**:
> 🔄 **R-Loop Started**
> 1. **LOAD**: Found first pending task: `T-AUTH-001`. (Skipping completed tasks...)
> 2. **IMPLEMENT**: ...

### 示例 2：拦截乱序行为
**Input**:
> Agent: I will start with `T-UI-005` (Button Component).

**Output**:
> ⛔️ **ORDER VIOLATION**: Task `T-AUTH-001` is still pending. You MUST finish `T-AUTH-001` before `T-UI-005`.

## 🛡️ 铁律与约束 (Iron Rules & Constraints)
1.  **物理顺序优先**: 必须严格按照文件中的行号顺序执行任务，除非触发阻塞协议。
2.  **测试即交付**: 任何代码变更必须通过单元测试验证。**严禁跳过测试**直接打钩。
3.  **单线程执行**: 每次只做一个任务。严禁并发执行。
4.  **状态真实性**: 只有当代码提交且测试通过后，才能打钩 `[x]`。
5.  **保持专注**: 如果用户插入了无关对话，礼貌拒绝并回归当前任务。

## 📂 关联资产 (Related Assets)
- `04-ralph-tasks.md` (Task List)
- `RALPH_STATE.md` (State Sync)
