import fetch from 'node-fetch'

let handler = async (m, { conn, groupMetadata }) => {
    const who = m.sender
    const name = conn.getName(who)
    const nombreDelGrupo = m.isGroup ? groupMetadata.subject : 'Grupo de Prueba'
    
    // 1. Intentar obtener la URL de la foto de perfil
    let ppUrl
    try {
        ppUrl = await conn.profilePictureUrl(who, 'image')
    } catch (e) {
        // Si falla (por privacidad o falta de foto), usamos la del asistente
        ppUrl = global.getAssistantConfig?.(conn.user.jid)?.assistantImage || 'https://i.ibb.co/jPSF32Pz/9005bfa156f1f56fb2ac661101d748a5.jpg'
    }

    // 2. Convertir la URL a Buffer (Indispensable para que se vea)
    let imageBuffer
    try {
        const res = await fetch(ppUrl)
        if (!res.ok) throw new Error()
        imageBuffer = await res.buffer()
    } catch {
        const res = await fetch('https://i.ibb.co/jPSF32Pz/9005bfa156f1f56fb2ac661101d748a5.jpg')
        imageBuffer = await res.buffer()
    }

    // --- DISEÑO: PERFIL INTEGRADO (ESTILO MODERNO) ---
    // Construimos el mensaje de forma que el 'quoted' sea el perfil
    await conn.sendMessage(m.chat, { 
        text: `Hola @${who.split('@')[0]}, ¡bienvenido al grupo!`,
        mentions: [who],
        contextInfo: {
            externalAdReply: {
                title: `PERFIL: ${name}`,
                body: `Integrante de ${nombreDelGrupo}`,
                mediaType: 1,
                renderLargerThumbnail: true, // Esto hace que la foto se vea grande y clara
                thumbnail: imageBuffer, // El buffer con tu foto
                sourceUrl: 'https://www.deylin.xyz',
                showAdAttribution: false
            }
        }
    }, { 
        quoted: {
            key: { 
                participant: who, // Vinculamos el mensaje a tu JID
                remoteJid: "status@broadcast" 
            },
            message: {
                locationMessage: { // Usar locationMessage a veces ayuda a forzar la miniatura
                    degreesLatitude: 0,
                    degreesLongitude: 0,
                    name: name,
                    jpegThumbnail: imageBuffer // Doble refuerzo de imagen
                }
            }
        } 
    })
}

handler.command = /^(prueba|test)$/i
handler.rowner = true 

export default handler
