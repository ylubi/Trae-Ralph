/**
 * Trae Ralph Loop CDP - 自定义场景：输出过长处理
 * 
 * 检测到 "输出过长，请输入“继续”后获得更多结果" 提示时，自动点击"继续"按钮
 * 
 * 检测状态：
 * - 输出过长：已验证可检测与点击继续
 * 
 * 检测方式：
 * - 文本检查：匹配 "输出过长" 相关的提示信息
 * 
 * 响应策略：
 * - 自动点击同一上下文中的 "继续" 按钮 (.icube-alert-action)
 * 
 * 优先级：10（高）
 */

module.exports = {
  id: 'outputLimitClick',
  name: '输出过长自动点击',
  description: '检测到输出过长提示卡片时，自动点击继续按钮',
  enabled: true,
  priority: 21, // 高优先级，但低于系统严重错误
  isConfirm: true, // 标记为确认类操作，允许在停止期间多次触发
  thinkingTime: 0, // 无需等待，立即触发
  
  detection: {
    // 移除强制 selectors 检查，改用更灵活的 textCheck
    textCheck: {
      // 扩大选择范围，同时匹配 icube-alert-container, icube-alert-msg 和 icube-alert-action
      selector: '.icube-alert-container, .icube-alert-msg, .icube-alert-action, .agent-error-wrap',
      // 匹配 "输出过长"
      pattern: /输出过长/,
      lastTurnOnly: true
    },
    // 添加关键词作为备用检测
    keywords: ['输出过长']
  },
  
  response: {
    action: 'click',
    target: '.icube-alert-action',
    message: '检测到输出过长，点击继续'
  }
};
