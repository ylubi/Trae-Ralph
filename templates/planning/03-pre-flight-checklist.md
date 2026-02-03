# 项目前期准备清单 (Pre-flight Checklist)

在 Ralph 开始全自动开发之前，请务必完成以下准备工作，以确保流程顺畅。

## 1. 环境准备 (Environment)
- [ ] **操作系统**: Windows / macOS / Linux
- [ ] **Node.js**: v18+ 已安装 (`node -v`)
- [ ] **Git**: 已安装并配置好 user.name/email (`git --version`)
- [ ] **IDE**: Trae 已安装

## 2. 账号与密钥 (Secrets & Keys)
请准备以下密钥，并填入 `.env` 文件（参考 `.env.example`）：

| 服务 | 用途 | 环境变量名 | 状态 |
|---|---|---|---|
| OpenAI / Anthropic | AI 驱动能力 | `AI_API_KEY` | [ ] 待获取 |
| 数据库 (Supabase/Neon) | 数据存储 | `DATABASE_URL` | [ ] 待获取 |
| [其他服务] | [用途] | `[ENV_VAR_NAME]` | [ ] 待获取 |

## 3. 知识库准备 (Knowledge Base)
- [ ] 确认已阅读 `docs/planning/01-requirements.md`
- [ ] 确认已阅读 `docs/planning/02-architecture.md`

## 4. 启动确认
- [ ] 所有 Checkbox 已勾选
- [ ] `.env` 文件已创建并填值
- [ ] **我已准备好启动 Ralph**
