---
name: ralph-test-executor
description: Ralph 通用测试执行器：负责执行测试计划 (05-test-plan.md)，运行自动化测试命令，并更新测试状态。
---

# Skill: ralph-test-executor

## 📋 技能描述 (Description)
这是 Ralph **测试与验收阶段 (Testing Phase)** 的执行官。
你的职责是确保所有代码经过严格验证，并将验证结果如实记录在 `05-test-plan.md` 中。

## 使用场景 (Usage)
- **Phase**: Testing Phase (After Implementation)
- **Action**: "Run Tests", "Verify Features"
- **Trigger**: 当用户请求执行 `05-test-plan.md` 中的测试项时。

## 指令 (Instructions)

### 1. 全自动执行协议 (Fully Automated Protocol)
你必须严格按照 `05-test-plan.md` 中的顺序，**逐个**自动执行测试用例。

#### Step 1: LOAD (加载与锁定)
-   **Action**: 读取 `05-test-plan.md`。
-   **Strict Search**: 从文件顶部开始，找到**第一个**状态为 `[ ]` (Pending) 的测试用例 ID。
    -   **Constraint**: 严禁跳过当前未完成的用例去执行后面的用例。必须是**物理顺序上**的第一个。
    -   **Double Check**: 如果 Agent 试图测试 `TC-005`，但 `TC-004` 仍是 `[ ]`，系统必须报错并强制回滚到 `TC-004`。
-   **Focus**: 锁定当前测试用例 (e.g., `[TC-AUTH-HP-001]`)。

#### Step 2: EXECUTE (执行)
-   **No Manual Steps**: 严禁要求用户手动操作。所有验证必须通过编写和运行脚本完成。
-   **Check Deps**: 如果测试依赖的环境（如 DB）未就绪，执行 **[阻塞协议]**。
-   **Tool Selection**:
    -   **Unit/Integration**: 运行 `npm test` 或相关测试命令。
    -   **E2E/UI**: 优先使用 **Chrome DevTools MCP** 进行浏览器测试。
        -   **Action**: 调用 `chrome-devtools:navigate`, `chrome-devtools:click`, `chrome-devtools:screenshot` 等工具。
        -   **Reason**: 相比 Playwright/Puppeteer 脚本，MCP 工具更稳定且易于 AI 控制。
    -   **API**: 使用 `curl` 或编写脚本发送请求验证响应。

#### Step 3: VERIFY (验证)
-   **Pass**: 如果脚本执行成功且输出符合预期 -> 标记为 `[x]`。
-   **Fail**: 如果脚本报错或断言失败 -> 标记为 `(Failed: <Reason>)`。

#### Step 4: LOOP (循环)
-   **Sync**:
    1.  **Count**: 重新扫描 `05-test-plan.md`，计算 `[x]` 的数量与总测试用例数。
    2.  **Verify**: 确保 `RALPH_STATE.md` 中的进度与实际文件一致。如果不一致，**强制覆盖** `RALPH_STATE.md`。
    3.  **Update**: 更新 `RALPH_STATE.md` 中的 "Testing Phase" 进度 (e.g., `10/50 Tests`).
-   **Next**: 自动进入下一个未完成的测试用例，直到所有用例执行完毕。

### 2. 自动化门禁 (Automated Gates)
-   在执行具体用例前，先运行全量测试套件 (e.g., `npm run test:all`)。
-   如果全量测试失败，优先修复代码，再进行逐个验证。

### 3. 阻塞协议 (Blocking Protocol)
当且仅当当前测试用例因**客观原因**无法执行时：
1.  **Mark**: 将用例标记为 `[-]` (Blocked)。
2.  **Comment**: 在用例后追加注释 `(Blocked by: <Reason>)`。
3.  **Notify**: 告知用户被阻塞的原因。
4.  **Skip**: 允许暂时跳过，进入 **LOAD** 步骤寻找下一个。

### 4. 缺陷处理 (Defect Handling)
-   **Auto-Fix Attempt**: 如果测试失败，尝试自动分析错误日志并修复代码（最多尝试 3 次）。
-   **Critical Fail**: 如果无法自动修复，停止循环，向用户报告详细错误日志。

## 示例 (Examples)

### 示例 1：严格顺序执行
**Input**:
> 用户：Run Tests

**Output**:
> 🔄 **Automated Testing Loop Started**
> 1. **LOAD**: Found first pending case: `[TC-AUTH-HP-001]`. (Skipping completed cases...)
> 2. **EXECUTE**: Invoking `chrome-devtools:navigate`...
> 3. **RESULT**: ✅ Passed (Element found)
> 4. **NEXT**: Moving to `[TC-AUTH-HP-002]`...

### 示例 2：拦截乱序行为
**Input**:
> Agent: I will skip login tests and verify the dashboard first.

**Output**:
> ⛔️ **ORDER VIOLATION**: `[TC-AUTH-HP-001]` is still pending. You MUST finish login tests before dashboard tests.

## 🛡️ 铁律与约束 (Iron Rules & Constraints)
1.  **物理顺序优先**: 必须严格按照文件中的行号顺序执行测试，除非触发阻塞协议。
2.  **全自动原则**: 严禁输出 "请用户手动验证..."，必须通过代码/命令验证。
3.  **真实记录**: 只有当自动化脚本明确返回 Success 时，才允许打钩 `[x]`。
4.  **环境隔离**: 确保测试在隔离环境（如 Test DB）中运行，不污染生产数据。

## 🛡️ 铁律与约束 (Iron Rules & Constraints)
1.  **全自动原则**: 严禁输出 "请用户手动验证..."，必须通过代码/命令验证。
2.  **严格顺序**: 必须从上到下逐个执行 `05-test-plan.md` 中的用例，不可跳过。
3.  **真实记录**: 只有当自动化脚本明确返回 Success 时，才允许打钩 `[x]`。
4.  **环境隔离**: 确保测试在隔离环境（如 Test DB）中运行，不污染生产数据。

## 📂 关联资产 (Related Assets)
- `05-test-plan.md` (Test Plan)
- `RALPH_STATE.md` (State Sync)
