let handler = async (m, { conn, groupMetadata }) => {
    const who = m.sender
    const nombreDelGrupo = m.isGroup ? groupMetadata.subject : 'Chat de Prueba'
    const totalMembers = m.isGroup ? groupMetadata.participants.length : '1'
    const mentionListText = `@${who.split('@')[0]}`

    // Obtención de imagen (Prioridad: Perfil > Asistente > Default)
    let ppUrl
    try {
        ppUrl = await conn.profilePictureUrl(who, 'image')
    } catch {
        ppUrl = global.getAssistantConfig?.(conn.user.jid)?.assistantImage || 'https://i.ibb.co/jPSF32Pz/9005bfa156f1f56fb2ac661101d748a5.jpg'
    }

    // --- DISEÑO 1: BANNER INFORMATIVO (Imagen Grande) ---
    let style1 = {
        key: { fromMe: false, participant: who, remoteJid: "status@broadcast" },
        message: { 
            contactMessage: { 
                displayName: `DISEÑO 1: BANNER`, 
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;Admin;;;\nFN:Admin\nEND:VCARD` 
            } 
        },
        contextInfo: {
            externalAdReply: {
                showAdAttribution: true,
                title: `ESTILO BANNER GRANDE`,
                body: nombreDelGrupo,
                mediaType: 1,
                renderLargerThumbnail: true,
                thumbnailUrl: ppUrl,
                sourceUrl: 'https://www.deylin.xyz'
            }
        }
    }
    await conn.sendMessage(m.chat, { text: 'Este es el *Diseño 1* (Banner Grande)' }, { quoted: style1 })

    // --- DISEÑO 2: COMPACTO (Imagen Pequeña a la derecha) ---
    let style2 = {
        key: { fromMe: false, participant: who, remoteJid: "status@broadcast" },
        message: { 
            contactMessage: { 
                displayName: mentionListText, 
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;User;;;\nFN:User\nEND:VCARD` 
            } 
        },
        contextInfo: {
            externalAdReply: {
                title: `ESTILO COMPACTO`,
                body: `Total: ${totalMembers} usuarios`,
                mediaType: 1,
                renderLargerThumbnail: false,
                thumbnailUrl: ppUrl,
                sourceUrl: null
            }
        }
    }
    await conn.sendMessage(m.chat, { text: 'Este es el *Diseño 2* (Miniatura Pequeña)' }, { quoted: style2 })

    // --- DISEÑO 3: NOTIFICACIÓN DE SISTEMA ---
    let style3 = {
        key: { fromMe: false, participant: who, remoteJid: "status@broadcast" },
        message: { 
            contactMessage: { 
                displayName: `ACCESO CONCEDIDO`, 
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;System;;;\nFN:System\nEND:VCARD` 
            } 
        },
        contextInfo: {
            externalAdReply: {
                title: `✅ PRUEBA DE SISTEMA`,
                body: `Usuario verificado: ${mentionListText}`,
                previewType: "PHOTO",
                thumbnailUrl: ppUrl,
                containsAutoReply: true
            }
        }
    }
    await conn.sendMessage(m.chat, { text: 'Este es el *Diseño 3* (Tipo Notificación)' }, { quoted: style3 })

}

handler.command = /^(prueba|testdesign)$/i
handler.rowner = true // Solo tú puedes probarlo para no spamear

export default handler
