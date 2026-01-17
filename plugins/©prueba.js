import axios from 'axios'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`!Hola¡ ¿cómo puedo ayudarte hoy?`)

    await conn.sendMessage(m.chat, { react: { text: '🕒', key: m.key } })

    try {
        const url = `https://claude.ryzecodes.xyz/chat?q=${encodeURIComponent(text)}`
        const { data } = await axios.get(url)

        if (!data.status) throw new Error()

        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
        m.reply(data.response.trim())

    } catch (e) {
        console.error(e)
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
        m.reply('Ocurrió un error al conectar con la IA.')
    }
}

handler.command = /^(claude)$/i

export default handler
