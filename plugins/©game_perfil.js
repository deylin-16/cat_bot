let handler = async (m, { conn, usedPrefix, command }) => {
    let user = global.db.data.users[m.sender]
    let name = conn.getName(m.sender)
    let bitcoins = user.bitcoins || 0
    let exp = user.exp || 0
    let nivel = Math.floor(0.1 * Math.sqrt(exp)) || 1
    let rango = 'Novato'

    if (bitcoins >= 1000) rango = 'Inversor ₿'
    if (bitcoins >= 5000) rango = 'Empresario ₿'
    if (bitcoins >= 15000) rango = 'Magnate ₿'
    if (bitcoins >= 50000) rango = 'Dueño de la Red'

    let pp
    try {
        pp = await conn.profilePictureUrl(m.sender, 'image')
    } catch (e) {
        pp = await global.img(conn)
    }

    let txt = `*👤 PERFIL DE USUARIO*\n\n`
    txt += `*Nombre:* ${name}\n`
    txt += `*Nivel:* ${nivel}\n`
    txt += `*Rango:* ${rango}\n\n`
    txt += `*💰 ECONOMÍA*\n`
    txt += `*Bitcoins:* ${bitcoins} ₿\n`
    txt += `*Experiencia:* ${exp} XP`

    await conn.sendMessage(m.chat, {
        text: txt,
        contextInfo: {
            externalAdReply: {
                title: `DASHBOARD - ${name}`,
                body: `Nivel: ${nivel} | Bitcoins: ${bitcoins} ₿`,
                thumbnailUrl: typeof pp === 'string' ? pp : null,
                thumbnail: typeof pp !== 'string' ? pp : null,
                sourceUrl: 'https://deylin.xyz',
                mediaType: 1,
                renderLargerThumbnail: true
            }
        }
    }, { quoted: m })
}

handler.command = /^(perfil|profile|me|my)$/i
export default handler
