import baileys from '@whiskeysockets/baileys'

let handler = async (m, { conn, text }) => {
    let link = text.trim()
    if (!link || !link.includes('whatsapp.com/channel/')) {
        return m.reply('⚠️ Proporciona un enlace válido de un mensaje del canal para inspeccionarlo.')
    }

    // Extraemos el JID (si viene en el link) y el ID del mensaje
    let parts = link.split('/')
    let serverId = parts.pop().split('?')[0] // El número (ej: 133)
    let channelJid = '120363406846602793@newsletter' 

    try {
        m.reply(`🕵️ Investigando mensaje #${serverId} en el canal...`)

        // Intentamos obtener los metadatos del mensaje directamente del servidor
        // Nota: Esto solo funciona si el bot tiene el canal sincronizado
        let msgInfo = await conn.getAggregateVotesInNewsletterMessage(channelJid, serverId)
        
        let report = `🔍 *INSPECCIÓN DE ENLACE DIRECTO*\n\n`
        report += `📌 *Server ID:* \`${serverId}\`\n`
        report += `📡 *Canal JID:* \`${channelJid}\`\n`
        
        if (msgInfo) {
            report += `✅ *Mensaje encontrado en el servidor.*\n`
            report += `📊 *Data:* ${JSON.stringify(msgInfo)}\n`
        } else {
            report += `❌ *El servidor no devolvió data extendida.* Intentando con estructura de llave...\n`
        }

        await m.reply(report)

        // Prueba técnica: Intentar reaccionar con el bot principal para testear el ID
        await conn.sendMessage(channelJid, {
            react: {
                text: '🔍',
                key: {
                    remoteJid: channelJid,
                    fromMe: false,
                    id: serverId,
                }
            }
        }, { newsletter: true })

    } catch (e) {
        await m.reply(`❌ Error en la investigación profunda:\n${e.message}`)
        console.error(e)
    }
}

handler.command = /^(inspect|inspec)$/i
handler.owner = true

export default handler
