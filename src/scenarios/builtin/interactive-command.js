/**
 * Trae Ralph Loop CDP - 内置场景：交互式命令
 * 
 * 检测需要用户输入的交互式命令 (y/n)
 * 
 * 检测方式：
 * - 关键词匹配：等待用户输入、waiting for input、y/n、yes/no 等
 * - 正则表达式匹配：(y/n)、[y/n]、yes/no 等模式
 * 
 * 响应策略：
 * - 自动回复 'y' 或 '是' 确认继续
 * - 根据不同提示模式选择合适的响应
 * 
 * 优先级：2（高）
 * 
 * @author Trae Ralph Loop Team
 * @license MIT
 */

module.exports = {
  id: 'interactiveCommand',
  name: '交互式命令',
  description: '检测需要用户输入的交互式命令',
  enabled: true,
  // 优先级必须高于 terminalLongWaitSkip (12)，否则会被超时跳过逻辑抢占
  priority: 20,
  
  // 检测规则
  detection: {
    keywords: [
      '等待用户输入',
      'waiting for input',
      '请确认',
      '是否继续',
      'y/n',
      'yes/no'
    ],
    patterns: [
      /\(y\/n\)/i,
      /\[y\/n\]/i,
      /yes\/no/i,
      /请确认/,
      /是否继续/
    ],
    selectors: [
      // 检测 xterm 输入助手，意味着终端正在等待输入
      '.xterm-helper-textarea'
    ]
  },
  
  // 响应策略
  response: {
    action: 'custom',
    handler: 'rapidInteractiveInput',
    message: '自动交互输入 (连续回车)'
  },

  // 不再需要 repeatable，因为 handler 内部实现了循环
  // repeatable: true,
  // cooldown: 2000
};
