let handler = async (m, { conn, command }) => {
    if (!(m.chat in global.db.data.chats)) return conn.reply(m.chat, '〽️ *¡Este chat no está registrado!*', m)
    let chat = global.db.data.chats[m.chat].isBanned = true
    let isBanning = command === 'banchat'
    if (isBanning) {
        if (chat.isBanned) return conn.reply(m.chat, '⚠️ *¡El bot ya estaba baneado!*', m)
        chat.isBanned = true
        await conn.reply(m.chat, '🚫 𝗘𝗹 𝗕𝗼𝘁 𝗛𝗮 𝗦𝗶𝗱𝗼 𝗗𝗲𝘀𝗮𝗰𝘁𝗶𝘃𝗮𝗱𝗼', m)
    } else {
        if (!chat.isBanned) return conn.reply(m.chat, '👑 *¡El bot no está baneado!*', m)
        chat.isBanned = false
        await conn.reply(m.chat, '⚡ *¡El bot ya fue desbaneado!*', m)
    }
}

handler.command = ['banchat', 'unbanchat', 'desbanearchat', 'desbanchat']
handler.admin = true 
handler.botAdmin = true
handler.group = true
export default handler
