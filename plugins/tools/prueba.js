const cardCommand = {
    name: 'carta',
    alias: ['card', 'cardgen', 'post'],
    category: 'tools',
    run: async (m, { conn, text, usedPrefix, command }) => {
        if (!text) return m.reply(`┏━━━〔 ɪɴғᴏ 〕━━━┓\n┃ ✎ ᴜsᴏ: ${usedPrefix + command} <ᴛᴇxᴛᴏ>\n┃ ✎ ᴇᴊ: ${usedPrefix + command} Hola Mundo\n┗━━━━━━━━━━━━━━━┛`)

        await m.react('⏳')

        try {
            const author = m.pushName || 'Deylin System'
            const apiUrl = `https://api.deylin.xyz/api/ai/card?text=${encodeURIComponent(text)}&author=${encodeURIComponent(author)}`

            await conn.sendMessage(m.chat, { 
                image: { url: apiUrl }, 
                caption: `┏━━━〔 ᴄᴀʀᴅ ɢᴇɴ 〕━━━┓\n┃ ✎ ᴜsᴜᴀʀɪᴏ: @${m.sender.split('@')[0]}\n┃ ✎ ᴇsᴛᴀᴅᴏ: ᴇɴᴠɪᴀᴅᴏ\n┗━━━━━━━━━━━━━━━━━━┛`,
                mentions: [m.sender]
            }, { quoted: m })

            await m.react('✅')
        } catch (e) {
            console.error(e)
            await m.react('❌')
            m.reply(`┏━━━〔 ᴇʀʀᴏʀ 〕━━━┓\n┃ ✎ ɪɴғᴏ: ғᴀʟʟᴏ ᴀʟ ɢᴇɴᴇʀᴀʀ ɪᴍᴀɢᴇɴ\n┗━━━━━━━━━━━━━━━┛`)
        }
    }
}

export default cardCommand
