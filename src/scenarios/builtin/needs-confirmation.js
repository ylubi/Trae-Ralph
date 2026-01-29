/**
 * Trae Ralph Loop CDP - 内置场景：需要确认
 * 
 * 检测 AI 等待用户确认的情况
 * 
 * 检测方式：
 * - 关键词匹配：需要确认、请确认、confirm、是否、should i 等
 * 
 * 响应策略：
 * - 自动发送"确认，继续"命令
 * 
 * 优先级：2（高）
 * 
 * @author Trae Ralph Loop Team
 * @license MIT
 */

module.exports = {
  id: 'needsConfirmation',
  name: '需要确认',
  description: '检测 AI 等待用户确认',
  enabled: true,
  priority: 2,
  
  // 检测规则
  detection: {
    keywords: [
      '需要确认',
      '请确认',
      'confirm',
      'confirmation',
      '是否',
      '要不要',
      'should i',
      'shall i'
    ]
  },
  
  // 响应策略
  response: {
    action: 'continue',
    message: '确认，继续'
  }
};
