#!/usr/bin/env node

/**
 * Trae Ralph Loop CDP - 配置向导
 * 
 * 帮助用户找到并配置 Trae 路径，支持国际版和国内版
 * 
 * 功能：
 * - 自动搜索常见 Trae 安装路径
 * - 交互式配置界面
 * - 快速配置命令行参数支持
 * - 生成配置文件到 ~/.trae-ralph/config.json
 * 
 * 使用方法：
 *   npm run config                                    # 交互式配置
 *   npm run config -- --trae-path "Trae.exe"         # 快速配置国际版
 *   npm run config -- --cn --trae-path "Trae CN.exe" # 快速配置国内版
 * 
 * @author Trae Ralph Loop Team
 * @license MIT
 * @see https://github.com/your-username/trae-ralph
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');
const os = require('os');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

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

function question(prompt) {
    return new Promise(resolve => {
        rl.question(prompt, resolve);
    });
}

// 配置目录
const CONFIG_DIR = path.join(os.homedir(), '.trae-ralph');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// 解析命令行参数
function parseArgs() {
    const args = process.argv.slice(2);
    const result = {
        version: null,  // 'international' 或 'china'
        traePath: null,
        interactive: true
    };
    
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--cn' || args[i] === '--china') {
            result.version = 'china';
            result.interactive = false;
        } else if (args[i] === '--international' || args[i] === '--int') {
            result.version = 'international';
            result.interactive = false;
        } else if (args[i] === '--trae-path' && args[i + 1]) {
            result.traePath = args[i + 1];
            result.interactive = false;
            i++; // 跳过下一个参数
        }
    }
    
    // 如果只指定了路径没指定版本，默认为国际版
    if (result.traePath && !result.version) {
        result.version = 'international';
    }
    
    return result;
}

// 确保配置目录存在
function ensureConfigDir() {
    if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
        log(`✅ 已创建配置目录: ${CONFIG_DIR}`, 'green');
    }
}

// 常见的 Trae 安装路径
const COMMON_PATHS = {
    win32: {
        international: [
            'C:\\Program Files\\Trae\\Trae.exe',
            'C:\\Program Files (x86)\\Trae\\Trae.exe',
            path.join(process.env.LOCALAPPDATA || '', 'Programs\\Trae\\Trae.exe'),
            path.join(process.env.APPDATA || '', 'Trae\\Trae.exe')
        ],
        china: [
            'C:\\Program Files\\Trae CN\\Trae CN.exe',
            'C:\\Program Files (x86)\\Trae CN\\Trae CN.exe',
            'D:\\Program Files\\Trae CN\\Trae CN.exe',
            'D:\\Program Files (x86)\\Trae CN\\Trae CN.exe',
            path.join(process.env.LOCALAPPDATA || '', 'Programs\\Trae CN\\Trae CN.exe'),
            path.join(process.env.APPDATA || '', 'Trae CN\\Trae CN.exe')
        ]
    },
    darwin: {
        international: [
            '/Applications/Trae.app/Contents/MacOS/Trae',
            path.join(process.env.HOME || '', 'Applications/Trae.app/Contents/MacOS/Trae')
        ],
        china: [
            '/Applications/Trae CN.app/Contents/MacOS/Trae CN',
            path.join(process.env.HOME || '', 'Applications/Trae CN.app/Contents/MacOS/Trae CN')
        ]
    },
    linux: {
        international: [
            '/usr/bin/trae',
            '/usr/local/bin/trae',
            '/opt/trae/trae',
            path.join(process.env.HOME || '', '.local/bin/trae')
        ],
        china: [
            '/usr/bin/trae-cn',
            '/usr/local/bin/trae-cn',
            '/opt/trae-cn/trae-cn',
            path.join(process.env.HOME || '', '.local/bin/trae-cn')
        ]
    }
};

function searchTraePath(version = 'both') {
    const platform = process.platform;
    const paths = COMMON_PATHS[platform] || { international: [], china: [] };
    
    log('🔍 搜索 Trae 安装路径...', 'blue');
    log('');
    
    const found = {
        international: [],
        china: []
    };
    
    // 搜索国际版
    if (version === 'both' || version === 'international') {
        log('搜索国际版 (Trae)...', 'cyan');
        for (const p of paths.international) {
            if (fs.existsSync(p)) {
                found.international.push(p);
                log(`  ✅ 找到: ${p}`, 'green');
            }
        }
    }
    
    // 搜索国内版
    if (version === 'both' || version === 'china') {
        log('搜索国内版 (Trae CN)...', 'cyan');
        for (const p of paths.china) {
            if (fs.existsSync(p)) {
                found.china.push(p);
                log(`  ✅ 找到: ${p}`, 'green');
            }
        }
    }
    
    // 尝试从 PATH 查找
    try {
        let command;
        if (platform === 'win32') {
            command = 'where trae.exe';
        } else {
            command = 'which trae';
        }
        
        const result = execSync(command, { encoding: 'utf8' }).trim();
        if (result && !found.international.includes(result)) {
            found.international.push(result);
            log(`  ✅ 在 PATH 中找到国际版: ${result}`, 'green');
        }
    } catch (error) {
        // 忽略错误
    }
    
    // 查找国内版
    try {
        let command;
        if (platform === 'win32') {
            command = 'where "trae cn.exe"';
        } else {
            command = 'which trae-cn';
        }
        
        const result = execSync(command, { encoding: 'utf8' }).trim();
        if (result && !found.china.includes(result)) {
            found.china.push(result);
            log(`  ✅ 在 PATH 中找到国内版: ${result}`, 'green');
        }
    } catch (error) {
        // 忽略错误
    }
    
    log('');
    return found;
}

async function selectVersion() {
    log('请选择 Trae 版本：', 'yellow');
    log('');
    log('1. 国际版 (Trae)');
    log('2. 国内版 (Trae CN)');
    log('3. 两个都配置');
    log('');
    
    const choice = await question('请选择 (1-3): ');
    
    switch (choice) {
        case '1':
            return 'international';
        case '2':
            return 'china';
        case '3':
            return 'both';
        default:
            log('❌ 无效选择，默认选择国际版', 'yellow');
            return 'international';
    }
}

async function configurePath(version, foundPaths) {
    const versionName = version === 'international' ? '国际版 (Trae)' : '国内版 (Trae CN)';
    
    log(`\n配置 ${versionName}`, 'cyan');
    log('');
    
    let traePath;
    
    if (foundPaths.length === 0) {
        log(`❌ 未找到 ${versionName}`, 'red');
        log('');
        log('请手动输入 Trae 的完整路径：', 'yellow');
        log('');
        log('示例：', 'blue');
        if (version === 'international') {
            log('  Windows: C:\\Program Files\\Trae\\Trae.exe');
            log('  Mac:     /Applications/Trae.app/Contents/MacOS/Trae');
            log('  Linux:   /usr/bin/trae');
        } else {
            log('  Windows: C:\\Program Files\\Trae CN\\Trae CN.exe');
            log('  Mac:     /Applications/Trae CN.app/Contents/MacOS/Trae CN');
            log('  Linux:   /usr/bin/trae-cn');
        }
        log('');
        
        traePath = await question('Trae 路径 (留空跳过): ');
        
        if (!traePath) {
            log(`⚠️ 跳过 ${versionName} 配置`, 'yellow');
            return null;
        }
        
        if (!fs.existsSync(traePath)) {
            log('', 'red');
            log(`❌ 路径不存在: ${traePath}`, 'red');
            log('');
            return null;
        }
        
    } else if (foundPaths.length === 1) {
        traePath = foundPaths[0];
        log(`✅ 将使用: ${traePath}`, 'green');
        
    } else {
        log(`找到多个 ${versionName} 安装：`, 'yellow');
        log('');
        
        foundPaths.forEach((p, i) => {
            log(`  ${i + 1}. ${p}`);
        });
        
        log('');
        const choice = await question(`请选择 (1-${foundPaths.length}): `);
        const index = parseInt(choice) - 1;
        
        if (index >= 0 && index < foundPaths.length) {
            traePath = foundPaths[index];
        } else {
            log('❌ 无效的选择', 'red');
            return null;
        }
    }
    
    log('');
    log(`✅ ${versionName} 路径已确认:`, 'green');
    log(`   ${traePath}`, 'cyan');
    
    return traePath;
}

// 加载现有配置
function loadExistingConfig() {
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        } catch (error) {
            return null;
        }
    }
    return null;
}

// 快速配置（命令行参数）
async function quickConfig(version, traePath) {
    log('🚀 Trae Ralph Loop 快速配置', 'cyan');
    log('');
    
    // 确保配置目录存在
    ensureConfigDir();
    
    // 验证路径
    if (!fs.existsSync(traePath)) {
        log(`❌ 路径不存在: ${traePath}`, 'red');
        log('');
        log('💡 请检查路径是否正确', 'yellow');
        rl.close();
        process.exit(1);
    }
    
    const versionName = version === 'international' ? '国际版 (Trae)' : '国内版 (Trae CN)';
    log(`📍 配置 ${versionName}`, 'blue');
    log(`📍 路径: ${traePath}`, 'blue');
    log('');
    
    // 加载现有配置或创建新配置
    let config = loadExistingConfig() || {
        version: '1.0.0',
        trae: {},
        defaultVersion: version
    };
    
    // 更新指定版本的配置
    const port = version === 'international' ? 9222 : 9223;
    config.trae[version] = {
        path: traePath,
        port: port,
        checkInterval: 5000,
        stableCount: 3,
        startupDelay: 5000
    };
    
    // 如果是第一次配置，设置为默认版本
    if (!config.defaultVersion) {
        config.defaultVersion = version;
    }
    
    // 移除旧格式的顶层配置字段
    delete config.port;
    delete config.checkInterval;
    delete config.stableCount;
    delete config.startupDelay;
    
    log('✅ 配置完成！', 'green');
    log('');
    log('配置摘要：', 'cyan');
    if (config.trae.international) {
        log(`  国际版: ${config.trae.international.path}`, 'blue');
        log(`    端口: ${config.trae.international.port}`, 'blue');
    }
    if (config.trae.china) {
        log(`  国内版: ${config.trae.china.path}`, 'blue');
        log(`    端口: ${config.trae.china.port}`, 'blue');
    }
    log(`  默认版本: ${config.defaultVersion === 'international' ? '国际版' : '国内版'}`, 'blue');
    log(`  配置文件: ${CONFIG_FILE}`, 'blue');
    log('');
    
    // 保存配置
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    
    log('✅ 配置已保存', 'green');
    log('');
    log('现在可以运行：', 'yellow');
    if (version === 'international') {
        log('  npm start              - 启动国际版', 'white');
    } else {
        log('  npm run start:cn       - 启动国内版', 'white');
    }
    log('');
    
    rl.close();
}

async function configure() {
    log('🚀 Trae Ralph Loop 配置向导', 'cyan');
    log('');
    log(`📁 配置目录: ${CONFIG_DIR}`, 'blue');
    log('');
    
    // 确保配置目录存在
    ensureConfigDir();
    
    // 选择版本
    const versionChoice = await selectVersion();
    
    // 搜索 Trae
    const foundPaths = searchTraePath(versionChoice);
    
    const config = {
        version: '1.0.0',
        trae: {},
        port: 9222,
        checkInterval: 5000,
        stableCount: 3,
        startupDelay: 5000
    };
    
    // 配置国际版
    if (versionChoice === 'international' || versionChoice === 'both') {
        const path = await configurePath('international', foundPaths.international);
        if (path) {
            config.trae.international = {
                path: path,
                port: 9222,
                checkInterval: 5000,
                stableCount: 3,
                startupDelay: 5000
            };
        }
    }
    
    // 配置国内版
    if (versionChoice === 'china' || versionChoice === 'both') {
        const path = await configurePath('china', foundPaths.china);
        if (path) {
            config.trae.china = {
                path: path,
                port: 9223,  // 使用不同的端口
                checkInterval: 5000,
                stableCount: 3,
                startupDelay: 5000
            };
        }
    }
    
    // 检查是否至少配置了一个版本
    if (!config.trae.international && !config.trae.china) {
        log('');
        log('❌ 未配置任何 Trae 版本', 'red');
        log('');
        rl.close();
        process.exit(1);
    }
    
    // 设置默认版本
    if (config.trae.international && !config.trae.china) {
        config.defaultVersion = 'international';
    } else if (config.trae.china && !config.trae.international) {
        config.defaultVersion = 'china';
    } else {
        log('');
        log('请选择默认启动版本：', 'yellow');
        log('1. 国际版 (Trae)');
        log('2. 国内版 (Trae CN)');
        log('');
        const choice = await question('请选择 (1-2): ');
        config.defaultVersion = choice === '2' ? 'china' : 'international';
    }
    
    log('');
    log('✅ 配置完成！', 'green');
    log('');
    log('配置摘要：', 'cyan');
    if (config.trae.international) {
        log(`  国际版: ${config.trae.international.path}`, 'blue');
        log(`    端口: ${config.trae.international.port}`, 'blue');
    }
    if (config.trae.china) {
        log(`  国内版: ${config.trae.china.path}`, 'blue');
        log(`    端口: ${config.trae.china.port}`, 'blue');
    }
    log(`  默认版本: ${config.defaultVersion === 'international' ? '国际版' : '国内版'}`, 'blue');
    log(`  配置文件: ${CONFIG_FILE}`, 'blue');
    log('');
    
    // 保存配置
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    
    log('✅ 配置已保存', 'green');
    log('');
    
    // 询问是否测试
    const test = await question('是否立即测试启动？(y/n): ');
    
    if (test.toLowerCase() === 'y') {
        log('');
        log('🚀 测试启动 Trae...', 'blue');
        log('');
        
        rl.close();
        
        // 运行 launcher
        require('./launcher.js');
    } else {
        log('');
        log('现在可以运行：', 'yellow');
        log('  npm start              - 启动默认版本');
        log('  npm start -- --version international  - 启动国际版');
        log('  npm start -- --version china         - 启动国内版');
        log('');
        
        rl.close();
    }
}

// 主入口
async function main() {
    const args = parseArgs();
    
    if (args.interactive) {
        // 交互式配置
        await configure();
    } else {
        // 快速配置
        if (!args.traePath) {
            log('❌ 缺少 --trae-path 参数', 'red');
            log('');
            log('使用方法：', 'yellow');
            log('  npm run config -- --trae-path "Trae.exe"         # 配置国际版', 'white');
            log('  npm run config -- --cn --trae-path "Trae CN.exe" # 配置国内版', 'white');
            log('');
            rl.close();
            process.exit(1);
        }
        
        await quickConfig(args.version, args.traePath);
    }
}

// 运行配置向导
main().catch(error => {
    log('❌ 配置失败:', 'red');
    console.error(error);
    rl.close();
    process.exit(1);
});
