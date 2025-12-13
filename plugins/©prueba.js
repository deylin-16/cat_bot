import { webp2png } from './lib/webp2mp4.js'
import fetch from 'node-fetch'
import { isJidGroup } from '@whiskeysockets/baileys'

let handler = async (m, { conn, text, args, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, participants, groupMetadata, command }) => {
    if (!m.isGroup) return m.reply('😒 ¿De verdad esperabas que hiciera algo en privado? Solo sirvo para grupos.')
    
    if (!isAdmin) return m.reply('😼 Te crees importante, ¿verdad? Solo hablo con los administradores, humano.')
    
    if (!isBotAdmin) return m.reply('🙄 Soy un gato ocupado. Necesito ser administrador para molestarte y hacer estas cosas. ¡Arregla eso!')

    let action = text.toLowerCase().trim()

    if (!action) return m.reply(`*Instrucciones para Jiji. No me hagas repetirlo:*
🔑 *Cerrar/Abrir:* jiji cierra el grupo | jiji abre el grupo
📝 *Metadatos:* jiji cambia el nombre a [nombre] | jiji cambia la foto (responde a una imagen)
✂️ *Mantenimiento:* jiji elimina a @user | jiji menciona a todos`)

    // CERRAR GRUPO
    if (action.includes('cierra') || action.includes('cerrar') || action.includes('bloquear') || action.includes('ciérralo')) {
        await conn.groupSettingUpdate(m.chat, 'announcement')
        m.reply('🔒 Hecho. Silencio total. Ahora, hazme caso.')

    // ABRIR GRUPO
    } else if (action.includes('abre') || action.includes('abrir') || action.includes('desbloquear') || action.includes('ábrelo')) {
        await conn.groupSettingUpdate(m.chat, 'not_announcement')
        m.reply('🔓 ¡Qué fastidio! Grupo abierto. Que empiece el ruido.')

    // CAMBIAR NOMBRE DEL GRUPO
    } else if (action.includes('cambia el nombre') || action.includes('renombrar') || action.includes('ponle nombre')) {
        let newSubject = text.substring(command.length).trim().replace(/cambia el nombre a|renombrar a|ponle nombre/gi, '').trim()
        
        if (!newSubject) return m.reply('😒 ¿Acaso esperas que adivine el nombre? Dímelo.')
        if (newSubject.length > 25) return m.reply('🙄 El nombre no es una novela. Menos de 25 caracteres.')

        await conn.groupUpdateSubject(m.chat, newSubject)
        m.reply(`✅ Título cambiado a: *${newSubject}*. Qué creatividad.`)

    // CAMBIAR DESCRIPCIÓN DEL GRUPO
    } else if (action.includes('cambia la descripción') || action.includes('pon descripción') || action.includes('descr') || action.includes('descripción')) {
        let newDesc = text.substring(command.length).trim().replace(/cambia la descripción a|pon descripción|descr/gi, '').trim()
        
        if (!newDesc && m.quoted && m.quoted.text) {
            newDesc = m.quoted.text.trim()
        }
        
        if (!newDesc) return m.reply('😒 Necesito el texto. ¿Respondiste a algo? ¿O vas a escribirlo?')
        
        await conn.groupUpdateDescription(m.chat, newDesc)
        m.reply('✅ Descripción actualizada. Espero que sirva de algo.')

    // CAMBIAR FOTO DEL GRUPO
    } else if (action.includes('cambia la foto') || action.includes('pon foto') || action.includes('cambiar imagen')) {
        let q = m.quoted ? m.quoted : m
        let mime = (q.msg || q).mimetype || q.mediaType || ''
        
        if (!/image\/(jpe?g|png)|webp/.test(mime)) {
            return m.reply('🖼️ Tienes que responder a una imagen, ¿o esperas que ponga una foto mía? Nunca.')
        }

        try {
            let media = await q.download?.()
            
            if (/webp/.test(mime)) {
                media = await webp2png(media)
            }
            
            await conn.updateProfilePicture(m.chat, media)
            m.reply('✅ Foto cambiada. Ahora el grupo se ve... diferente.')
        } catch (e) {
            console.error(e)
            m.reply('❌ Falló. Problema de la imagen. No es mi culpa.')
        }
        
    // ELIMINAR USUARIOS
    } else if (action.includes('elimina') || action.includes('eliminalo') || action.includes('sácalo') || action.includes('fuera')) {
        let users = m.mentionedJid.filter(u => u.endsWith('@s.whatsapp.net'))
        
        if (users.length === 0 && m.quoted) {
            let targetJid = m.quoted.sender
            if (targetJid.endsWith('@s.whatsapp.net')) {
                users.push(targetJid)
            }
        }
        
        if (users.length === 0) return m.reply('🤦 Menciona al culpable (o responde a su mensaje). Pierdo mi tiempo.')

        for (let user of users) {
            const isTargetAdmin = groupMetadata.participants.find(p => p.id === user)?.admin
            if (isTargetAdmin === 'admin' && !isRAdmin) {
                m.reply(`😼 No soy tu guardián. No puedo sacar a @${user.split('@')[0]} porque también es administrador.`)
                continue
            }
            
            await conn.groupParticipantsUpdate(m.chat, [user], 'remove')
            m.reply(`🧹 Uno menos. @${user.split('@')[0]} ha sido expulsado. La paz sea contigo (por ahora).`)
        }

    // MENCIONAR A TODOS (TAGALL)
    } else if (action.includes('menciona todos') || action.includes('tagall') || action.includes('menciónalos')) {
        let members = participants.map(p => p.id)
        let mentionText = '📢 ¡Despierten! Jiji los llama:\n\n'
        
        let customText = text.substring(command.length).trim().replace(/menciona todos|tagall|menciónalos/gi, '').trim()
        if(customText) {
            mentionText = `📢 Tienen un mensaje de @${m.sender.split('@')[0]}:\n\n` + customText + '\n\n'
        }
        
        mentionText += members.map(jid => `@${jid.split('@')[0]}`).join(' ')
        
        conn.sendMessage(m.chat, { 
            text: mentionText, 
            contextInfo: { mentionedJid: members } 
        }, { quoted: m })
        
    } else {
        m.reply('🙄 No entendí. Si vas a molestarme, al menos hazlo bien.')
    }
}

handler.command = ['jiji']
handler.group = true
handler.admin = true
handler.tags = ['admin']

export default handler
