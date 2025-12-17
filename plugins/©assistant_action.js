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

const RESPONSES = {
    NO_GROUP: ['Este comando solo está disponible en grupos.'],
    NO_ADMIN: ['Solo los administradores me pueden decir qué hacer.'],
    NO_BOT_ADMIN: ['Debo ser administrador para poder gestionar el grupo.'],
    CLOSE_SUCCESS: ['El grupo ha sido cerrado.'],
    OPEN_SUCCESS: ['El grupo ha sido abierto.'],
    RENAME_MISSING: ['Debe proporcionar el nuevo nombre del grupo.'],
    RENAME_LENGTH: ['El nombre es demasiado largo.'],
    RENAME_SUCCESS: (subject) => [`Nombre actualizado a: *${subject}*.`],
    DESC_MISSING: ['Debe proporcionar la nueva descripción.'],
    DESC_SUCCESS: ['Descripción actualizada.'],
    PHOTO_MISSING: ['Responde a una imagen para cambiar la foto.'],
    PHOTO_SUCCESS: ['Foto de grupo actualizada.'],
    PHOTO_FAIL: ['Error al cambiar la foto.'],
    REMOVE_MISSING: ['Mencione a quién desea expulsar.'],
    REMOVE_IS_ADMIN: (user) => [`@${user.split('@')[0]} es admin, no puedo sacarlo.`],
    REMOVE_SELF: ['No puedo expulsarme a mí mismo.'],
    REMOVE_OWNER_GROUP: (user) => [`No puedo eliminar al dueño del grupo.`],
    REMOVE_OWNER_BOT: (user) => [`No puedo eliminar a mi creador.`],
    REMOVE_SUCCESS: (user) => [`@${user.split('@')[0]} ha sido expulsado.`],
    REMOVE_FAIL: (user) => [`Error al expulsar a @${user.split('@')[0]}.`],
    TAGALL_HEADER: (sender) => [`📢 Aviso de @${sender}:`],
    TAGALL_DEFAULT: ['📢 ¡Atención a todos!']
}

const randomResponse = (key, ...args) => {
    const responses = RESPONSES[key];
    if (typeof responses === 'function') return responses(...args)[0]
    return responses[Math.floor(Math.random() * responses.length)]
}

const handler = async (m, { conn, text, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, participants, groupMetadata, command }) => {
    if (!m.isGroup) return
    const actionText = text.toLowerCase().trim()
    if (!actionText) return

    let actionKey = null
    let commandPhraseUsed = ''
    const actionSynonymsFlat = Object.entries(ACTION_SYNONYMS).flatMap(([key, syns]) => syns.map(syn => ({ key, syn }))).sort((a, b) => b.syn.length - a.syn.length)

    for (const { key, syn } of actionSynonymsFlat) {
        if (actionText.includes(syn)) {
            actionKey = key
            commandPhraseUsed = syn
            break
        }
    }

    if (!actionKey) return
    if (!isAdmin) return m.reply(randomResponse('NO_ADMIN'))
    if (!isBotAdmin) return m.reply(randomResponse('NO_BOT_ADMIN'))

    const cleanArgument = (fullText, usedPhrase) => {
        return fullText.replace(usedPhrase, '').trim()
    }

    if (actionKey === 'CLOSE') {
        await conn.groupSettingUpdate(m.chat, 'announcement')
        m.reply(randomResponse('CLOSE_SUCCESS'))
    } else if (actionKey === 'OPEN') {
        await conn.groupSettingUpdate(m.chat, 'not_announcement')
        m.reply(randomResponse('OPEN_SUCCESS'))
    } else if (actionKey === 'RENAME') {
        const newSubject = cleanArgument(actionText, commandPhraseUsed)
        if (!newSubject) return m.reply(randomResponse('RENAME_MISSING'))
        await conn.groupUpdateSubject(m.chat, newSubject)
        m.reply(randomResponse('RENAME_SUCCESS', newSubject))
    } else if (actionKey === 'DESC') {
        let newDesc = cleanArgument(actionText, commandPhraseUsed)
        if (!newDesc && m.quoted) newDesc = m.quoted.text
        if (!newDesc) return m.reply(randomResponse('DESC_MISSING'))
        await conn.groupUpdateDescription(m.chat, newDesc)
        m.reply(randomResponse('DESC_SUCCESS'))
    } else if (actionKey === 'PHOTO') {
        let q = m.quoted ? m.quoted : m
        let mime = (q.msg || q).mimetype || ''
        if (!/image/.test(mime)) return m.reply(randomResponse('PHOTO_MISSING'))
        try {
            let media = await q.download()
            await conn.updateProfilePicture(m.chat, media)
            m.reply(randomResponse('PHOTO_SUCCESS'))
        } catch (e) {
            m.reply(randomResponse('PHOTO_FAIL'))
        }
    } else if (actionKey === 'REMOVE') {
        let users = m.mentionedJid.concat(m.quoted ? [m.quoted.sender] : []).filter(u => u.endsWith('@s.whatsapp.net'))
        if (users.length === 0) return m.reply(randomResponse('REMOVE_MISSING'))
        for (let user of users) {
            if (user === conn.user.jid) continue
            await conn.groupParticipantsUpdate(m.chat, [user], 'remove')
            m.reply(randomResponse('REMOVE_SUCCESS', user))
        }
    } else if (actionKey === 'TAGALL') {
        let members = participants.map(p => p.id)
        let msg = randomResponse('TAGALL_DEFAULT') + '\n' + members.map(v => '@' + v.replace(/@s\.whatsapp\.net/g, '')).join('\n')
        conn.sendMessage(m.chat, { text: msg, mentions: members })
    }
}

handler.command = ['jiji']
handler.group = true
export default handler
