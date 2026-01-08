import { canzar } from '../lib/levelling.js'

let handler = async (m, { conn, usedPrefix, command }) => {
    let user = global.db.data.users[m.sender]
    let name = conn.getName(m.sender)
    let pp = 'https://telegra.ph/file/06494b30f878a2d3637e6.jpg'
    
    try {
        pp = await conn.profilePictureUrl(m.sender, 'image')
    } catch (e) {
        pp = await global.img(conn)
    }

    let { exp, bitcoins, level, role } = user
    let txt = `*👤 PERFIL DE USUARIO*\n\n`
    txt += `*Nombre:* ${name}\n`
    txt += `*Nivel:* ${level || 1}\n`
    txt += `*Rango:* ${role || 'Novato'}\n\n`
    txt += `*💰 ECONOMÍA*\n`
    txt += `*Bitcoins:* ${bitcoins} ₿\n`
    txt += `*Experiencia:* ${exp} XP\n\n`
    txt += `*🏆 LOGROS*\n`
    txt += `*Trivia:* ${bitcoins > 500 ? 'Maestro' : 'Aprendiz'}`

    await conn.sendMessage(m.chat, {
        text: txt,
        contextInfo: {
            externalAdReply: {
                title: `SISTEMA DE LOGROS - ${name}`,
                body: `Nivel: ${level || 1} | ₿ ${bitcoins}`,
                thumbnailUrl: pp,
                sourceUrl: 'https://deylin.xyz',
                mediaType: 1,
                renderLargerThumbnail: true
            }
        }
    }, { quoted: m })
}

handler.command = /^(perfil|profile)$/i
export default handler
