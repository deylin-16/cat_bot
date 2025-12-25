let handler = async (m, { conn }) => {
    const config = global.getAssistantConfig(conn.user.jid)
    
    let isBuffer = Buffer.isBuffer(config.assistantImage)
    let targetUrl = 'https://www.deylin.xyz'

    await conn.sendMessage(m.chat, {
        text: targetUrl,
        contextInfo: {
            externalAdReply: {
                title: `CÓDIGO DE EMPAREJAMIENTO`,
                body: `Asistente: ${config.assistantName}`,
                mediaType: 2, 
                renderLargerThumbnail: true,
                thumbnail: isBuffer ? config.assistantImage : null,
                thumbnailUrl: !isBuffer ? config.assistantImage : null,
                sourceUrl: targetUrl,
                mediaUrl: targetUrl,
                showAdAttribution: false
            }
        }
    }, { quoted: m })
}

handler.command = ['prueba']

export default handler
