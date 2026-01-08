let handler = async (m, { conn }) => {
if (!(m.chat in global.db.data.chats)) return conn.reply(m.chat, '〽️l🔥 *¡Este chat no está registrado!*', m, rcanal)
let chat = global.db.data.chats[m.chat]
if (!chat.isBanned) return conn.reply(m.chat, '👑 *¡ᴇʟ ʙᴏᴛ ɴᴏ ᴇsᴛᴀ ʙᴀɴᴇᴀᴅᴏ ᴇɴ ᴇsᴛᴇ ᴄʜᴀᴛ!*', m, fake)
chat.isBanned = false
await conn.reply(m.chat, '⚡ *¡ᴇʟ ʙᴏᴛ ʏᴀ ғᴜᴇ ᴅᴇsʙᴀɴᴇᴀᴅᴏ ᴇɴ ᴇsᴛᴇ ᴄʜᴀᴛ!*', m, rcanal)
}




global.db.data.chats[m.chat].isBanned = true
conn.reply(m.chat, `${emoji} 𝗘𝗹 𝗕𝗼𝘁 𝗛𝗮 𝗦𝗶𝗱𝗼 𝗗𝗲𝘀𝗮𝗰𝘁𝗶𝘃𝗮𝗱𝗼 𝗘𝗻 𝗘𝘀𝘁𝗲 𝗖𝗵𝗮𝘁`, m, rcanal)

}



handler.command = ['bot']
handler.admin = true 
handler.botadmin = true
handler.group = true

export default handler

