import fs from 'fs'
import path from 'path'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!m.isGroup) return

    if (text === 'off' || text === 'reset' || text === 'liberar') {
        global.db.data.chats[m.chat].primaryBot = ''
        return m.reply(`✅ Grupo liberado. Todos los asistentes pueden responder.`)
    }

    let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : null

    if (!who) return m.reply(`Menciona al bot que quieres dejar como único asistente.\n\nEjemplo: ${usedPrefix + command} @bot\nPara resetear: ${usedPrefix + command} off`)

    const botNumber = who.split('@')[0]
    const mainBotNumber = conn.user.jid.split('@')[0]
    
    const pathSubBots = path.join(process.cwd(), 'sessions_sub_assistant')
    const pathUserSession = path.join(pathSubBots, botNumber)

    const isMainBot = botNumber === mainBotNumber
    const isSubBotFile = fs.existsSync(pathUserSession)

    if (!isMainBot && !isSubBotFile) {
        return m.reply(`❌ El usuario @${botNumber} no es un asistente registrado en el sistema.`, null, { mentions: [who] })
    }

    global.db.data.chats[m.chat].primaryBot = who

    await conn.sendMessage(m.chat, {
        text: `✅ *Prioridad Establecida*\n\nSolo @${botNumber} responderá en este grupo. Los demás se mantendrán en espera.`,
        mentions: [who]
    }, { quoted: m })
}

handler.command = /^(prioridad|primary|setbot)$/i
handler.rowner = true

export default handler
