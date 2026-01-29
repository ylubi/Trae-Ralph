#!/usr/bin/env node

/**
 * Trae Ralph Loop CDP - CLI 入口
 * 
 * 命令行工具入口文件
 * 
 * 功能：
 * - 启动 Trae Ralph Loop
 * - 配置 Trae 路径
 * - 管理场景
 * - 注入模式
 * 
 * 使用方法：
 *   trae-ralph [command] [options]
 * 
 * 可用命令：
 *   config      配置 Trae 路径
 *   scenarios   管理场景
 *   start       启动 Trae Ralph Loop（默认）
 *   inject      注入模式（向已运行的 Trae 注入）
 * 
 * 选项：
 *   --version   显示版本号
 *   --help      显示帮助信息
 *   --cn        使用国内版 Trae
 * 
 * @author Trae Ralph Loop Team
 * @license MIT
 * @see https://github.com/your-username/trae-ralph
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// 获取命令行参数
const args = process.argv.slice(2);
const command = args[0];

// 显示版本信息
if (args.includes('--version') || args.includes('-v')) {
  const packageJson = require('../package.json');
  console.log(`v${packageJson.version}`);
  process.exit(0);
}

// 显示帮助信息
if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

// 根据命令执行相应操作
switch (command) {
  case 'config':
    runScript('config.js', args.slice(1));
    break;
  
  case 'scenarios':
    runScript('scenario-manager.js', args.slice(1));
    break;
  
  case 'inject':
    runScript('injector.js', args.slice(1));
    break;
  
  case 'setup-trae':
    runScript('setup-trae.js', args.slice(1));
    break;
  
  case 'start':
  case undefined:
    // 默认命令：启动
    runScript('launcher.js', args.slice(1));
    break;
  
  default:
    console.error(`\x1b[31m错误：未知命令 "${command}"\x1b[0m`);
    console.log('使用 --help 查看可用命令');
    process.exit(1);
}

/**
 * 运行指定的脚本
 */
function runScript(scriptName, scriptArgs) {
  const scriptPath = path.join(__dirname, '..', 'src', scriptName);
  
  // 检查脚本是否存在
  if (!fs.existsSync(scriptPath)) {
    console.error(`\x1b[31m错误：脚本文件不存在 ${scriptPath}\x1b[0m`);
    process.exit(1);
  }
  
  // 使用 spawn 运行脚本，继承父进程的 stdio
  const child = spawn('node', [scriptPath, ...scriptArgs], {
    stdio: 'inherit',
    shell: true
  });
  
  // 处理子进程退出
  child.on('exit', (code) => {
    process.exit(code || 0);
  });
  
  // 处理错误
  child.on('error', (err) => {
    console.error(`\x1b[31m错误：无法启动脚本\x1b[0m`, err);
    process.exit(1);
  });
}

/**
 * 显示帮助信息
 */
function showHelp() {
  const packageJson = require('../package.json');
  
  console.log(`
\x1b[36m${packageJson.name}\x1b[0m v${packageJson.version}
${packageJson.description}

\x1b[33m使用方法：\x1b[0m
  trae-ralph [command] [options]

\x1b[33m可用命令：\x1b[0m
  config              配置 Trae 路径
  scenarios           管理场景（查看、创建、编辑、删除、测试）
  start               启动 Trae Ralph Loop（默认命令）
  inject              注入模式（向已运行的 Trae 注入脚本）
  setup-trae          设置 Trae Rules 和 Skills 到项目

\x1b[33m选项：\x1b[0m
  --version, -v       显示版本号
  --help, -h          显示帮助信息
  --cn                使用国内版 Trae CN

\x1b[33m示例：\x1b[0m
  trae-ralph config              # 配置 Trae 路径
  trae-ralph config --cn         # 配置国内版 Trae CN
  trae-ralph scenarios           # 管理场景
  trae-ralph start               # 启动国际版
  trae-ralph start --cn          # 启动国内版
  trae-ralph inject              # 注入模式
  trae-ralph setup-trae          # 设置 Trae 配置到当前目录
  trae-ralph setup-trae --path /path/to/project  # 设置到指定目录

\x1b[33m首次使用：\x1b[0m
  1. 运行 \x1b[32mtrae-ralph config\x1b[0m 配置 Trae 路径
  2. 运行 \x1b[32mtrae-ralph start\x1b[0m 启动 Ralph Loop

\x1b[33m更多信息：\x1b[0m
  ${packageJson.homepage}
  `);
}
