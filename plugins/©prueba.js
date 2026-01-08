import baileys from '@whiskeysockets/baileys'
const { proto } = baileys

let handler = async (m, { conn, text, usedPrefix, command }) => {
    // Validación de entrada con m.reply
    if (!text) {
        return m.reply(`*${usedPrefix + command}* https://whatsapp.com/channel/xxx/123 ✅`)
    }

    let [link, emoji] = text.split(' ')
    if (!link || !emoji) {
        return m.reply(`⚠️ Formato incorrecto. Ejemplo:\n*${usedPrefix + command}* https://whatsapp.com/channel/0029Vag71O87zTclO8uDIn3n/150 🔥`)
    }

    // Extraer el ID del mensaje del enlace
    let msgId = link.split('/').pop()
    let channelJid = '120363406846602793@newsletter'

    if (!msgId || isNaN(msgId)) {
        return m.reply('❌ El enlace no parece válido o no contiene el ID del mensaje.')
    }

    // Filtrar bots activos en el array global
    let bots = global.conns.filter(c => c.user && c.ws?.socket && c.ws.socket.readyState !== 0)

    if (bots.length === 0) {
        return m.reply('❌ No hay sub-bots conectados actualmente en la lista global.')
    }

    await m.reply(`🚀 Iniciando reacción masiva con *${bots.length}* sub-bots...`)

    let successCount = 0
    for (let [index, sock] of bots.entries()) {
        try {
            // Retraso para no saturar la conexión
            await new Promise(resolve => setTimeout(resolve, index * 600)) 

            await sock.sendMessage(channelJid, {
                react: {
                    text: emoji,
                    key: {
                        remoteJid: channelJid,
                        fromMe: false, 
                        id: msgId,
                    }
                }
            }, { newsletter: true })
            
            successCount++
        } catch (e) {
            console.error(`[ERROR] Bot ${sock.user?.id || 'Desconocido'}:`, e.message)
        }
    }

    return m.reply(`✅ **Reporte de Reacciones**\n\n✨ Exitosas: ${successCount}\n🤖 Total bots: ${bots.length}\n📌 Canal: Deylin`)
}

handler.help = ['reac']
handler.tags = ['owner']
handler.command = /^(reac|reaccionar)$/i
handler.owner = true 

export default handler
