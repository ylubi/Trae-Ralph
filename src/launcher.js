#!/usr/bin/env node

/**
 * Trae Ralph Loop CDP - 启动器
 * 
 * 自动启动 Trae 并注入 Ralph Loop 脚本
 * 
 * 功能：
 * - 启动 Trae 并开启远程调试端口
 * - 等待 Trae 完全加载
 * - 自动注入 Ralph Loop 脚本
 * - 支持多版本（国际版/国内版）
 * - 重试机制
 * 
 * 使用方法：
 *   npm start                      # 启动国际版
 *   npm run start:cn               # 启动国内版
 *   npm start -- --version china   # 指定版本启动
 * 
 * @author Trae Ralph Loop Team
 * @license MIT
 * @see https://github.com/your-username/trae-ralph
 */

const { spawn } = require('child_process');
const CDP = require('chrome-remote-interface');
const fs = require('fs');
const path = require('path');
const os = require('os');

// 配置目录
const CONFIG_DIR = path.join(os.homedir(), '.trae-ralph');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// 配置
let CONFIG = {
    port: 9222,
    host: 'localhost',
    scriptPath: path.join(__dirname, 'ralph-loop-enhanced.js'),
    checkInterval: 5000,
    stableCount: 3,
    startupDelay: 5000  // 等待 Trae 启动的时间（毫秒）
};

// 加载用户配置
function loadUserConfig() {
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            const userConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            CONFIG = { ...CONFIG, ...userConfig };
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

// 颜色输出
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

function getTraePath(version) {
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
    let traePath, port, checkInterval, stableCount, startupDelay;
    
    if (typeof traeConfig === 'string') {
        // 旧格式：直接是路径字符串
        traePath = traeConfig;
        port = userConfig.port || 9222;
        checkInterval = userConfig.checkInterval || 5000;
        stableCount = userConfig.stableCount || 3;
        startupDelay = userConfig.startupDelay || 5000;
    } else {
        // 新格式：对象包含路径和配置
        traePath = traeConfig.path;
        port = traeConfig.port || 9222;
        checkInterval = traeConfig.checkInterval || 5000;
        stableCount = traeConfig.stableCount || 3;
        startupDelay = traeConfig.startupDelay || 5000;
    }
    
    // 检查路径是否存在
    if (!fs.existsSync(traePath)) {
        log(`❌ Trae 路径不存在: ${traePath}`, 'red');
        log('');
        log('💡 请重新运行配置向导：', 'yellow');
        log('  npm run config');
        log('');
        process.exit(1);
    }
    
    return { 
        path: traePath, 
        version: targetVersion,
        port,
        checkInterval,
        stableCount,
        startupDelay
    };
}

async function startTrae() {
    log('🚀 Trae Ralph Loop 启动器', 'cyan');
    log('');
    
    // 解析命令行参数
    const args = process.argv.slice(2);
    let targetVersion = null;
    
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--version' && args[i + 1]) {
            targetVersion = args[i + 1];
            break;
        }
    }
    
    const traeConfig = getTraePath(targetVersion);
    
    // 更新全局配置
    CONFIG.port = traeConfig.port;
    CONFIG.traePath = traeConfig.path;
    CONFIG.checkInterval = traeConfig.checkInterval;
    CONFIG.stableCount = traeConfig.stableCount;
    CONFIG.startupDelay = traeConfig.startupDelay;
    
    const versionName = traeConfig.version === 'international' ? '国际版 (Trae)' : '国内版 (Trae CN)';
    log(`📍 使用版本: ${versionName}`, 'blue');
    log(`📍 Trae 路径: ${traeConfig.path}`, 'blue');
    log(`📍 调试端口: ${traeConfig.port}`, 'blue');
    log('');
    
    // 启动 Trae
    log('🚀 启动 Trae...', 'blue');
    
    // 添加远程调试参数
    const traeArgs = [`--remote-debugging-port=${traeConfig.port}`];
    
    log(`💡 启动参数: ${traeArgs.join(' ')}`, 'blue');
    
    const trae = spawn(traeConfig.path, traeArgs, {
        detached: true,
        stdio: 'ignore'
    });
    
    trae.unref();
    
    log('✅ Trae 已启动', 'green');
    log(`⏳ 等待 ${traeConfig.startupDelay / 1000} 秒让 Trae 完全加载...`, 'yellow');
    log('');
    log('💡 提示：首次启动可能需要更长时间', 'cyan');
    log('');
    
    // 等待 Trae 启动
    await new Promise(resolve => setTimeout(resolve, traeConfig.startupDelay));
    
    // 注入脚本
    await injectScript();
}

async function injectScript() {
    const maxRetries = 10;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
        try {
            // 连接到 Trae
            log('📡 连接到 Trae...', 'blue');
            
            if (retryCount > 0) {
                log(`   (尝试 ${retryCount + 1}/${maxRetries})`, 'yellow');
            }
            
            const client = await CDP({ 
                port: CONFIG.port,
                host: CONFIG.host
            });
            
            const { Page, Runtime } = client;
            
            // 启用必要的域
            await Page.enable();
            await Runtime.enable();
            
            log('✅ 已连接', 'green');
            log('');
            
            // 读取注入脚本
            log('📖 读取注入脚本...', 'blue');
            let script = fs.readFileSync(CONFIG.scriptPath, 'utf8');
            
            // 加载场景配置
            const scenarioLoader = require(path.join(__dirname, 'scenarios/loader.js'));
            const scenariosConfig = scenarioLoader.generateBrowserConfig();
            
            // 加载选择器定义
            const selectorsScript = fs.readFileSync(
                path.join(__dirname, 'editor-api/selectors.js'), 
                'utf8'
            );
            
            // 修改配置
            script = script.replace(
                'checkInterval: 5000',
                `checkInterval: ${CONFIG.checkInterval}`
            ).replace(
                'stableCount: 3',
                `stableCount: ${CONFIG.stableCount}`
            ).replace(
                'const SCENARIOS_PLACEHOLDER = null;',
                `const SCENARIOS_PLACEHOLDER = ${JSON.stringify(scenariosConfig, null, 2).replace(/^/gm, '  ').trim()};`
            ).replace(
                'const SELECTORS_PLACEHOLDER = null;',
                `const SELECTORS_PLACEHOLDER = ${JSON.stringify(selectorsScript)};`
            );
            
            // 包装脚本
            const wrappedScript = `
                (function() {
                    if (window.__TRAE_RALPH_LOOP_INJECTED__) {
                        console.log('⚠️ Trae Ralph Loop 已注入，跳过');
                        return;
                    }
                    window.__TRAE_RALPH_LOOP_INJECTED__ = true;
                    
                    console.log('🚀 Trae Ralph Loop 已自动启动');
                    
                    ${script}
                })();
            `;
            
            // 等待页面加载完成
            log('⏳ 等待页面加载...', 'yellow');
            
            // 尝试立即注入
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            log('📝 注入脚本...', 'blue');
            
            const result = await Runtime.evaluate({
                expression: wrappedScript,
                returnByValue: true
            });
            
            if (result.exceptionDetails) {
                log('❌ 注入失败:', 'red');
                console.error(result.exceptionDetails);
            } else {
                log('✅ 脚本注入成功！', 'green');
                log('');
                log('🎉 Trae Ralph Loop 已启动', 'cyan');
                log('');
                log('💡 提示：', 'yellow');
                log('  - 脚本会自动检测 Ralph 状态');
                log('  - AI 停止时自动发送"继续"');
                log('  - 在 Trae DevTools Console 可以看到日志');
                log('');
                log('✅ 启动器任务完成，可以关闭此窗口', 'green');
            }
            
            // 断开连接
            await client.close();
            return; // 成功，退出函数
            
        } catch (error) {
            retryCount++;
            
            if (retryCount < maxRetries) {
                log(`⚠️ 连接失败，${3}秒后重试...`, 'yellow');
                await new Promise(resolve => setTimeout(resolve, 3000));
            } else {
                log('❌ 连接失败:', 'red');
                console.error(error);
                log('');
                log('💡 故障排除：', 'yellow');
                log('  1. 确保 Trae 已完全启动（可能需要更长时间）');
                log('  2. 尝试增加 startupDelay：');
                log('     编辑 ~/.trae-ralph/config.json，将 startupDelay 改为 10000');
                log('  3. 检查端口是否被占用：');
                log(`     netstat -ano | findstr :${CONFIG.port}`);
                log('  4. 手动启动 Trae 并测试 (独立环境模式 - 推荐):');
                log('     ⚠️ 这将启动一个新的 Trae 实例，不会与当前窗口冲突');
                const userDataDir = path.join(process.cwd(), 'temp', 'trae-profile');
                log(`     & "${CONFIG.traePath}" --remote-debugging-port=${CONFIG.port} --user-data-dir="${userDataDir}"`);
                log('     然后运行: node injector.js');
                log('');
                process.exit(1);
            }
        }
    }
}

// 运行
startTrae().catch(error => {
    log('❌ 启动失败:', 'red');
    console.error(error);
    process.exit(1);
});
