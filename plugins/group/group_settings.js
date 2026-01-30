const groupConfig = {
    name: 'config_group',
    alias: ['welcome', 'detect', 'setwelcome', 'delwelcome'],
    category: 'group',
    admin: true,
    run: async (m, { conn, text, command }) => {
        const chat = global.db.data.chats[m.chat]
        
        if (command === 'welcome') {
            chat.welcome = !chat.welcome
            m.reply(`┏━━━〔 sʏsᴛᴇᴍ 〕━━━┓\n┃ ✎ ᴡᴇʟᴄᴏᴍᴇ: ${chat.welcome ? 'ᴏɴ' : 'ᴏғғ'}\n┗━━━━━━━━━━━━━━━━━━┛`)
        }

        if (command === 'detect') {
            chat.detect = !chat.detect
            m.reply(`┏━━━〔 sʏsᴛᴇᴍ 〕━━━┓\n┃ ✎ ᴅᴇᴛᴇᴄᴛᴏʀ: ${chat.detect ? 'ᴏɴ' : 'ᴏғғ'}\n┗━━━━━━━━━━━━━━━━━━┛`)
        }

        if (command === 'setwelcome') {
            if (!text) return m.reply('┃ ✎ ᴇʀʀᴏʀ: ɪɴɢʀᴇsᴀ ᴇʟ ᴛᴇxᴛᴏ.')
            chat.customWelcome = text
            m.reply(`┏━━━〔 sʏsᴛᴇᴍ 〕━━━┓\n┃ ✎ sᴛᴀᴛᴜs: ᴡᴇʟᴄᴏᴍᴇ ᴜᴘᴅᴀᴛᴇᴅ\n┗━━━━━━━━━━━━━━━━━━┛`)
        }

        if (command === 'delwelcome') {
            chat.customWelcome = ''
            m.reply(`┏━━━〔 sʏsᴛᴇᴍ 〕━━━┓\n┃ ✎ sᴛᴀᴛᴜs: ᴡᴇʟᴄᴏᴍᴇ ʀᴇsᴇᴛᴛᴇᴅ\n┗━━━━━━━━━━━━━━━━━━┛`)
        }
    }
}

export default groupConfig
