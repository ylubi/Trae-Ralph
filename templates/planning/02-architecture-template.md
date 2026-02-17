# 系统架构设计 (System Architecture)

<!-- 
AI 指令: 
1. 若为 Web 项目，**必须**激活 `ralph-web-architecture` Skill。
2. **惯例优先**: 若需求文档明确了框架（如 Next.js/FastAPI），必须严格遵循该框架的官方最佳实践（目录结构、路由方式、数据获取）。
3. 必须定义前端组件策略 (Atomic/Smart-Dumb)、状态管理边界。
4. 必须提供数据库 ERD 描述和 API 详细规范。
-->

## 1. 技术栈 (Tech Stack)

### 1.1 前端
- **框架**: [如 React / Vue]
- **UI 库**: [如 Tailwind CSS / Ant Design]
- **状态管理**: [如 Zustand / Redux]

### 1.2 后端
- **Runtime**: [如 Node.js / Python]
- **框架**: [如 Express / FastAPI]
- **数据库**: [如 PostgreSQL / SQLite]

### 1.3 基础设施
- **部署**: [如 Vercel / Docker]
- **CI/CD**: [GitHub Actions]

### 1.4 质量保障 (QA Stack)
- **后端单元测试**: [如 Vitest / Jest]
- **前端组件测试**: [如 React Testing Library + Vitest]
    - 目标: 覆盖所有页面和交互组件
- **E2E 测试**: [Playwright (推荐) / Cypress]
- **MCP 工具**: [Chrome DevTools MCP / SQLite MCP]

## 2. 目录结构规范
```
/
├── src/
│   ├── components/  # UI 组件 (需包含 *.test.tsx)
│   ├── pages/       # 页面
│   ├── services/    # API 调用
│   └── utils/       # 工具函数
├── docs/            # 文档
└── tests/           # 测试用例
    ├── e2e/         # 端到端测试
    └── integration/ # 集成测试
```

## 3. 数据模型 (Data Model)

### 3.1 [实体 A] (示例: User)
| 字段名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| id | UUID | 是 | 主键 |
| email | String | 是 | 唯一索引 |
| password_hash | String | 是 | 加密存储 |
| role | Enum | 是 | USER, ADMIN |

### 3.2 [实体 B]
...

## 4. API 接口定义 (API Specification)

> **Ralph 规范**: 本章节必须详细到字段级别。每个接口都必须定义 Request 和 Response 结构。

### 4.1 模块: [模块名]

#### 4.1.1 接口: [接口名] (示例: 用户注册)
- **URL**: `POST /api/v1/auth/register`
- **Auth**: Public

**Request Body**:
```json
{
  "email": "user@example.com", // [必填] 邮箱
  "password": "..."            // [必填] 密码，长度 >= 8
}
```

**Response (201 Created)**:
```json
{
  "user_id": "uuid-...",
  "token": "jwt-token-..."
}
```

**Response (400 Bad Request)**:
```json
{
  "error": "EMAIL_EXISTS",
  "message": "该邮箱已被注册"
}
```

#### 4.1.2 接口: [接口名]
...

## 5. 关键流程设计
### 5.1 [核心流程名称]
1. 用户发起请求 -> ...
2. 系统验证 -> ...
3. 数据库操作 -> ...
4. 返回结果
