import { WAMessageStubType } from '@whiskeysockets/baileys'

export async function before(m, { conn, participants }) {
    if (!m.messageStubType || !m.chat.endsWith('@g.us')) return true

    const chat = global.db.data.chats[m.chat]
    if (!chat) return true

    const st = m.messageStubType
    const param = m.messageStubParameters || []
    const who = param[0] || m.sender
    const userTag = `@${who.split('@')[0]}`

    if (chat.welcome && (st === 27 || st === 31 || st === WAMessageStubType.GROUP_PARTICIPANT_ADD)) {
        const groupMetadata = await conn.groupMetadata(m.chat).catch(_ => ({}))
        
        const baseTxt = `┏━━━〔 *ᴡᴇʟᴄᴏᴍᴇ* 〕━━━┓\n┃ ✎ ʜᴇʟʟᴏ: @user\n┃ ✎ ɢʀᴏᴜᴘ: @grupo\n┃ ✎ ɴᴏᴅᴇs: @total\n┗━━━━━━━━━━━━━━━━━━┛`
        const customPart = chat.customWelcome ? `\n\n➠ ${chat.customWelcome}` : ''
        
        const txt = (baseTxt + customPart)
            .replace(/@user/g, userTag)
            .replace(/@grupo/g, groupMetadata.subject || 'System')
            .replace(/@total/g, participants.length)

        let pp = 'https://i.ibb.co/jPSF32Pz/9005bfa156f1f56fb2ac661101d748a5.jpg'
        if (typeof global.img === 'function') pp = global.img()
        
        try { 
            pp = await conn.profilePictureUrl(who, 'image') 
        } catch (e) {}

        await conn.sendMessage(m.chat, { 
            image: { url: pp }, 
            caption: txt, 
            mentions: [who] 
        })
        return true
    }

    if (chat.detect) {
        let tipo = '', icon = '🛡️', mensaje = ''

        if (st === 29 || st === WAMessageStubType.GROUP_PROMOTE_ADMIN) {
            tipo = 'ᴘʀᴏᴍᴏᴛᴇ'; icon = '⚡'
            mensaje = `┃ ✎ ᴜsᴇʀ: ${userTag}\n┃ ✎ sᴛᴀᴛᴜs: ɴᴇᴡ ᴀᴅᴍɪɴɪsᴛʀᴀᴛᴏʀ`
        } else if (st === 30 || st === WAMessageStubType.GROUP_DEMOTE_ADMIN) {
            tipo = 'ᴅᴇᴍᴏᴛᴇ'; icon = '❌'
            mensaje = `┃ ✎ ᴜsᴇʀ: ${userTag}\n┃ ✎ sᴛᴀᴛᴜs: ʀᴇᴍᴏᴠᴇᴅ ғʀᴏᴍ ᴀᴅᴍɪɴs`
        } else if (st === 21 || st === WAMessageStubType.GROUP_CHANGE_SUBJECT) {
            tipo = 'sʏsᴛᴇᴍ'; icon = '📝'
            mensaje = `┃ ✎ ᴄʜᴀɴɢᴇ: ɴᴇᴡ sᴜʙᴊᴇᴄᴛ\n┃ ✎ ᴠᴀʟᴜᴇ: ${param[0]}`
        } else if (st === 22 || st === WAMessageStubType.GROUP_CHANGE_ICON) {
            tipo = 'sʏsᴛᴇᴍ'; icon = '🖼️'
            mensaje = `┃ ✎ ᴄʜᴀɴɢᴇ: ɢʀᴏᴜᴘ ɪᴄᴏɴ ᴜᴘᴅᴀᴛᴇᴅ`
        } else { 
            return true 
        }

        await conn.sendMessage(m.chat, {
            text: `┏━━━〔 ${tipo} 〕━━━┓\n${mensaje}\n┗━━━━━━━━━━━━━━━━━━┛`,
            contextInfo: { mentionedJid: [who] }
        })
    }
    return true
}
