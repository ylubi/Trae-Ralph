/**
 * Trae Ralph Loop CDP - 内置场景：请求限制
 * 
 * 检测 API 请求限制，等待后重试
 * 
 * 检测方式：
 * - 关键词匹配：rate limit、请求过多、请求限制、too many requests 等
 * - CSS 选择器匹配：包含 rate 和 limit 的错误元素
 * 
 * 响应策略：
 * - 等待 60 秒后自动发送"继续"命令
 * 
 * 优先级：1（最高）
 * 
 * @author Trae Ralph Loop Team
 * @license MIT
 */

module.exports = {
  id: 'rateLimit',
  name: '请求限制',
  description: '检测 API 请求限制，等待后重试',
  enabled: true,
  priority: 1,
  
  // 检测规则
  detection: {
    keywords: [
      'rate limit',
      '请求过多',
      '请求限制',
      '稍后再试',
      'too many requests',
      'rate limited',
      '频率限制'
    ],
    selectors: [
      '[class*="rate"][class*="limit"]',
      '[class*="error"][class*="limit"]'
    ]
  },
  
  // 响应策略
  response: {
    action: 'wait',
    waitTime: 60000, // 等待 60 秒
    message: '查看 Ralph 开发进程 \n\n 继续'
  }
};
