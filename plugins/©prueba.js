import baileys from '@whiskeysockets/baileys'

let handler = async (m, { conn, text }) => {
    let link = text.trim()
    if (!link.includes('whatsapp.com/channel/')) return m.reply('⚠️ Pega el enlace del canal.')

    let serverId = link.split('/').pop().split('?')[0]
    let channelJid = '120363406846602793@newsletter'

    try {
        m.reply(`📡 Consultando directamente al servidor de WA por el ID: ${serverId}...`)

        // Consultamos al servidor por el mensaje específico
        const result = await conn.query({
            tag: 'newsletter',
            attrs: { jid: channelJid, type: 'get' },
            content: [
                {
                    tag: 'message',
                    attrs: { server_id: serverId }
                }
            ]
        })

        await m.reply(`✅ **Respuesta del Servidor:**\n\n\`\`\`${JSON.stringify(result, null, 2)}\`\`\``)

    } catch (e) {
        // Si aquí sale "item-not-found", es que el ID del enlace no sirve para reaccionar
        await m.reply(`❌ Error de Servidor: ${e.message}`)
        
        if (e.message.includes('not-authorized')) {
            await m.reply('💡 El bot no está autorizado. Los subbots DEBEN seguir el canal primero.')
        }
    }
}

handler.command = /^(inspec2|debug2)$/i
handler.owner = true
export default handler
