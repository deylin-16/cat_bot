import { newsletterKey } from '@whiskeysockets/baileys'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    // Validación de entrada: Reac [enlace] [emoji]
    if (!text) throw `*${usedPrefix + command}* https://whatsapp.com/channel/xxx/123 ✅`
    
    let [link, emoji] = text.split(' ')
    if (!link || !emoji) throw `⚠️ Formato incorrecto. Ejemplo:\n*${usedPrefix + command}* https://whatsapp.com/channel/0029Vag71O87zTclO8uDIn3n/150 🔥`

    // Extraer el ID del mensaje del enlace del canal
    // El enlace suele ser: https://whatsapp.com/channel/JID/ID_MENSAJE
    let msgId = link.split('/').pop()
    let channelJid = '120363406846602793@newsletter'

    if (!msgId || isNaN(msgId)) throw '❌ El enlace no parece válido o no contiene el ID del mensaje.'

    let bots = global.conns.filter(c => c.user && c.ws.socket && c.ws.socket.readyState !== 0) // Solo bots activos
    
    if (bots.length === 0) return m.reply('❌ No hay sub-bots conectados actualmente.')

    m.reply(`🚀 Enviando reacción con *${bots.length}* sub-bots al mensaje ID: ${msgId}`)

    for (let [index, sock] of bots.entries()) {
        try {
            // Pequeño retraso entre cada bot para que las reacciones entren una por una y no se saturen
            await new Promise(resolve => setTimeout(resolve, index * 500)) 

            await sock.sendMessage(channelJid, {
                react: {
                    text: emoji,
                    key: {
                        remoteJid: channelJid,
                        fromMe: false, // Los mensajes del canal no son "nuestros"
                        id: msgId,
                    }
                }
            }, { newsletter: true })
        } catch (e) {
            console.error(`Error en bot ${sock.user.id}:`, e)
        }
    }

    m.reply('✅ Proceso de reacción masiva finalizado.')
}

handler.help = ['reac']
handler.tags = ['owner']
handler.command = /^(reac|reaccionar)$/i
handler.owner = true // Solo tú puedes usarlo

export default handler
