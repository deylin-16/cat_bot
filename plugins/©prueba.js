let handler = async (m, { conn, text, command }) => {
    global.db.data.settings ||= {}
    global.db.data.settings[conn.user.jid] ||= { prefix: ['./', '#', '/'] }
    let setting = global.db.data.settings[conn.user.jid]

    if (command === 'setprefix') {
        if (!text) return m.reply(`Por favor, ingresa los prefijos que deseas usar (máximo 3).\nEjemplo: setprefix 😏 # 😭`)
        let newPrefix = text.split(/\s+/).filter(v => v).slice(0, 3)
        if (newPrefix.length === 0) return m.reply(`Prefijos no válidos.`)
        setting.prefix = newPrefix
        await m.reply(`Prefijos actualizados correctamente para este bot: ${newPrefix.join(' ')}`)
    }

    if (command === 'resetprefix') {
        setting.prefix = ['./', '#', '/']
        await m.reply(`Los prefijos han sido reseteados a los valores por defecto: . / #`)
    }
}

handler.command = ['setprefix', 'resetprefix']
handler.owner = true

export default handler
