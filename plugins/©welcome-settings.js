const { areJidsSameUser } = await import('@whiskeysockets/baileys')

let handler = async (m, { conn, text, command, isAdmin, isGroup }) => {
    if (!isGroup) return m.reply("❌ Este comando solo funciona en grupos.")
    if (!isAdmin) return m.reply("❌ Solo los administradores pueden configurar la bienvenida.")

    let chat = global.db.data.chats[m.chat] || {}

    switch (command.toLowerCase()) {
        case 'setwelcome':
            if (!text) return m.reply(`*Uso:* /setwelcome ¡Bienvenido, @user! Esperamos que disfrutes.`)
            
            let msg = text.replace(/\\n/g, '\n')
            chat.customWelcome = msg
            
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
