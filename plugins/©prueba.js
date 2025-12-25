import fetch from 'node-fetch'

let handler = async (m, { conn }) => {
    const config = global.getAssistantConfig(conn.user.jid)
    
    // Configuración Base
    let canalLink = 'https://www.deylin.xyz/1' 
    let iconoUrl = 'https://i.ibb.co/g8PsK57/IMG-20251224-WA0617.jpg'
    let botName = config.assistantName
    
    // Descarga y conversión a Buffer (Datos Binarios Reales)
    let response = await fetch(iconoUrl)
    let buffer = await response.buffer()

    await conn.sendMessage(m.chat, {
        text: canalLink, // El texto base es el link para forzar anclaje
        contextInfo: {
            // 1. Forzamos estado de reenvío para activar metadatos de link
            isForwarded: true,
            
            // 2. Metadatos de Newsletter (Engaña al sistema para que crea que es un canal oficial)
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363160031023229@newsletter',
                serverMessageId: 100,
                newsletterName: `COMUNIDAD: ${botName}`,
            },

            // 3. Lógica Inmensa de AdReply (Redundancia Total)
            externalAdReply: {
                title: `🌟 UNIRSE A: ${botName.toUpperCase()}`,
                body: '🚀 TOCA AQUÍ PARA ACCESO EXCLUSIVO',
                mediaType: 1, 
                previewType: "PHOTO", 
                thumbnail: buffer, // Datos binarios
                
                // REPETICIÓN ESTRATÉGICA: Llenamos todos los campos con el mismo link
                // para que no quede ni un solo espacio "vacío" o "en blanco"
                sourceUrl: canalLink,
                mediaUrl: canalLink, // Forzamos que el "medio" sea la web del canal
                
                renderLargerThumbnail: true, // Impacto visual grande
                showAdAttribution: true, // Etiqueta de "Enlace" oficial
                containsAutoReply: true,
                
                // Campos adicionales para forzar la detección del sistema
                ctwaContext: {
                    sourceUrl: canalLink,
                    description: botName
                }
            }
        }
    }, { quoted: m })
}

handler.command = ['prueba_total']
export default handler
