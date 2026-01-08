let handler = async (m, { conn }) => {
    // 1. Verificar si estás respondiendo a algo
    if (!m.quoted) return m.reply('⚠️ Responde a un mensaje del canal con este comando para inspeccionarlo.')

    try {
        // 2. Extraer la data cruda del mensaje citado
        const quotedData = m.quoted
        
        // 3. Construir un reporte detallado
        let report = `🔍 *INSPECCIÓN TÉCNICA DE MENSAJE*\n\n`
        report += `📌 *ID (key.id):* \`${quotedData.id}\`\n`
        report += `📡 *RemoteJID:* \`${quotedData.chat}\`\n`
        report += `👤 *Participant:* \`${quotedData.participant || 'No definido'}\`\n`
        report += `⏱️ *Timestamp:* \`${quotedData.msgTimestamp || 'N/A'}\`\n`
        report += `📝 *Tipo:* \`${quotedData.mtype}\`\n\n`
        
        // 4. Ver si tiene el ID del enlace (serverMessageId)
        if (quotedData.message?.newsletterAdminMesage) {
             report += `🆔 *Server ID:* \`${quotedData.message.newsletterAdminMesage.serverMessageId}\`\n`
        }

        report += `\n*Data JSON Completa:*`
        
        // Enviamos el texto y luego el JSON en un mensaje aparte porque puede ser largo
        await m.reply(report)
        await conn.sendMessage(m.chat, { text: JSON.stringify(quotedData, null, 2) }, { quoted: m })

    } catch (e) {
        await m.reply(`❌ Error en la inspección: ${e.message}`)
    }
}

handler.help = ['inspect']
handler.tags = ['tools']
handler.command = /^(inspect|inspeccionar|debug)$/i
handler.owner = true

export default handler
