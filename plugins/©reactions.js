import fetch from 'node-fetch'
import fs from 'fs'

let handler = async (m, { conn, command, usedPrefix }) => {
    
    let dbReacciones = JSON.parse(fs.readFileSync('./src/social_reacciones.json'))
    
    let cmd = command.toLowerCase()
    let actionKey = Object.keys(dbReacciones).find(key => key === cmd || dbReacciones[key].en === cmd)
    let data = dbReacciones[actionKey]

   
    let user = m.sender
    let target = m.mentionedJid[0] ? m.mentionedJid[0] : (m.quoted ? m.quoted.sender : null)
    
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
        let buffer = await response.buffer()

        await conn.sendMessage(m.chat, {
            video: buffer,
            caption: textoFinal,
            gifPlayback: true,
            mentions: menciones
        }, { quoted: m })
        
    } catch (e) {
        console.error(e)
        m.reply('❌ Error al obtener el contenido.')
    }
}

handler.command = /^(beso|kiss|abrazo|hug|golpe|slap|patada|kick|matar|kill|saludo|hello|triste|sad|reir|laugh)$/i
handler.group = true

export default handler
