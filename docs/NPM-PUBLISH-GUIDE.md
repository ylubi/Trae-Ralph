# NPM 发布指南

## 发布前准备

### 1. 更新项目信息

在 `package.json` 中更新以下信息：

```json
{
  "author": "Your Name <your.email@example.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/trae-ralph.git"
  },
  "bugs": {
    "url": "https://github.com/your-username/trae-ralph/issues"
  },
  "homepage": "https://github.com/your-username/trae-ralph#readme"
}
```

### 2. 检查文件

确保以下文件完整且正确：
- ✅ `README.md` - 项目说明文档
- ✅ `LICENSE` - MIT 许可证
- ✅ `CHANGELOG.md` - 版本更新日志
- ✅ `.npmignore` - npm 忽略文件配置

### 3. 测试本地安装

在发布前，先在本地测试全局安装：

```bash
# 在项目根目录执行
npm link

# 测试命令是否可用
trae-ralph --help

# 测试配置命令
trae-ralph config

# 测试场景管理
trae-ralph scenarios

# 测试启动
trae-ralph start

# 取消链接
npm unlink -g trae-ralph
```

### 4. 版本管理

使用语义化版本号（Semantic Versioning）：

```bash
# 补丁版本（bug 修复）
npm version patch  # 1.0.0 -> 1.0.1

# 次版本（新功能）
npm version minor  # 1.0.0 -> 1.1.0

# 主版本（破坏性更新）
npm version major  # 1.0.0 -> 2.0.0
```

## 发布步骤

### 1. 登录 npm

```bash
npm login
```

输入你的 npm 账号信息：
- Username
- Password
- Email
- 2FA Code（如果启用了双因素认证）

### 2. 检查发布内容

查看将要发布的文件列表：

```bash
npm pack --dry-run
```

### 3. 发布到 npm

```bash
# 发布到 npm
npm publish

# 如果包名已被占用，可以使用 scoped package
npm publish --access public
```

### 4. 验证发布

```bash
# 查看包信息
npm info trae-ralph

# 全局安装测试
npm install -g trae-ralph

# 测试命令
trae-ralph --version
trae-ralph config
```

## 用户安装和使用

发布成功后，用户可以通过以下方式使用：

### 全局安装

```bash
npm install -g trae-ralph
```

### 可用命令

```bash
trae-ralph config      # 配置 Trae 路径
trae-ralph scenarios   # 管理场景
trae-ralph start       # 启动国际版
trae-ralph start --cn  # 启动国内版
trae-ralph inject      # 注入模式
```

### 查看帮助

```bash
trae-ralph --help
```

## 更新发布

当需要发布新版本时：

```bash
# 1. 更新代码
git add .
git commit -m "feat: 添加新功能"

# 2. 更新版本号
npm version patch  # 或 minor/major

# 3. 推送到 Git
git push origin main
git push origin --tags

# 4. 发布到 npm
npm publish
```

## 撤销发布

如果发布后发现问题，可以在 24 小时内撤销：

```bash
# 撤销特定版本
npm unpublish trae-ralph@1.0.0

# 撤销整个包（慎用！）
npm unpublish trae-ralph --force
```

**注意**：撤销发布后，相同版本号不能再次使用。

## 常见问题

### 1. 包名已被占用

如果 `trae-ralph` 已被占用，可以：
- 使用 scoped package：`@your-username/trae-ralph`
- 选择其他包名：`trae-ralph-cdp`、`ralph-loop` 等

### 2. 发布权限问题

确保：
- 已登录 npm 账号
- 账号邮箱已验证
- 有发布权限（对于 scoped package）

### 3. 版本号冲突

如果版本号已存在：
```bash
npm version patch  # 自动递增版本号
```

## 最佳实践

1. **发布前测试**：使用 `npm link` 本地测试
2. **语义化版本**：遵循 SemVer 规范
3. **更新日志**：在 `CHANGELOG.md` 记录每次更新
4. **标签管理**：为每个版本创建 Git 标签
5. **文档完善**：保持 README 和文档更新

## 参考资源

- [npm 官方文档](https://docs.npmjs.com/)
- [语义化版本规范](https://semver.org/lang/zh-CN/)
- [npm 包发布指南](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
