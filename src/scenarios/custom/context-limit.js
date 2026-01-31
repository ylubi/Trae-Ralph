
module.exports = {
  id: 'contextLimitExceeded',
  name: '上下文长度过大',
  description: '检测到上下文长度超过限制时，自动输入“继续”',
  enabled: true,
  priority: 20, // 高优先级，系统级错误
  isConfirm: true, // 标记为确认类操作，允许在停止期间触发
  group: 'system-recovery',
  groupCooldown: 60000, // 冷却 60秒，避免短时间内连续触发
  detection: {
    selectors: ['.icube-alert-msg'],
    textCheck: {
      selector: '.icube-alert-msg',
      pattern: /上下文长度已超过最大限制/,
      lastTurnOnly: true // 仅检查最后一条消息
    }
  },
  response: {
    action: 'custom',
    handler: 'resetContext'
  }
};
