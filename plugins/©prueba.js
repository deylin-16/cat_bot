import fetch from 'node-fetch'
import { sticker } from '../lib/sticker.js'
import { webp2png } from '../lib/webp2mp4.js'

export const ACTION_SYNONYMS = {
    CLOSE: ['cierra', 'cerrar', 'bloquea', 'mutea', 'silencia', 'tranca', 'ciérralo', 'silencialo', 'modo-admin', 'cerrar-grupo'],
    OPEN: ['abre', 'abrir', 'desbloquea', 'desmutea', 'desilencia', 'destranca', 'ábrelo', 'abrir-grupo'],
    RENAME: ['cambia nombre', 'renombrar', 'ponle nombre', 'actualiza nombre', 'modifica nombre', 'nuevo nombre'],
    DESC: ['cambia descripción', 'pon descripción', 'nueva descripción', 'actualiza descripción', 'modifica descripción', 'descr'],
    PHOTO: ['cambia foto', 'pon foto', 'cambiar imagen', 'actualiza foto', 'nueva foto', 'cambia perfil'],
    REMOVE: ['elimina', 'sacar', 'kickea', 'expulsa', 'saca', 'fuera', 'eliminalo', 'sácalo', 'quitar'],
    TAGALL: ['menciona todos', 'tagall', 'mencionar', 'aviso', 'notificar', 'menciónalos']
};

export async function handleJijiCommand(m, conn, { isROwner, isOwner, isRAdmin, participants, groupMetadata, command }) {
    const replyFunction = m.reply || ((text, quote, options) => conn.reply(m.chat, text, quote || m, options));

    if (!m.isGroup) {
        replyFunction('😒 ¿De verdad esperabas que hiciera algo en privado? Solo sirvo para grupos.');
        return true; 
    }
    
    if (!participants || !groupMetadata) {
        replyFunction('❌ No se pudo cargar la información del grupo. Inténtalo de nuevo.');
        return true; 
    }

    const groupAdmins = participants.filter(p => p.admin)
    const isAdmin = groupAdmins.some(p => p.id === m.sender)
    const isBotAdmin = groupAdmins.some(p => p.id === conn.user.jid)

    if (!isAdmin) {
        replyFunction('😼 Te crees importante, ¿verdad? Solo hablo con los administradores, humano.');
        return true; 
    }
    
    if (!isBotAdmin) {
        replyFunction('🙄 Soy un gato ocupado. Necesito ser administrador para molestarte y hacer estas cosas. ¡Arregla eso!');
        return true; 
    }

    let actionText = m.text.substring(command.length).toLowerCase().trim()
    if (!actionText) {
        replyFunction(`*Instrucciones de Jiji. No me hagas repetirlo:*\n\n🔑 *Grupo:* jiji cierra el grupo | jiji abre el grupo\n📝 *Metadatos:* jiji cambia el nombre a [nombre] | jiji cambia la foto (responde a una imagen)\n✂️ *Mantenimiento:* jiji elimina a @user | jiji menciona a todos`);
        return true;
    }

    const actionWords = actionText.split(/\s+/).slice(0, 3).join(' ')
    let actionExecuted = false;
    
    if (ACTION_SYNONYMS.CLOSE.some(syn => actionWords.includes(syn))) {
        await conn.groupSettingUpdate(m.chat, 'announcement')
        replyFunction('🔒 Hecho. Silencio total. Ahora, hazme caso.')
        actionExecuted = true;
    } else if (ACTION_SYNONYMS.OPEN.some(syn => actionWords.includes(syn))) {
        await conn.groupSettingUpdate(m.chat, 'not_announcement')
        replyFunction('🔓 ¡Qué fastidio! Grupo abierto. Que empiece el ruido.')
        actionExecuted = true;
    } else if (ACTION_SYNONYMS.RENAME.some(syn => actionWords.includes(syn))) {
        let newSubject = actionText.replace(new RegExp(ACTION_SYNONYMS.RENAME.join('|'), 'gi'), '').trim()
        if (!newSubject) {
            replyFunction('😒 ¿Acaso esperas que adivine el nombre? Dímelo.');
            return true;
        }
        if (newSubject.length > 25) {
            replyFunction('🙄 El nombre no es una novela. Menos de 25 caracteres.');
            return true;
        }
        await conn.groupUpdateSubject(m.chat, newSubject)
        replyFunction(`✅ Título cambiado a: *${newSubject}*. Qué creatividad.`)
        actionExecuted = true;
    } else if (ACTION_SYNONYMS.DESC.some(syn => actionWords.includes(syn))) {
        let newDesc = actionText.replace(new RegExp(ACTION_SYNONYMS.DESC.join('|'), 'gi'), '').trim()
        if (!newDesc && m.quoted && m.quoted.text) {
            newDesc = m.quoted.text.trim()
        }
        if (!newDesc) {
            replyFunction('😒 Necesito el texto. ¿Respondiste a algo? ¿O vas a escribirlo?');
            return true;
        }
        await conn.groupUpdateDescription(m.chat, newDesc)
        replyFunction('✅ Descripción actualizada. Espero que sirva de algo.')
        actionExecuted = true;
    } else if (ACTION_SYNONYMS.PHOTO.some(syn => actionWords.includes(syn))) {
        let q = m.quoted ? m.quoted : m
        let mime = (q.msg || q).mimetype || q.mediaType || ''
        if (!/image\/(jpe?g|png)|webp/.test(mime)) {
            replyFunction('🖼️ Tienes que responder a una imagen, ¿o esperas que ponga una foto mía? Nunca.')
            return true;
        }
        try {
            let media = await q.download?.()
            if (/webp/.test(mime)) {
                media = await webp2png(media)
            }
            await conn.updateProfilePicture(m.chat, media)
            replyFunction('✅ Foto cambiada. Ahora el grupo se ve... diferente.')
        } catch (e) {
            console.error(e)
            replyFunction('❌ Falló. Problema de la imagen. No es mi culpa.')
        }
        actionExecuted = true;
    } else if (ACTION_SYNONYMS.REMOVE.some(syn => actionWords.includes(syn))) {
        let users = m.mentionedJid.filter(u => u.endsWith('@s.whatsapp.net'))
        if (users.length === 0 && m.quoted) {
            let targetJid = m.quoted.sender
            if (targetJid.endsWith('@s.whatsapp.net')) {
                users.push(targetJid)
            }
        }
        if (users.length === 0) {
            replyFunction('🤦 Menciona al culpable (o responde a su mensaje). Pierdo mi tiempo.');
            return true;
        }
        for (let user of users) {
            const isTargetAdmin = groupMetadata.participants.find(p => p.id === user)?.admin
            if (isTargetAdmin === 'admin' && !isRAdmin) {
                replyFunction(`😼 No soy tu guardián. No puedo sacar a @${user.split('@')[0]} porque también es administrador.`)
                continue
            }
            await conn.groupParticipantsUpdate(m.chat, [user], 'remove')
            replyFunction(`🧹 Uno menos. @${user.split('@')[0]} ha sido expulsado. La paz sea contigo (por ahora).`)
        }
        actionExecuted = true;
    } else if (ACTION_SYNONYMS.TAGALL.some(syn => actionWords.includes(syn))) {
        let members = participants.map(p => p.id)
        let customText = actionText.replace(new RegExp(ACTION_SYNONYMS.TAGALL.join('|'), 'gi'), '').trim()
        let mentionText = `📢 Tienen un mensaje de @${m.sender.split('@')[0]}:\n\n` + (customText || '¡Presten atención, por si les importa algo en la vida!') + '\n\n'
        mentionText += members.map(jid => `@${jid.split('@')[0]}`).join(' ')
        conn.sendMessage(m.chat, { 
            text: mentionText, 
            contextInfo: { mentionedJid: members } 
        }, { quoted: m })
        actionExecuted = true;
    }
    
    return actionExecuted;
}

let handler = async (m, { conn, text }) => {
    
}

export default handler
