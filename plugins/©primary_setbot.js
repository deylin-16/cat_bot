import ws from 'ws'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!m.isGroup) return

    if (text === 'off' || text === 'reset' || text === 'liberar') {
        global.db.data.chats[m.chat].primaryBot = ''
        return m.reply(`✅ Grupo liberado. Todos los asistentes pueden responder.`)
    }

    let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : null

    if (!who) return m.reply(`Menciona al bot que quieres dejar como único asistente.`)

    const activeBots = (global.conns || []).filter(c => c.user && c.ws?.socket && c.ws.socket.readyState !== ws.CLOSED)
    const onlineJids = [global.conn?.user?.jid, ...activeBots.map(v => v.user.jid)].filter(Boolean)

    if (!onlineJids.includes(who)) {
        return m.reply(`❌ El usuario @${who.split('@')[0]} no es un asistente activo o está desconectado.`, null, { mentions: [who] })
    }

    global.db.data.chats[m.chat].primaryBot = who

    await conn.sendMessage(m.chat, {
        text: `✅ *Prioridad Establecida*\n\nSolo el asistente @${who.split('@')[0]} tiene permiso para responder en este grupo.`,
        mentions: [who]
    }, { quoted: m })
}

handler.command = /^(prioridad|primary|setbot)$/i
handler.rowner = true

export default handler
