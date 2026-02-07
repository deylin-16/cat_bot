import { jidNormalizedUser } from '@whiskeysockets/baileys'
import { getRealJid } from './identifier.js'

export async function events(conn, m, participants) {
    if (!m.messageStubType || !m.chat.endsWith('@g.us')) return
    
    const st = m.messageStubType
    const param = m.messageStubParameters || []
    
    // --- BLOQUE DE DEPURACIÓN ---
    // Esto te enviará al chat la estructura de param[0] para ver qué hay dentro
    if (param[0]) {
        await conn.sendMessage(m.chat, { 
            text: `DEBUG EVENTO:\nType: ${st}\nParam: ${JSON.stringify(param[0], null, 2)}` 
        })
    }
    // ----------------------------

    // Intento de captura ultra-robusta
    let rawWho = param[0]
    if (!rawWho) rawWho = m.sender
    
    // Si sigue siendo un objeto, buscamos cualquier propiedad que parezca un JID
    if (typeof rawWho === 'object' && rawWho !== null) {
        rawWho = rawWho.id || rawWho.jid || rawWho.user || (rawWho.device ? rawWho.user : null) || m.sender
    }

    // Limpiamos el string final
    let who = jidNormalizedUser(await getRealJid(conn, String(rawWho), m))
    const userTag = `@${who.split('@')[0]}`

    const chat = global.db.data.chats[m.chat]
    if (chat && chat.detect) {
        let tipo = st === 29 ? 'ᴀsᴄᴇɴsᴏ' : st === 30 ? 'ᴅᴇɢʀᴀᴅᴀᴄɪᴏɴ' : 'ᴇᴠᴇɴᴛᴏ'
        let mensaje = `> ┃ ✎ ᴜsᴜᴀʀɪᴏ: ${userTag}\n> ┃ ✎ ᴇsᴛᴀᴅᴏ: ᴀᴄᴛɪᴠᴏ`

        await conn.sendMessage(m.chat, {
            text: `> ┏━━━〔 ${tipo} 〕━━━┓\n${mensaje}\n> ┗━━━━━━━━━━━━━━━━━━┛`,
            contextInfo: { mentionedJid: [who] }
        })
    }
}
