# 更新日志

## [1.1.1] - 2026-01-25

### 修复

- 修复模板引用校验误判与失效引用
- 增强自检中的跨平台兼容性检查
- 补充模板系统说明与命令示例

## [1.1.0] - 2026-01-25

### 新增功能

- 增加 `.trae-templates/` 模板体系（rules/skills/workflows/reference）
- 扩展 Agent Skills 示例（Python、Puppeteer、Playwright）
- 支持 setup-trae 的选择性部署（--rules/--skills/--exclude）
- 新增模板一致性验证（SKILL.md、标签与引用检查）

### 改进

- 补齐开发、测试、调试、部署工作流文档
- 增强状态管理、性能优化与 CDP 集成示例
- 新增参考实现文档与代码示例索引

## [1.0.0] - 2026-01-24

### 新增功能

#### 快速配置命令
- 添加命令行参数支持，实现一条命令完成配置
- 支持 `npm run config -- --trae-path "路径"` 快速配置国际版
- 支持 `npm run config -- --cn --trae-path "路径"` 快速配置国内版
- 添加 `npm run config:cn` 快捷命令用于交互式配置国内版

#### 多版本独立端口配置
- 国际版和国内版现在使用独立端口（9222 和 9223）
- 支持同时运行两个版本而不冲突
- 每个版本有独立的配置对象（path, port, checkInterval 等）

#### 配置文件增强
- 配置文件移至用户主目录 `~/.trae-ralph/config.json`
- 支持嵌套对象配置格式
- 向后兼容旧的字符串路径格式
- 自动清理旧格式的顶层配置字段

#### 注入器增强
- `injector.js` 现在支持版本参数
- 添加 `npm run inject:cn` 命令用于国内版注入
- 自动读取对应版本的端口配置

### 改进

#### 配置系统
- 快速配置保留现有配置，只更新指定版本
- 自动验证路径是否存在
- 更友好的错误提示和使用说明
- 支持脚本自动化配置

#### 文档
- 新增 `docs/QUICK-CONFIG-GUIDE.md` - 快速配置详细指南
- 新增 `docs/CONFIG-MIGRATION.md` - 配置迁移指南
- 更新 `COMMANDS.md` 添加快速配置示例
- 更新 `README.md` 添加新文档链接
- 更新 `docs/MULTI-VERSION.md` 反映新的配置格式

#### 命令
- `package.json` 添加 `config:cn` 脚本
- `package.json` 添加 `inject:cn` 脚本
- 所有命令现在支持版本参数

### 修复

- 修复配置文件格式不一致的问题
- 修复国际版和国内版端口冲突的问题
- 修复配置向导可能生成错误格式的问题

### 技术改进

- `src/config.js` 重构，支持命令行参数解析
- 添加 `parseArgs()` 函数处理命令行参数
- 添加 `quickConfig()` 函数实现快速配置
- 添加 `loadExistingConfig()` 函数加载现有配置
- `src/launcher.js` 和 `src/injector.js` 支持新配置格式

### 向后兼容

- 完全兼容旧的配置文件格式
- 自动检测并支持字符串路径格式
- 提供迁移指南帮助用户更新配置

## 使用示例

### 快速配置

```bash
# 配置国际版
npm run config -- --trae-path "D:\Program Files\Trae\Trae.exe"

# 配置国内版
npm run config -- --cn --trae-path "D:\Program Files\Trae CN\Trae CN.exe"
```

### 启动

```bash
# 启动国际版（端口 9222）
npm start

# 启动国内版（端口 9223）
npm run start:cn
```

### 注入

```bash
# 注入到国际版
npm run inject

# 注入到国内版
npm run inject:cn
```

## 配置文件格式

### 新格式（推荐）

```json
{
  "version": "1.0.0",
  "trae": {
    "international": {
      "path": "Trae 路径",
      "port": 9222,
      "checkInterval": 5000,
      "stableCount": 3,
      "startupDelay": 5000
    },
    "china": {
      "path": "Trae CN 路径",
      "port": 9223,
      "checkInterval": 5000,
      "stableCount": 3,
      "startupDelay": 5000
    }
  },
  "defaultVersion": "international"
}
```

### 旧格式（仍支持）

```json
{
  "version": "1.0.0",
  "trae": {
    "international": "Trae 路径"
  },
  "port": 9222,
  "checkInterval": 5000,
  "stableCount": 3,
  "startupDelay": 5000,
  "defaultVersion": "international"
}
```

## 迁移指南

如果你的配置文件是旧格式，建议更新为新格式：

```bash
# 方法 1：重新运行配置向导
npm run config

# 方法 2：使用快速配置更新
npm run config -- --trae-path "你的 Trae 路径"
npm run config -- --cn --trae-path "你的 Trae CN 路径"
```

详细说明请查看 [docs/CONFIG-MIGRATION.md](docs/CONFIG-MIGRATION.md)

## 贡献者

感谢所有为这个项目做出贡献的人！

---

**注意：** 此版本包含配置文件格式的重大改进，建议所有用户更新配置文件以获得最佳体验。
