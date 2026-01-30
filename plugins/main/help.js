import { promises } from 'fs';
import { join } from 'path';

const menuCommand = {
    name: 'menu',
    alias: ['help', 'h', 'comandos'],
    category: 'main',
    run: async (m, { conn, usedPrefix }) => {
        try {
            const allPlugins = Array.from(global.plugins.values());
            const categories = {};

            allPlugins.forEach(plugin => {
                if (!plugin || plugin.disabled) return;
                const cat = plugin.category || 'otros';
                if (!categories[cat]) categories[cat] = [];
                
                if (!categories[cat].includes(plugin.name)) {
                    categories[cat].push(plugin.name);
                }
            });

            let menuText = `*── 「 ${global.botname || 'DYNAMIC BOT'} 」 ──*\n\n`;
            menuText += `▢ *USUARIO:* @${m.sender.split('@')[0]}\n`;
            menuText += `▢ *PREFIX:* [ ${usedPrefix} ]\n`;
            menuText += `*──────────────────*\n\n`;

            const keys = Object.keys(categories).sort();
            
            if (keys.length === 0) {
                menuText += `_No se encontraron comandos cargados._\n\n`;
            } else {
                for (const key of keys) {
                    menuText += `*┌── 「 ${key.toUpperCase()} 」*\n`;
                    for (const cmd of categories[key].sort()) {
                        menuText += `│ ▢ ${usedPrefix}${cmd}\n`;
                    }
                    menuText += `*└──────────────*\n\n`;
                }
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
            console.error(error);
            conn.reply(m.chat, 'Error al generar el menú.', m);
        }
    }
};

export default menuCommand;
