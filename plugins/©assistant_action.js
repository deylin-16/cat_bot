import { webp2png } from '../lib/webp2mp4.js'
import fetch from 'node-fetch'

const RESPONSES = {
    NO_ADMIN: ['Solo los administradores pueden usar este comando.'],
    NO_BOT_ADMIN: ['Necesito ser administrador para ejecutar esta acción.'],
    CLOSE_SUCCESS: ['El grupo ha sido cerrado.'],
    OPEN_SUCCESS: ['El grupo ha sido abierto.'],
    RENAME_MISSING: ['Escribe el nuevo nombre después del comando.'],
    RENAME_SUCCESS: (subject) => [`Nombre actualizado a: *${subject}*.`],
    DESC_MISSING: ['Escribe la nueva descripción o responde a un texto.'],
    DESC_SUCCESS: ['Descripción actualizada.'],
    PHOTO_MISSING: ['Responde a una imagen para cambiar la foto del grupo.'],
    PHOTO_SUCCESS: ['Foto de grupo actualizada.'],
    REMOVE_MISSING: ['Etiqueta a alguien o responde a su mensaje para eliminarlo.'],
    REMOVE_SUCCESS: (user) => [`@${user.replace(/@(s\.whatsapp\.net|lid)/g, '')} ha sido eliminado.`],
    TAGALL_DEFAULT: ['📢 ¡Atención a todos!']
}

const randomResponse = (key, ...args) => {
    const responses = RESPONSES[key];
    if (typeof responses === 'function') return responses(...args)[0]
    return responses[Math.floor(Math.random() * responses.length)]
}

const handler = async (m, { conn, text, command, isAdmin, isBotAdmin, participants }) => {
    if (!m.isGroup) return
    if (!isAdmin) return m.reply(randomResponse('NO_ADMIN'))
    if (!isBotAdmin) return m.reply(randomResponse('NO_BOT_ADMIN'))

    if (/cierra|cerrar|bloquear/i.test(command)) {
        await conn.groupSettingUpdate(m.chat, 'announcement')
        m.reply(randomResponse('CLOSE_SUCCESS'))

    } else if (/abre|abrir|desbloquear/i.test(command)) {
        await conn.groupSettingUpdate(m.chat, 'not_announcement')
        m.reply(randomResponse('OPEN_SUCCESS'))

    } else if (/renombrar|setname/i.test(command)) {
        if (!text) return m.reply(randomResponse('RENAME_MISSING'))
        await conn.groupUpdateSubject(m.chat, text)
        m.reply(randomResponse('RENAME_SUCCESS', text))

    } else if (/desc|setdesc/i.test(command)) {
        let newDesc = text || (m.quoted ? m.quoted.text : '')
        if (!newDesc) return m.reply(randomResponse('DESC_MISSING'))
        await conn.groupUpdateDescription(m.chat, newDesc)
        m.reply(randomResponse('DESC_SUCCESS'))

    } else if (/setfoto|setpp/i.test(command)) {
        let q = m.quoted ? m.quoted : m
        let mime = (q.msg || q).mimetype || ''
        if (!/image/.test(mime)) return m.reply(randomResponse('PHOTO_MISSING'))
        let media = await q.download()
        await conn.updateProfilePicture(m.chat, media)
        m.reply(randomResponse('PHOTO_SUCCESS'))

    } else if (/elimina|kick|ban|echar|sacar/i.test(command)) {
        let users = m.mentionedJid.concat(m.quoted ? [m.quoted.sender] : []).filter(u => u !== conn.user.jid)
        if (users.length === 0) return m.reply(randomResponse('REMOVE_MISSING'))
        for (let user of users) {
            await conn.groupParticipantsUpdate(m.chat, [user], 'remove')
            await conn.sendMessage(m.chat, { text: randomResponse('REMOVE_SUCCESS', user), mentions: [user] })
        }

    } else if (/tagall|todos|anuncio/i.test(command)) {
        let members = participants.map(p => p.id)
        let msg = randomResponse('TAGALL_DEFAULT') + '\n\n' + members.map(v => '@' + v.replace(/@(s\.whatsapp\.net|lid)/g, '')).join('\n')
        conn.sendMessage(m.chat, { text: msg, mentions: members })
    }
}

handler.command = /^(cierra|cerrar|abre|abrir|renombrar|setname|desc|setdesc|setfoto|setpp|elimina|kick|ban|echar|sacar|tagall|todos|anuncio)$/i
handler.group = true
handler.admin = true

export default handler
