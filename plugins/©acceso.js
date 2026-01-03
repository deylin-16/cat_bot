import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'

let handler = async (m, { conn, command }) => {
    if (!globalThis.db.data.settings[conn.user.jid]?.jadibotmd) return m.reply(`El comando está desactivado.`)
    
    let phoneNumber = m.sender.split('@')[0]
    let authFolder = path.join(process.cwd(), 'jadibts', phoneNumber)
    if (!fs.existsSync(authFolder)) fs.mkdirSync(authFolder, { recursive: true })

    await m.reply('⚡ *Iniciando motor independiente...*\nEspere su código de vinculación en este chat.')

    const child = spawn('node', [
        'index.js', 
        `--session=${phoneNumber}`, 
        `--chatId=${m.chat}`
    ], {
        cwd: process.cwd(),
        stdio: 'inherit',
        detached: true
    })

    child.unref()
}

handler.command = /^(conectar|conectar_assistant)$/i 
export default handler
