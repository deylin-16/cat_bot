const hidetagCommand = {
    name: 'hidetag',
    alias: ['tag', 'n', 'notificar', 'hidetag'],
    category: 'group',
    admin: true,
    group: true,
    run: async (m, { conn, text, participants }) => {
        const users = participants.map(u => u.id)
        const q = m.quoted ? m.quoted : m
        const mime = (q.msg || q).mimetype || ''
        const tagText = text || (m.quoted && m.quoted.text ? m.quoted.text : "" || `*Hola*`)

        try {
            if (m.quoted && /image|video|sticker|audio/.test(mime)) {
                await conn.copyNForward(m.chat, m.quoted.fakeObj, false, { 
                    contextInfo: { mentionedJid: users },
                    caption: tagText 
                })
            } else if (/image|video|sticker|audio/.test(mime)) {
                const media = await q.download()
                await conn.sendMessage(m.chat, { 
                    [mime.split('/')[0]]: media, 
                    caption: tagText, 
                    mentions: users 
                }, { quoted: m })
            } else {
                await conn.sendMessage(m.chat, { 
                    text: tagText, 
                    mentions: users 
                }, { quoted: m })
            }
            await m.react('✅')
        } catch (e) {
            console.error(e)
            await conn.sendMessage(m.chat, { text: tagText, mentions: users }, { quoted: m })
        }
    }
}

export default hidetagCommand
