import fetch from 'node-fetch'

let handler = async (m, { conn, groupMetadata }) => {
    const who = m.sender
    const nombreDelGrupo = m.isGroup ? groupMetadata.subject : 'Chat de Prueba'
    const totalMembers = m.isGroup ? groupMetadata.participants.length : '1'
    const name = conn.getName(who)

    // Obtener imagen
    let ppUrl
    try {
        ppUrl = await conn.profilePictureUrl(who, 'image')
    } catch {
        ppUrl = global.getAssistantConfig?.(conn.user.jid)?.assistantImage || 'https://i.ibb.co/jPSF32Pz/9005bfa156f1f56fb2ac661101d748a5.jpg'
    }

    let imageBuffer
    try {
        const response = await fetch(ppUrl)
        imageBuffer = await response.buffer()
    } catch {
        const response = await fetch('https://i.ibb.co/jPSF32Pz/9005bfa156f1f56fb2ac661101d748a5.jpg')
        imageBuffer = await response.buffer()
    }

    // --- ESTILO 1: PERFIL PROFESIONAL (Sin VCard visible) ---
    // Este estilo hace que el mensaje parezca una mención oficial de perfil
    let style1 = {
        contextInfo: {
            externalAdReply: {
                title: `Usuario: ${name}`,
                body: `Se ha unido a ${nombreDelGrupo}`,
                mediaType: 1,
                renderLargerThumbnail: true,
                thumbnail: imageBuffer,
                sourceUrl: 'https://www.deylin.xyz',
                showAdAttribution: false // Quita el "Anuncio" para que se vea más limpio
            }
        }
    }
    await conn.sendMessage(m.chat, { text: `✅ *Bienvenida Confirmada*\nHola @${who.split('@')[0]}, ya eres parte de nosotros.`, mentions: [who] }, { quoted: { key: { participant: who, remoteJid: "status@broadcast" }, message: { conversation: `Perfil de ${name}` } }, contextInfo: style1.contextInfo })

    // --- ESTILO 2: MODO NOTIFICACIÓN FLOTANTE ---
    // Usa un formato más pequeño que parece una notificación push del sistema
    let style2 = {
        contextInfo: {
            externalAdReply: {
                title: name,
                body: `Miembro Nº ${totalMembers}`,
                mediaType: 1,
                renderLargerThumbnail: false, // Miniatura circular a la derecha
                thumbnail: imageBuffer,
                containsAutoReply: true
            }
        }
    }
    await conn.sendMessage(m.chat, { text: `✨ ¡Un nuevo usuario ha aterrizado!` }, { quoted: { key: { participant: who, remoteJid: "status@broadcast" }, message: { conversation: name } }, contextInfo: style2.contextInfo })

    // --- ESTILO 3: DISEÑO "MENCION DE PERFIL" ---
    // Simula que el bot está respondiendo a una acción directa del perfil del usuario
    let style3 = {
        contextInfo: {
            externalAdReply: {
                title: `BIENVENIDO(A)`,
                body: `ID: ${who.split('@')[0]}`,
                mediaType: 1,
                renderLargerThumbnail: true,
                thumbnail: imageBuffer,
                sourceUrl: null,
                mediaUrl: null
            }
        }
    }
    await conn.sendMessage(m.chat, { text: `> Bienvenido a la comunidad de ${nombreDelGrupo}` }, { quoted: { key: { participant: who, remoteJid: "status@broadcast" }, message: { extendedTextMessage: { text: `Perfil verificado de ${name}` } } }, contextInfo: style3.contextInfo })
}

handler.command = /^(prueba2|testprofile)$/i
handler.rowner = true 

export default handler
