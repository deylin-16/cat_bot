import fetch from 'node-fetch'

let handler = async (m, { conn }) => {
    const config = global.getAssistantConfig(conn.user.jid)
    
    let canalLink = 'https://www.deylin.xyz/1' 
    let iconoUrl = 'https://i.ibb.co/g8PsK57/IMG-20251224-WA0617.jpg'
    
    let buffer = await (await fetch(iconoUrl)).buffer()

    await conn.sendMessage(m.chat, {
        text: 'Haz clic en la imagen para unirte a la comunidad 🚀', 
        contextInfo: {
            externalAdReply: {
                title: config.assistantName,
                body: '🚀 ¡Únete al canal oficial!',
                thumbnail: buffer,
                mediaType: 1, // Volvemos a imagen para que se vea
                
                // LA SOLUCIÓN DEFINITIVA:
                // Dejamos mediaUrl en blanco para que no intente abrir archivos.
                // Así WhatsApp solo encuentra el sourceUrl para ejecutar el clic.
                mediaUrl: null, 
                sourceUrl: canalLink,
                
                renderLargerThumbnail: true,
                showAdAttribution: true
            }
        }
    }, { quoted: m })
}

handler.command = ['prueba']
export default handler
