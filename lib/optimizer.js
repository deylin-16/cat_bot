import fs from 'fs';
import chalk from 'chalk';

export function startOptimization(conn) {
    setInterval(() => {
        const used = process.memoryUsage().heapUsed / 1024 / 1024;
        if (used > 500) {
            console.log(chalk.red(`[OPTIMIZER] RAM crítica: ${Math.round(used)}MB. Limpiando...`));
            if (global.gc) global.gc();
        }
    }, 5 * 60 * 1000);
}

export function cleanSessions() {
    const path = './sessions';
    if (!fs.existsSync(path)) return;
    const files = fs.readdirSync(path);
    files.forEach(file => {
        if (file.startsWith('pre-key-') || file.startsWith('sender-key-')) {
            fs.unlinkSync(`${path}/${file}`);
        }
    });
}
