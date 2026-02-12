/**
 * @file terminal.js
 * @description 终端类场景定义 (Priority: 100)
 */

module.exports = [
    {
        id: 'terminal_run_command',
        type: 'OP_TERMINAL',
        name: '运行命令',
        description: '识别运行命令卡片',
        // 匹配逻辑：优先识别终端卡片容器，然后再细分
        // 只要是终端卡片，就先归类为 OP_TERMINAL，具体的子类型（运行/交互/删除）在执行阶段判断
        match: (el, text) => {
            // 1. 基础容器匹配 (宽泛)
            const isTerminalCard = !!(el.querySelector('.icd-run-command-card-v2') || 
                                    el.querySelector('.icd-run-command-card-v2-cwd') ||
                                    el.querySelector('.icd-delete-files-command-card-v2-content'));
            
            if (!isTerminalCard) return false;

            // 2. 排除删除卡片 (因为它有独立的定义，且优先级不同)
            // 虽然这里返回 true 也会被 classifyTask 正确处理（因为它遍历所有定义），
            // 但为了清晰，我们尽量让 id 对应的逻辑明确。
            // 不过，为了鲁棒性，如果 delete_file 定义没匹配上，这里兜底匹配也是可以的。
            // 目前策略：只要是 run-command 卡片，都算 terminal_run_command
            
            return !!(el.querySelector('.icd-run-command-card-v2') || el.querySelector('.icd-run-command-card-v2-cwd'));
        }
    },
    {
        id: 'terminal_delete_file',
        type: 'OP_TERMINAL',
        name: '删除文件',
        description: '识别删除文件卡片',
        match: (el, text) => !!el.querySelector('.icd-delete-files-command-card-v2-content')
    }
];
