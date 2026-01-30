import ws from 'ws'

const prioridad = {
    name: 'prioridad',
    alias: ['primary', 'setbot'],
    category: 'admin',
    rowner: true,
    group: true,
    run: async (m, { conn, text, usedPrefix, command }) => {
        if (text === 'off' || text === 'reset' || text === 'liberar') {
            global.db.data.chats[m.chat].primaryBot = ''
            return m.reply(`✅ Grupo liberado. Todos los asistentes pueden responder.`)
        }

        let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : null

        if (!who) return m.reply(`Menciona al bot que quieres dejar como único asistente.`)

        const cleanNumber = (jid) => jid.split('@')[0].replace(/\D/g, '')
        const targetNumber = cleanNumber(who)

        const activeBots = (global.conns || []).filter(c => c.user && c.ws?.socket?.readyState === ws.OPEN)

        const onlineNumbers = [
            cleanNumber(conn.user.jid),
            ...activeBots.map(v => cleanNumber(v.user.jid))
        ].filter(Boolean)

        if (!onlineNumbers.includes(targetNumber)) {
            return m.reply(`❌ El usuario @${targetNumber} no es un asistente activo.\n\nAsistentes: ${onlineNumbers.join(', ')}`, null, { mentions: [who] })
        }

        global.db.data.chats[m.chat].primaryBot = who

        await conn.sendMessage(m.chat, {
            text: `✅ *Prioridad Establecida*\n\nSolo el asistente @${targetNumber} tiene permiso para responder en este grupo.`,
            mentions: [who]
        }, { quoted: m })
    }
}

export default prioridad
