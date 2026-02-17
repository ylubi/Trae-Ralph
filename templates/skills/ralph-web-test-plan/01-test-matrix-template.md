# 页面测试矩阵模板 (Page Test Matrix)

此模板用于指导 `05-test-plan.md` 中每个页面的详细测试设计。

## 页面: [Page Name] (e.g. /login)
> Source: `01-requirements.md` & `03-tech-design.md`

### 1. 设计分析 (Design Analysis)
- **核心功能**: [从需求文档提取，如：用户登录]
- **预期交互**: [从验收标准提取，如：输入密码后回车提交]
- **关键数据**: [从架构文档提取，如：User Object]
- **UI 状态**: `loading`, `error`, `empty` (Standard Web States)

### 2. 静态检查 (Static Checks via Chrome DevTools)
| 检查项 (Check Item) | 预期结果 (Expected) | MCP 验证方法 (MCP Method) | 状态 |
| :--- | :--- | :--- | :--- |
| **Console Errors** | 无任何红色报错 (0 Errors) | `console.logs` (Filter: error) | [ ] |
| **Network Status** | 关键请求 (Fetch/XHR) 返回 200 | `network.requests` (Status < 400) | [ ] |
| **Layout Shift** | 无明显的布局抖动 (CLS) | 视觉检查 / Performance Monitor | [ ] |
| **Critical Elements** | 核心按钮/输入框可见 | `dom.querySelector` | [ ] |

### 3. 功能交互穷举 (Functional Exhaustion)
> 基于设计文档生成的用例

#### 3.1 核心交互 (Core Interactions)
- [ ] **Feature A**: 描述操作步骤 -> 预期结果 (Happy Path)
- [ ] **Feature B**: 描述操作步骤 -> 预期结果 (Happy Path)
- [ ] **Validation**: 输入无效数据 -> 显示错误提示 (Sad Path)

#### 3.2 状态覆盖 (State Coverage)
- [ ] **Loading**: 数据请求中显示加载状态
- [ ] **Error**: API 失败显示友好提示
- [ ] **Empty**: 无数据时的展示

### 4. 视觉检查 (Visual Check)
- [ ] **Responsive**: 手机尺寸 (375px) 下布局正常
- [ ] **Theme**: 暗色模式下文字可见度正常
