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
    id: 'taskCompletedStop',
    name: '任务完成自动停止',
    description: '检测到 XML 状态为 TRAE RALPH COMPLETED 时停止运行',
    enabled: true,
    priority: 999, // 最高优先级
    detection: {
      textCheck: {
        selector: '*',
        pattern: /<state>\s*TRAE RALPH COMPLETED\s*<\/state>/i
      }
    },
    action: 'stop'
  },
  {
    id: 'agentWorking',
    name: 'Agent正在工作',
    description: '检测到停止按钮或加载状态，表示Agent正在生成回复或执行任务',
    enabled: true,
    priority: 22, // 必须高于 sendButtonDisabledContinue (20)，防止在正常生成/思考时误触发保底
    detection: {
      selectors: [
        '.codicon-stop-circle',
        '.icd-loading'
      ]
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
    cooldown: 60000, // 60秒冷却，防止短时间内重复触发
    detection: {
      selectors: [
        '.chat-input-v2-send-button:not(.disabled):not([disabled])'
      ]
    },
    response: {
      action: 'continue', // 发送消息并点击
      message: '查看 Ralph 开发进程 \n\n 继续'
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
        '.chat-input-v2-send-button[disabled]',
        '.chat-input-v2-send-button[aria-disabled="true"]'
      ]
    },
    response: {
      action: 'continue',
      message: '查看 Ralph 开发进程 \n\n 继续'
    }
  }
];
