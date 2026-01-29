/**
 * Trae Ralph Loop CDP - 自定义场景：系统状态提醒
 * 
 * 处理系统级提醒和错误状态
 * 
 * 检测状态：
 * - 排队提醒：待验证
 * - 系统错误：已验证可检测与继续
 * - 模型思考上限：待验证
 * 
 * 包含：
 * 1. 排队提醒：当模型请求量较高时
 * 2. 系统错误：当发生未知系统错误时
 */

module.exports = [
  {
    id: 'queueUpAlert',
    name: '排队提醒',
    description: '检测并记录排队提醒',
    enabled: true,
    priority: 5,
    detection: {
      selectors: ['.icube-alert-title'],
      textCheck: {
        selector: '.icube-alert-title',
        text: '排队提醒',
        lastTurnOnly: true
      }
    },
    response: {
      action: 'log', // 暂时只记录，也可以配置为 'wait'
      message: '检测到排队提醒，等待处理...'
    }
  },
  {
    id: 'systemError',
    name: '系统错误',
    description: '检测系统未知错误',
    enabled: true,
    priority: 25, // 高优先级
    group: 'system-recovery', // 分组：系统恢复
    groupCooldown: 30000, // 组冷却 30秒
    cooldown: 30000, // 30秒冷却时间，防止频繁触发
    detection: {
      // 强制检测最后一条信息，而不是全局信息
      textCheck: {
        selector: '.agent-error-wrap .icube-alert-msg',
        pattern: /系统未知错误/,
        lastTurnOnly: true
      }
    },
    response: {
      action: 'continue',
      message: '继续'
    }
  },
  {
    id: 'modelLimitReached',
    name: '模型思考上限',
    description: '检测到模型思考次数上限，自动点击继续',
    enabled: true,
    priority: 11, // 高优先级，必须处理
    group: 'system-recovery', // 分组：系统恢复
    groupCooldown: 30000, // 组冷却 30秒
    cooldown: 30000, // 30秒冷却时间
    detection: {
      selectors: ['.icube-alert-container'],
      textCheck: {
        selector: '.icube-alert-container',
        pattern: /模型思考次数已达上限/,
        lastTurnOnly: true
      }
    },
    response: {
      action: 'click',
      target: '.icube-alert-action', // 精确匹配“继续”按钮的类名
      matchText: '继续' // 双重确认文本内容
    }
  }
];
