let handler = async (m, { conn, command }) => {
    let chat = global.db.data.chats[m.chat]
    
    if (!chat) return conn.reply(m.chat, ' *¡Este chat no está registrado en la base de datos!*', m)

    if (command === 'botón' || /on/i.test(command)) {
        if (!chat.isBanned) return conn.reply(m.chat, ' *El bot ya está activo y funcionando.*', m)
        
        chat.isBanned = false
        await conn.reply(m.chat, '*¡El bot ha sido reactivado en este chat!*', m)
    }

    if (command === 'botof' || /off/i.test(command)) {
        if (chat.isBanned) return conn.reply(m.chat, ' *El bot ya se encuentra desactivado.*', m)
        
        chat.isBanned = true
        await conn.reply(m.chat, '*El Bot Ha Sido Desactivado En Este Chat*', m)
    }
}

handler.command = /^(bot|botón|botof)$/i 
handler.admin = true 
handler.group = true

export default handler
