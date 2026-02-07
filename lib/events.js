import { WAMessageStubType } from '@whiskeysockets/baileys'
import { getRealJid } from './identifier.js'

export async function handleGroupEvents(conn, m, participants) {
    if (!m.messageStubType || !m.chat.endsWith('@g.us')) return
    
    const chat = global.db.data.chats[m.chat]
    if (!chat) return

    const st = m.messageStubType
    const param = m.messageStubParameters || []
    
    // Resolvemos identidad (LID a PN) para que las menciones no fallen
    let rawWho = param[0] || m.sender
    let who = await getRealJid(conn, rawWho, m)
    const userTag = `@${who.split('@')[0]}`

    // --- BIENVENIDA ---
    if (chat.welcome && [27, 31, WAMessageStubType.GROUP_PARTICIPANT_ADD].includes(st)) {
        const groupMetadata = await conn.groupMetadata(m.chat).catch(_ => ({}))
        const txt = `┏━━━〔 *ᴡᴇʟᴄᴏᴍᴇ* 〕━━━┓\n┃ ✎ ʜᴏʟᴀ: ${userTag}\n┃ ✎ ɢʀᴜᴘᴏ: ${groupMetadata.subject || 'Sistema'}\n┃ ✎ ɴᴏᴅᴏs: ${participants.length}\n┗━━━━━━━━━━━━━━━━━━┛${chat.customWelcome ? `\n\n➠ ${chat.customWelcome}` : ''}`

        let pp = 'https://telegra.ph/file/243e966f050255dbd2d56.jpg' 
        try { pp = await conn.profilePictureUrl(who, 'image') } catch (e) {}

        await conn.sendMessage(m.chat, { image: { url: pp }, caption: txt, mentions: [who] })
    }

    // --- DETECCIÓN / LOGS ---
    if (chat.detect) {
        const events = {
            [21]: { t: 'ɴᴏᴍʙʀᴇ', i: '📝', m: `> ┃ ✎ ᴄᴀᴍʙɪᴏ: ɴᴜᴇᴠᴏ ᴛɪᴛᴜʟᴏ\n> ┃ ✎ ᴠᴀʟᴏʀ: ${param[0]}` },
            [22]: { t: 'ɪᴄᴏɴᴏ', i: '🖼️', m: `> ┃ ✎ ᴄᴀᴍʙɪᴏ: ɪᴍᴀɢᴇɴ ᴀᴄᴛᴜᴀʟɪᴢᴀᴅᴀ` },
            [29]: { t: 'ᴀsᴄᴇɴsᴏ', i: '⚡', m: `> ┃ ✎ ᴜsᴜᴀʀɪᴏ: ${userTag}\n> ┃ ✎ ᴇsᴛᴀᴅᴏ: ɴᴜᴇᴠᴏ ᴀᴅᴍɪɴ` },
            [30]: { t: 'ᴅᴇɢʀᴀᴅᴀᴄɪᴏɴ', i: '❌', m: `> ┃ ✎ ᴜsᴜᴀʀɪᴏ: ${userTag}\n> ┃ ✎ ᴇsᴛᴀᴅᴏ: ʏᴀ ɴᴏ ᴇs ᴀᴅᴍɪɴ` },
            [28]: { t: 'sᴀʟɪᴅᴀ', i: '👋', m: `> ┃ ✎ ᴜsᴜᴀʀɪᴏ: ${userTag}\n> ┃ ✎ ᴀᴄᴄɪᴏɴ: sᴇ ʜᴀ ɪᴅᴏ` }
        }

        const ev = events[st]
        if (ev) {
            await conn.sendMessage(m.chat, {
                text: `> ┏━━━〔 ${ev.t} 〕━━━┓\n${ev.m}\n> ┗━━━━━━━━━━━━━━━━━━┛`,
                contextInfo: { mentionedJid: [who] }
            })
        }
    }
}
