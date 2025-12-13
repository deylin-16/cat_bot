import { webp2png } from '../lib/webp2mp4.js'
import fetch from 'node-fetch'
import { isJidGroup } from '@whiskeysockets/baileys'

const ACTION_SYNONYMS = {
    CLOSE: ['cierra', 'cerrar', 'bloquea', 'ciérralo', 'silencia el grupo', 'modo-admin'],
    OPEN: ['abre', 'abrir', 'desbloquea', 'ábrelo', 'quita modo-admin'],
    RENAME: ['cambia el nombre a', 'renombrar a', 'ponle nombre', 'nuevo nombre', 'actualiza nombre a'],
    DESC: ['cambia la descripción a', 'pon descripción', 'nueva descripción', 'descr', 'actualiza descripción'],
    PHOTO: ['cambia la foto', 'pon foto', 'cambiar imagen'],
    REMOVE: ['elimina', 'sacar', 'kickea', 'expulsa', 'saca', 'fuera', 'eliminalo', 'sácalo'],
    TAGALL: ['menciona todos', 'tagall', 'menciónalos', 'aviso a todos']
};

const handler = async (m, { conn, text, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, participants, groupMetadata, command }) => {
    
    if (!m.isGroup) return m.reply('😒 ¿De verdad esperabas que hiciera algo en privado? Solo sirvo para grupos.')
    if (!isAdmin) return m.reply('😼 Te crees importante, ¿verdad? Solo hablo con los administradores, humano.')
    if (!isBotAdmin) return m.reply('🙄 Soy un gato ocupado. Necesito ser administrador para molestarte y hacer estas cosas. ¡Arregla eso!')

    const actionText = text.toLowerCase().trim()
    
    if (!actionText) {
        return m.reply(`*Instrucciones para Jiji. No me hagas repetirlo:*
🔑 *Grupo:* jiji cierra el grupo | jiji abre el grupo
📝 *Metadatos:* jiji cambia el nombre a [nombre] | jiji cambia la foto (responde a una imagen)
✂️ *Mantenimiento:* jiji elimina a @user | jiji menciona a todos`)
    }

    let actionKey = null;
    let commandPhraseUsed = '';

    const actionSynonymsFlat = Object.entries(ACTION_SYNONYMS).flatMap(([key, syns]) => 
        syns.map(syn => ({ key, syn }))
    ).sort((a, b) => b.syn.length - a.syn.length);

    for (const { key, syn } of actionSynonymsFlat) {
        if (actionText.includes(syn)) {
            actionKey = key;
            commandPhraseUsed = syn;
            break;
        }
    }
    
    const cleanArgument = (fullText, usedPhrase) => {
        return fullText.replace(command, '').trim()
                       .replace(usedPhrase, '').trim()
                       .replace(new RegExp(usedPhrase, 'gi'), '').trim();
    };

    if (actionKey === 'CLOSE') {
        await conn.groupSettingUpdate(m.chat, 'announcement')
        m.reply('🔒 Hecho. Silencio total. Ahora, hazme caso.')

    } else if (actionKey === 'OPEN') {
        await conn.groupSettingUpdate(m.chat, 'not_announcement')
        m.reply('🔓 ¡Qué fastidio! Grupo abierto. Que empiece el ruido.')

    } else if (actionKey === 'RENAME') {
        const newSubject = cleanArgument(actionText, commandPhraseUsed);

        if (!newSubject) return m.reply('😒 ¿Acaso esperas que adivine el nombre? Dímelo.')
        if (newSubject.length > 25) return m.reply('🙄 El nombre no es una novela. Menos de 25 caracteres.')

        await conn.groupUpdateSubject(m.chat, newSubject)
        m.reply(`✅ Título cambiado a: *${newSubject}*. Qué creatividad.`)

    } else if (actionKey === 'DESC') {
        let newDesc = cleanArgument(actionText, commandPhraseUsed);

        if (!newDesc && m.quoted && m.quoted.text) {
            newDesc = m.quoted.text.trim()
        }

        if (!newDesc) return m.reply('😒 Necesito el texto. ¿Respondiste a algo? ¿O vas a escribirlo?')

        await conn.groupUpdateDescription(m.chat, newDesc)
        m.reply('✅ Descripción actualizada. Espero que sirva de algo.')

    } else if (actionKey === 'PHOTO') {
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
            console.error('Error al cambiar la foto del grupo:', e)
            m.reply('❌ Falló. Problema de la imagen. No es mi culpa.')
        }

    } else if (actionKey === 'REMOVE') {
        let users = m.mentionedJid.filter(u => u.endsWith('@s.whatsapp.net'))
        
        if (users.length === 0 && m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo && m.message.extendedTextMessage.contextInfo.mentionedJid) {
             users.push(...m.message.extendedTextMessage.contextInfo.mentionedJid.filter(u => u.endsWith('@s.whatsapp.net')));
        }
        
        if (users.length === 0 && m.quoted) {
            let targetJid = m.quoted.sender
            if (targetJid.endsWith('@s.whatsapp.net')) {
                users.push(targetJid)
            }
        }

        users = [...new Set(users)].filter(u => u && u.endsWith('@s.whatsapp.net'));

        if (users.length === 0) return m.reply('🤦 Menciona al culpable (o responde a su mensaje). Pierdo mi tiempo.')

        for (let user of users) {
            const isTargetAdmin = groupMetadata.participants.find(p => p.id === user)?.admin

            if (isTargetAdmin === 'admin' && !isRAdmin && !isOwner) {
                conn.sendMessage(m.chat, { text: `😼 No soy tu guardián. No puedo sacar a @${user.split('@')[0]} porque también es administrador.`, contextInfo: { mentionedJid: [user] } }, { quoted: m })
                continue
            }

            if (user === conn.user.jid) {
                 m.reply('😒 No puedo sacarme a mí mismo, ¿estás intentando bromear?')
                continue
            }

            await conn.groupParticipantsUpdate(m.chat, [user], 'remove')
            
            // CORRECCIÓN: Usar conn.sendMessage para forzar la mención
            conn.sendMessage(m.chat, { 
                text: `🧹 Uno menos. @${user.split('@')[0]} ha sido expulsado. La paz sea contigo (por ahora).`,
                contextInfo: { mentionedJid: [user] } 
            }, { quoted: m })
        }

    } else if (actionKey === 'TAGALL') {
        let members = participants.map(p => p.id)

        let customText = cleanArgument(actionText, commandPhraseUsed);

        let mentionText = customText ? 
            `📢 Tienen un mensaje de @${m.sender.split('@')[0]}:\n\n*${customText}*\n\n` :
            '📢 ¡Despierten! Jiji los llama:\n\n';

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

export default handler
