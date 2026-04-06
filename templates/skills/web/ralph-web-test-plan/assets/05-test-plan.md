# 测试计划 (Test Plan)

> **生成时间**: {{DATE}}
> **基于文档**: 01-requirements.md, 02-architecture.md
> **测试框架**: Playwright (E2E) + Vitest (Unit) + React Testing Library (Component)

> **⚠️ 执行铁律**: 必须严格按照列表顺序（从上到下）执行测试用例。严禁跳跃或乱序执行。

---

## 1. 页面测试详情 (Test Cases)

> **Test Case ID Format**: `[TC-<MODULE>-<TYPE>-<NUMBER>]`
> - Modules: `AUTH`, `USER`, `ART`, `ADMIN`, `COMM`
> - Types: `HP` (Happy Path), `SP` (Sad Path), `EC` (Edge Case), `UI` (UI/UX)

### 1.1 登录页面 (`/login`) - Module: AUTH

#### 3.1.1 功能交互穷举

**Happy Path (HP):**
- [ ] `[TC-AUTH-HP-001]` 输入有效邮箱和密码，点击登录，跳转首页 (P0)
- [ ] `[TC-AUTH-HP-002]` 点击"忘记密码"链接，跳转重置页面 (P1)
- [ ] `[TC-AUTH-HP-003]` 点击"注册"链接，跳转注册页面 (P1)
- [ ] `[TC-AUTH-HP-004]` 点击第三方登录按钮，触发 OAuth 流程 (P0)

**Sad Path (SP):**
- [ ] `[TC-AUTH-SP-001]` 邮箱格式无效，显示错误提示 (P1)
- [ ] `[TC-AUTH-SP-002]` 密码为空，显示"密码不能为空" (P1)
- [ ] `[TC-AUTH-SP-003]` 邮箱未注册，显示"用户不存在" (P1)
- [ ] `[TC-AUTH-SP-004]` 密码错误，显示"密码错误" (P0)
- [ ] `[TC-AUTH-SP-005]` 连续失败 5 次，显示"请稍后再试" (P2)
- [ ] `[TC-AUTH-SP-006]` 网络断开，显示网络错误提示 (P2)

**Edge Cases (EC):**
- [ ] `[TC-AUTH-EC-001]` 输入框前后空格自动去除 (P2)
- [ ] `[TC-AUTH-EC-002]` 回车键提交表单 (P2)
- [ ] `[TC-AUTH-EC-003]` 密码显示/隐藏切换 (P2)

#### 3.1.2 Chrome DevTools 深度验证 (UI)

| 检查面板 | ID | 检查项 | 验证标准 | 状态 |
| :--- | :--- | :--- | :--- | :--- |
| Console | `[TC-AUTH-UI-001]` | Runtime Errors | 0 Errors | [ ] |
| Network | `[TC-AUTH-UI-002]` | API Response Time | < 500ms | [ ] |
| Lighthouse | `[TC-AUTH-UI-003]` | Performance | > 90 | [ ] |
| Device Mode | `[TC-AUTH-UI-004]` | Mobile (375px) | 布局正常 | [ ] |

---

### 3.2 注册页面 (`/register`) - Module: AUTH

#### 3.2.1 功能交互穷举

**Happy Path (HP):**
- [ ] `[TC-AUTH-HP-010]` 输入有效用户名、邮箱、密码，注册成功 (P0)
- [ ] `[TC-AUTH-HP-011]` 显示密码强度指示器 (P2)

**Sad Path (SP):**
- [ ] `[TC-AUTH-SP-010]` 用户名已存在，显示"用户名已被使用" (P1)
- [ ] `[TC-AUTH-SP-011]` 邮箱已注册，显示"邮箱已被注册" (P1)

**Async Validation (EC):**
- [ ] `[TC-AUTH-EC-010]` 用户名输入后 500ms 触发唯一性校验 (P2)
- [ ] `[TC-AUTH-EC-011]` 校验中显示 Loading 状态 (P2)

---

### 3.3 首页 (`/`) - Module: HOME

#### 3.3.1 功能交互穷举

**Happy Path (HP):**
- [ ] `[TC-HOME-HP-001]` 默认显示"推荐"动态流 (P0)
- [ ] `[TC-HOME-HP-002]` 滚动到底部，自动加载更多 (P0)

**Sad Path (SP):**
- [ ] `[TC-HOME-SP-001]` 网络错误，显示错误提示 (P1)
- [ ] `[TC-HOME-SP-002]` 无更多内容，显示"没有更多了" (P2)

#### 3.3.2 Chrome DevTools 深度验证 (UI)

| 检查面板 | ID | 检查项 | 验证标准 | 状态 |
| :--- | :--- | :--- | :--- | :--- |
| Console | `[TC-HOME-UI-001]` | Runtime Errors | 0 Errors | [ ] |
| Network | `[TC-HOME-UI-002]` | Infinite Scroll | 无重复请求 | [ ] |
| Lighthouse | `[TC-HOME-UI-003]` | LCP | < 2.5s | [ ] |

---

### 3.4 文章详情页 (`/article/:slug`) - Module: ART

#### 3.4.1 功能交互穷举

**Happy Path (HP):**
- [ ] `[TC-ART-HP-001]` 文章内容正确渲染 (P0)
- [ ] `[TC-ART-HP-002]` 目录导航跳转正确 (P1)
- [ ] `[TC-ART-HP-003]` 点击点赞按钮，数字 +1 (P1)

**Sad Path (SP):**
- [ ] `[TC-ART-SP-001]` 文章不存在，显示 404 页面 (P1)

#### 3.4.2 Chrome DevTools 深度验证 (UI)

| 检查面板 | ID | 检查项 | 验证标准 | 状态 |
| :--- | :--- | :--- | :--- | :--- |
| Console | `[TC-ART-UI-001]` | Runtime Errors | 0 Errors | [ ] |
| Network | `[TC-ART-UI-002]` | Image Lazy Load | 图片懒加载生效 | [ ] |
