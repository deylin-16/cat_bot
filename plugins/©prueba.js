import baileys from '@whiskeysockets/baileys'

let handler = async (m, { conn, text }) => {
    // 1. Usamos el ID que sacamos de tu inspección
    // Pero permitimos que el usuario lo pase por texto o por respuesta
    let msgId = text.split(' ')[0] || (m.quoted ? m.quoted.id : null)
    let emoji = text.split(' ')[1] || '❤️'

    if (!msgId) return m.reply('⚠️ Responde al mensaje o pega el ID de la inspección.')

    // EL JID REAL DE TU CANAL
    let channelJid = '120363406846602793@newsletter' 

    let bots = global.conns.filter(c => c.user && c.ws?.socket && c.ws.socket.readyState === 1)
    m.reply(`🚀 Intentando forzar reacción en el canal con el ID: ${msgId}`)

    let successCount = 0
    for (let [index, sock] of bots.entries()) {
        try {
            await new Promise(resolve => setTimeout(resolve, index * 600)) 

            await sock.sendMessage(channelJid, {
                react: {
                    text: emoji,
                    key: {
                        remoteJid: channelJid,
                        fromMe: false, 
                        id: msgId, // Usamos el ID alfanumérico largo
                    }
                }
            }, { newsletter: true })
            
            successCount++
        } catch (e) {
            console.error(`Error en bot ${sock.user?.id}:`, e.message)
        }
    }

    return m.reply(`✅ **Forzado Completado**\n\n✨ Reacciones: ${successCount}\n📌 Si esto no funciona, el ID ${msgId} solo existe en el grupo y no es válido para el canal.`)
}

handler.command = /^(reacf|forzar)$/i
handler.owner = true 

export default handler
