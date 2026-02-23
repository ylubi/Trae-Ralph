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
3.  **Chrome DevTools 深度验证 (Deep Verification)**: 必须强制使用 Chrome DevTools 对每个页面进行“视觉、网络、性能”的多维检查。

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
        *   **Loading State (Slow 3G)**: 弱网环境下的骨架屏/Spinner 展示。
        *   **Offline State**: 断网时的提示或缓存展示。
        *   **Empty State**: 无数据时的展示。

3.  **DevTools 验证标准 (DevTools Standards)**:
    *   **Console**: 零红色报错 (Zero Red Errors)。
    *   **Network**: 模拟 Slow 3G 验证加载体验；模拟 Offline 验证容错。
    *   **Application**: 验证 Token/Cookies 存储逻辑。
    *   **Lighthouse**: 确保核心页面 Performance > 80, Accessibility > 90。
    *   **Device Mode**: 验证 375px (Mobile) 及 IPad (Tablet) 适配。

## 内容填充规则 (Content Population Rules)
由于 `05-test-plan.md` 的核心是 **第3章：交互式验收 (Interactive Verification)**，你必须遵循以下 **强制格式**：

### 1. 测试范围概览 (Test Scope Inventory)
**必须**在文档开头创建一个表格，列出所有待测试的页面和关键功能，作为测试总览。
| 页面 (Route) | 关键功能 (Key Features) | 优先级 |
| :--- | :--- | :--- |
| `/login` | 登录表单, 忘记密码, 社交登录 | P0 |
| `/dashboard` | 数据概览, 图表渲染, 快捷入口 | P0 |
| ... | ... | ... |

### 3. 交互式验收 (Interactive Verification)
**必须** 对项目中的 **每一个页面** (Page/Route) 重复生成以下标准矩阵结构：

#### 3.x [页面名称] (e.g., /login)
> Source: `01-requirements.md` & `02-architecture.md`

**3.x.1 设计分析 (Design Analysis)**
- **核心功能**: [从需求文档提取]
- **预期交互**: [从验收标准提取]
- **UI 状态**: `loading`, `error`, `empty`

**3.x.2 Chrome DevTools 深度验证 (Deep Verification)**
> **强制工具**: Chrome DevTools (F12)

| 检查面板 (Panel) | 检查项 (Check Item) | 验证标准 (Criteria) | 模拟/操作 (Action) | 状态 |
| :--- | :--- | :--- | :--- | :--- |
| **Console** | **Runtime Errors** | 无红色报错 (0 Errors) | 全流程操作监控 | [ ] |
| **Network** | **API Status** | 核心请求 200/201 | 检查 XHR/Fetch | [ ] |
| **Network** | **Slow 3G** | Loading 骨架屏/Spinner 正常显示 | Preset: Slow 3G | [ ] |
| **Network** | **Offline** | 断网提示/优雅降级 | Preset: Offline | [ ] |
| **Application**| **Storage/Cookies**| Token/Session 存储正确 | 检查 LocalStorage/Cookies | [ ] |
| **Lighthouse** | **Core Vitals** | Performance > 80, Accessibility > 90 | Run Navigation Audit | [ ] |
| **Elements** | **Layout Shift** | 无明显 CLS (布局偏移) | 视觉检查 / Perf Monitor | [ ] |
| **Device Mode**| **Responsive** | 375px/IPad 布局无错乱 | Toggle Device Toolbar | [ ] |

**3.x.3 功能交互穷举 (Functional Exhaustion)**
> **禁止笼统**: 严禁写 "测试所有功能"。必须拆解为具体的“动作 -> 反馈”。
- [ ] **Happy Path**: [具体操作，如：点击提交] -> [预期结果，如：跳转至首页]
- [ ] **Sad Path**: [异常操作，如：断网提交] -> [错误提示，如：Toast显示重试]
- [ ] **Validation**: [无效输入，如：密码少于6位] -> [校验提示，如：Input变红]

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
1.  **有概览吗？** 我是否在文档开头创建了包含所有页面的“测试范围概览”表格？
2.  **填满了吗？** 我是否将模板中的“示例页面”替换为了项目的所有实际页面？
3.  **具体吗？** 我是否将抽象的 `[具体动作]` 替换为了真实的业务操作描述？
4.  **DevTools覆盖了吗？** 我是否包含了 Network (Slow 3G/Offline), Lighthouse, Application 等深度验证项？
5.  **API全了吗？** 我是否列出了核心业务 API 并包含状态码预期？

如果任一答案为“否”，请重新生成。
