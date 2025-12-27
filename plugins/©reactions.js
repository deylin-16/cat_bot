import axios from 'axios'
import fs from 'fs'
import { join } from 'path'

let handler = async (m, { conn, command }) => {
    const path = join(process.cwd(), 'db', 'social_reactions.json')
    if (!fs.existsSync(path)) return

    let dbReacciones = JSON.parse(fs.readFileSync(path, 'utf-8'))
    let cmd = command.toLowerCase()
    
    const alias = { 
        'kiss': 'beso', 'kiss2': 'beso2', 'kiss3': 'beso3',
        'hug': 'abrazo', 'hug2': 'abrazo2', 
        'slap': 'golpe', 'kill': 'matar', 'pat': 'acariciar', 
        'dance': 'bailar', 'kick': 'patada', 'laugh': 'reir',
        'cry': 'triste', 'sad': 'triste', 'angry': 'enojado', 
        'wave': 'saludo', 'bite': 'morder', 'lick': 'lamer', 
        'sleep': 'dormir', 'eat': 'comer', 'scare': 'asustar', 
        'shoot': 'disparar', 'run': 'correr', 'stare': 'mirar', 
        'wow': 'asombro', 'blush': 'tímido'
    }
    
    let key = alias[cmd] || cmd
    let data = dbReacciones[key]
    if (!data) return

    await conn.sendMessage(m.chat, { react: { text: data.emoji, key: m.key } })

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

    try {
        const { data: tenorRes } = await axios.get(
            `https://api.tenor.com/v1/search?q=${encodeURIComponent(data.search)}&key=LIVDSRZULELA&limit=15`
        )

        if (!tenorRes?.results?.length) throw new Error()
        
        const randomGif = tenorRes.results[Math.floor(Math.random() * tenorRes.results.length)]
        const videoUrl = randomGif.media[0].mp4.url

        await conn.sendMessage(m.chat, {
            video: { url: videoUrl },
            caption: textoFinal,
            gifPlayback: true,
            mentions: menciones
        }, { quoted: m })

    } catch (e) {
        m.reply('❌ Error de conexión.')
    }
}

handler.command = /^(beso|kiss|beso2|kiss2|beso3|kiss3|abrazo|hug|hug2|abrazo2|golpe|slap|matar|kill|pat|acariciar|bailar|dance|patada|kick|reir|laugh|triste|sad|cry|enojado|angry|saludo|wave|morder|bite|lamer|lick|dormir|sleep|comer|eat|asustar|scare|disparar|shoot|correr|run|mirar|stare|asombro|wow|tímido|blush)$/i
handler.group = true

export default handler
