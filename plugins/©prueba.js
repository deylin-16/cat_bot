import fetch from 'node-fetch'

let handler = async (m, { conn }) => {
    const config = global.getAssistantConfig(conn.user.jid)
    
    let canalLink = 'https://www.deylin.xyz/1' 
    let iconoUrl = 'https://i.ibb.co/g8PsK57/IMG-20251224-WA0617.jpg'
    
    let buffer = await (await fetch(iconoUrl)).buffer()

    await conn.sendMessage(m.chat, {
        text: canalLink, 
        contextInfo: {
            externalAdReply: {
                title: 'COMUNIDAD OFICIAL 🚀',
                body: `Asistente: ${config.assistantName}`,
                thumbnail: buffer,
                
                // CAMBIO MAESTRO:
                // Usamos mediaType 2 (Video). WhatsApp NO intenta abrir el visor de fotos con el tipo 2,
                // sino que ejecuta directamente la acción de sourceUrl.
                mediaType: 2, 
                
                mediaUrl: canalLink,
                sourceUrl: canalLink,
                renderLargerThumbnail: true,
                showAdAttribution: true
            }
        }
    }, { quoted: m })
}

handler.command = ['prueba']
export default handler
