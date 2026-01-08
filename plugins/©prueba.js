import baileys from '@whiskeysockets/baileys'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    // 1. Validar que se envíe un emoji
    if (!text) return m.reply(`⚠️ Responde a un mensaje del canal y escribe:\n*${usedPrefix + command}* 🔥`)

    // 2. Obtener el mensaje al que estás respondiendo (Quoted)
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mtype || ''
    
    // 3. Determinar el JID del canal
    // Si estás respondiendo a un mensaje reenviado del canal, intentamos sacar el JID
    let channelJid = '120363406846602793@newsletter' 

    // 4. Filtrar bots activos
    let bots = global.conns.filter(c => c.user && c.ws?.socket && c.ws.socket.readyState === 1)

    if (bots.length === 0) return m.reply('❌ No hay sub-bots conectados.')

    await m.reply(`🚀 Reaccionando con *${bots.length}* bots al mensaje seleccionado...`)

    let successCount = 0
    for (let [index, sock] of bots.entries()) {
        try {
            await new Promise(resolve => setTimeout(resolve, index * 500)) 

            await sock.sendMessage(channelJid, {
                react: {
                    text: text.trim(),
                    key: {
                        remoteJid: channelJid,
                        fromMe: false,
                        // Aquí usamos el ID real del mensaje que sacamos del quoted
                        id: m.quoted ? m.quoted.id : m.key.id,
                    }
                }
            }, { newsletter: true })
            
            successCount++
        } catch (e) {
            console.error(`[ERROR] Bot ${sock.user?.id}:`, e.message)
        }
    }

    return m.reply(`✅ **Resultado**\n\n✨ Reacciones: ${successCount}\n🤖 Bots: ${bots.length}`)
}

handler.help = ['reac']
handler.tags = ['owner']
handler.command = /^(reac|reaccionar)$/i
handler.owner = true 

export default handler
