import fetch from 'node-fetch'
import fs from 'fs'

let handler = async (m, { conn, command, usedPrefix }) => {
    const path = '../db/social_reactions.json'
    if (!fs.existsSync(path)) return m.reply('❌ No se encontró el archivo: db/social_reactions.json')

    let dbReacciones = JSON.parse(fs.readFileSync(path, 'utf-8'))
    let cmd = command.toLowerCase()
    let actionKey = Object.keys(dbReacciones).find(key => key === cmd || dbReacciones[key].en === cmd)

    if (!actionKey) return

    let data = dbReacciones[actionKey]
    let user = m.sender
    let target = null

    if (m.mentionedJid && m.mentionedJid[0]) {
        target = m.mentionedJid[0]
    } else if (m.quoted) {
        target = m.quoted.sender
    }

    let textoFinal = ''
    let menciones = [user]

    if (target) {
        if (target === user) {
            textoFinal = data.txt_solo.replace('@user', `@${user.split('@')[0]}`)
        } else {
            textoFinal = data.txt_mencion.replace('@user', `@${user.split('@')[0]}`).replace('@target', `@${target.split('@')[0]}`)
            menciones.push(target)
        }
    } else {
        textoFinal = data.txt_grupo.replace('@user', `@${user.split('@')[0]}`)
    }

    let videoUrl = data.enlaces[Math.floor(Math.random() * data.enlaces.length)]

    try {
        let response = await fetch(videoUrl)
        if (!response.ok) throw new Error('Download Failed')
        let buffer = await response.buffer()

        await conn.sendMessage(m.chat, {
            video: buffer,
            caption: textoFinal,
            gifPlayback: true,
            mentions: menciones
        }, { quoted: m })

    } catch (e) {
        m.reply(`❌ Error al cargar el contenido.`)
    }
}

handler.command = /^(beso|kiss|abrazo|hug|golpe|slap|patada|kick|matar|kill|saludo|hello|triste|sad|reir|laugh|enojado|angry|comer|eat|dormir|sleep|bailar|dance|correr|run|disparar|shoot|cachetada|slap2|asustado|scared|pensar|think|tímido|shy|morder|bite|acariciar|pat|lamer|lick|mirar|stare|besogay|kiss2|aburrido|bored|asombro|wow)$/i
handler.group = true

export default handler
