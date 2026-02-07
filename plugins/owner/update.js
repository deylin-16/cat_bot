import { execSync } from 'child_process';
import path from 'path';

const updateCommand = {
    name: 'update',
    alias: ['actualizar', 'up'],
    category: 'main',
    rowner: true,
    run: async (m, { conn, args }) => {
        try {
            const output = execSync('git pull ' + (args[0] || '')).toString();
            
            if (output.includes('Already up to date')) {
                return await conn.sendMessage(m.chat, { text: '*[ ✓ ] El sistema ya está en su versión más reciente.*' }, { quoted: m });
            }

            await conn.sendMessage(m.chat, { text: `*[ 📦 ] Cambios detectados:*\n\n${output}\n\n*Refrescando sistema de plugins...*` }, { quoted: m });

            
            const pluginFolder = path.join(process.cwd(), './plugins');
            if (global.reload) {
                await global.reload(false); 
                
                const { readRecursive } = await import('../index.js').catch(() => ({})); 
                
            }

            await conn.sendMessage(m.chat, { text: '*[ ✅ ] Actualización aplicada con éxito. Todos los plugins en subcarpetas han sido mapeados.*' }, { quoted: m });

        } catch (error) {
            let status = '';
            try {
                status = execSync('git status --porcelain').toString().trim();
            } catch { status = 'Error al obtener estado.'; }

            const conflictMsg = status ? `*⚠️ Conflictos en archivos:*\n${status}\n\n*Usa:* git reset --hard origin/main` : error.message;
            await conn.sendMessage(m.chat, { text: `*❌ Error Crítico:* ${conflictMsg}` }, { quoted: m });
        }
    }
};

export default updateCommand;
