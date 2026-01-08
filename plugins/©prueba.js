import baileys from '@whiskeysockets/baileys'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`*${usedPrefix + command}* https://whatsapp.com/channel/xxx/123 ✅`)

    let [link, emoji] = text.split(' ')
    if (!link || !emoji) return m.reply(`⚠️ Ejemplo:\n*${usedPrefix + command}* enlace emoji`)

    // Limpieza profunda del ID del mensaje
    // A veces el enlace trae parámetros como ?v=... que dañan el ID
    let msgId = link.split('/').pop().split('?')[0]
    let channelJid = '120363406846602793@newsletter'

    if (!msgId || isNaN(msgId)) return m.reply('❌ El ID del mensaje no es válido.')

    let bots = global.conns.filter(c => c.user && c.ws?.socket && c.ws.socket.readyState !== 0)

    if (bots.length === 0) return m.reply('❌ No hay sub-bots conectados en global.conns.')

    await m.reply(`🚀 Intentando reaccionar con *${bots.length}* bots al mensaje #${msgId}...`)

    let successCount = 0
    for (let [index, sock] of bots.entries()) {
        try {
            await new Promise(resolve => setTimeout(resolve, index * 700)) 

            await sock.sendMessage(channelJid, {
                react: {
                    text: emoji,
                    key: {
                        remoteJid: channelJid,
                        fromMe: false, 
                        id: msgId, // El ID en canales debe ser puramente el número
                    }
                }
            }, { 
                newsletter: true,
                broadcast: true // Forzamos el modo broadcast para canales
            })
            
            successCount++
        } catch (e) {
            console.error(`[ERROR REACCIÓN]:`, e.message)
        }
    }

    return m.reply(`✅ **Reporte Final**\n\n✨ Reacciones enviadas: ${successCount}\n🤖 Bots activos: ${bots.length}\n\n> Si aún no aparecen, verifica que el canal permita reacciones de 'Cualquier emoji'.`)
}

handler.help = ['reac']
handler.tags = ['owner']
handler.command = /^(reac|reaccionar)$/i
handler.owner = true 

export default handler
