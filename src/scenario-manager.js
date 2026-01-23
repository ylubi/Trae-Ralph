#!/usr/bin/env node

/**
 * Trae Ralph Loop CDP - 场景管理工具
 * 
 * 交互式场景管理界面，用于管理内置和自定义场景
 * 
 * 功能：
 * - 查看所有场景（内置和自定义）
 * - 查看场景详情
 * - 创建自定义场景
 * - 编辑场景文件
 * - 删除自定义场景
 * - 测试场景检测
 * 
 * 使用方法：
 *   npm run scenarios
 * 
 * @author Trae Ralph Loop Team
 * @license MIT
 * @see https://github.com/your-username/trae-ralph
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const scenarioLoader = require('../scenarios/loader.js');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function question(prompt) {
    return new Promise(resolve => {
        rl.question(prompt, resolve);
    });
}

async function mainMenu() {
    log('\n🎯 Trae Ralph Loop - 场景管理工具', 'cyan');
    log('');
    log('1. 查看所有场景', 'blue');
    log('2. 查看场景详情', 'blue');
    log('3. 创建自定义场景', 'blue');
    log('4. 编辑场景文件', 'blue');
    log('5. 删除自定义场景', 'blue');
    log('6. 测试场景检测', 'blue');
    log('0. 退出', 'blue');
    log('');
    
    const choice = await question('请选择 (0-6): ');
    
    switch (choice) {
        case '1':
            await viewScenarios();
            break;
        case '2':
            await viewScenarioDetail();
            break;
        case '3':
            await createCustomScenario();
            break;
        case '4':
            await editScenarioFile();
            break;
        case '5':
            await deleteCustomScenario();
            break;
        case '6':
            await testScenario();
            break;
        case '0':
            log('\n👋 再见！', 'green');
            rl.close();
            return;
        default:
            log('❌ 无效选择', 'red');
    }
    
    await mainMenu();
}

async function viewScenarios() {
    const scenarios = scenarioLoader.getScenarioList();
    
    log('\n📋 所有场景：', 'cyan');
    log('');
    
    if (scenarios.length === 0) {
        log('暂无场景', 'yellow');
        return;
    }
    
    // 按来源分组
    const builtin = scenarios.filter(s => s.source === 'builtin');
    const custom = scenarios.filter(s => s.source === 'custom');
    
    if (builtin.length > 0) {
        log('内置场景：', 'blue');
        builtin.forEach((s, index) => {
            const status = s.enabled ? '✅' : '❌';
            log(`  ${index + 1}. ${status} ${s.name} (${s.id}) - 优先级: ${s.priority}`);
        });
        log('');
    }
    
    if (custom.length > 0) {
        log('自定义场景：', 'magenta');
        custom.forEach((s, index) => {
            const status = s.enabled ? '✅' : '❌';
            log(`  ${index + 1}. ${status} ${s.name} (${s.id}) - 优先级: ${s.priority}`);
        });
        log('');
    }
    
    log(`总计: ${scenarios.length} 个场景 (${scenarios.filter(s => s.enabled).length} 个已启用)`, 'cyan');
}

async function viewScenarioDetail() {
    const scenarios = scenarioLoader.getScenarioList();
    
    log('\n📖 查看场景详情', 'cyan');
    log('');
    
    scenarios.forEach((s, index) => {
        log(`${index + 1}. ${s.name} (${s.id})`);
    });
    
    log('');
    const choice = await question('选择场景编号 (0 取消): ');
    const index = parseInt(choice) - 1;
    
    if (index < 0 || index >= scenarios.length) {
        log('❌ 无效选择', 'red');
        return;
    }
    
    const scenario = scenarios[index];
    
    log('');
    log(`场景: ${scenario.name}`, 'blue');
    log(`ID: ${scenario.id}`);
    log(`描述: ${scenario.description || '无'}`);
    log(`来源: ${scenario.source === 'builtin' ? '内置' : '自定义'}`);
    log(`文件: ${scenario.file}`);
    log(`状态: ${scenario.enabled ? '✅ 启用' : '❌ 禁用'}`);
    log(`优先级: ${scenario.priority}`);
    log('');
    
    log('检测规则:', 'yellow');
    if (scenario.detection?.keywords) {
        log(`  关键词: ${scenario.detection.keywords.join(', ')}`);
    }
    if (scenario.detection?.patterns) {
        log(`  正则: ${scenario.detection.patterns.length} 个`);
    }
    if (scenario.detection?.selectors) {
        log(`  选择器: ${scenario.detection.selectors.join(', ')}`);
    }
    if (scenario.detection?.checkDuration) {
        log(`  时长检测: ${scenario.detection.thinkingTime}ms`);
    }
    log('');
    
    log('响应策略:', 'yellow');
    log(`  动作: ${scenario.response?.action || 'continue'}`);
    log(`  消息: ${scenario.response?.message || '继续'}`);
    if (scenario.response?.waitTime) {
        log(`  等待时间: ${scenario.response.waitTime}ms`);
    }
}

async function createCustomScenario() {
    log('\n➕ 创建自定义场景', 'cyan');
    log('');
    
    const id = await question('场景 ID (英文，如 myScenario): ');
    if (!id || !/^[a-zA-Z0-9_]+$/.test(id)) {
        log('❌ 无效的 ID（只能包含字母、数字和下划线）', 'red');
        return;
    }
    
    // 检查 ID 是否已存在
    const existing = scenarioLoader.getScenario(id);
    if (existing) {
        log(`❌ 场景 ID "${id}" 已存在`, 'red');
        return;
    }
    
    const name = await question('场景名称: ');
    const description = await question('场景描述: ');
    const priority = await question('优先级 (1-5，默认 5): ');
    const message = await question('响应消息 (默认"继续"): ');
    
    log('\n添加关键词（每行一个，输入空行结束）：');
    const keywords = [];
    while (true) {
        const kw = await question('关键词: ');
        if (!kw) break;
        keywords.push(kw);
    }
    
    // 生成场景文件
    const scenarioContent = `/**
 * 场景：${name}
 * 
 * ${description}
 */

module.exports = {
  id: '${id}',
  name: '${name}',
  description: '${description}',
  enabled: true,
  priority: ${parseInt(priority) || 5},
  
  // 检测规则
  detection: {
    keywords: ${JSON.stringify(keywords, null, 4).replace(/^/gm, '    ').trim()}
  },
  
  // 响应策略
  response: {
    action: 'continue',
    message: '${message || '继续'}'
  }
};
`;
    
    const fileName = id.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '') + '.js';
    const filePath = path.join(__dirname, '../scenarios/custom', fileName);
    
    fs.writeFileSync(filePath, scenarioContent);
    
    log('\n✅ 自定义场景已创建', 'green');
    log(`文件: scenarios/custom/${fileName}`, 'blue');
    log('');
    log('💡 提示：', 'yellow');
    log('  - 可以直接编辑文件添加更多配置');
    log('  - 重新注入脚本后生效');
    log('  - 查看 scenarios/custom/README.md 了解更多');
}

async function editScenarioFile() {
    const scenarios = scenarioLoader.getScenarioList();
    const customScenarios = scenarios.filter(s => s.source === 'custom');
    
    if (customScenarios.length === 0) {
        log('\n⚠️ 没有自定义场景', 'yellow');
        return;
    }
    
    log('\n✏️ 编辑场景文件', 'cyan');
    log('');
    
    customScenarios.forEach((s, index) => {
        log(`${index + 1}. ${s.name} (${s.id})`);
    });
    
    log('');
    const choice = await question('选择场景编号 (0 取消): ');
    const index = parseInt(choice) - 1;
    
    if (index < 0 || index >= customScenarios.length) {
        log('❌ 无效选择', 'red');
        return;
    }
    
    const scenario = customScenarios[index];
    const filePath = path.join(__dirname, '../scenarios/custom', scenario.file);
    
    log('');
    log(`文件路径: ${filePath}`, 'blue');
    log('');
    log('💡 请使用文本编辑器打开此文件进行编辑', 'yellow');
    log('');
    log('编辑完成后，重新注入脚本即可生效', 'cyan');
}

async function deleteCustomScenario() {
    const scenarios = scenarioLoader.getScenarioList();
    const customScenarios = scenarios.filter(s => s.source === 'custom');
    
    if (customScenarios.length === 0) {
        log('\n⚠️ 没有自定义场景', 'yellow');
        return;
    }
    
    log('\n🗑️ 删除自定义场景', 'cyan');
    log('');
    
    customScenarios.forEach((s, index) => {
        log(`${index + 1}. ${s.name} (${s.id})`);
    });
    
    log('');
    const choice = await question('选择要删除的场景 (0 取消): ');
    const index = parseInt(choice) - 1;
    
    if (index < 0 || index >= customScenarios.length) {
        log('❌ 无效选择', 'red');
        return;
    }
    
    const scenario = customScenarios[index];
    const filePath = path.join(__dirname, '../scenarios/custom', scenario.file);
    
    log('');
    log(`⚠️ 确认删除场景 "${scenario.name}"？`, 'yellow');
    const confirm = await question('输入 yes 确认: ');
    
    if (confirm.toLowerCase() === 'yes') {
        fs.unlinkSync(filePath);
        log(`\n✅ 场景 "${scenario.name}" 已删除`, 'green');
    } else {
        log('\n❌ 已取消', 'yellow');
    }
}

async function testScenario() {
    log('\n🧪 测试场景检测', 'cyan');
    log('');
    log('输入测试文本（模拟 AI 消息）：');
    
    const testText = await question('> ');
    
    if (!testText) {
        log('❌ 测试文本不能为空', 'red');
        return;
    }
    
    const scenarios = scenarioLoader.getEnabledScenarios();
    
    log('\n🔍 检测结果：', 'blue');
    log('');
    
    let matched = false;
    
    for (const scenario of scenarios) {
        if (scenario.detection?.keywords) {
            const lowerText = testText.toLowerCase();
            const matchedKeywords = scenario.detection.keywords.filter(kw =>
                lowerText.includes(kw.toLowerCase())
            );
            
            if (matchedKeywords.length > 0) {
                matched = true;
                log(`✅ 匹配场景: ${scenario.name} (${scenario.id})`, 'green');
                log(`   优先级: ${scenario.priority}`);
                log(`   匹配关键词: ${matchedKeywords.join(', ')}`);
                log(`   将发送: "${scenario.response?.message || '继续'}"`);
                log('');
                break; // 只显示第一个匹配的场景
            }
        }
    }
    
    if (!matched) {
        log('❌ 未匹配任何场景', 'yellow');
        log('将使用默认响应: "继续"');
    }
}

// 启动
mainMenu().catch(error => {
    log('\n❌ 错误:', 'red');
    console.error(error);
    rl.close();
    process.exit(1);
});
