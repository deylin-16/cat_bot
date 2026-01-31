import axios from 'axios';

const cardCommand = {
    name: 'carta',
    alias: ['card', 'cardgen', 'post'],
    category: 'tools',
    run: async (m, { conn, text, usedPrefix, command }) => {
        const author = m.pushName || 'Deylin System';
        const baseUrl = 'https://api.deylin.xyz/api/ai/card';

        try {
            
            if (!text) {
                await m.react('🔍');
                const response = await axios.get(baseUrl);
                const data = response.data;

                if (data.status && data.menu) {
                    let menuMsg = `┏━━━〔 ᴄᴀʀᴅ sʏsᴛᴇᴍ 〕━━━┓\n┃\n`;
                    menuMsg += `┃ ➠ ᴜsᴏ: ${usedPrefix + command} <ᴛᴇxᴛᴏ>|<ɴᴜᴍ>\n`;
                    menuMsg += `┃ ➠ ᴇᴊ: ${usedPrefix + command} Hola Mundo|6\n┃\n`;
                    menuMsg += `┣━━〔 ᴇsᴛɪʟᴏs ᴅɪɴᴀ́ᴍɪᴄᴏs 〕━━┓\n┃\n`;
                    
                    Object.entries(data.menu).forEach(([key, value]) => {
                        menuMsg += `┃ ⋆͙̈ ${key}. ${value}\n`;
                    });

                    menuMsg += `┃\n┗━━━━━━━━━━━━━━━━━━━━┛`;
                    return m.reply(menuMsg);
                }
            }

            let [txt, type] = text.split('|');
            
            if (!type) {
                return m.reply(`⚠️ *Falta el estilo.* Usa el formato: \n${usedPrefix + command} ${txt.trim()}|número\n\n_Escribe solo *${usedPrefix + command}* para ver la lista de estilos._`);
            }

            await m.react('⏳');

            const apiUrl = `${baseUrl}?text=${encodeURIComponent(txt.trim())}&author=${encodeURIComponent(author)}&type=${type.trim()}`;

            await conn.sendMessage(m.chat, { 
                image: { url: apiUrl }, 
                caption: `┏━━━〔 ᴄᴀʀᴅ ɢᴇɴ 〕━━━┓\n┃ ✎ ᴇsᴛɪʟᴏ: ${type.trim()}\n┃ ✎ ᴜsᴜᴀʀɪᴏ: @${m.sender.split('@')[0]}\n┃ ✎ ᴄᴏᴘʏʀɪɢʜᴛ: ᴅᴇʏʟɪɴ sʏsᴛᴇᴍ\n┗━━━━━━━━━━━━━━━━━━┛`,
                mentions: [m.sender]
            }, { quoted: m });

            await m.react('✅');

        } catch (e) {
            console.error(e);
            await m.react('❌');
            m.reply(`┏━━━〔 ᴇʀʀᴏʀ 〕━━━┓\n┃ ✎ ɪɴғᴏ: No se pudo conectar con la API o el estilo es inválido.\n┗━━━━━━━━━━━━━━━┛`);
        }
    }
}

export default cardCommand;
