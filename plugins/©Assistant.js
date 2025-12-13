import fetch from 'node-fetch'
import { sticker } from '../lib/sticker.js'
import { webp2png } from '../lib/webp2mp4.js'

const POLLINATIONS_BASE_URL = 'https://text.pollinations.ai';

let handler = m => m

const ACTION_SYNONYMS = {
    CLOSE: ['cierra', 'cerrar', 'bloquea', 'mutea', 'silencia', 'tranca', 'ciérralo', 'silencialo', 'modo-admin', 'cerrar-grupo'],
    OPEN: ['abre', 'abrir', 'desbloquea', 'desmutea', 'desilencia', 'destranca', 'ábrelo', 'abrir-grupo'],
    RENAME: ['cambia nombre', 'renombrar', 'ponle nombre', 'actualiza nombre', 'modifica nombre', 'nuevo nombre'],
    DESC: ['cambia descripción', 'pon descripción', 'nueva descripción', 'actualiza descripción', 'modifica descripción', 'descr'],
    PHOTO: ['cambia foto', 'pon foto', 'cambiar imagen', 'actualiza foto', 'nueva foto', 'cambia perfil'],
    REMOVE: ['elimina', 'sacar', 'kickea', 'expulsa', 'saca', 'fuera', 'eliminalo', 'sácalo', 'quitar'],
    TAGALL: ['menciona todos', 'tagall', 'mencionar', 'aviso', 'notificar', 'menciónalos']
};

async function handleJijiCommand(m, conn, { isROwner, isOwner, isRAdmin, participants, groupMetadata, command }) {
    if (!m.isGroup) {
        conn.reply(m.chat, '😒 ¿De verdad esperabas que hiciera algo en privado? Solo sirvo para grupos.', m);
        return true; 
    }
    
    // CORRECCIÓN CLAVE: Chequear que los participantes existan antes de usar .filter
    if (!participants || !groupMetadata) {
        // En un handler.all, a veces groupMetadata no se carga a tiempo.
        // Podríamos intentar obtenerlo de nuevo si es necesario, pero por ahora,
        // si no hay datos, asumimos que no es operable y evitamos el error.
        conn.reply(m.chat, '❌ No se pudo cargar la información del grupo. Inténtalo de nuevo.', m);
        return true; 
    }

    // --- CÁLCULO DE PERMISOS ---
    const groupAdmins = participants.filter(p => p.admin)
    const isAdmin = groupAdmins.some(p => p.id === m.sender)
    const isBotAdmin = groupAdmins.some(p => p.id === conn.user.jid)
    // ----------------------------

    if (!isAdmin) {
        conn.reply(m.chat, '😼 Te crees importante, ¿verdad? Solo hablo con los administradores, humano.', m);
        return true; 
    }
    
    if (!isBotAdmin) {
        conn.reply(m.chat, '🙄 Soy un gato ocupado. Necesito ser administrador para molestarte y hacer estas cosas. ¡Arregla eso!', m);
        return true; 
    }

    let actionText = m.text.substring(command.length).toLowerCase().trim()
    if (!actionText) {
        conn.reply(m.chat, `*Instrucciones de Jiji. No me hagas repetirlo:*\n\n🔑 *Grupo:* jiji cierra el grupo | jiji abre el grupo\n📝 *Metadatos:* jiji cambia el nombre a [nombre] | jiji cambia la foto (responde a una imagen)\n✂️ *Mantenimiento:* jiji elimina a @user | jiji menciona a todos`, m);
        return true;
    }

    const actionWords = actionText.split(/\s+/).slice(0, 3).join(' ')
    let actionExecuted = false;

    if (ACTION_SYNONYMS.CLOSE.some(syn => actionWords.includes(syn))) {
        await conn.groupSettingUpdate(m.chat, 'announcement')
        conn.reply(m.chat, '🔒 Hecho. Silencio total. Ahora, hazme caso.', m)
        actionExecuted = true;

    } else if (ACTION_SYNONYMS.OPEN.some(syn => actionWords.includes(syn))) {
        await conn.groupSettingUpdate(m.chat, 'not_announcement')
        conn.reply(m.chat, '🔓 ¡Qué fastidio! Grupo abierto. Que empiece el ruido.', m)
        actionExecuted = true;

    } else if (ACTION_SYNONYMS.RENAME.some(syn => actionWords.includes(syn))) {
        let newSubject = actionText.replace(new RegExp(ACTION_SYNONYMS.RENAME.join('|'), 'gi'), '').trim()
        
        if (!newSubject) {
            conn.reply(m.chat, '😒 ¿Acaso esperas que adivine el nombre? Dímelo.', m);
            return true;
        }
        if (newSubject.length > 25) {
            conn.reply(m.chat, '🙄 El nombre no es una novela. Menos de 25 caracteres.', m);
            return true;
        }

        await conn.groupUpdateSubject(m.chat, newSubject)
        conn.reply(m.chat, `✅ Título cambiado a: *${newSubject}*. Qué creatividad.`, m)
        actionExecuted = true;

    } else if (ACTION_SYNONYMS.DESC.some(syn => actionWords.includes(syn))) {
        let newDesc = actionText.replace(new RegExp(ACTION_SYNONYMS.DESC.join('|'), 'gi'), '').trim()
        
        if (!newDesc && m.quoted && m.quoted.text) {
            newDesc = m.quoted.text.trim()
        }
        
        if (!newDesc) {
            conn.reply(m.chat, '😒 Necesito el texto. ¿Respondiste a algo? ¿O vas a escribirlo?', m);
            return true;
        }
        
        await conn.groupUpdateDescription(m.chat, newDesc)
        conn.reply(m.chat, '✅ Descripción actualizada. Espero que sirva de algo.', m)
        actionExecuted = true;

    } else if (ACTION_SYNONYMS.PHOTO.some(syn => actionWords.includes(syn))) {
        let q = m.quoted ? m.quoted : m
        let mime = (q.msg || q).mimetype || q.mediaType || ''
        
        if (!/image\/(jpe?g|png)|webp/.test(mime)) {
            conn.reply(m.chat, '🖼️ Tienes que responder a una imagen, ¿o esperas que ponga una foto mía? Nunca.', m)
            return true;
        }

        try {
            let media = await q.download?.()
            
            if (/webp/.test(mime)) {
                media = await webp2png(media)
            }
            
            await conn.updateProfilePicture(m.chat, media)
            conn.reply(m.chat, '✅ Foto cambiada. Ahora el grupo se ve... diferente.', m)
        } catch (e) {
            console.error(e)
            conn.reply(m.chat, '❌ Falló. Problema de la imagen. No es mi culpa.', m)
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
            conn.reply(m.chat, '🤦 Menciona al culpable (o responde a su mensaje). Pierdo mi tiempo.', m);
            return true;
        }

        for (let user of users) {
            const isTargetAdmin = groupMetadata.participants.find(p => p.id === user)?.admin
            if (isTargetAdmin === 'admin' && !isRAdmin) {
                conn.reply(m.chat, `😼 No soy tu guardián. No puedo sacar a @${user.split('@')[0]} porque también es administrador.`, m)
                continue
            }
            
            await conn.groupParticipantsUpdate(m.chat, [user], 'remove')
            conn.reply(m.chat, `🧹 Uno menos. @${user.split('@')[0]} ha sido expulsado. La paz sea contigo (por ahora).`, m)
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


handler.all = async function (m, { conn, isROwner, isOwner, isRAdmin, participants, groupMetadata, command }) {
    let user = global.db.data.users[m.sender]
    let chat = global.db.data.chats[m.chat]

    m.isBot = m.id.startsWith('BAE5') && m.id.length === 16 
            || m.id.startsWith('3EB0') && (m.id.length === 12 || m.id.length === 20 || m.id.length === 22) 
            || m.id.startsWith('B24E') && m.id.length === 20
    if (m.isBot) return 

    let prefixRegex = new RegExp('^[' + (opts?.prefix || '‎z/i!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.,\\-').replace(/[|\\{}()[\]^$+*?.\-\^]/g, '\\$&') + ']')
    
    let [mainCommand] = (m.text || '').trim().toLowerCase().split(/\s+/);
    
    if (mainCommand === 'jiji') {
        const commandParams = { isROwner, isOwner, isRAdmin, participants, groupMetadata, command: 'jiji' };
        const executedAction = await handleJijiCommand(m, conn, commandParams);
        if (executedAction) return true; 
    }

    if (prefixRegex.test(m.text)) return true 
    
    if (global.plugins[mainCommand]) return true
    
    if (m.sender?.toLowerCase().includes('bot')) return true

    if (!chat.isBanned && chat.autoresponder) {
        if (m.fromMe) return

        let query = m.text || ''
        let username = m.pushName || 'Usuario'

        let isOrBot = /(jiji|gato|asistente)/i.test(query)
        let isReply = m.quoted && m.quoted.sender === conn.user.jid
        let isMention = m.mentionedJid && m.mentionedJid.includes(conn.user.jid) 

        if (!(isOrBot || isReply || isMention)) return

        await conn.sendPresenceUpdate('composing', m.chat)

        const adminKeywords = new RegExp(`(jiji|${Object.values(ACTION_SYNONYMS).flat().join('|')})`, 'i');

        if (adminKeywords.test(query)) {
             await conn.reply(m.chat, '🙄 Eso es trabajo de mantenimiento, no una pregunta existencial. No me mezcles en tus tareas de administrador.', m);
             return;
        }


        let jijiPrompt = `Eres Jiji, un gato negro sarcástico y leal, como el de Kiki: Entregas a Domicilio. Responde a ${username}: ${query}. 
        
        nota: si vas a resaltar un texto solo usas un * en cada esquina no ** y separa bien los párrafos y eso.`;

        let promptToSend = chat.sAutoresponder ? chat.sAutoresponder : jijiPrompt;

        try {
            const url = `${POLLINATIONS_BASE_URL}/${encodeURIComponent(promptToSend)}`;
            const res = await fetch(url)

            if (!res.ok) {
                    throw new Error(`Error HTTP: ${res.status}`);
            }

            let result = await res.text()

            if (result && result.trim().length > 0) {
                await conn.reply(m.chat, result, m)
            }
        } catch (e) {
            console.error(e)
            await conn.reply(m.chat, '⚠️ ¡Rayos! No puedo contactar con la nube de la IA. Parece que mis antenas felinas están fallando temporalmente.', m)
        }
    }
    return true
}

export default handler
