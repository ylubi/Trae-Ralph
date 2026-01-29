/**
 * Trae Ralph Loop CDP - 自定义场景：聊天控制状态
 * 
 * 处理聊天发送按钮的不同状态，作为系统保底措施
 * 
 * 检测状态：
 * - Agent正在工作：待验证
 * - Agent准备就绪：待验证
 * - 发送按钮禁用继续：已验证可检测与发送继续
 * 
 * 包含状态：
 * 1. 正在工作 (Stop Button Visible): 防止误判超时
 * 2. 准备就绪 (Send Button Visible): 提示空闲状态
 */

module.exports = [
  {
    id: 'agentWorking',
    name: 'Agent正在工作',
    description: '检测到停止按钮，表示Agent正在生成回复或执行任务',
    enabled: true,
    priority: 0,
    detection: {
      selectors: ['.codicon-stop-circle']
    },
    response: {
      action: 'log',
      message: 'Agent正在工作，保持等待...'
    }
  },
  {
    id: 'agentReady',
    name: 'Agent准备就绪',
    description: '检测到发送按钮可用，且已有任务记录，自动发送继续',
    enabled: true,
    priority: 5, // 中低优先级，仅作为状态指示和保底措施
    requiresActiveHistory: true, // 需要有历史工作记录，防止新开窗口误触发
    detection: {
      selectors: [
        '.chat-input-v2-send-button:not(.disabled) .codicon-icube-ArrowUp'
      ]
    },
    response: {
      action: 'continue', // 发送消息并点击
      message: '继续'
    }
  },
  {
    id: 'sendButtonDisabledContinue',
    // ✅ 已测试通过 (2026-01-29): 核心功能，修改请谨慎
    name: '发送按钮禁用继续',
    description: '检测到发送按钮禁用状态，直接发送继续',
    enabled: true,
    priority: 20,
    group: 'system-recovery', // 分组：系统恢复
    groupCooldown: 30000, // 组冷却 30秒
    cooldown: 30000,
    detection: {
      selectors: [
        '.chat-input-wrapper .chat-input-v2-send-button.disabled',
        '.chat-input-wrapper .chat-input-v2-send-button[disabled]',
        '.chat-input-v2-send-button.disabled',
        '.chat-input-v2-send-button[disabled]'
      ]
    },
    response: {
      action: 'continue',
      message: '继续'
    }
  }
];
