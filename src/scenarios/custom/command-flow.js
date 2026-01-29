/**
 * Trae Ralph Loop CDP - 自定义场景：命令执行流
 * 
 * 处理命令执行相关的 UI 卡片交互
 * 
 * 检测状态：
 * - 运行命令卡片：待验证
 * - 高风险命令确认：待验证
 * - Sudo密码等待跳过：待验证
 * - 终端超时跳过：待验证（已修复 handler 注入）
 */

module.exports = [
  {
    id: 'runCommandCard',
    // ✅ 已测试通过 (2026-01-29): 核心功能，修改请谨慎
    name: '运行命令卡片',
    description: '自动点击运行命令卡片中的运行按钮',
    enabled: true,
    priority: 10,
    detection: {
      // 匹配普通运行卡片和高风险运行卡片，必须包含运行按钮
      selectors: ['.icd-run-command-card-v2 .icd-run-command-card-v2-actions-btn-run'],
      lastTurnOnly: true
    },
    response: {
      action: 'click',
      // 同时匹配普通运行按钮和高风险运行按钮
      target: '.icd-run-command-card-v2-actions-btn-run',
      message: '点击运行按钮'
    }
  },
  {
    id: 'highRiskConfirm',
    // ✅ 已测试通过 (2026-01-29): 核心功能，修改请谨慎
    name: '高风险命令确认',
    description: '自动确认高风险命令执行弹窗',
    enabled: true,
    priority: 31, // 提高优先级，与删除确认同级
    isConfirm: true, // 标记为确认类场景
    detection: {
      // 检测高风险确认弹窗，通常包含"运行"相关提示
      // 必须使用 textCheck 来进行精确匹配，避免误触发
      textCheck: {
        selector: '.confirm-popover-body',
        text: '运行风险命令',
        lastTurnOnly: false
      }
    },
    response: {
      action: 'click',
      // 点击"仍要运行"按钮
      target: '.confirm-popover-body button',
      matchText: '仍要运行',
      message: '确认运行风险命令'
    }
  },
  {
    id: 'sudoPasswordSkip',
    name: 'Sudo密码等待跳过',
    description: '检测到Sudo命令且终端长时间无输出（可能是等待密码），快速跳过',
    enabled: true,
    priority: 15, // 高于普通超时
    thinkingTime: 5000, // 5秒后跳过 (给一点时间确认是否真的卡住)
    detection: {
      textCheck: {
          selector: '.icd-run-command-card-v2',
          pattern: /sudo[\s\S]*终端长时间未返回输出/,
          lastTurnOnly: true
      }
    },
    response: {
      action: 'click',
      target: '.icd-btn-tertiary', // 跳过按钮
      message: '跳过Sudo密码等待'
    }
  },
  {
    id: 'terminalLongWaitSkip',
    // ✅ 已测试通过 (2026-01-29): 核心功能，修改请谨慎
    name: '终端超时跳过',
    description: '检测到终端长时间未返回输出或命令运行过久，等待3分钟后跳过',
    enabled: true,
    priority: 12, // 比Sudo低，比普通运行高
    thinkingTime: 180000, // 3分钟
    detection: {
      // 必须显式配置使用 lastTurnOnly，确保检测的是最新回复
      lastTurnOnly: true,
      // 不再依赖文本检测，直接检测是否存在终端卡片且包含跳过按钮
      selectors: [
          // 必须同时满足：是 icd-run-command-card-v2 且包含跳过按钮
          '.icd-run-command-card-v2 .icd-btn-tertiary'
      ]
    },
    response: {
      action: 'custom',
      handler: 'skipAfterTimeout',
      message: '检测到可跳过的终端命令，启动保底跳过计时'
    }
  }
];
