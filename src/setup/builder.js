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
    'detector.js',
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
    return modules[key];
};
const module = { exports: {} };

// 定义模块注册函数
function defineModule(name, fn) {
    const module = { exports: {} };
    fn(require, module, module.exports);
    modules[name] = module.exports;
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
    
    if (options.scenarios) {
        console.log('⚙️ 注入场景配置');
        const scenariosJson = JSON.stringify(options.scenarios, null, 2);
        // 使用 JSON.stringify 的结果，并确保替换安全
        // 注意：这里假设代码中存在 "const SCENARIOS_PLACEHOLDER = null;"
        bundle = bundle.replace(
            'const SCENARIOS_PLACEHOLDER = null;', 
            `const SCENARIOS_PLACEHOLDER = ${scenariosJson};`
        );
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
