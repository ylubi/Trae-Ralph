/**
 * @file config.js
 * @description 基础配置模块
 * 
 * 该模块管理 Trae Ralph Loop 的所有配置项，包括：
 * - 循环检查间隔时间
 * - 状态稳定计数阈值
 * - 场景检测配置 (Scenarios)
 * - 聊天历史记录限制
 * - 终端颜色代码配置
 * 
 * 支持通过注入 SCENARIOS_PLACEHOLDER 和 SELECTORS_PLACEHOLDER 
 * 在运行时动态更新配置。
 * 
 * 主要导出对象：
 * - CONFIG: 全局配置对象
 * - colors: 终端颜色代码
 */

const SCENARIOS_PLACEHOLDER = null;
const SCENARIOS = SCENARIOS_PLACEHOLDER || {};

/**
 * 全局配置对象
 * @property {number} checkInterval - 循环检查间隔（毫秒）
 * @property {number} stableCount - 判定状态稳定的连续检查次数
 * @property {Object} scenarios - 场景配置集合
 * @property {number} chatHistoryTurns - 获取聊天历史的轮数
 * @property {number} chatHistoryCharLimit - 聊天历史字符数限制
 */
const CONFIG = {
  checkInterval: 5000,
  stableCount: 3,
  scenarios: SCENARIOS,
  chatHistoryTurns: 6,
  chatHistoryCharLimit: 4000
};

// 注入选择器定义（会被 launcher/injector 替换）
const SELECTORS_PLACEHOLDER = null;

// 如果有选择器定义，则加载
if (SELECTORS_PLACEHOLDER) {
  eval(SELECTORS_PLACEHOLDER);
}

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
