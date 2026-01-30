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
        const tagText = text || (m.quoted && m.quoted.text ? m.quoted.text : "")

        try {
            if (/image|video|sticker|audio/.test(mime)) {
                const media = await q.download()
                let msg = {}

                if (/image/.test(mime)) msg = { image: media, caption: tagText, mentions: users }
                else if (/video/.test(mime)) msg = { video: media, caption: tagText, mentions: users }
                else if (/audio/.test(mime)) msg = { audio: media, mimetype: 'audio/mp4', ptt: mime.includes('audio'), mentions: users }
                else if (/sticker/.test(mime)) msg = { sticker: media, mentions: users }

                await conn.sendMessage(m.chat, msg)
            } else {
                await conn.sendMessage(m.chat, { text: tagText, mentions: users })
            }
            await m.react('✅')
        } catch (e) {
            await conn.sendMessage(m.chat, { text: tagText, mentions: users })
        }
    }
}

export default hidetagCommand
