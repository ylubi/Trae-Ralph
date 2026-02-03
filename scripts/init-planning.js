const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const targetProjectDir = process.argv[2];

if (!targetProjectDir) {
  console.error('❌ 请提供目标项目路径');
  console.error('用法: node scripts/init-planning.js <target-project-path>');
  process.exit(1);
}

const absoluteTargetDir = path.resolve(targetProjectDir);
const sourceTemplatesDir = path.resolve(__dirname, '../templates/planning');

// 定义目标目录
// 引用层 (Reference): 存放只读标准模板，每次都会更新
const targetReferenceDir = path.join(absoluteTargetDir, '.trae/ralph-assets/templates');

console.log(`🚀 开始初始化需求规划环境: ${absoluteTargetDir}`);

// 确保引用层目录存在
if (!fs.existsSync(targetReferenceDir)) {
  fs.mkdirSync(targetReferenceDir, { recursive: true });
  console.log(`✅ 创建目录: ${path.relative(absoluteTargetDir, targetReferenceDir)}`);
}

// ---------------------------------------------------------
// 阶段 1: 安装/更新标准模板库 (Reference Layer)
// 策略: 强制覆盖 (Force Update)，确保项目始终拥有最新标准
// ---------------------------------------------------------
console.log('📦 [1/2] 更新标准模板库 (.trae/ralph-assets)...');

// 自动扫描并复制所有 .md 文件
const files = fs.readdirSync(sourceTemplatesDir);
files.forEach(file => {
  if (path.extname(file) === '.md') {
    const src = path.join(sourceTemplatesDir, file);
    const dest = path.join(targetReferenceDir, file);

    fs.copyFileSync(src, dest);
    // console.log(`  -> 更新: ${file}`);
  }
});
console.log(`✅ 已同步 ${files.length} 个模板文件`);

// ---------------------------------------------------------
// 阶段 2: 注入 Ralph 规则
// ---------------------------------------------------------
const injectScript = path.resolve(__dirname, 'inject-rules.js');
try {
  console.log('🔄 [2/2] 注入 Ralph 规则...');
  execSync(`node "${injectScript}" "${absoluteTargetDir}"`, { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Ralph 规则注入失败', error);
}

console.log(`
🎉 初始化完成！

请在 Trae Chat 中告诉 Agent：
> "我想做一个[你的想法]"

Agent 将会自动为你创建 docs/planning 目录并生成方案。
`);
