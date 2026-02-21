---
name: ralph-web-test-plan
description: Ralph 流程专用：仅当在 Web 项目开发且处于规划阶段时触发。强制制定包含 Chrome DevTools MCP 的全面测试计划。
---

# Skill: ralph-web-test-plan

## 技能描述
这是 Ralph **Web 自动化开发流程** 的专用测试计划生成器。
本 Skill 的核心职责是确保生成的测试计划 (`05-test-plan.md`) 具备 **全覆盖 (Full Coverage)** 特性，杜绝漏测。

## 触发条件 (Trigger)
-   **环境**: Ralph Flow
-   **项目类型**: Web 项目
-   **阶段**: 规划阶段 (Planning Mode) - Round 1-5

## 核心目标 (Core Objectives)
1.  **全页面覆盖 (All Pages)**: 必须枚举项目路由中的每一个页面。
2.  **全功能覆盖 (All Features)**: 针对每个页面，必须枚举所有交互功能（点击、输入、提交、跳转、状态变更）。
3.  **MCP 深度验证 (Deep Verification)**: 必须强制使用 **Chrome DevTools MCP** 对每个页面进行“视觉与控制台”的双重检查。

## 执行策略：设计驱动穷举 (Design-Driven Exhaustion)
由于规划阶段可能尚未编写代码，测试计划必须基于 **设计文档** 进行穷举：

1.  **路由穷举 (Route Audit)**:
    *   读取 `02-architecture.md` 中的【前端路由设计】章节。
    *   如果架构文档未定义路由，则必须根据 `01-requirements.md` 中的页面需求反推所有页面 URL。
    *   **列出** 所有规划中的页面清单。

2.  **交互穷举 (Interaction Audit)**:
    *   分析 `01-requirements.md` 中的【用户故事】和【验收标准】。
    *   针对每个页面，提取所有用户可操作的动词 (点击、提交、筛选、排序)。
    *   **强制补充** 标准 Web 交互状态：
        *   **Happy Path**: 正常操作流程。
        *   **Sad Path**: 网络错误、校验失败、权限不足。
        *   **Loading State**: 数据加载中的骨架屏/Spinner。
        *   **Empty State**: 无数据时的展示。

3.  **视觉标准 (Visual Standards)**:
    *   基于 `02-architecture.md` 中的 UI/UX 规范（如有）。
    *   若无明确设计稿，则强制采用通用响应式标准 (Mobile/Desktop 适配)。

## 内容填充规则 (Content Population Rules)
由于 `05-test-plan.md` 的核心是 **第3章：交互式验收 (Interactive Verification)**，你必须遵循以下 **强制格式**：

### 3. 交互式验收 (Interactive Verification)
**必须** 对项目中的 **每一个页面** (Page/Route) 重复生成以下标准矩阵结构：

#### 3.x [页面名称] (e.g., /login)
> Source: `01-requirements.md` & `02-architecture.md`

**3.x.1 设计分析 (Design Analysis)**
- **核心功能**: [从需求文档提取]
- **预期交互**: [从验收标准提取]
- **UI 状态**: `loading`, `error`, `empty`

**3.x.2 静态检查 (Static Checks)**
| 检查项 | 预期结果 | MCP 验证方法 | 状态 |
| :--- | :--- | :--- | :--- |
| **Console Errors** | 无红色报错 | `console.logs` | [ ] |
| **Network Status** | 关键请求 200 | `network.requests` | [ ] |
| **Layout Shift** | 无布局抖动 | Visual Check | [ ] |

**3.x.3 功能交互穷举 (Functional Exhaustion)**
- [ ] **Happy Path**: [具体操作] -> [预期结果]
- [ ] **Sad Path**: [异常操作] -> [错误提示]
- [ ] **Validation**: [无效输入] -> [校验提示]

**3.x.4 视觉检查 (Visual Check)**
- [ ] **Responsive**: 移动端适配 (375px)
- [ ] **Theme**: 暗色模式适配 (如有)

---
(对下一个页面重复上述结构...)

## 螺旋迭代指令 (Spiral Instructions)
在 **任意 Round 的 Step 5** (Lock 阶段)，执行：
1.  **Sync**: 检查 `01` 新增的页面是否已同步到测试矩阵。
2.  **Next Round Trigger**:
    *   **Round 1-4**: 输出 "🔒 Tests Locked. Starting Next Round..."
    *   **Round 5**: 输出 "✅ Final Test Plan Locked."
-   **API 穷举**: 根据 `03-tech-design.md` 的 API 设计，列出所有关键 Endpoint。
-   **状态码检查**: 必须明确预期状态码（200, 201, 400, 401, 403）。
-   **安全测试**: 必须包含至少一个“越权访问 (403)”的测试用例。

---

## 🤖 质量自检清单 (Quality Self-Check)

在生成最终文件前，Agent 必须自问：
1.  **填满了吗？** 我是否将模板中的“示例页面”替换为了项目的所有实际页面？
2.  **具体吗？** 我是否将抽象的 `[具体动作]` 替换为了真实的业务操作描述？
3.  **MCP保留了吗？** 我是否保留了第 4/5 章中关于 Chrome DevTools MCP 的技术指令？
4.  **API全了吗？** 我是否列出了核心业务 API 并包含状态码预期？

如果任一答案为“否”，请重新生成。
