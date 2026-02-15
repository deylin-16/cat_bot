import fetch from 'node-fetch'

const muteCommand = {
    name: 'mute',
    alias: ['unmute', 'mutar', 'silenciar'],
    category: 'admin',
    admin: true,
    botAdmin: true,
    group: true,
    run: async (m, { conn, command, text, isAdmin, isROwner }) => {
        let who = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'

        if (!who || who === '@s.whatsapp.net') return conn.reply(m.chat, `*👑 Menciona o responde al mensaje de la persona que deseas ${command === 'mute' ? 'mutar' : 'demutar'}*`, m)

        const ownerBot = global.owner[0][0] + '@s.whatsapp.net'
        
        
        if (who === ownerBot) return conn.reply(m.chat, '🔥 *No puedes mutar al creador del bot*', m)
        if (who === conn.user.jid) return conn.reply(m.chat, '🔥 *No puedes mutar al propio bot*', m)

        const groupMetadata = await conn.groupMetadata(m.chat)
        const groupOwner = groupMetadata.owner || m.chat.split`-`[0] + '@s.whatsapp.net'
        if (who === groupOwner) return conn.reply(m.chat, '🔥 *No puedes mutar al creador del grupo*', m)
        

        let chat = global.db.data.chats[m.chat]
        if (!chat.mutos) chat.mutos = []

        if (command === 'mute' || command === 'mutar' || command === 'silenciar') {
            if (chat.mutos.includes(who)) return conn.reply(m.chat, '🔥 *Este usuario ya ha sido mutado en este grupo*', m)

            chat.mutos.push(who)
            await conn.reply(m.chat, '𝗨𝘀𝘂𝗮𝗿𝗶𝗼 𝗺𝘂𝘁𝗮𝗱𝗼\n*Sus mensajes serán eliminados automáticamente en este grupo.*', m, { mentions: [who] })

        } else if (command === 'unmute') {
            if (!chat.mutos.includes(who)) return conn.reply(m.chat, '🔥 *Este usuario no está mutado en este grupo*', m)

            chat.mutos = chat.mutos.filter(id => id !== who)
            await conn.reply(m.chat, '𝗨𝘀𝘂𝗮𝗿𝗶𝗼 𝗱𝗲𝗺𝘂𝘁𝗮𝗱𝗼\n*Ya puede enviar mensajes normalmente.*', m, { mentions: [who] })
        }
    }
}

export default muteCommand
