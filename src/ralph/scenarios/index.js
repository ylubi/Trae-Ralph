/**
 * @file index.js
 * @description 场景定义聚合入口
 */

const replyScenarios = require('./defs/reply');
const terminalScenarios = require('./defs/terminal');
const clickScenarios = require('./defs/click');
const restartScenarios = require('./defs/restart');

// 聚合所有场景定义
const ALL_DEFINITIONS = [
    ...clickScenarios,    // P0: 优先处理点击操作 (如系统警告按钮)
    ...replyScenarios,    // P1: 回复操作
    ...terminalScenarios,
    ...restartScenarios
];

module.exports = ALL_DEFINITIONS;
