#!/usr/bin/env node

/**
 * Trae Ralph Loop CDP - 场景配置管理工具
 * 
 * 帮助用户配置和测试不同的中断场景（已废弃，请使用 scenario-manager.js）
 * 
 * 功能：
 * - 查看所有场景
 * - 启用/禁用场景
 * - 修改场景配置
 * - 添加自定义场景
 * - 删除自定义场景
 * - 测试场景检测
 * 
 * 使用方法：
 *   node src/scenario-config.js
 * 
 * 注意：此文件已被 src/scenario-manager.js 替代，建议使用 npm run scenarios
 * 
 * @author Trae Ralph Loop Team
 * @license MIT
 * @see https://github.com/your-username/trae-ralph
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

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

const configPath = path.join(__dirname, '../config/scenarios-config.json');

function loadConfig() {
    if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    return {
        scenarios: {},
        customScenarios: []
    };
}

function saveConfig(config) {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

async function mainMenu() {
    log('\n🎯 Trae Ralph Loop - 场景配置工具', 'cyan');
    log('');
    log('1. 查看所有场景', 'blue');
    log('2. 启用/禁用场景', 'blue');
    log('3. 修改场景配置', 'blue');
    log('4. 添加自定义场景', 'blue');
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
            await toggleScenario();
            break;
        case '3':
            await editScenario();
            break;
        case '4':
            await addCustomScenario();
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
    const config = loadConfig();
    
    log('\n📋 所有场景：', 'cyan');
    log('');
    
    const scenarios = {
        ...config.scenarios,
        ...Object.fromEntries(
            config.customScenarios.map(s => [s.id, s])
        )
    };
    
    if (Object.keys(scenarios).length === 0) {
        log('暂无配置的场景', 'yellow');
        return;
    }
    
    Object.entries(scenarios).forEach(([id, scenario], index) => {
        const status = scenario.enabled ? '✅ 启用' : '❌ 禁用';
        log(`${index + 1}. ${scenario.name || id} (${id})`, 'blue');
        log(`   状态: ${status}`);
        log(`   优先级: ${scenario.priority || 5}`);
        log(`   动作: ${scenario.action || 'continue'}`);
        if (scenario.keywords && scenario.keywords.length > 0) {
            log(`   关键词: ${scenario.keywords.slice(0, 3).join(', ')}...`);
        }
        log('');
    });
}

async function toggleScenario() {
    const config = loadConfig();
    
    log('\n🔄 启用/禁用场景', 'cyan');
    log('');
    
    const scenarios = {
        ...config.scenarios,
        ...Object.fromEntries(
            config.customScenarios.map(s => [s.id, s])
        )
    };
    
    const ids = Object.keys(scenarios);
    ids.forEach((id, index) => {
        const s = scenarios[id];
        const status = s.enabled ? '✅' : '❌';
        log(`${index + 1}. ${status} ${s.name || id} (${id})`);
    });
    
    log('');
    const choice = await question('选择场景编号 (0 取消): ');
    const index = parseInt(choice) - 1;
    
    if (index < 0 || index >= ids.length) {
        log('❌ 无效选择', 'red');
        return;
    }
    
    const id = ids[index];
    const scenario = scenarios[id];
    const newStatus = !scenario.enabled;
    
    // 更新配置
    if (config.scenarios[id]) {
        config.scenarios[id].enabled = newStatus;
    } else {
        const customIndex = config.customScenarios.findIndex(s => s.id === id);
        if (customIndex >= 0) {
            config.customScenarios[customIndex].enabled = newStatus;
        }
    }
    
    saveConfig(config);
    
    log(`\n✅ 场景 "${scenario.name || id}" 已${newStatus ? '启用' : '禁用'}`, 'green');
}

async function editScenario() {
    const config = loadConfig();
    
    log('\n✏️ 修改场景配置', 'cyan');
    log('');
    log('选择要修改的场景：', 'yellow');
    
    const scenarios = {
        ...config.scenarios,
        ...Object.fromEntries(
            config.customScenarios.map(s => [s.id, s])
        )
    };
    
    const ids = Object.keys(scenarios);
    ids.forEach((id, index) => {
        log(`${index + 1}. ${scenarios[id].name || id} (${id})`);
    });
    
    log('');
    const choice = await question('选择场景编号 (0 取消): ');
    const index = parseInt(choice) - 1;
    
    if (index < 0 || index >= ids.length) {
        log('❌ 无效选择', 'red');
        return;
    }
    
    const id = ids[index];
    const scenario = scenarios[id];
    
    log('');
    log(`编辑场景: ${scenario.name || id}`, 'blue');
    log('');
    log('1. 修改优先级');
    log('2. 修改响应消息');
    log('3. 添加关键词');
    log('4. 删除关键词');
    log('0. 返回');
    log('');
    
    const editChoice = await question('选择操作: ');
    
    switch (editChoice) {
        case '1':
            const priority = await question(`当前优先级: ${scenario.priority || 5}\n新优先级 (1-5): `);
            scenario.priority = parseInt(priority) || 5;
            log('✅ 优先级已更新', 'green');
            break;
        case '2':
            const message = await question(`当前消息: ${scenario.message || '继续'}\n新消息: `);
            if (message) {
                scenario.message = message;
                log('✅ 消息已更新', 'green');
            }
            break;
        case '3':
            const keyword = await question('新关键词: ');
            if (keyword) {
                if (!scenario.keywords) scenario.keywords = [];
                scenario.keywords.push(keyword);
                log('✅ 关键词已添加', 'green');
            }
            break;
        case '4':
            if (scenario.keywords && scenario.keywords.length > 0) {
                log('\n当前关键词：');
                scenario.keywords.forEach((kw, i) => {
                    log(`${i + 1}. ${kw}`);
                });
                const kwIndex = await question('\n删除编号: ');
                const kwIdx = parseInt(kwIndex) - 1;
                if (kwIdx >= 0 && kwIdx < scenario.keywords.length) {
                    scenario.keywords.splice(kwIdx, 1);
                    log('✅ 关键词已删除', 'green');
                }
            } else {
                log('⚠️ 没有关键词', 'yellow');
            }
            break;
    }
    
    // 保存更新
    if (config.scenarios[id]) {
        config.scenarios[id] = scenario;
    } else {
        const customIndex = config.customScenarios.findIndex(s => s.id === id);
        if (customIndex >= 0) {
            config.customScenarios[customIndex] = scenario;
        }
    }
    
    saveConfig(config);
}

async function addCustomScenario() {
    const config = loadConfig();
    
    log('\n➕ 添加自定义场景', 'cyan');
    log('');
    
    const id = await question('场景 ID (英文，如 myScenario): ');
    if (!id || !/^[a-zA-Z0-9_]+$/.test(id)) {
        log('❌ 无效的 ID', 'red');
        return;
    }
    
    const name = await question('场景名称: ');
    const priority = await question('优先级 (1-5，默认 5): ');
    const message = await question('响应消息 (默认"继续"): ');
    
    log('\n添加关键词（每行一个，输入空行结束）：');
    const keywords = [];
    while (true) {
        const kw = await question('关键词: ');
        if (!kw) break;
        keywords.push(kw);
    }
    
    const newScenario = {
        id,
        name: name || id,
        enabled: true,
        priority: parseInt(priority) || 5,
        keywords,
        action: 'continue',
        message: message || '继续'
    };
    
    config.customScenarios.push(newScenario);
    saveConfig(config);
    
    log('\n✅ 自定义场景已添加', 'green');
    log(JSON.stringify(newScenario, null, 2), 'blue');
}

async function deleteCustomScenario() {
    const config = loadConfig();
    
    if (config.customScenarios.length === 0) {
        log('\n⚠️ 没有自定义场景', 'yellow');
        return;
    }
    
    log('\n🗑️ 删除自定义场景', 'cyan');
    log('');
    
    config.customScenarios.forEach((s, index) => {
        log(`${index + 1}. ${s.name || s.id} (${s.id})`);
    });
    
    log('');
    const choice = await question('选择要删除的场景 (0 取消): ');
    const index = parseInt(choice) - 1;
    
    if (index < 0 || index >= config.customScenarios.length) {
        log('❌ 无效选择', 'red');
        return;
    }
    
    const deleted = config.customScenarios.splice(index, 1)[0];
    saveConfig(config);
    
    log(`\n✅ 场景 "${deleted.name || deleted.id}" 已删除`, 'green');
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
    
    const config = loadConfig();
    const scenarios = {
        ...config.scenarios,
        ...Object.fromEntries(
            config.customScenarios.map(s => [s.id, s])
        )
    };
    
    log('\n🔍 检测结果：', 'blue');
    log('');
    
    let matched = false;
    
    for (const [id, scenario] of Object.entries(scenarios)) {
        if (!scenario.enabled) continue;
        
        if (scenario.keywords) {
            const lowerText = testText.toLowerCase();
            const matchedKeywords = scenario.keywords.filter(kw =>
                lowerText.includes(kw.toLowerCase())
            );
            
            if (matchedKeywords.length > 0) {
                matched = true;
                log(`✅ 匹配场景: ${scenario.name || id}`, 'green');
                log(`   匹配关键词: ${matchedKeywords.join(', ')}`);
                log(`   将发送: "${scenario.message || '继续'}"`);
                log('');
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
