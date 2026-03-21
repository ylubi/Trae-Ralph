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
const net = require('net');

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

const PROFILES_DIR = path.join(CONFIG_DIR, 'profiles');

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

const LOG_PREFIX = '[trae-ralph]';

function log(message, color = 'reset') {
    console.log(`${colors[color]}${LOG_PREFIX} ${message}${colors.reset}`);
}

function parseArgs() {
    const args = process.argv.slice(2);
    const result = {
        version: null,
        noStopMode: false,
        port: null,
        profileMode: 'hybrid',
        projectPath: null,
        foreground: false,
        monitorMode: false,
        host: null
    };

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--version' && args[i + 1]) {
            result.version = args[i + 1];
            i++;
            continue;
        }
        if (args[i] === '--nostop') {
            result.noStopMode = true;
            continue;
        }
        if (args[i] === '--port' && args[i + 1]) {
            const p = Number(args[i + 1]);
            if (Number.isInteger(p) && p > 0 && p < 65536) {
                result.port = p;
            }
            i++;
            continue;
        }
        if (args[i] === '--profile' && args[i + 1]) {
            const mode = String(args[i + 1]).toLowerCase();
            if (['hybrid', 'isolated', 'shared'].includes(mode)) {
                result.profileMode = mode;
            }
            i++;
            continue;
        }
        if (args[i] === '--project-path' && args[i + 1]) {
            result.projectPath = path.resolve(args[i + 1]);
            i++;
            continue;
        }
        if (args[i] === '--foreground') {
            result.foreground = true;
            continue;
        }
        if (args[i] === '--monitor') {
            result.monitorMode = true;
            continue;
        }
        if (args[i] === '--host' && args[i + 1]) {
            result.host = args[i + 1];
            i++;
            continue;
        }
        if (!args[i].startsWith('--') && !result.projectPath) {
            result.projectPath = path.resolve(args[i]);
        }
    }

    return result;
}

function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function isPortAvailable(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', () => resolve(false));
        server.once('listening', () => {
            server.close(() => resolve(true));
        });
        server.listen(port, '127.0.0.1');
    });
}

async function findAvailablePort(startPort, maxOffset = 50) {
    for (let i = 0; i <= maxOffset; i++) {
        const candidate = startPort + i;
        if (await isPortAvailable(candidate)) {
            return candidate;
        }
    }
    throw new Error(`未找到可用端口，起始端口: ${startPort}`);
}

function copyFileIfExists(src, dest) {
    try {
        if (!fs.existsSync(src)) {
            return;
        }
        ensureDir(path.dirname(dest));
        fs.copyFileSync(src, dest);
    } catch (error) {
    }
}

function copyDirRecursive(src, dest) {
    try {
        if (!fs.existsSync(src)) {
            return;
        }
        const stat = fs.statSync(src);
        if (!stat.isDirectory()) {
            return;
        }
        ensureDir(dest);
        const entries = fs.readdirSync(src, { withFileTypes: true });
        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);
            if (entry.isDirectory()) {
                copyDirRecursive(srcPath, destPath);
            } else if (entry.isFile()) {
                copyFileIfExists(srcPath, destPath);
            }
        }
    } catch (error) {
    }
}

function getExtensionsDir(version) {
    const candidates = process.platform === 'win32'
        ? [
            path.join(os.homedir(), '.trae', 'extensions'),
            path.join(os.homedir(), '.trae-cn', 'extensions'),
            path.join(os.homedir(), '.vscode', 'extensions')
        ]
        : [
            path.join(os.homedir(), '.trae', 'extensions'),
            path.join(os.homedir(), '.trae-cn', 'extensions'),
            path.join(os.homedir(), '.vscode', 'extensions')
        ];

    if (version === 'china') {
        candidates.unshift(
            process.platform === 'win32'
                ? path.join(os.homedir(), '.trae-cn', 'extensions')
                : path.join(os.homedir(), '.trae-cn', 'extensions')
        );
    }

    return candidates.find(p => fs.existsSync(p)) || null;
}

function getPrimaryUserDataDir(version) {
    const appData = process.env.APPDATA || '';
    const localAppData = process.env.LOCALAPPDATA || '';
    const candidates = process.platform === 'win32'
        ? (version === 'china'
            ? [
                path.join(appData, 'Trae CN'),
                path.join(localAppData, 'Trae CN', 'User Data'),
                path.join(appData, 'Trae')
            ]
            : [
                path.join(appData, 'Trae'),
                path.join(localAppData, 'Trae', 'User Data'),
                path.join(appData, 'Trae CN')
            ])
        : [
            path.join(os.homedir(), '.config', 'Trae'),
            path.join(os.homedir(), '.config', 'Trae CN')
        ];

    return candidates.find(p => fs.existsSync(p)) || null;
}

function syncHybridProfile(sourceDir, targetDir) {
    if (!sourceDir || !fs.existsSync(sourceDir)) {
        return;
    }

    ensureDir(targetDir);
    copyFileIfExists(path.join(sourceDir, 'User', 'settings.json'), path.join(targetDir, 'User', 'settings.json'));
    copyFileIfExists(path.join(sourceDir, 'User', 'keybindings.json'), path.join(targetDir, 'User', 'keybindings.json'));
    copyDirRecursive(path.join(sourceDir, 'User', 'snippets'), path.join(targetDir, 'User', 'snippets'));
    copyDirRecursive(path.join(sourceDir, 'User', 'workspaceStorage'), path.join(targetDir, 'User', 'workspaceStorage'));
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
    
    const cli = parseArgs();
    if (cli.host) {
        CONFIG.host = cli.host;
    }

    if (cli.monitorMode) {
        if (!cli.port) {
            log('❌ monitor 模式必须指定 --port', 'red');
            process.exit(1);
        }
        CONFIG.port = cli.port;
        log(`📍 Monitor 模式: ${CONFIG.host}:${CONFIG.port}`, 'blue');
        await injectScript({ monitorMode: true, background: false });
        return;
    }
    
    const traeConfig = getTraePath(cli.version);
    const selectedPort = cli.port || await findAvailablePort(traeConfig.port);
    const profileMode = cli.profileMode;
    const instanceProfileDir = path.join(PROFILES_DIR, traeConfig.version, `port-${selectedPort}`);
    const primaryUserDataDir = getPrimaryUserDataDir(traeConfig.version);
    const extensionsDir = getExtensionsDir(traeConfig.version);
    const hasProjectPath = !!cli.projectPath;
    
    CONFIG.port = selectedPort;
    CONFIG.traePath = traeConfig.path;
    CONFIG.checkInterval = traeConfig.checkInterval;
    CONFIG.stableCount = traeConfig.stableCount;
    CONFIG.startupDelay = traeConfig.startupDelay;
    CONFIG.noStopMode = cli.noStopMode;

    const versionName = traeConfig.version === 'international' ? '国际版 (Trae)' : '国内版 (Trae CN)';
    log(`📍 使用版本: ${versionName}`, 'blue');
    if (cli.noStopMode) {
        log(`📍 模式: NoStop (忽略完成信号)`, 'magenta');
    }
    log(`📍 Profile 模式: ${profileMode}`, 'blue');
    log(`📍 Trae 路径: ${traeConfig.path}`, 'blue');
    log(`📍 调试端口: ${selectedPort}`, 'blue');
    if (hasProjectPath) {
        log(`📍 项目目录: ${cli.projectPath}`, 'blue');
    } else {
        log('📍 启动目标: 空白窗口', 'blue');
    }
    log('');
    
    log('🚀 启动 Trae...', 'blue');
    
    const traeArgs = [`--remote-debugging-port=${selectedPort}`, '--new-window', '--disable-restore-windows'];
    if (profileMode !== 'shared') {
        ensureDir(instanceProfileDir);
        if (profileMode === 'hybrid') {
            syncHybridProfile(primaryUserDataDir, instanceProfileDir);
        }
        traeArgs.push(`--user-data-dir=${instanceProfileDir}`);
    }
    if (extensionsDir) {
        traeArgs.push(`--extensions-dir=${extensionsDir}`);
    }
    if (hasProjectPath) {
        if (!fs.existsSync(cli.projectPath) || !fs.statSync(cli.projectPath).isDirectory()) {
            log(`❌ 项目目录不存在或不是文件夹: ${cli.projectPath}`, 'red');
            process.exit(1);
        }
        traeArgs.push(cli.projectPath);
    }
    
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
    await injectScript({ monitorMode: false, background: !cli.foreground });
}

async function injectScript(options = { monitorMode: false, background: false }) {
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
            
            const { Runtime, Target, Page } = client;
            await Runtime.enable();
            await Page.enable();
            await Target.setDiscoverTargets({ discover: true });
            
            log('✅ 已连接', 'green');
            log('');
            
            // 加载选择器定义
            const selectorsScript = fs.readFileSync(
                path.join(__dirname, 'editor-api/selectors.js'), 
                'utf8'
            );

            // 构建 Ralph Loop 脚本
            log('🏗️ 构建 Ralph Loop 脚本...', 'blue');
            const { build } = require('./setup/builder');
            const script = build({
                checkInterval: CONFIG.checkInterval,
                stableCount: CONFIG.stableCount,
                selectors: selectorsScript,
                noStopMode: CONFIG.noStopMode
            });
            
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
                    
                    ${script}
                    if (typeof window.waitForRalphToggleButton === 'function') {
                        window.waitForRalphToggleButton();
                    } else if (typeof window.ensureRalphToggleButton === 'function') {
                        window.ensureRalphToggleButton();
                    }
                })();
            `;
            
            log('⏳ 等待页面加载...', 'yellow');
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            log('📝 注入脚本...', 'blue');

            let injectedCount = 0;
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
            const getTargetId = (targetInfo) => {
                if (!targetInfo) {
                    return null;
                }
                return targetInfo.id || targetInfo.targetId || null;
            };
            const attachToTarget = async (targetInfo) => {
                const targetId = getTargetId(targetInfo);
                const attachModes = [
                    async () => CDP({
                        host: CONFIG.host,
                        port: CONFIG.port,
                        target: targetId
                    }),
                    async () => CDP({
                        host: CONFIG.host,
                        port: CONFIG.port,
                        target: (targets) => targets.find(t => (t.id || t.targetId) === targetId)
                    }),
                    async () => CDP({
                        host: CONFIG.host,
                        port: CONFIG.port,
                        target: (targets) => targets.find(t => t.type === 'page' && t.url === targetInfo.url)
                    })
                ];
                for (const mode of attachModes) {
                    try {
                        const c = await mode();
                        if (c) {
                            return c;
                        }
                    } catch (error) {
                    }
                }
                throw new Error(`无法附着到目标: ${targetId}`);
            };
            const injectToTarget = async (targetInfo, source = 'unknown') => {
                const targetId = getTargetId(targetInfo);
                if (!targetId || !shouldInjectTarget(targetInfo)) {
                    return false;
                }
                let targetClient = null;
                try {
                    targetClient = await attachToTarget(targetInfo);
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
                        return false;
                    }
                    const result = await targetRuntime.evaluate({
                        expression: wrappedScript,
                        returnByValue: true
                    });
                    if (result.exceptionDetails) {
                        log(`⚠️ 目标注入异常: ${targetId} (${source})`, 'yellow');
                        return false;
                    }
                    log(`✅ 已注入目标: ${targetId} (${source}) ${targetInfo.url || ''}`, 'green');
                    return true;
                } catch (error) {
                    log(`⚠️ 注入失败目标: ${targetId} (${source}) ${error.message || error}`, 'yellow');
                    return false;
                } finally {
                    if (targetClient) {
                        await targetClient.close();
                    }
                }
            };

            const targets = await CDP.List({ host: CONFIG.host, port: CONFIG.port });
            const pageTargets = targets.filter(t => t.type === 'page');
            log(`📊 扫描到 page targets: ${pageTargets.length}`, 'blue');
            const runnableTargets = pageTargets.filter(shouldInjectTarget);
            log(`📊 可注入 workbench targets: ${runnableTargets.length}`, 'blue');

            for (const target of runnableTargets) {
                if (await injectToTarget(target, 'initial-scan')) {
                    injectedCount++;
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

            if (injectedCount > 0) {
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
                log('🛰️ 已启动目标监控，项目切换后会自动重注入', 'cyan');
                log('🛑 按 Ctrl+C 可停止监控', 'yellow');
            } else {
                log('❌ 注入失败: 未找到可注入窗口', 'red');
            }

            Target.targetCreated(async ({ targetInfo }) => {
                if (!targetInfo || targetInfo.type !== 'page') {
                    return;
                }
                const createdTargetId = targetInfo.targetId || targetInfo.id;
                if (!shouldInjectTarget(targetInfo)) {
                    log(`⏭️ 跳过非 workbench 目标: ${createdTargetId} ${targetInfo.url || ''}`, 'yellow');
                    return;
                }
                log(`🆕 发现新目标: ${createdTargetId} ${targetInfo.url || ''}`, 'cyan');
                setTimeout(async () => {
                    await injectToTarget(targetInfo, 'target-created');
                }, 1000);
            });

            let scanErrorCount = 0;
            const watcherInterval = setInterval(async () => {
                try {
                    const list = await CDP.List({ host: CONFIG.host, port: CONFIG.port });
                    const pages = list.filter(t => t.type === 'page');
                    for (const p of pages) {
                        if (!shouldInjectTarget(p)) {
                            continue;
                        }
                        await injectToTarget(p, 'periodic-scan');
                    }
                    scanErrorCount = 0;
                } catch (error) {
                    log(`⚠️ 目标扫描失败: ${error.message || error}`, 'yellow');
                    if (String(error && error.message || error).includes('ECONNREFUSED')) {
                        scanErrorCount++;
                        if (scanErrorCount >= 10) {
                            log('❌ ECONNREFUSED 达到 10 次，停止监控并退出', 'red');
                            clearInterval(watcherInterval);
                            await client.close();
                            process.exit(1);
                        }
                    }
                }
            }, 3000);

            process.on('SIGINT', async () => {
                clearInterval(watcherInterval);
                await client.close();
                process.exit(0);
            });

            if (options.background && !options.monitorMode) {
                const monitorArgs = [
                    __filename,
                    '--monitor',
                    '--port', String(CONFIG.port),
                    '--host', CONFIG.host
                ];
                const monitorProcess = spawn(process.execPath, monitorArgs, {
                    detached: true,
                    stdio: 'ignore',
                    windowsHide: true
                });
                monitorProcess.unref();
                clearInterval(watcherInterval);
                await client.close();
                log(`✅ 后台监控已启动 (PID: ${monitorProcess.pid || 'unknown'})`, 'green');
                return;
            }

            return await new Promise(() => {});
            
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
