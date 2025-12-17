import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'
import { sticker } from '../lib/sticker.js'
import { WAMessageStubType } from '@whiskeysockets/baileys'
import ws from 'ws'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, 'db/group_configs.json')

global.getGroupAssistantConfig = (chatId) => {
    let configs = {}
    try {
        if (fs.existsSync(DB_PATH)) {
            configs = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))
        }
    } catch (e) {
        console.error("Error al leer group_configs.json:", e)
    }

    const groupConfig = configs[chatId]

    return {
        assistantName: groupConfig?.assistantName || global.bot,
        assistantImage: groupConfig?.assistantImage || "https://i.ibb.co/pjx0z1G6/b5897d1aa164ea5053165d4a04c2f2fa.jpg"
    }
}

let handler = async (m, { conn, usedPrefix, command }) => {
    let { assistantName, assistantImage, assistantCommand } = global.getGroupAssistantConfig(m.chat)
    
    let isSub = conn.user.jid !== global.conn?.user?.jid
    let ownerBot = global.owner.map(([jid, name]) => ({ jid, name }))

    let _package = JSON.parse(await fs.promises.readFile(path.join(__dirname, '../package.json')).catch(_ => '{}')) || {}
    let { modStatus } = global.db.data.settings[conn.user.jid] || {}

    let customCommands = `
*• GRUPOS*
◦ \`cierra\` (Cierra el grupo)
◦ \`abre\` (Abre el grupo)
◦ \`renombrar a\` (Cambia nombre)

*• UTILIDADES*
◦ \`elimina\` (@tag)
◦ \`menciona a todos\`
`;

    let caption = `*HOLA SOY ${assistantName.toUpperCase()}* 🤖

*— Estado:* ${isSub ? '*Sub-Asistente*' : '*Asistente Principal*'}
*— Versión:* ${_package.version}
*— Creador:* ${ownerBot[0].name}
*— Runtime:* ${msToDate(process.uptime() * 1000)}

*— ACTION COMMANDS  —*


- *descargar/descarga*
> Enlace de tiktok/Facebook/instagram 

- *play/MP3/🎧/🎵*
> Nombre del vídeo de YouTube para descargar MP3 

`
    
    let pp

    if (assistantImage) {
        pp = Buffer.from(assistantImage, 'base64')
    } else if (conn.user.imgUrl) {
        pp = await conn.profilePictureUrl(conn.user.jid, 'image').catch(_ => fs.readFileSync(path.join(__dirname, '../src/avatar_contact.png')))
    } else {
         pp = fs.readFileSync(path.join(__dirname, '../src/avatar_contact.png'))
    }

    try {
        await conn.sendMessage(m.chat, { 
            image: pp, 
            caption: caption.trim()
        }, { quoted: m })
    } catch (e) {
        console.error("Error al enviar el menú con imagen:", e)
        await conn.reply(m.chat, caption.trim(), m)
    }
}

handler.command = ['menu', 'comandos', 'funciones']

export default handler

function msToDate(ms) {
    let d = isNaN(ms) ? 0 : ms
    let s = d / 1000
    let m = s / 60
    let h = m / 60
    let dd = Math.floor(h / 24)
    let hh = Math.floor(h % 24)
    let mm = Math.floor(m % 60)
    let ss = Math.floor(s % 60)
    return `${dd} día(s) ${hh} hora(s) ${mm} minuto(s) ${ss} segundo(s)`
}
