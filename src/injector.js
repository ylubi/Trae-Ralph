#!/usr/bin/env node

/**
 * Trae Ralph Loop CDP - 注入器
 * 
 * 通过 Chrome DevTools Protocol 向运行中的 Trae 注入脚本
 * 
 * 功能：
 * - 连接到 Trae 的 CDP 端口
 * - 读取并注入 Ralph Loop 脚本
 * - 加载场景配置和选择器定义
 * - 防止重复注入
 * - 支持多版本（国际版/国内版）
 * 
 * 使用方法：
 *   npm run inject       # 注入到国际版
 *   npm run inject:cn    # 注入到国内版
 * 
 * 前提条件：
 *   Trae 必须已启动并开启远程调试端口
 * 
 * @author Trae Ralph Loop Team
 * @license MIT
 * @see https://github.com/your-username/trae-ralph
 */

const CDP = require('chrome-remote-interface');
const fs = require('fs');
const path = require('path');
const os = require('os');

// 配置目录
const CONFIG_DIR = path.join(os.homedir(), '.trae-ralph');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// 配置
const CONFIG = {
    port: 9222,
    host: 'localhost',
    scriptPath: path.join(__dirname, 'ralph-loop-enhanced.js'),
    checkInterval: 5000,
    stableCount: 3
};

// 加载用户配置
function loadUserConfig() {
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            const userConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            return userConfig;
        } catch (error) {
            log('⚠️ 无法读取配置文件，使用默认配置', 'yellow');
        }
    }
    
    // 尝试加载旧配置（向后兼容）
    const oldConfigPath = path.join(__dirname, 'trae-config.json');
    if (fs.existsSync(oldConfigPath)) {
        try {
            const oldConfig = JSON.parse(fs.readFileSync(oldConfigPath, 'utf8'));
            log('⚠️ 检测到旧配置文件，建议运行 npm run config 更新配置', 'yellow');
            return { trae: { international: oldConfig.traePath }, ...oldConfig };
        } catch (error) {
            // 忽略
        }
    }
    
    return null;
}

function getTraeConfig(version) {
    const userConfig = loadUserConfig();
    
    if (!userConfig || !userConfig.trae) {
        log('❌ 未找到配置文件', 'red');
        log('');
        log('💡 请先运行配置向导：', 'yellow');
        log('  npm run config');
        log('');
        process.exit(1);
    }
    
    // 确定使用哪个版本
    let targetVersion = version;
    if (!targetVersion) {
        targetVersion = userConfig.defaultVersion || 'international';
    }
    
    const traeConfig = userConfig.trae[targetVersion];
    
    if (!traeConfig) {
        log(`❌ 未配置 ${targetVersion === 'international' ? '国际版' : '国内版'} Trae`, 'red');
        log('');
        log('💡 请运行配置向导添加此版本：', 'yellow');
        log('  npm run config');
        log('');
        process.exit(1);
    }
    
    // 兼容旧配置格式（字符串路径）
    let traePath, port, checkInterval, stableCount;
    
    if (typeof traeConfig === 'string') {
        // 旧格式：直接是路径字符串
        traePath = traeConfig;
        port = userConfig.port || 9222;
        checkInterval = userConfig.checkInterval || 5000;
        stableCount = userConfig.stableCount || 3;
    } else {
        // 新格式：对象包含路径和配置
        traePath = traeConfig.path;
        port = traeConfig.port || 9222;
        checkInterval = traeConfig.checkInterval || 5000;
        stableCount = traeConfig.stableCount || 3;
    }
    
    return { 
        version: targetVersion,
        path: traePath,
        port,
        checkInterval,
        stableCount
    };
}

// 颜色输出
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function injectScript() {
    log('🚀 Trae Ralph Loop CDP 注入器', 'cyan');
    log('');
    
    // 解析命令行参数
    const args = process.argv.slice(2);
    let targetVersion = null;
    let noStopMode = false;
    
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--version' && args[i + 1]) {
            targetVersion = args[i + 1];
            i++;
        }
        if (args[i] === '--nostop') {
            noStopMode = true;
        }
    }
    
    const traeConfig = getTraeConfig(targetVersion);
    
    // 更新全局配置
    CONFIG.port = traeConfig.port;
    CONFIG.traePath = traeConfig.path;
    CONFIG.checkInterval = traeConfig.checkInterval;
    CONFIG.stableCount = traeConfig.stableCount;
    CONFIG.noStopMode = noStopMode;
    
    const versionName = traeConfig.version === 'international' ? '国际版 (Trae)' : '国内版 (Trae CN)';
    log(`📍 使用版本: ${versionName}`, 'blue');
    if (noStopMode) {
        log(`📍 模式: NoStop (忽略完成信号)`, 'magenta');
    }
    log(`📍 调试端口: ${traeConfig.port}`, 'blue');
    log('');
    
    try {
        // 连接到 Trae
        log(`📡 连接到 Trae (${CONFIG.host}:${CONFIG.port})...`, 'blue');
        const client = await CDP({ 
            port: CONFIG.port,
            host: CONFIG.host
        });
        
        const { Page, Runtime, Network } = client;
        
        // 启用必要的域
        await Page.enable();
        await Runtime.enable();
        await Network.enable();
        
        log('✅ 已连接到 Trae', 'green');
        log('');
        
        // 加载场景配置
        const scenarioLoader = require(path.join(__dirname, 'scenarios/loader.js'));
        const scenariosConfig = scenarioLoader.generateBrowserConfig();
        
        // 加载选择器定义
        const selectorsScript = fs.readFileSync(
            path.join(__dirname, 'editor-api/selectors.js'), 
            'utf8'
        );

        // 构建 Ralph Loop 脚本
        const { build } = require('./setup/builder');
        const ralphLoopScript = build({
            checkInterval: CONFIG.checkInterval,
            stableCount: CONFIG.stableCount,
            scenarios: scenariosConfig,
            selectors: selectorsScript,
            noStopMode: CONFIG.noStopMode
        });
        
        // 注入 Ralph Loop
        log('💉 正在注入 Ralph Loop...', 'blue');
        const result = await Runtime.evaluate({
            expression: ralphLoopScript,
            returnByValue: true
        });
        
        if (result.exceptionDetails) {
            log('❌ 注入失败:', 'red');
            console.error(result.exceptionDetails);
            process.exit(1);
        }
        
        log('✅ 脚本注入成功！', 'green');
        log('');
        log('🎉 Trae Ralph Loop 已启动', 'cyan');
        log('');
        log('💡 提示：', 'yellow');
        log('  - 脚本会自动检测 Ralph 状态');
        log('  - AI 停止时自动发送"继续"');
        log('  - 在 Trae DevTools Console 可以看到日志');
        log('');
        
        // 断开连接
        await client.close();
        
        log('✅ 完成', 'green');
        process.exit(0);
        
    } catch (error) {
        log('❌ 注入失败:', 'red');
        console.error(error);
        log('');
        log('💡 故障排除：', 'yellow');
        log('  1. 确保 Trae 已启动');
        log('  2. 确保 Trae 开启了远程调试端口 (PowerShell)：');
        log(`     & "${CONFIG.traePath}" --remote-debugging-port=${CONFIG.port}`);
        log('  3. 检查端口是否被占用');
        log('  4. 尝试重启 Trae (独立环境模式 - 推荐)');
        log('     ⚠️ 这将启动一个新的 Trae 实例，不会与当前窗口冲突');
        const userDataDir = path.join(process.cwd(), 'temp', 'trae-profile');
        log(`     & "${CONFIG.traePath}" --remote-debugging-port=${CONFIG.port} --user-data-dir="${userDataDir}"`);
        log('');
        process.exit(1);
    }
}

// 运行
injectScript();
