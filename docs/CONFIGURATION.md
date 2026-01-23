# 配置指南

## 快速开始

### 方法 1：快速配置（推荐）

一条命令完成配置，适合熟练用户：

```bash
# 配置国际版
npm run config -- --trae-path "D:\Program Files\Trae\Trae.exe"

# 配置国内版
npm run config -- --cn --trae-path "D:\Program Files\Trae CN\Trae CN.exe"
```

### 方法 2：交互式配置

有向导引导，适合新手：

```bash
npm run config
```

## 配置文件

### 位置

配置文件位于用户主目录：

```
~/.trae-ralph/config.json
```

**路径说明：**
- Windows: `C:\Users\<用户名>\.trae-ralph\config.json`
- Mac: `/Users/<用户名>/.trae-ralph/config.json`
- Linux: `/home/<用户名>/.trae-ralph/config.json`

### 格式

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

### 配置项说明

| 字段 | 说明 | 默认值 |
|------|------|--------|
| `trae.international` | 国际版配置 | - |
| `trae.china` | 国内版配置 | - |
| `path` | Trae 可执行文件路径 | - |
| `port` | CDP 调试端口 | 国际版 9222，国内版 9223 |
| `checkInterval` | 检查间隔（毫秒） | 5000 |
| `stableCount` | 稳定计数 | 3 |
| `startupDelay` | 启动延迟（毫秒） | 5000 |
| `defaultVersion` | 默认启动版本 | international |

**重要：** 
- 至少需要配置一个版本
- 两个版本使用不同端口，可以同时运行

## 快速配置详解

### 基本用法

```bash
# 配置国际版
npm run config -- --trae-path "路径"

# 配置国内版
npm run config -- --cn --trae-path "路径"

# 或使用简写
npm run config:cn
```

### 平台示例

**Windows:**
```bash
npm run config -- --trae-path "C:\Program Files\Trae\Trae.exe"
npm run config -- --cn --trae-path "C:\Program Files\Trae CN\Trae CN.exe"
```

**macOS:**
```bash
npm run config -- --trae-path "/Applications/Trae.app/Contents/MacOS/Trae"
npm run config -- --cn --trae-path "/Applications/Trae CN.app/Contents/MacOS/Trae CN"
```

**Linux:**
```bash
npm run config -- --trae-path "/usr/bin/trae"
npm run config -- --cn --trae-path "/usr/bin/trae-cn"
```

### 优点

✅ 一条命令完成配置  
✅ 保留现有配置，只更新指定版本  
✅ 自动验证路径是否存在  
✅ 适合脚本自动化  

## 常见安装路径

### Windows

**国际版：**
- `C:\Program Files\Trae\Trae.exe`
- `C:\Program Files (x86)\Trae\Trae.exe`
- `%LOCALAPPDATA%\Programs\Trae\Trae.exe`

**国内版：**
- `C:\Program Files\Trae CN\Trae CN.exe`
- `C:\Program Files (x86)\Trae CN\Trae CN.exe`
- `D:\Program Files\Trae CN\Trae CN.exe`

### macOS

**国际版：**
- `/Applications/Trae.app/Contents/MacOS/Trae`

**国内版：**
- `/Applications/Trae CN.app/Contents/MacOS/Trae CN`

### Linux

**国际版：**
- `/usr/bin/trae`
- `/usr/local/bin/trae`
- `/opt/trae/trae`

**国内版：**
- `/usr/bin/trae-cn`
- `/usr/local/bin/trae-cn`
- `/opt/trae-cn/trae-cn`

## 配置管理

### 查看配置

```bash
# Windows
type %USERPROFILE%\.trae-ralph\config.json

# Mac/Linux
cat ~/.trae-ralph/config.json
```

### 编辑配置

```bash
# Windows
notepad %USERPROFILE%\.trae-ralph\config.json

# Mac
open -e ~/.trae-ralph/config.json

# Linux
nano ~/.trae-ralph/config.json
```

### 重置配置

```bash
# Windows
del %USERPROFILE%\.trae-ralph\config.json

# Mac/Linux
rm ~/.trae-ralph/config.json

# 重新配置
npm run config
```

## 版本切换

### 临时切换

```bash
# 启动国际版
npm start

# 启动国内版
npm run start:cn
```

### 永久切换

修改配置文件中的 `defaultVersion`：

```json
{
  "defaultVersion": "china"  // 或 "international"
}
```

## 配置迁移

### 从旧格式迁移

如果你的配置文件是旧格式（字符串路径），建议更新为新格式：

**旧格式：**
```json
{
  "trae": {
    "international": "D:\\Program Files\\Trae\\Trae.exe"
  },
  "port": 9222
}
```

**新格式：**
```json
{
  "trae": {
    "international": {
      "path": "D:\\Program Files\\Trae\\Trae.exe",
      "port": 9222
    }
  }
}
```

**迁移方法：**

```bash
# 方法 1：重新运行配置向导
npm run config

# 方法 2：使用快速配置
npm run config -- --trae-path "你的路径"
```

## 故障排除

### 未找到配置文件

```bash
npm run config
```

### 路径不存在

```bash
# 重新配置
npm run config -- --trae-path "正确的路径"
```

### 端口冲突

确保国际版和国内版使用不同端口：
- 国际版：9222
- 国内版：9223

### 配置文件损坏

```bash
# 删除配置文件
rm ~/.trae-ralph/config.json  # Mac/Linux
del %USERPROFILE%\.trae-ralph\config.json  # Windows

# 重新配置
npm run config
```

## 使用示例

### 场景 1：首次配置

```bash
npm run config -- --trae-path "C:\Program Files\Trae\Trae.exe"
npm run config -- --cn --trae-path "C:\Program Files\Trae CN\Trae CN.exe"
```

### 场景 2：更新路径

```bash
npm run config -- --trae-path "D:\新位置\Trae\Trae.exe"
```

### 场景 3：添加第二个版本

```bash
# 已有国际版，添加国内版
npm run config -- --cn --trae-path "C:\Program Files\Trae CN\Trae CN.exe"
```

### 场景 4：自动化脚本

```bash
#!/bin/bash
npm install
npm run config -- --trae-path "/usr/bin/trae"
npm start
```

## 下一步

配置完成后：

```bash
# 启动
npm start        # 国际版
npm run start:cn # 国内版

# 管理场景
npm run scenarios
```

---

**需要帮助？** 查看 [COMMANDS.md](../COMMANDS.md) 了解所有可用命令。
