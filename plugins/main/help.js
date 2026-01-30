import { promises } from 'fs';
import { join } from 'path';

const menuCommand = {
    name: 'menu',
    alias: ['help', 'h', 'comandos'],
    category: 'main',
    run: async (m, { conn, usedPrefix }) => {
        try {
            const plugins = Object.values(global.plugins);
            const menuData = {};

            plugins.forEach(plugin => {
                if (plugin.disabled) return;
                const category = plugin.category || 'otros';
                if (!menuData[category]) menuData[category] = [];
                menuData[category].push(plugin);
            });

            let menuText = `*── 「 ${global.botname || 'DYNAMIC BOT'} 」 ──*\n\n`;
            menuText += `▢ *USUARIO:* @${m.sender.split('@')[0]}\n`;
            menuText += `▢ *PREFIX:* [ ${usedPrefix} ]\n`;
            menuText += `*──────────────────*\n\n`;

            const sortedCategories = Object.keys(menuData).sort();
            
            for (const category of sortedCategories) {
                menuText += `*┌── 「 ${category.toUpperCase()} 」*\n`;
                const categoryCommands = menuData[category]
                    .map(p => `│ ▢ ${usedPrefix}${p.name}`)
                    .join('\n');
                menuText += categoryCommands + `\n*└──────────────*\n\n`;
            }

            menuText += `_Dynamic Bot by Deylin_`;

            await conn.sendMessage(m.chat, { 
                text: menuText,
                contextInfo: {
                    mentionedJid: [m.sender],
                    externalAdReply: {
                        title: 'SISTEMA DE COMANDOS',
                        body: 'Minimalist Structure',
                        thumbnailUrl: img,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m });

            await m.react('📜');

        } catch (error) {
            conn.reply(m.chat, 'Error al generar el menú.', m);
        }
    }
};

export default menuCommand;
