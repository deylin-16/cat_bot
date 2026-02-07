import { WAMessageStubType } from '@whiskeysockets/baileys'
import { getRealJid } from './identifier.js'

export async function events(conn, m, participants) {
    if (!m.messageStubType || !m.chat.endsWith('@g.us')) return
    
    const chat = global.db.data.chats[m.chat]
    if (!chat) return

    const st = m.messageStubType
    const param = m.messageStubParameters || []
    
    // Resolvemos identidad (LID a PN) para que las menciones funcionen
    let rawWho = param[0] || m.sender
    let who = await getRealJid(conn, rawWho, m)
    const userTag = `@${who.split('@')[0]}`

    // --- BIENVENIDA (Eventos 27, 31) ---
    if (chat.welcome && (st === 27 || st === 31 || st === WAMessageStubType.GROUP_PARTICIPANT_ADD)) {
        const groupMetadata = await conn.groupMetadata(m.chat).catch(_ => ({}))
        const txt = `┏━━━〔 *ᴡᴇʟᴄᴏᴍᴇ* 〕━━━┓\n┃ ✎ ʜᴏʟᴀ: ${userTag}\n┃ ✎ ɢʀᴜᴘᴏ: ${groupMetadata.subject || 'Sistema'}\n┃ ✎ ɴᴏᴅᴏs: ${participants.length}\n┗━━━━━━━━━━━━━━━━━━┛${chat.customWelcome ? `\n\n➠ ${chat.customWelcome}` : ''}`

        let pp = 'https://telegra.ph/file/243e966f050255dbd2d56.jpg' 
        try { pp = await conn.profilePictureUrl(who, 'image') } catch (e) {}

        await conn.sendMessage(m.chat, { image: { url: pp }, caption: txt, mentions: [who] })
    }

    // --- DETECCIÓN / LOGS ---
    if (chat.detect) {
        let mensaje = ''
        let tipo = ''
        
        if (st === 21 || st === WAMessageStubType.GROUP_CHANGE_SUBJECT) {
            tipo = 'ɴᴏᴍʙʀᴇ'; mensaje = `> ┃ ✎ ᴄᴀᴍʙɪᴏ: ɴᴜᴇᴠᴏ ᴛɪᴛᴜʟᴏ\n> ┃ ✎ ᴠᴀʟᴏʀ: ${param[0]}`
        } else if (st === 22 || st === WAMessageStubType.GROUP_CHANGE_ICON) {
            tipo = 'ɪᴄᴏɴᴏ'; mensaje = `> ┃ ✎ ᴄᴀᴍʙɪᴏ: ɪᴍᴀɢᴇɴ ᴀᴄᴛᴜᴀʟɪᴢᴀᴅᴀ`
        } else if (st === 29 || st === WAMessageStubType.GROUP_PROMOTE_ADMIN) {
            tipo = 'ᴀsᴄᴇɴsᴏ'; mensaje = `> ┃ ✎ ᴜsᴜᴀʀɪᴏ: ${userTag}\n> ┃ ✎ ᴇsᴛᴀᴅᴏ: ɴᴜᴇᴠᴏ ᴀᴅᴍɪɴ`
        } else if (st === 30 || st === WAMessageStubType.GROUP_DEMOTE_ADMIN) {
            tipo = 'ᴅᴇɢʀᴀᴅᴀᴄɪᴏɴ'; mensaje = `> ┃ ✎ ᴜsᴜᴀʀɪᴏ: ${userTag}\n> ┃ ✎ ᴇsᴛᴀᴅᴏ: ʏᴀ ɴᴏ ᴇs ᴀᴅᴍɪɴ`
        } else if (st === 28 || st === WAMessageStubType.GROUP_PARTICIPANT_LEAVE) {
            tipo = 'sᴀʟɪᴅᴀ'; mensaje = `> ┃ ✎ ᴜsᴜᴀʀɪᴏ: ${userTag}\n> ┃ ✎ ᴀᴄᴄɪᴏɴ: sᴇ ʜᴀ ɪᴅᴏ`
        }

        if (tipo) {
            await conn.sendMessage(m.chat, {
                text: `> ┏━━━〔 ${tipo} 〕━━━┓\n${mensaje}\n> ┗━━━━━━━━━━━━━━━━━━┛`,
                contextInfo: { mentionedJid: [who] }
            })
        }
    }
}
