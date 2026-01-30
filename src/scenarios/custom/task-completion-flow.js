/**
 * Trae Ralph Loop CDP - 自定义场景：任务完成自动检查
 * 
 * 当 Trae 状态显示为 "任务完成" 时，自动发送指令检查项目完成情况
 * 
 * 2026-01-29 - Created
 */

module.exports = {
  id: 'taskCompletedConfirmCheck',
  name: '任务完成确认检查',
  description: '当任务显示完成后，自动发送指令检查项目完成情况',
  enabled: true,
  priority: 10, // 普通优先级
  cooldown: 60000, // 60秒冷却，防止短时间内重复触发
  isConfirm: true, // 标记为确认类操作，允许在同一停止周期内触发（配合cooldown使用）
  
  // 检测规则
  detection: {
    // 使用 textCheck 精确匹配状态栏文本
    textCheck: {
      selector: '.latest-assistant-bar .status .status-text',
      text: '任务完成',
      lastTurnOnly: true // 限制在最后一条消息中检查
    }
  },
  
  // 响应策略
  response: {
    action: 'send', // 发送消息
    message: '继续'
  }
};
