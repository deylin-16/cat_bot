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

        let user = global.db.data.users[who]
        if (!user) global.db.data.users[who] = { exp: 0, muto: false, warnAntiLink: 0 }

        const ownerBot = global.owner[0][0] + '@s.whatsapp.net'
        if (who === ownerBot) throw '🔥 *No puedes mutar al creador del bot*'
        if (who === conn.user.jid) throw '🔥 *No puedes mutar al propio bot*'

        const groupMetadata = await conn.groupMetadata(m.chat)
        const groupOwner = groupMetadata.owner || m.chat.split`-`[0] + '@s.whatsapp.net'
        if (who === groupOwner) throw '🔥 *No puedes mutar al creador del grupo*'

        if (command === 'mute') {
            if (user.muto) throw '🔥 *Este usuario ya ha sido mutado*'
            
            user.muto = true
            await conn.reply(m.chat, '𝗨𝘀𝘂𝗮𝗿𝗶𝗼 𝗺𝘂𝘁𝗮𝗱𝗼\n*Sus mensajes serán eliminados automáticamente.*', m, { mentions: [who] })
            
        } else if (command === 'unmute') {
            if (!user.muto) throw '🔥 *Este usuario no ha sido mutado*'
            
            user.muto = false
            await conn.reply(m.chat, '𝗨𝘀𝘂𝗮𝗿𝗶𝗼 𝗱𝗲𝗺𝘂𝘁𝗮𝗱𝗼\n*Ya puede enviar mensajes normalmente.*', m, { mentions: [who] })
        }
    }
}

export default muteCommand
