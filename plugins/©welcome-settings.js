const { areJidsSameUser } = await import('@whiskeysockets/baileys')

let handler = async (m, { conn, text, command, isAdmin, isGroup }) => {
    

    let chat = global.db.data.chats[m.chat] || {}

    switch (command.toLowerCase()) {
        case 'setwelcome':
            
            
            let usedPrefix = m.text.charAt(0)
            
            
            const commandPattern = usedPrefix + command.toLowerCase()
            
            
            
            let customMessage = m.text.substring(commandPattern.length).trimStart()
            
            
            
            if (!customMessage) return m.reply(`*Uso:* /setwelcome ¡Bienvenido, @user! Esperamos que disfrutes.`)
            
            chat.customWelcome = customMessage

            m.reply(`✅ Mensaje de bienvenida personalizado establecido para este grupo.\n\n*Nota:* Usa *@user* para mencionar al nuevo miembro.`)
            break

        case 'welcome':
        case 'bienvenida':
            let status = text.toLowerCase() === 'on' ? true : text.toLowerCase() === 'off' ? false : null
            if (status === null) return m.reply(`*Uso correcto:*\n/welcome on (Activar)\n/welcome off (Desactivar)`)

            chat.welcome = status
            m.reply(`✅ La bienvenida en este grupo ha sido *${status ? 'activada' : 'desactivada'}*.`)
            break

        default:
            break
    }
}

handler.command = ['setwelcome', 'welcome', 'bienvenida']
handler.botAdmin = false
handler.admin = true
export default handler
