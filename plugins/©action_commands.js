import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let handler = async (m, { conn, usedPrefix, command }) => {
    let { assistantName, assistantImage } = global.getAssistantConfig(conn.user.jid)

    let isSub = conn.user.jid !== global.conn?.user?.jid
    let ownerBot = global.owner.map(([jid, name]) => ({ jid, name }))

    let _package = JSON.parse(await fs.promises.readFile(path.join(__dirname, '../package.json')).catch(_ => '{}')) || {}

    let customCommands = `
*• GROUPS*
◦ \`jiji cierra\` (Close the group)
◦ \`jiji abre\` (Open the group)
◦ \`jiji renombrar a\` (Change name)

*• UTILITIES*
◦ \`jiji elimina\` (@tag)
◦ \`jiji menciona a todos\`

*• CONTENT EXTRACTION*
◦ \`play/🎧\` (YouTube video title)
◦ \`Descarga\` (Link Facebook/Tiktok/instagram)

*• FUNCTION*
◦ \`robar perfil/tomar perfil\` (@user/number)

*• SPY FUNCTION*
◦ \`👁️‍🗨️/👁️/:)\` (steal photos/videos/audios from a single view)
`;

    let caption = `*HELLO I AM ${assistantName.toUpperCase()}* 

*— Version:* ${_package.version}
*— Creator:* ${ownerBot[0].name}
*— Runtime:* ${msToDate(process.uptime() * 1000)}

*NOTE:* _assistant without prefix._

*— COMMANDS —*
${customCommands}`

    try {
        let sendImage = typeof assistantImage === 'string' ? { url: assistantImage } : assistantImage
        
        await conn.sendMessage(m.chat, { 
            image: sendImage, 
            caption: caption.trim()
        }, { quoted: m })
        
    } catch (e) {
        await conn.reply(m.chat, caption.trim(), m)
    }
}

handler.command = ['menu', 'comandos', 'funcioned', 'ayuda']

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
    return `${dd}d ${hh}h ${mm}m ${ss}s`
}
