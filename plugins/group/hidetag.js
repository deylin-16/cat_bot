const hidetagCommand = {
    name: 'hidetag',
    alias: ['tag', 'n', 'hidetag'],
    category: 'group',
    run: async (m, { conn, text, participants }) => {
        if (!m.isGroup) return
        
        const isAdmin = participants.some(u => u.id === m.sender && (u.admin === 'admin' || u.admin === 'superadmin'))
        if (!isAdmin) return

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
                else if (/audio/.test(mime)) msg = { audio: media, mimetype: 'audio/mp4', mentions: users }
                else if (/sticker/.test(mime)) msg = { sticker: media, mentions: users }

                await conn.sendMessage(m.chat, msg, { quoted: m })
            } else {
                await conn.sendMessage(m.chat, { text: tagText, mentions: users }, { quoted: m })
            }
            await m.react('✅')
        } catch (e) {
            await conn.sendMessage(m.chat, { text: tagText, mentions: users }, { quoted: m })
        }
    }
}

export default hidetagCommand
