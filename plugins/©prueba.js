let handler = async (m, { conn }) => {
    let chats = global.db.data.chats
    let count = 0

    Object.keys(chats).forEach(jid => {
        if (chats[jid].primaryBot) {
            chats[jid].primaryBot = ''
            count++
        }
    })

    if (count === 0) {
        return m.reply('✅ No había ningún grupo con prioridad establecida. Todos los bots ya estaban libres.')
    }

    await conn.sendMessage(m.chat, { 
        text: `✅ *Restauración Completa*\n\nSe ha eliminado la prioridad en *${count}* grupos. Ahora todos los asistentes responderán en todas partes.` 
    }, { quoted: m })
}

handler.command = /^(restaurarbot|resetbots|liberartodo)$/i
handler.rowner = true

export default handler
