# 页面测试矩阵模板 (Page Test Matrix)

此模板用于指导 `05-test-plan.md` 中每个页面的详细测试设计。

## 页面: [Page Name] (e.g. /login)
> Source: `01-requirements.md` & `03-tech-design.md`

### 1. 设计分析 (Design Analysis)
- **核心功能**: [从需求文档提取，如：用户登录]
- **预期交互**: [从验收标准提取，如：输入密码后回车提交]
- **关键数据**: [从架构文档提取，如：User Object]
- **UI 状态**: `loading`, `error`, `empty` (Standard Web States)

### 2. Chrome DevTools 深度验证 (Deep Verification)
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

### 3. 功能交互穷举 (Functional Exhaustion)
> **禁止笼统 (No Vague Terms)**: 严禁使用 "测试功能X" 这种模糊描述。必须拆解为具体的“动作 -> 反馈”。
> **Design Source**: 参考 `01-requirements.md` 中的 Acceptance Criteria。

#### 3.1 核心交互 (Core Interactions)
- [ ] **Feature A (Happy Path)**: [具体操作，如：点击提交] -> [预期结果，如：跳转至首页]
- [ ] **Feature B (Happy Path)**: [具体操作，如：下拉选择日期] -> [预期结果，如：列表按日期刷新]
- [ ] **Validation (Sad Path)**: [无效输入，如：密码少于6位] -> [校验提示，如：Input变红并提示错误]

#### 3.2 状态覆盖 (State Coverage)
- [ ] **Loading**: 数据请求中显示加载状态
- [ ] **Error**: API 失败显示友好提示
- [ ] **Empty**: 无数据时的展示

### 4. 视觉检查 (Visual Check)
- [ ] **Responsive**: 手机尺寸 (375px) 下布局正常
- [ ] **Theme**: 暗色模式下文字可见度正常
