const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const targetProjectDir = process.argv[2];

if (!targetProjectDir) {
  console.error('❌ 请提供目标项目路径');
  console.error('用法: npm run templates:inject -- <target-project-path>');
  process.exit(1);
}

const absoluteTargetDir = path.resolve(targetProjectDir);
console.log(`🚀 开始向项目注入所有模板 (Rules + Skills): ${absoluteTargetDir}`);

try {
  // 1. Inject Rules
  console.log('\n📦 [1/2] Injecting Rules...');
  const rulesScript = path.join(__dirname, 'inject-rules.js');
  execSync(`node "${rulesScript}" "${absoluteTargetDir}"`, { stdio: 'inherit' });

  // 2. Inject Skills
  console.log('\n📦 [2/2] Injecting Skills...');
  const skillsScript = path.join(__dirname, 'inject-skills.js');
  execSync(`node "${skillsScript}" "${absoluteTargetDir}"`, { stdio: 'inherit' });

  console.log('\n✨ 所有模板注入完成！');
  console.log(`👉 请在目标项目中检查 .trae/rules 和 .trae/skills 目录`);

} catch (error) {
  console.error('\n❌ 注入过程中发生错误:', error.message);
  process.exit(1);
}
