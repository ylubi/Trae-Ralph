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
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

const LOG_PREFIX = '[trae-ralph]';

function log(message, color = 'reset') {
    console.log(`${colors[color]}${LOG_PREFIX} ${message}${colors.reset}`);
}

async function injectScript() {
    log('🚀 Trae Ralph Loop CDP 注入器', 'cyan');
    log('');
    
    const args = process.argv.slice(2);
    let targetVersion = null;
    let noStopMode = false;
    let explicitPort = null;
    
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--version' && args[i + 1]) {
            targetVersion = args[i + 1];
            i++;
        }
        if (args[i] === '--nostop') {
            noStopMode = true;
        }
        if (args[i] === '--port' && args[i + 1]) {
            const p = Number(args[i + 1]);
            if (Number.isInteger(p) && p > 0 && p < 65536) {
                explicitPort = p;
            }
            i++;
        }
    }
    
    const traeConfig = getTraeConfig(targetVersion);
    
    CONFIG.port = explicitPort || traeConfig.port;
    CONFIG.traePath = traeConfig.path;
    CONFIG.checkInterval = traeConfig.checkInterval;
    CONFIG.stableCount = traeConfig.stableCount;
    CONFIG.noStopMode = noStopMode;
    
    const versionName = traeConfig.version === 'international' ? '国际版 (Trae)' : '国内版 (Trae CN)';
    log(`📍 使用版本: ${versionName}`, 'blue');
    if (noStopMode) {
        log(`📍 模式: NoStop (忽略完成信号)`, 'magenta');
    }
    log(`📍 调试端口: ${CONFIG.port}`, 'blue');
    log('');
    
    try {
        let targetPort = CONFIG.port;
        let client = null;

        if (explicitPort) {
            log(`📡 连接到 Trae (${CONFIG.host}:${targetPort})...`, 'blue');
            client = await CDP({ port: targetPort, host: CONFIG.host });
        } else {
            const candidates = [CONFIG.port];
            for (let i = 1; i <= 20; i++) {
                candidates.push(CONFIG.port + i);
            }
            for (const port of candidates) {
                try {
                    client = await CDP({ port, host: CONFIG.host });
                    targetPort = port;
                    break;
                } catch (error) {
                }
            }
            if (!client) {
                throw new Error(`无法连接到可用 CDP 端口，起始端口: ${CONFIG.port}`);
            }
            if (targetPort !== CONFIG.port) {
                log(`📍 自动切换端口: ${targetPort}`, 'yellow');
            }
        }
        
        const { Runtime, Network, Page } = client;
        
        await Runtime.enable();
        await Network.enable();
        await Page.enable();
        
        log('✅ 已连接到 Trae', 'green');
        log('');
        
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
            selectors: selectorsScript,
            noStopMode: CONFIG.noStopMode
        });
        
        log('💉 正在注入 Ralph Loop...', 'blue');

        const wrappedScript = `
            (function() {
                const __RLOG = (...args) => console.log('[trae-ralph]', ...args);
                try {
                    __RLOG('🧩 注入脚本执行');
                } catch (e) {
                }
                if (window.__TRAE_RALPH_LOOP_INJECTED__) {
                    __RLOG('⚠️ Trae Ralph Loop 已注入，跳过');
                    if (typeof window.waitForRalphToggleButton === 'function') {
                        window.waitForRalphToggleButton();
                    } else if (typeof window.ensureRalphToggleButton === 'function') {
                        window.ensureRalphToggleButton();
                    }
                    return;
                }
                window.__TRAE_RALPH_LOOP_INJECTED__ = true;
                __RLOG('🚀 Trae Ralph Loop 已自动启动');
                ${ralphLoopScript}
                if (typeof window.waitForRalphToggleButton === 'function') {
                    window.waitForRalphToggleButton();
                } else if (typeof window.ensureRalphToggleButton === 'function') {
                    window.ensureRalphToggleButton();
                }
            })();
        `;

        let injectedCount = 0;
        const targets = await CDP.List({ host: CONFIG.host, port: targetPort });
        const pageTargets = targets.filter(t => t.type === 'page');
        const shouldInjectTarget = (targetInfo) => {
            if (!targetInfo || targetInfo.type !== 'page') {
                return false;
            }
            const url = String(targetInfo.url || '').toLowerCase();
            if (!url) {
                return false;
            }
            if (url.startsWith('devtools://') || url.startsWith('chrome-devtools://') || url.includes('devtools/bundled')) {
                return false;
            }
            return url.includes('workbench/workbench.html') || url.includes('workbench.html') || url.startsWith('vscode-file://vscode-app/');
        };
        const runnableTargets = pageTargets.filter(shouldInjectTarget);

        for (const target of runnableTargets) {
            let targetClient = null;
            try {
                targetClient = await CDP({
                    host: CONFIG.host,
                    port: targetPort,
                    target: target.id
                });
                const { Runtime: targetRuntime } = targetClient;
                const { Page: targetPage } = targetClient;
                await targetRuntime.enable();
                await targetPage.enable();
                await targetPage.addScriptToEvaluateOnNewDocument({
                    source: wrappedScript
                });
                const probe = await targetRuntime.evaluate({
                    expression: 'Boolean(window.__TRAE_RALPH_LOOP_INJECTED__)',
                    returnByValue: true
                });
                const alreadyInjected = !!(probe && probe.result && probe.result.value === true);
                if (alreadyInjected) {
                    await targetRuntime.evaluate({
                        expression: `
                            (function() {
                                if (typeof window.waitForRalphToggleButton === 'function') {
                                    window.waitForRalphToggleButton();
                                    return;
                                }
                                if (typeof window.ensureRalphToggleButton === 'function') {
                                    window.ensureRalphToggleButton();
                                }
                            })();
                        `,
                        returnByValue: true
                    });
                    continue;
                }
                const result = await targetRuntime.evaluate({
                    expression: wrappedScript,
                    returnByValue: true
                });
                if (!result.exceptionDetails) {
                    injectedCount++;
                }
            } catch (error) {
            } finally {
                if (targetClient) {
                    await targetClient.close();
                }
            }
        }

        if (injectedCount === 0) {
            await Page.addScriptToEvaluateOnNewDocument({
                source: wrappedScript
            });
            const result = await Runtime.evaluate({
                expression: wrappedScript,
                returnByValue: true
            });
            if (!result.exceptionDetails) {
                injectedCount = 1;
            }
        }

        if (injectedCount === 0) {
            throw new Error('未找到可注入窗口');
        }
        
        log('✅ 脚本注入成功！', 'green');
        log(`✅ 注入窗口数: ${injectedCount}`, 'green');
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
