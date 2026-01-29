const path = require('path');
const { parseList } = require('./utils');

/**
 * 解析命令行参数
 */
function parseArguments() {
  const args = process.argv.slice(2);
  const options = {
    path: null,
    rulesOnly: false,
    skillsOnly: false,
    force: false,
    rules: [],
    skills: [],
    exclude: [],
    validateOnly: false,
    update: false,
    selfTest: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--path' && i + 1 < args.length) {
      options.path = path.resolve(args[i + 1]);
      i++;
    } else if (arg === '--rules-only') {
      options.rulesOnly = true;
    } else if (arg === '--skills-only') {
      options.skillsOnly = true;
    } else if (arg === '--rules' && i + 1 < args.length) {
      options.rules = parseList(args[i + 1]);
      i++;
    } else if (arg === '--skills' && i + 1 < args.length) {
      options.skills = parseList(args[i + 1]);
      i++;
    } else if (arg === '--exclude' && i + 1 < args.length) {
      options.exclude = parseList(args[i + 1]);
      i++;
    } else if (arg === '--validate' || arg === '--validate-only') {
      options.validateOnly = true;
    } else if (arg === '--update') {
      options.update = true;
    } else if (arg === '--self-test' || arg === '--test') {
      options.selfTest = true;
    } else if (arg === '--force' || arg === '-f') {
      options.force = true;
    }
  }

  return options;
}

module.exports = {
  parseArguments
};
