/**
 * Trae Ralph Loop CDP - 内置场景：上下文限制
 * 
 * 检测 AI 因上下文窗口已满而停止工作
 * 
 * 检测方式：
 * - 关键词匹配：上下文窗口、context window 等
 * - 正则表达式匹配
 * 
 * 响应策略：
 * - 自动发送"继续"命令
 * 
 * 优先级：1（最高）
 * 
 * @author Trae Ralph Loop Team
 * @license MIT
 */

module.exports = {
  id: 'contextLimit',
  name: '上下文限制',
  description: '检测 AI 因上下文窗口已满而停止',
  enabled: true,
  priority: 1,
  
  // 检测规则
  detection: {
    keywords: [
      '上下文窗口已满',
      'context window',
      '达到上下文限制',
      '上下文过长',
      'context limit',
      'token limit'
    ],
    selectors: [
      '[class*="context"][class*="limit"]',
      '[class*="context"][class*="warning"]'
    ]
  },
  
  // 响应策略
  response: {
    action: 'continue',
    message: '查看 Ralph 开发进程 \n\n 继续'
  }
};
