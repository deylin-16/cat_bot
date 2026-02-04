const leaveCommand = {
    name: 'salir',
    alias: ['leave', 'out'],
    category: 'owner',
    owner: true,
    group: true,
    run: async (m, { conn, text }) => {
        let id = text ? text : m.chat
        let chat = global.db.data.chats[m.chat]
        
        chat.welcome = false
        
        await conn.sendMessage(id, { 
            text: `> Ƀ͢♛ *𝗠𝗲 𝗱𝗲𝘀𝗽𝗶𝗱𝗼 𝗱𝗲 𝗲́𝘀𝘁𝗲 𝗴𝗿𝘂𝗽𝗼*\n\n*Fue un gusto estar aquí.*` 
        }, { quoted: m })
        
        await conn.groupLeave(id)
        
        try {
            chat.welcome = true
        } catch (e) {
            console.log(e)
        }
    }
}

export default leaveCommand
