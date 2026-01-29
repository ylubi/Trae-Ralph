// ============================================
// Trae Ralph Loop - 基础配置
// ============================================

const SCENARIOS_PLACEHOLDER = null;
const SCENARIOS = SCENARIOS_PLACEHOLDER || {};

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
