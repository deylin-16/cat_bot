import { canLevelUp, findLevel, xpRange } from '../lib/levelling.js'

let handler = async (m, { conn, usedPrefix, command }) => {
    let user = global.db.data.users[m.sender]
    let name = conn.getName(m.sender)
    let bitcoins = user.bitcoins || 0
    let exp = user.exp || 0
    let level = findLevel(exp)
    let { min, max, xp } = xpRange(level)
    
    let pp
    try {
        pp = await conn.profilePictureUrl(m.sender, 'image')
    } catch (e) {
        pp = await global.img(conn)
    }

    let txt = `*👤 PERFIL DE USUARIO*\n\n`
    txt += `*Nombre:* ${name}\n`
    txt += `*Nivel:* ${level}\n`
    txt += `*Rango:* ${user.role || 'Novato'}\n\n`
    txt += `*📊 PROGRESO*\n`
    txt += `*XP:* ${exp - min} / ${xp} (Total: ${exp})\n\n`
    txt += `*💰 ECONOMÍA*\n`
    txt += `*Bitcoins:* ${bitcoins} ₿`

    await conn.sendMessage(m.chat, {
        text: txt,
        contextInfo: {
            externalAdReply: {
                title: `SISTEMA DE LOGROS - ${name}`,
                body: `Nivel: ${level} | Bitcoins: ${bitcoins} ₿`,
                thumbnailUrl: typeof pp === 'string' ? pp : null,
                thumbnail: typeof pp !== 'string' ? pp : null,
                sourceUrl: 'https://deylin.xyz',
                mediaType: 1,
                renderLargerThumbnail: true
            }
        }
    }, { quoted: m })
}

handler.command = /^(perfil|profile)$/i
export default handler
