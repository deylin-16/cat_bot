import { jidNormalizedUser } from '@whiskeysockets/baileys'
import { getRealJid } from './identifier.js'

export async function events(conn, m, participants) {
    if (!m.messageStubType || !m.chat.endsWith('@g.us')) return
    
    // 1. CAPTURA TOTAL (Debug Extremo)
    // Esto enviará al chat toda la estructura del mensaje de evento
    try {
        const fullDebug = {
            stubType: m.messageStubType,
            stubParameters: m.messageStubParameters,
            sender: m.sender, // Quién disparó el evento (si existe)
            key: m.key,       // Información de la llave del mensaje
            raw: m            // El objeto 'm' completo
        }

        await conn.sendMessage(m.chat, { 
            text: `🔎 [ESCÁNER DE EVENTO]\n\n` + 
                 `*Tipo:* ${m.messageStubType}\n` +
                 `*Parámetros:* ${JSON.stringify(m.messageStubParameters, null, 2)}\n\n` +
                 `*Mensaje Completo (JSON):*\n${JSON.stringify(fullDebug, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2).slice(0, 3000)}` 
        })
    } catch (e) {
        console.error('Error en el scanner:', e)
    }

    // 2. LÓGICA DE PROCESAMIENTO (Basada en lo que descubrimos)
    const st = m.messageStubType
    const params = m.messageStubParameters || []
    
    // Intentamos parsear el primer parámetro que suele ser el JSON del usuario
    let who = ''
    try {
        if (params[0] && params[0].startsWith('{')) {
            const parsed = JSON.parse(params[0])
            who = parsed.phoneNumber || parsed.id || m.sender
        } else {
            who = params[0] || m.sender
        }
    } catch {
        who = params[0] || m.sender
    }

    // Normalización para la mención
    const realWho = jidNormalizedUser(await getRealJid(conn, String(who), m))
    
    // Solo enviamos el log normal si la detección está activa
    const chat = global.db.data.chats[m.chat]
    if (chat?.detect) {
        const events = {
            21: 'ɴᴏᴍʙʀᴇ', 22: 'ɪᴄᴏɴᴏ', 27: 'ᴇɴᴛʀᴀᴅᴀ', 28: 'sᴀʟɪᴅᴀ', 29: 'ᴀsᴄᴇɴsᴏ', 30: 'ᴅᴇɢʀᴀᴅᴀᴄɪᴏɴ', 31: 'ᴇɴᴛʀᴀᴅᴀ'
        }
        
        let tipo = events[st] || 'ᴇᴠᴇɴᴛᴏ'
        await conn.sendMessage(m.chat, {
            text: `> ┏━━━〔 ${tipo} 〕━━━┓\n> ┃ ✎ ᴜsᴜᴀʀɪᴏ: @${realWho.split('@')[0]}\n> ┗━━━━━━━━━━━━━━━━━━┛`,
            contextInfo: { mentionedJid: [realWho] }
        })
    }
}
