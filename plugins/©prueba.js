import { newsletterKey } from '@whiskeysockets/baileys'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    // Validación de entrada: Reac [enlace] [emoji]
    if (!text) {
        return m.reply(`*${usedPrefix + command}* https://whatsapp.com/channel/xxx/123 ✅`)
    }

    let [link, emoji] = text.split(' ')
    if (!link || !emoji) {
        return m.reply(`⚠️ Formato incorrecto. Ejemplo:\n*${usedPrefix + command}* https://whatsapp.com/channel/0029Vag71O87zTclO8uDIn3n/150 🔥`)
    }

    // Extraer el ID del mensaje del enlace del canal
    // El enlace suele ser: https://whatsapp.com/channel/JID/ID_MENSAJE
    let msgId = link.split('/').pop()
    let channelJid = '120363406846602793@newsletter'

    if (!msgId || isNaN(msgId)) {
        return m.reply('❌ El enlace no parece válido o no contiene el ID del mensaje.')
    }

    // Filtrar solo los bots que están realmente conectados
    let bots = global.conns.filter(c => c.user && c.ws.socket && c.ws.socket.readyState !== 0)

    if (bots.length === 0) {
        return m.reply('❌ No hay sub-bots conectados actualmente en global.conns.')
    }

    m.reply(`🚀 Enviando reacción con *${bots.length}* sub-bots al mensaje ID: ${msgId}`)

    let successCount = 0
    for (let [index, sock] of bots.entries()) {
        try {
            // Retraso escalonado para evitar bloqueos
            await new Promise(resolve => setTimeout(resolve, index * 500)) 

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
            console.error(`[ERROR REACCIÓN] Bot ${sock.user.id}:`, e)
        }
    }

    m.reply(`✅ Proceso finalizado.\n\n🤖 Bots intentados: ${bots.length}\n✨ Reacciones exitosas: ${successCount}`)
}

handler.help = ['reac']
handler.tags = ['owner']
handler.command = /^(reac|reaccionar)$/i
handler.owner = true 

export default handler
