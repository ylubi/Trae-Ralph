/**
 * Trae Ralph Loop CDP - 内置场景：长时间思考
 * 
 * 检测 AI 长时间无响应（兜底场景）
 * 
 * 检测方式：
 * - 时长检测：超过 300 秒 (5分钟) 无响应
 * - 作为兜底场景，当其他场景都不匹配时触发
 * 
 * 响应策略：
 * - 自动发送"继续"命令
 * 
 * 优先级：4（低）
 * 
 * @author Trae Ralph Loop Team
 * @license MIT
 */

module.exports = {
  id: 'longThinking',
  name: '长时间思考',
  description: '检测 AI 长时间无响应',
  enabled: true,
  priority: 4,
  
  // 检测规则
  detection: {
    checkDuration: true,
    thinkingTime: 300000, // 300 秒 (5分钟)
    selectors: [] // 移除选择器，避免在思考时立即触发
  },
  
  // 响应策略
  response: {
    action: 'continue',
    message: '查看 Ralph 开发进程 \n\n 继续'
  }
};
