const groupConfig = {
    name: 'config_group',
    alias: ['welcome', 'detect', 'setwelcome', 'delwelcome'],
    category: 'group',
    admin: true,
    run: async (m, { conn, text, command }) => {
        const chat = global.db.data.chats[m.chat];
        
        if (command === 'welcome') {
            chat.welcome = !chat.welcome;
            await conn.sendMessage(m.chat, { 
                text: `┏━━━〔 sʏsᴛᴇᴍ 〕━━━┓\n┃ ✎ sᴛᴀᴛᴜs: ᴡᴇʟᴄᴏᴍᴇ\n┃ ✎ sᴛᴀᴛᴇ: ${chat.welcome ? 'ᴀᴄᴛɪᴠᴀᴛᴇᴅ' : 'ᴅᴇᴀᴄᴛɪᴠᴀᴛᴇᴅ'}\n┗━━━━━━━━━━━━━━━━━━┛` 
            }, { quoted: m });
        }

        if (command === 'detect') {
            chat.detect = !chat.detect;
            await conn.sendMessage(m.chat, { 
                text: `┏━━━〔 sʏsᴛᴇᴍ 〕━━━┓\n┃ ✎ sᴛᴀᴛᴜs: ᴅᴇᴛᴇᴄᴛᴏʀ\n┃ ✎ sᴛᴀᴛᴇ: ${chat.detect ? 'ᴀᴄᴛɪᴠᴀᴛᴇᴅ' : 'ᴅᴇᴀᴄᴛɪᴠᴀᴛᴇᴅ'}\n┗━━━━━━━━━━━━━━━━━━┛` 
            }, { quoted: m });
        }

        if (command === 'setwelcome') {
            if (!text) return m.reply('┃ ✎ ᴇʀʀᴏʀ: ɪɴɢʀᴇsᴀ ᴇʟ ɴᴜᴇᴠᴏ ᴛᴇxᴛᴏ.');
            chat.customWelcome = text;
            m.reply(`┏━━━〔 sʏsᴛᴇᴍ 〕━━━┓\n┃ ✎ ᴄᴏɴғɪɢ: ᴄᴜsᴛᴏᴍ ᴡᴇʟᴄᴏᴍᴇ sᴇᴛ\n┗━━━━━━━━━━━━━━━━━━┛`);
        }

        if (command === 'delwelcome') {
            chat.customWelcome = '';
            m.reply(`┏━━━〔 sʏsᴛᴇᴍ 〕━━━┓\n┃ ✎ ᴄᴏɴғɪɢ: ᴡᴇʟᴄᴏᴍᴇ ʀᴇsᴇᴛᴛᴇᴅ\n┗━━━━━━━━━━━━━━━━━━┛`);
        }
    }
}

export default groupConfig;
