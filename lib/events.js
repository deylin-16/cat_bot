import { WAMessageStubType, jidNormalizedUser } from '@whiskeysockets/baileys'
import { getRealJid } from './identifier.js'

export async function events(conn, m, participants) {
    if (!m.messageStubType || !m.chat.endsWith('@g.us')) return
    
    const chat = global.db.data.chats[m.chat]
    if (!chat) return

    const st = m.messageStubType
    const param = m.messageStubParameters || []
    
    /**
     * LIMPIEZA DE ID:
     * Si param[0] es un objeto como {"id": "número@s.whatsapp.net"}, extraemos solo el string.
     */
    let rawWho = param[0] || m.sender || m.key.participant
    if (typeof rawWho === 'object' && rawWho !== null) {
        rawWho = rawWho.id || rawWho.user || rawWho.jid || m.sender
    }
    
    // Aseguramos que sea un string limpio
    rawWho = typeof rawWho === 'string' ? rawWho : String(rawWho)

    // Resolvemos identidad real (LID a PN)
    let who = jidNormalizedUser(await getRealJid(conn, rawWho, m))
    
    // El tag que se verá en el texto (ej: @50499999999)
    const userTag = `@${who.split('@')[0]}`

    // --- BIENVENIDA / ENTRADAS (Formatos 27, 31, 32 y StubType) ---
    const isWelcome = [27, 31, WAMessageStubType.GROUP_PARTICIPANT_ADD, WAMessageStubType.GROUP_PARTICIPANT_INVITE].includes(st)
    
    if (chat.welcome && isWelcome) {
        const groupMetadata = await conn.groupMetadata(m.chat).catch(_ => ({}))
        const txt = `┏━━━〔 *ᴡᴇʟᴄᴏᴍᴇ* 〕━━━┓\n┃ ✎ ʜᴏʟᴀ: ${userTag}\n┃ ✎ ɢʀᴜᴘᴏ: ${groupMetadata.subject || 'Sistema'}\n┃ ✎ ɴᴏᴅᴏs: ${participants.length}\n┗━━━━━━━━━━━━━━━━━━┛${chat.customWelcome ? `\n\n➠ ${chat.customWelcome}` : ''}`

        let pp = 'https://telegra.ph/file/243e966f050255dbd2d56.jpg' 
        try { pp = await conn.profilePictureUrl(who, 'image') } catch (e) {}

        await conn.sendMessage(m.chat, { 
            image: { url: pp }, 
            caption: txt, 
            mentions: [who] 
        })
        return
    }

    // --- DETECCIÓN / LOGS ---
    if (chat.detect) {
        let mensaje = '', tipo = ''
        
        if (st === 21 || st === WAMessageStubType.GROUP_CHANGE_SUBJECT) {
            tipo = 'ɴᴏᴍʙʀᴇ'; mensaje = `> ┃ ✎ ᴄᴀᴍʙɪᴏ: ɴᴜᴇᴠᴏ ᴛɪᴛᴜʟᴏ\n> ┃ ✎ ᴠᴀʟᴏʀ: ${param[0]}`
        } else if (st === 22 || st === WAMessageStubType.GROUP_CHANGE_ICON) {
            tipo = 'ɪᴄᴏɴᴏ'; mensaje = `> ┃ ✎ ᴄᴀᴍʙɪᴏ: ɪᴍᴀɢᴇɴ ᴀᴄᴛᴜᴀʟɪᴢᴀᴅᴀ`
        } else if (st === 29 || st === WAMessageStubType.GROUP_PROMOTE_ADMIN) {
            tipo = 'ᴀsᴄᴇɴsᴏ'; mensaje = `> ┃ ✎ ᴜsᴜᴀʀɪᴏ: ${userTag}\n> ┃ ✎ ᴇsᴛᴀᴅᴏ: ɴᴜᴇᴠᴏ ᴀᴅᴍɪɴ`
        } else if (st === 30 || st === WAMessageStubType.GROUP_DEMOTE_ADMIN) {
            tipo = 'ᴅᴇɢʀᴀᴅᴀᴄɪᴏɴ'; mensaje = `> ┃ ✎ ᴜsᴜᴀʀɪᴏ: ${userTag}\n> ┃ ✎ ᴇsᴛᴀᴅᴏ: ʏᴀ ɴᴏ ᴇs ᴀᴅᴍɪɴ`
        } else if (st === 28 || st === 32 || st === WAMessageStubType.GROUP_PARTICIPANT_LEAVE) {
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
