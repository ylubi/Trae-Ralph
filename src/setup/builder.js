// ============================================
// Trae Ralph Loop - 构建器
// ============================================
//
// 功能：
// 1. 读取 src/ralph 下的所有模块文件
// 2. 将它们合并为一个可以直接注入浏览器的 JS 文件
// 3. 处理 CommonJS 的 require/module.exports 语法，使其在浏览器中运行
// 4. 注入配置参数 (checkInterval, stableCount, scenarios, selectors)
//
// ============================================

const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.join(__dirname, '..', 'ralph');
const ORDER = [
    'config.js',
    'utils.js',
    'dom.js',
    'status.js',
    'actions.js',
    'scenarios/defs/reply.js',
    'scenarios/defs/terminal.js',
    'scenarios/defs/click.js',
    'scenarios/defs/restart.js',
    'scenarios/index.js',
    'trae-agent-task-manager.js',
    'main.js',
    'debug.js',
    'index.js'
];

function build(options = {}) {
    console.log('🏗️ 开始构建 Ralph Loop...');
    
    let bundle = '// Trae Ralph Loop - Bundled Script\n';
    bundle += '// Generated at: ' + new Date().toISOString() + '\n\n';
    
    // 添加一个简单的模块加载器模拟
    bundle += `
const modules = {};
const require = (name) => {
    // 简单的模块解析
    const key = name.replace('./', '').replace('.js', '');
    if (modules[key]) return modules[key];
    
    // 尝试后缀匹配 (处理嵌套引用，如 ./defs/reply -> scenarios/defs/reply)
    const suffixMatch = Object.keys(modules).find(k => k.endsWith('/' + key) || k === key);
    if (!suffixMatch) {
        console.warn(\`[RalphRequire] ⚠️ Module not found: \${name} (key: \${key})\`);
        console.log('[RalphRequire] Available modules:', Object.keys(modules));
    }
    return suffixMatch ? modules[suffixMatch] : undefined;
};
const module = { exports: {} };

// 定义模块注册函数
function defineModule(name, fn) {
    // console.log(\`[RalphLoader] Defining module: \${name}\`);
    const module = { exports: {} };
    try {
        fn(require, module, module.exports);
        modules[name] = module.exports;
        // console.log(\`[RalphLoader] ✅ Module defined: \${name}\`);
    } catch (e) {
        console.error(\`[RalphLoader] ❌ Error defining module \${name}:\`, e);
    }
}
\n`;

    for (const file of ORDER) {
        const filePath = path.join(SOURCE_DIR, file);
        if (fs.existsSync(filePath)) {
            console.log(`📦 打包: ${file}`);
            let content = fs.readFileSync(filePath, 'utf8');
            
            // 移除头部注释（可选）
            // content = content.replace(/\/\/ =+[\s\S]*?\/\/ =+\n/, '');

            const moduleName = file.replace('.js', '');
            
            // 包装在 defineModule 中
            bundle += `// File: ${file}\n`;
            bundle += `defineModule('${moduleName}', function(require, module, exports) {\n`;
            bundle += content;
            bundle += `\n});\n\n`;
        } else {
            console.warn(`⚠️ 文件不存在: ${file}`);
        }
    }
    
    // 注入配置
    if (options.checkInterval) {
        console.log(`⚙️ 配置 checkInterval: ${options.checkInterval}`);
        bundle = bundle.replace('checkInterval: 5000', `checkInterval: ${options.checkInterval}`);
    }
    
    if (options.stableCount) {
        console.log(`⚙️ 配置 stableCount: ${options.stableCount}`);
        bundle = bundle.replace('stableCount: 3', `stableCount: ${options.stableCount}`);
    }

    if (options.noStopMode) {
        console.log(`⚙️ 配置 noStopMode: ${options.noStopMode}`);
        bundle = bundle.replace('noStopMode: false', `noStopMode: ${options.noStopMode}`);
    }
    
    if (options.selectors) {
        console.log('⚙️ 注入选择器定义');
        // selectors 是一个 JS 代码字符串，我们需要将其作为字符串注入
        bundle = bundle.replace(
            'const SELECTORS_PLACEHOLDER = null;', 
            `const SELECTORS_PLACEHOLDER = ${JSON.stringify(options.selectors)};`
        );
    }
    
    return bundle;
}

// 如果直接运行
if (require.main === module) {
    // 确保目录存在
    // 这里我们只是输出内容
    console.log(build());
}

module.exports = { build };
