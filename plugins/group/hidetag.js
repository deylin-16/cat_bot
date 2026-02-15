const hidetagCommand = {
    name: 'hidetag',
    alias: ['tag', 'n', 'notificar'],
    category: 'group',
    admin: true,
    group: true,
    run: async (m, { conn, text, participants }) => {
        const users = participants.map(u => u.id)
        const q = m.quoted ? m.quoted : m
        const mime = (q.msg || q).mimetype || ''
        const tagText = text || q.text || "Notificación General"

        try {
            if (/image|video|sticker|audio/.test(mime)) {
                const media = await q.download()
                const type = mime.split('/')[0]
                const messageContent = {
                    [type === 'sticker' ? 'sticker' : type]: media,
                    caption: tagText,
                    mentions: users,
                    contextInfo: { mentionedJid: users }
                }
                await conn.sendMessage(m.chat, messageContent, { quoted: m })
            } else {
                await conn.sendMessage(m.chat, { 
                    text: tagText, 
                    mentions: users,
                    contextInfo: { 
                        mentionedJid: users,
                        externalAdReply: {
                            title: 'NOTIFICACIÓN',
                            mediaType: 1,
                            showAdAttribution: true,
                            thumbnailUrl: 'https://raw.githubusercontent.com/deylin-16/database/main/uploads/1771122017110.png'
                        }
                    }
                }, { quoted: m })

            }
            await m.react('✅')
        } catch (e) {
            await conn.sendMessage(m.chat, { text: tagText, mentions: users })
        }
    }
}

export default hidetagCommand
