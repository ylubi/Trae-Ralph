/**
 * @file config.js
 * @description 基础配置模块
 * 
 * 该模块管理 Trae Ralph Loop 的所有配置项，包括：
 * - 循环检查间隔时间
 * - 状态稳定计数阈值
 * - 聊天历史记录限制
 * - 终端颜色代码配置
 * 
 * 主要导出对象：
 * - CONFIG: 全局配置对象
 * - colors: 终端颜色代码
 */

/**
 * 全局配置对象
 * @property {number} checkInterval - 循环检查间隔（毫秒）
 * @property {number} stableCount - 判定状态稳定的连续检查次数
 * @property {number} chatHistoryTurns - 获取聊天历史的轮数
 * @property {number} chatHistoryCharLimit - 聊天历史字符数限制
 */
const CONFIG = {
  checkInterval: 5000,
  stableCount: 3,
  chatHistoryTurns: 6,
  chatHistoryCharLimit: 4000,
  noStopMode: false,
  messages: {
    continue: '重新加载 rules ./trae/rules/Ralph.md。查看 Ralph 开发进程 ，继续',
    stalled: '重新加载 rules ./trae/rules/Ralph.md。查看 Ralph 开发进程 ，继续'
  }
};

// 颜色输出配置（用于 Node.js 环境，但在浏览器中也可以保留作为参考）
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

module.exports = {
    CONFIG,
    colors
};
