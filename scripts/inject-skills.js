const fs = require('fs');
const path = require('path');

// 获取命令行参数
const args = process.argv.slice(2);

// 解析参数：支持 --skill-type 选项
let skillType = null;
let skillName = null;
let targetProjectPath = null;
let injectAll = false;

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--skill-type' && args[i + 1]) {
        skillType = args[i + 1];
        i++;
    } else if (!args[i].startsWith('--')) {
        if (!skillName && !targetProjectPath) {
            // 第一个非选项参数可能是 skill 名或路径
            if (skillType) {
                // 如果指定了 skill-type，这个参数就是路径
                targetProjectPath = args[i];
            } else {
                // 否则先暂定为 skill 名
                skillName = args[i];
            }
        } else if (!targetProjectPath) {
            targetProjectPath = args[i];
        }
    }
}

// 如果没有指定 skill-type 且只有一个参数，默认为目标路径，执行全部注入
if (!skillType && skillName && !targetProjectPath) {
    targetProjectPath = skillName;
    skillName = null;
    injectAll = true;
}

// 如果指定了 skill-type，也执行全部注入（但只注入该类型）
if (skillType && targetProjectPath) {
    injectAll = true;
}

if (!targetProjectPath) {
    console.error('❌ 参数错误');
    console.error('用法 1 (注入单个): npm run skills:inject -- <skill-name> <target-project-path>');
    console.error('用法 2 (注入全部): npm run skills:inject -- <target-project-path>');
    console.error('用法 3 (按类型注入): npm run skills:inject -- --skill-type <type> <target-project-path>');
    console.error('示例：npm run skills:inject -- C:\\work\\tools\\test\\test-009');
    console.error('示例：npm run skills:inject -- --skill-type web C:\\work\\tools\\test\\test-009');
    console.error('可用类型：web, common');
    process.exit(1);
}

const templatesDir = path.resolve(__dirname, '../templates/skills');

// 定义 skill 类型映射
const skillTypeMapping = {
    'web': ['ralph-web-architecture', 'ralph-web-requirement', 'ralph-web-routine', 'ralph-web-task-planner', 'ralph-web-test-plan'],
    'common': ['ralph-planner', 'ralph-round-initializer', 'ralph-func-analyst', 'ralph-task-executor', 'ralph-test-executor', 'ralph-state-manager']
};

// 主执行流程
if (injectAll) {
    if (skillType) {
        console.log(`🚀 开始批量注入 ${skillType} 类型 Skills 到：${targetProjectPath}`);
    } else {
        console.log(`🚀 开始批量注入所有 Skills 到：${targetProjectPath}`);
    }
    
    if (!fs.existsSync(templatesDir)) {
        console.error(`❌ 找不到 Skills 模板目录：${templatesDir}`);
        process.exit(1);
    }

    // 获取所有可用的 skill 目录（包括子目录中的）
    const allSkills = [];
    
    // 递归查找所有 skill 目录
    function findSkillDirs(dir, relativePath = '') {
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const relPath = path.join(relativePath, item);
            const stats = fs.statSync(fullPath);
            
            if (stats.isDirectory()) {
                // 检查是否是 skill 目录（包含 SKILL.md 文件）
                const skillMdPath = path.join(fullPath, 'SKILL.md');
                if (fs.existsSync(skillMdPath) && fs.statSync(skillMdPath).isFile()) {
                    allSkills.push({
                        name: item,
                        path: fullPath,
                        relativePath: relPath
                    });
                } else {
                    // 递归查找子目录
                    findSkillDirs(fullPath, relPath);
                }
            }
        }
    }
    
    findSkillDirs(templatesDir);

    if (allSkills.length === 0) {
        console.warn('⚠️ 模板目录中没有找到任何 Skill 文件夹');
        process.exit(0);
    }

    // 根据 skill-type 过滤
    let skillsToInject = allSkills;
    if (skillType) {
        if (skillTypeMapping[skillType]) {
            // 只注入指定类型的 skills
            skillsToInject = allSkills.filter(skill => skillTypeMapping[skillType].includes(skill.name));
            console.log(`📋 将注入 ${skillsToInject.length} 个 ${skillType} 类型 skills: ${skillsToInject.map(s => s.name).join(', ')}`);
        } else {
            console.error(`❌ 不支持的 skill 类型：${skillType}`);
            console.error(`可用类型：${Object.keys(skillTypeMapping).join(', ')}`);
            process.exit(1);
        }
    }

    if (skillsToInject.length === 0) {
        console.warn(`⚠️ 没有找到 ${skillType} 类型的 skills`);
        process.exit(0);
    }

    let successCount = 0;
    skillsToInject.forEach(skill => {
        try {
            injectSingleSkill(skill.name, skill.path, targetProjectPath);
            successCount++;
        } catch (err) {
            console.error(`❌ 注入 Skill [${skill.name}] 失败:`, err.message);
        }
    });

    console.log(`\n✨ 批量注入完成！成功：${successCount}/${skillsToInject.length}`);

} else {
    // 单个注入 - 需要查找 skill 的路径
    let skillPath = null;
    
    function findSkillDir(dir, skillName) {
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stats = fs.statSync(fullPath);
            
            if (stats.isDirectory()) {
                if (item === skillName) {
                    const skillMdPath = path.join(fullPath, 'SKILL.md');
                    if (fs.existsSync(skillMdPath) && fs.statSync(skillMdPath).isFile()) {
                        return fullPath;
                    }
                }
                const found = findSkillDir(fullPath, skillName);
                if (found) return found;
            }
        }
        return null;
    }
    
    skillPath = findSkillDir(templatesDir, skillName);
    
    if (!skillPath) {
        console.error(`❌ 找不到 Skill: ${skillName}`);
        process.exit(1);
    }
    
    injectSingleSkill(skillName, skillPath, targetProjectPath);
}


/**
 * 注入单个 Skill 的核心函数 (文件夹复制模式)
 * 1. 完整复制 Skill 文件夹下的所有文件
 * 2. 确保存在 SKILL.md 入口文件 (如果原名是 00-skill-manifest.md 则重命名)
 * 3. 确保 SKILL.md 包含 YAML Frontmatter (Trae 规范要求)
 * @param {string} name - Skill 名称 (文件夹名)
 * @param {string} sourceDir - Skill 源目录路径
 * @param {string} targetRoot - 目标项目根目录
 */
function injectSingleSkill(name, sourceDir, targetRoot) {
    const targetDir = path.resolve(targetRoot, '.trae/skills', name);
    
    // 1. 验证源是否存在
    if (!fs.existsSync(sourceDir)) {
        throw new Error(`找不到 Skill 模板目录：${sourceDir}`);
    }

    // 2. 确保目标目录存在
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    // 3. 复制所有文件
    const items = fs.readdirSync(sourceDir).sort();
    let copiedCount = 0;
    let hasAssets = false;
    
    // 识别 manifest 文件
    let manifestFile = items.find(f => f === 'SKILL.md');
    if (!manifestFile) {
        manifestFile = items.find(f => f.includes('manifest') || f.startsWith('00'));
    }

    for (const item of items) {
        const sourcePath = path.join(sourceDir, item);
        const stats = fs.statSync(sourcePath);
        
        // 处理子目录 (递归复制)
        if (stats.isDirectory()) {
            const destPath = path.join(targetDir, item);
            copyRecursive(sourcePath, destPath);
            hasAssets = true;
            copiedCount++;
            continue;
        }

        // 处理文件
        let destFileName = item;
        let isManifest = (item === manifestFile);

        // 如果是 manifest 文件，目标文件名强制为 SKILL.md
        if (isManifest && item !== 'SKILL.md') {
            destFileName = 'SKILL.md';
        }

        const destPath = path.join(targetDir, destFileName);

        if (isManifest && path.extname(item) === '.md') {
            // 对入口文件进行特殊处理：检查 Frontmatter
            let content = fs.readFileSync(sourcePath, 'utf8');
            if (!content.trim().startsWith('---')) {
                const frontmatter = `---\nname: "${name}"\ndescription: "Auto-injected skill: ${name}"\n---\n\n`;
                content = frontmatter + content;
            }
            fs.writeFileSync(destPath, content, 'utf8');
        } else {
            // 其他文件直接复制
            fs.copyFileSync(sourcePath, destPath);
        }
        copiedCount++;
    }

    // 合并输出一行信息
    const assetsInfo = hasAssets ? ' + assets' : '';
    console.log(`✅ ${name}${assetsInfo} (${copiedCount} 个文件)`);
}

/**
 * 递归复制目录
 */
function copyRecursive(src, dest) {
    if (fs.statSync(src).isDirectory()) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        fs.readdirSync(src).forEach(child => {
            copyRecursive(path.join(src, child), path.join(dest, child));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}
