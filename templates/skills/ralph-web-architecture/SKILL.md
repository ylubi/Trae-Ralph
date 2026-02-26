---
name: ralph-web-architecture
description: Ralph 流程专用：在 Web 项目规划阶段，强制生成生产级架构设计（Atomic Components, State, API Spec, DB ERD）。仅当处理 02-architecture.md 时触发。
---

# Skill: ralph-web-architecture

## 📋 技能描述 (Description)
此 Skill 专用于解决“架构设计过于简陋”的问题，确保生成的架构具备生产级深度。
它通过强制执行一系列标准和自检清单，防止生成 "Hello World" 级别的架构设计。

## 使用场景 (Usage)
- **环境**: Ralph Flow
- **项目类型**: Web 项目
- **阶段**: 规划阶段 (Planning Mode) - 支持 Round 1-3 (Step 3/5)

## 指令 (Instructions)

### Step 3: 竞品调研 (Research)
在 **任意 Round 的 Step 3**，执行 `WebSearch`：
1.  **Round 1**: 搜索 "架构全景图" (Overall Architecture) 与 "核心模块设计" (Core Module Design)。
2.  **Round 2**: 搜索 "数据模型最佳实践" (DB Schema) 与 "API 设计规范" (API Design)。
3.  **Round 3**: 搜索 "性能优化" (Performance) 与 "安全合规" (Security)。

### Step 5: 一致性锁定 (Lock)
在 **任意 Round 的 Step 5**，执行 `Ripple Check`：
1.  **Sync**: 确保 `01` 的变更已同步到 `02`。
2.  **Verify**: 确保 API 定义能覆盖所有前端交互。
3.  **Next Round Trigger**:
    *   **Round 1-2**: 输出 "🔒 Round X Locked. Proceeding to Round X+1..."
    *   **Round 3**: 输出 "✅ Final Architecture Locked."

## 示例 (Examples)

### 示例 1：架构调研 (Round 1)
**Input**:
> 用户：Research Architecture

**Output**:
> 🔍 **Searching for "React SaaS Architecture Best Practices"...**
> **Key Findings**:
> 1. Use Feature-Sliced Design (FSD) for scalability.
> 2. Separate UI components from business logic (hooks).
> **Action**: Updated `02-architecture.md` with recommended directory structure.

### 示例 2：一致性锁定
**Input**:
> 用户：Lock Round 2

**Output**:
> 🔒 **Locking Round 2**
> - Requirements vs Architecture: ✅ Consistent
> - API Coverage: ✅ 100%
> - **Status**: Ready for Round 3 (Performance & Security).

## 🛡️ 铁律与约束 (Iron Rules & Constraints)

### 1. 生产级架构标准 (Production-Ready Standards)
-   **框架惯例优先**: 严格遵循技术栈最佳实践 (e.g., Next.js App Router, Python Pydantic)。
-   **前端架构深度**: 必须区分原子组件与业务组件，明确状态管理策略。
-   **后端架构深度**: 必须定义 API Spec (REST/GraphQL), DB ERD (FK/Index), Auth (JWT/RBAC)。
-   **基础设施**: 必须包含 CI/CD, 监控, 日志方案。

### 2. 质量自检清单 (Quality Self-Check)
在生成或审查架构文档时，Agent 必须自问：
1.  **符合惯例吗？** 是否错误推荐了不兼容的库？
2.  **分层清晰吗？** 是否混杂了业务逻辑与数据访问？
3.  **数据规范吗？** 是否遗漏了外键和索引？
4.  **安全吗？** 敏感接口是否有 Auth 校验？
5.  **像真的吗？** 能否支撑 10 万用户？

## 📂 关联资产 (Related Assets)
- `02-architecture.md` (Target)
- `01-requirements.md` (Source)
