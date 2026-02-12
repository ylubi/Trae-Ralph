/**
 * @file index.js
 * @description 构建与注入入口模块
 * 
 * 这是 Trae Ralph Loop 的主入口文件。
 * 它的主要职责是：
 * 1. 导入所有依赖模块
 * 2. 初始化环境（停止旧实例）
 * 3. 暴露调试工具
 * 4. 注入 UI 控制按钮
 * 5. 打印启动日志
 * 
 * 此文件通常作为 Webpack/Rollup 的打包入口。
 */

// 这个文件作为 Webpack/Rollup 的入口，或者作为手动合并的参考
// 实际运行时，会将所有模块合并为一个文件注入到浏览器

const { CONFIG } = require('./config');
const { startLoop, stopLoop } = require('./main');
const { addToggleButton, exposeDebugTools } = require('./debug');

// 自动启动
(function() {
  // 停止旧循环
  if (window.stopLoop) {
    try { window.stopLoop(); } catch (e) { console.error(e); }
  }

  console.log('🚀 Trae Ralph Loop - 增强版 (Modular)');
  console.log('');
  
  // 暴露调试工具
  exposeDebugTools();
  
  // 添加 UI 按钮
  addToggleButton();
  
  // 默认不自动启动，需手动开启
  console.log('ℹ️ Ralph Loop 已就绪，请点击 "开启 Ralph" 按钮启动。');
  // startLoop();
  
})();
