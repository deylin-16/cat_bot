import chalk from 'chalk';

export function startOptimization(conn) {
    setInterval(() => {
        const used = process.memoryUsage().heapUsed / 1024 / 1024;
        console.log(chalk.yellow(`[OPTIMIZADOR] RAM: ${Math.round(used * 100) / 100} MB`));
        
        if (used > 600) {
            console.log(chalk.red('[ALERTA] RAM alta, ejecutando limpieza...'));
            global.db.data.stats = {}; 
            global.conn.ev.removeAllListeners('presence.update'); 
            if (global.gc) global.gc();
        }
    }, 10 * 60 * 1000);
}

export function cleanSessions() {
    const path = './sessions';
    if (!fs.existsSync(path)) return;
    const files = fs.readdirSync(path);
    if (files.length > 100) {
        files.forEach(f => {
            if (f.startsWith('pre-key-') || f.startsWith('session-')) {
                fs.unlinkSync(`${path}/${f}`);
            }
        });
    }
}
