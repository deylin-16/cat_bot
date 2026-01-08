import baileys from '@whiskeysockets/baileys'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`*${usedPrefix + command}* enlace emoji`)

    let [link, emoji] = text.split(' ')
    if (!link || !emoji) return m.reply(`⚠️ Ejemplo:\n*${usedPrefix + command}* https://whatsapp.com/channel/xxx/123 👍`)

    // Limpieza del ID del mensaje
    let msgId = link.split('/').pop().split('?')[0]
    let channelJid = '120363406846602793@newsletter'

    // Filtrar subbots que estén realmente activos
    let bots = global.conns.filter(c => c.user && c.ws?.socket && c.ws.socket.readyState === 1)

    if (bots.length === 0) return m.reply('❌ No hay sub-bots conectados en este momento.')

    m.reply(`🚀 Intentando con *${bots.length}* bots. Si no reaccionan, asegúrate de que el bot siga al canal.`)

    let successCount = 0
    for (let [index, sock] of bots.entries()) {
        try {
            await new Promise(resolve => setTimeout(resolve, index * 800)) 

            // Intentamos enviar la reacción con una estructura de "Key" más completa
            await sock.sendMessage(channelJid, {
                react: {
                    text: emoji,
                    key: {
                        remoteJid: channelJid,
                        fromMe: false, 
                        id: msgId,
                        // Añadimos el participant para newsletters (opcional pero ayuda)
                        participant: channelJid 
                    }
                }
            }, { 
                newsletter: true 
            })
            
            successCount++
        } catch (e) {
            console.error(`[ERROR] Bot ${sock.user?.id}:`, e.message)
        }
    }

    return m.reply(`✅ **Proceso completado**\n\n✨ Reacciones enviadas: ${successCount}\n📌 Si no aparecen, prueba a publicar un mensaje NUEVO en el canal y usa el enlace de ese mensaje nuevo.`)
}

handler.help = ['reac']
handler.tags = ['owner']
handler.command = /^(reac|reaccionar)$/i
handler.owner = true 

export default handler
