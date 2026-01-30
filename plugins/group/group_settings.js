import fetch from 'node-fetch'

const groupConfig = {
    name: 'config_group',
    alias: ['welcome', 'detect', 'setwelcome', 'delwelcome', 'renombrar', 'setnombre', 'desc', 'setdesc', 'setfoto', 'setpp', 'elimina', 'kick', 'ban', 'echar', 'sacar', 'tagall', 'todos', 'anuncio'],
    category: 'group',
    admin: true,
    group: true,
    run: async (m, { conn, text, command, participants, usedPrefix, isBotAdmin }) => {
        const chat = global.db.data.chats[m.chat]

        if (command === 'welcome') {
            chat.welcome = !chat.welcome
            m.reply(`┏━━━〔 sɪsᴛᴇᴍᴀ 〕━━━┓\n┃ ✎ ᴇsᴛᴀᴅᴏ: ʙɪᴇɴᴠᴇɴɪᴅᴀ\n┃ ✎ sᴛᴀᴛᴜs: ${chat.welcome ? 'ᴀᴄᴛɪᴠᴀᴅᴏ' : 'ᴅᴇsᴀᴄᴛɪᴠᴀᴅᴏ'}\n┗━━━━━━━━━━━━━━━━━━┛`)
        }

        if (command === 'detect') {
            chat.detect = !chat.detect
            m.reply(`┏━━━〔 sɪsᴛᴇᴍᴀ 〕━━━┓\n┃ ✎ ᴇsᴛᴀᴅᴏ: ᴅᴇᴛᴇᴄᴛᴏʀ\n┃ ✎ sᴛᴀᴛᴜs: ${chat.detect ? 'ᴀᴄᴛɪᴠᴀᴅᴏ' : 'ᴅᴇsᴀᴄᴛɪᴠᴀᴅᴏ'}\n┗━━━━━━━━━━━━━━━━━━┛`)
        }

        if (command === 'setwelcome') {
            if (!text) return m.reply('┏━━━〔 ᴇʀʀᴏʀ 〕━━━┓\n┃ ✎ ɪɴғᴏ: ɪɴɢʀᴇsᴀ ᴇʟ ᴛᴇxᴛᴏ\n┗━━━━━━━━━━━━━━━━━━┛')
            chat.customWelcome = text
            m.reply(`┏━━━〔 sɪsᴛᴇᴍᴀ 〕━━━┓\n┃ ✎ ᴄᴏɴғɪɢ: ᴡᴇʟᴄᴏᴍᴇ sᴇᴛ\n┗━━━━━━━━━━━━━━━━━━┛`)
        }

        if (command === 'delwelcome') {
            chat.customWelcome = ''
            m.reply(`┏━━━〔 sɪsᴛᴇᴍᴀ 〕━━━┓\n┃ ✎ ᴄᴏɴғɪɢ: ᴡᴇʟᴄᴏᴍᴇ ʀᴇsᴇᴛ\n┗━━━━━━━━━━━━━━━━━━┛`)
        }

        if (/renombrar|setnombre/i.test(command)) {
            if (!isBotAdmin) return m.reply('┃ ✎ ᴇʀʀᴏʀ: ɴᴇᴄᴇsɪᴛᴏ sᴇʀ ᴀᴅᴍɪɴ.')
            if (!text) return m.reply('┃ ✎ ɪɴғᴏ: ɪɴɢʀᴇsᴀ ᴇʟ ɴᴏᴍʙʀᴇ.')
            await conn.groupUpdateSubject(m.chat, text)
            m.reply(`┏━━━〔 sɪsᴛᴇᴍᴀ 〕━━━┓\n┃ ✎ ᴄᴀᴍʙɪᴏ: ɴᴏᴍʙʀᴇ ᴀᴄᴛᴜᴀʟ\n┃ ✎ ᴠᴀʟᴜᴇ: ${text}\n┗━━━━━━━━━━━━━━━━━━┛`)
        }

        if (/desc|setdesc/i.test(command)) {
            if (!isBotAdmin) return m.reply('┃ ✎ ᴇʀʀᴏʀ: ɴᴇᴄᴇsɪᴛᴏ sᴇʀ ᴀᴅᴍɪɴ.')
            let newDesc = m.quoted ? m.quoted.text : text
            if (!newDesc) return m.reply('┃ ✎ ɪɴғᴏ: ɪɴɢʀᴇsᴀ ʟᴀ ᴅᴇsᴄʀɪᴘᴄɪᴏɴ.')
            await conn.groupUpdateDescription(m.chat, newDesc)
            m.reply(`┏━━━〔 sɪsᴛᴇᴍᴀ 〕━━━┓\n┃ ✎ ᴄᴏɴғɪɢ: ᴅᴇsᴄ ᴀᴄᴛᴜᴀʟɪᴢᴀᴅᴀ\n┗━━━━━━━━━━━━━━━━━━┛`)
        }

        if (/setfoto|setpp/i.test(command)) {
            if (!isBotAdmin) return m.reply('┃ ✎ ᴇʀʀᴏʀ: ɴᴇᴄᴇsɪᴛᴏ sᴇʀ ᴀᴅᴍɪɴ.')
            let q = m.quoted ? m.quoted : m
            let mime = (q.msg || q).mimetype || ''
            if (!/image/.test(mime)) return m.reply('┃ ✎ ᴇʀʀᴏʀ: ʀᴇsᴘᴏɴᴅᴇ ᴀ ᴜɴᴀ ɪᴍᴀɢᴇɴ.')
            let media = await q.download()
            await conn.updateProfilePicture(m.chat, media)
            m.reply(`┏━━━〔 sɪsᴛᴇᴍᴀ 〕━━━┓\n┃ ✎ ᴄᴏɴғɪɢ: ғᴏᴛᴏ ᴀᴄᴛᴜᴀʟɪᴢᴀᴅᴀ\n┗━━━━━━━━━━━━━━━━━━┛`)
        }

        if (/elimina|kick|ban|echar|sacar/i.test(command)) {
            if (!isBotAdmin) return m.reply('> ✎ ᴇʀʀᴏʀ: ɴᴇᴄᴇsɪᴛᴏ sᴇʀ ᴀᴅᴍɪɴ.')
            let users = m.mentionedJid.concat(m.quoted ? [m.quoted.sender] : []).filter(u => u !== conn.user.jid)
            if (users.length === 0) return m.reply('> ✎ ɪɴғᴏ: ᴇᴛɪǫᴜᴇᴛᴀ ᴀ ᴀʟɢᴜɪᴇɴ.')
            for (let user of users) {
                await conn.groupParticipantsUpdate(m.chat, [user], 'remove')
                m.reply(`┏━━━〔 ᴇxᴛᴇʀᴍɪɴᴀᴛᴇ 〕━━━┓\n┃ ✎ ᴜsᴇʀ: @${user.split('@')[0]}\n┃ ✎ sᴛᴀᴛᴜs: ʀᴇᴍᴏᴠᴇᴅ\n┗━━━━━━━━━━━━━━━━━━┛`, null, { mentions: [user] })
            }
        }

        if (/tagall|todos|anuncio/i.test(command)) {
            let txt = `┏━━━〔 ᴀɴᴜɴᴄɪᴏ ɢʀᴇᴘ 〕━━━┓\n┃ ✎ ᴍsɢ: ${text || 'sɪɴ ᴍᴏᴛɪᴠᴏ'}\n┃\n`
            for (let mem of participants) {
                txt += `┃ ✎ @${mem.id.split('@')[0]}\n`
            }
            txt += `┗━━━━━━━━━━━━━━━━━━┛`
            conn.sendMessage(m.chat, { text: txt, mentions: participants.map(a => a.id) })
        }
    }
}

export default groupConfig
