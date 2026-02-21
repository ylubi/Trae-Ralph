---
name: ralph-web-requirement
description: Ralph 流程专用：在 Web 项目规划阶段，强制生成包含管理后台、用户中心及深度字段定义的生产级 PRD。仅当处理 01-requirements.md 或 01-prd.md 时触发。
---

# Ralph Web Requirement Expert

此 Skill 专用于解决“需求文档过于简陋”的问题，确保生成的 PRD 具备生产级深度。

## 🎯 触发条件 (Trigger)
-   **环境**: Ralph Flow
-   **项目类型**: Web 项目
-   **阶段**: 规划阶段 (Planning Mode) - 支持 Round 1-5 (Step 2/4)

## 🔄 螺旋迭代指令 (Spiral Instructions)

### Step 2: 深度自查 (Critique)
在 **任意 Round 的 Step 2**，执行：
1.  **Full Scan**: 扫描所有页面。
2.  **Strict Mode**: Round 越靠后，检查标准越严。R1 检查是否有页面，R5 检查是否有点按态。

### Step 4: 运营推演 (Simulation)
在 **任意 Round 的 Step 4**，执行：
1.  **Role Play**: 扮演客服/运维/审计。
2.  **Scenario Injection**: R1 注入基础异常，R5 注入高并发/黑客攻击场景。

## 🛠️ 生产级需求标准 (Production-Ready Standards)

### 1. 页面穷举原则 (Page Exhaustion)
严禁只设计“核心流程”或“列表页”。必须包含完整的生命周期管理：

-   **管理后台 (Admin Panel)**:
    -   **必须包含**: 管理员登录/鉴权 (RBAC)。
    -   **必须包含**: 核心业务资源的全生命周期管理 (CRUD + Review + History)。
        -   **列表页**: 必须包含高级筛选、搜索、分页、批量操作。
        -   **新建/编辑页**: 必须包含复杂表单设计（分步表单、动态字段、文件上传）。
        -   **详情页**: 必须包含元数据、关联数据、操作日志。
    -   **必须包含**: 审计日志 (Audit Logs) 或操作记录。
    -   **必须包含**: 仪表盘 (Dashboard) - 关键指标统计（日活、新增、转化率）。
-   **用户中心 (User Center)**:
    -   **必须包含**: 个人资料 (Profile)、安全设置 (修改密码/绑定邮箱/MFA)。
    -   **必须包含**: 业务数据的“生产者视图” (My Created Projects) 与“消费者视图” (My Joined Tasks)。
    -   **必须包含**: 通知中心 (Notifications) - 消息列表、标记已读。
-   **公共页面**: 404 Not Found, 403 Forbidden, 500 Server Error 页面设计。

### 2. 字段深度原则 (Field Depth)
严禁使用“简单的字符串描述”。每个字段必须定义：
-   **类型**: String, Int, Enum, Boolean, Timestamp, JSON, Array, File (Size/Type).
-   **验证**: Required, MaxLength, Regex (Email/Phone), Custom Logic (Async/Cross-field).
-   **交互**: Placeholder, Error Message, Loading State, Debounce, Tooltip.
-   **权限**: 谁可读？谁可写？(Read/Write/Admin Only/Owner Only).

### 3. 业务逻辑闭环 (Logic Completeness)
-   **异常流程**: 网络失败、权限不足、数据冲突、并发锁、表单脏检查。
-   **数据关联**: 删除主数据时，关联数据如何处理？(Cascade/Restrict/Set Null).
-   **状态流转**: 明确定义状态机 (State Machine) 及其触发动作（如：Pending -> Approved -> Published）。

## 🤖 质量自检清单 (Quality Self-Check)
在生成或审查需求文档时，Agent 必须自问：
1.  **能落地吗？** 这个表单如果交给前端开发，他知道每个字段的最大长度和校验规则吗？
2.  **流程通吗？** 数据创建后谁来审核？审核不通过怎么办？谁能修改？
3.  **视图全吗？** 我发布的内容和我参与的内容，是否在用户中心有区分？
4.  **后台强吗？** 管理员能否在后台处理所有可能的业务异常（如人工退款、强制下架、封号）？
5.  **像真的吗？** 这看起来像是一个 Demo 还是一个可以上线运营的商业产品？
