---
name: ralph-web-requirement
description: Ralph 流程专用：在 Web 项目规划阶段，强制生成包含管理后台、用户中心及深度字段定义的生产级 PRD。仅当处理 01-requirements.md 或 01-prd.md 时触发。
---

# Skill: ralph-web-requirement

## 📋 技能描述 (Description)
此 Skill 专用于解决“需求文档过于简陋”的问题，确保生成的 PRD 具备生产级深度。
它强制要求包含完整的生命周期管理（CRUD + Audit）、字段级定义和业务闭环。

## 使用场景 (Usage)
- **Phase**: Planning Phase (Round 1-3)
- **Caller**: `ralph-web-routine`
- **Context**: 编写/修订 `01-requirements.md` 时。

## 指令 (Instructions)

### Step 2: 深度自查 (Critique)
在 **Step 2**，扮演 "Critical Product Manager"：
1.  **Logical Gaps**: 寻找流程断点（如：注册了但没发验证码？）。
2.  **Edge Cases**: 寻找遗漏的边界（如：断网？并发？）。
3.  **Data Consistency**: 寻找字段定义冲突。
4.  **Output**: 输出 "🔴 Critical Issues" 列表，强制要求在下一轮 Draft 中修复。

### Step 4: 运营推演 (Simulation)
在 **Step 4**，扮演 "Operations Manager"：
1.  **Scenario**: 模拟真实用户故事（e.g., "用户忘记密码且手机号已换"）。
2.  **Walkthrough**: 按照文档描述走一遍流程。
3.  **Pass/Fail**: 如果流程走不通，标记为 "❌ Simulation Failed"。

## 示例 (Examples)

### 示例 1：深度自查 (Critique)
**Input**:
> 用户：Critique Draft 1

**Output**:
> 🧐 **Critique Report**:
> 1. **Gap**: User registration mentions "Email Verification" but no API or UI flow is defined for it.
> 2. **Edge Case**: What happens if the 3rd-party OAuth provider is down?
> **Action**: Please fix these in Round 2 Draft.

### 示例 2：运营推演 (Simulation)
**Input**:
> 用户：Simulate "User Refund"

**Output**:
> 🎭 **Simulating Refund Flow...**
> 1. User clicks "Refund" -> System checks eligibility (✅ Defined)
> 2. Admin receives notification (❌ Missing definition in Admin Panel)
> **Result**: ❌ Simulation Failed. Admin notification flow missing.

## 🛡️ 铁律与约束 (Iron Rules & Constraints)

### 1. 生产级需求标准 (Production-Ready Standards)
-   **页面穷举原则**:
    -   **管理后台**: 必须包含 RBAC, CRUD, Audit Logs, Dashboard。
    -   **用户中心**: 必须包含 Profile, Security, Notifications。
    -   **公共页面**: 404, 403, 500。
-   **字段深度原则**: 严禁简单描述。必须定义 Type, Validation, Interaction, Permission。
-   **业务逻辑闭环**: 必须定义异常流程, Cascade Delete, State Machine。

### 2. 质量自检清单 (Quality Self-Check)
在生成或审查需求文档时，Agent 必须自问：
1.  **能落地吗？** 开发人员知道字段长度和校验规则吗？
2.  **流程通吗？** 审核流程闭环了吗？
3.  **视图全吗？** 生产者/消费者视图区分了吗？
4.  **后台强吗？** 管理员能处理异常吗？
5.  **像真的吗？** 能上线运营吗？

## 📂 关联资产 (Related Assets)
- `01-requirements.md` (Target)
