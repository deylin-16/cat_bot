import ws from 'ws'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!m.isGroup) return

    if (text === 'off' || text === 'reset' || text === 'liberar') {
        global.db.data.chats[m.chat].primaryBot = ''
        return m.reply(`✅ Grupo liberado. Todos los asistentes pueden responder.`)
    }

    let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : null

    if (!who) return m.reply(`Menciona al bot que quieres dejar como único asistente.`)

    const cleanNumber = (jid) => jid.split('@')[0].replace(/[^0-9]/g, '')
    const targetNumber = cleanNumber(who)

    const activeBots = (global.conns || []).filter(c => c.user && c.ws?.socket && c.ws.socket.readyState !== ws.CLOSED)

    const onlineNumbers = [
        cleanNumber(conn.user.jid),
        ...activeBots.map(v => cleanNumber(v.user.jid))
    ].filter(Boolean)

    if (!onlineNumbers.includes(targetNumber)) {
        return m.reply(`❌ El usuario @${targetNumber} no es un asistente activo o está desconectado.\n\nBots detectados: ${onlineNumbers.join(', ')}`, null, { mentions: [who] })
    }

    global.db.data.chats[m.chat].primaryBot = who

    await conn.sendMessage(m.chat, {
        text: `✅ *Prioridad Establecida*\n\nSolo el asistente @${targetNumber} tiene permiso para responder en este grupo.`,
        mentions: [who]
    }, { quoted: m })
}

handler.command = /^(prioridad|primary|setbot)$/i
handler.rowner = true

export default handler