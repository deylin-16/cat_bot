import { smsg } from './lib/simple.js'
import { format } from 'util'
import { fileURLToPath } from 'url'
import path from 'path'

export async function handler(chatUpdate) {
    this.uptime = this.uptime || Date.now()
    if (!chatUpdate.messages) return
    
    let m = chatUpdate.messages[chatUpdate.messages.length - 1]
    if (!m) return
    
    const conn = this
    if (global.db.data == null) await global.loadDatabase()

    // 1. Serialización de m (Fundamental para m.reply)
    try {
        m = smsg(conn, m) || m
    } catch (e) { console.error(e) }
    
    if (!m) return

    const chatJid = m.key.remoteJid
    const mainBotJid = global.conn?.user?.jid
    const isSubAssistant = conn.user.jid !== mainBotJid

    // 2. Filtro de Prioridad de Sub-Bots
    if (chatJid.endsWith('@g.us')) {
        global.db.data.chats[chatJid] ||= { isBanned: false, primaryBot: '' }
        const isROwner = global.owner.map(([number]) => number.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
        if (global.db.data.chats[chatJid]?.primaryBot && global.db.data.chats[chatJid].primaryBot !== conn.user.jid && !isROwner) return
    }

    // 3. Registro de mensajes procesados (Antispam/RAM)
    conn.processedMessages = conn.processedMessages || new Map()
    if (conn.processedMessages.has(m.key.id)) return
    conn.processedMessages.set(m.key.id, Date.now())
    if (conn.processedMessages.size > 100) conn.processedMessages.delete(conn.processedMessages.keys().next().value)

    try {
        // 4. Inicialización de Usuario
        if (typeof global.db.data.users[m.sender] !== 'object') global.db.data.users[m.sender] = {}
        const user = global.db.data.users[m.sender]
        
        const isROwner = global.owner.map(([number]) => number.replace(/[^0-9]/g, '') + (m.sender.includes('@lid') ? '@lid' : '@s.whatsapp.net')).includes(m.sender)
        const isOwner = isROwner || m.fromMe

        if (m.isBaileys || (global.opts && global.opts['nyimak'] && !isOwner)) return

        // 5. Metadatos de Grupo
        let isAdmin = false, isBotAdmin = false
        if (m.isGroup) {
            const groupMetadata = await conn.groupMetadata(m.chat).catch(_ => ({}))
            const participants = groupMetadata.participants || []
            isAdmin = (participants.find(p => p.id === m.sender))?.admin || false
            isBotAdmin = !!(participants.find(p => p.id === conn.user.jid))?.admin
        }

        // 6. Lógica de Prefijos (Soporta comandos sin prefijo como quiere tu código)
        const _prefix = global.prefix || /^[#!./]/
        const match = _prefix instanceof RegExp ? _prefix.exec(m.text) : Array.isArray(_prefix) ? _prefix.find(p => m.text.startsWith(p)) : m.text.startsWith(_prefix) ? _prefix : null
        
        let usedPrefix = _prefix instanceof RegExp ? (match ? match[0] : '') : (match || '')
        let noPrefix = m.text.replace(usedPrefix, '').trim()
        let [command, ...args] = noPrefix.split(/\s+/).filter(v => v)
        command = (command || '').toLowerCase()

        for (const name in global.plugins) {
            const plugin = global.plugins[name]
            if (!plugin || plugin.disabled) continue

            // 7. Parámetros para los plugins (AQUÍ ESTABA EL ERROR)
            const extra = {
                conn,
                usedPrefix,
                noPrefix,
                args,
                command,
                text: args.join(' '),
                isROwner,
                isOwner,
                isAdmin,
                isBotAdmin,
                isSubAssistant,
                user, // Objeto user para ©action_commands.js
                chatUpdate
            }

            if (typeof plugin.before === 'function') {
                if (await plugin.before.call(conn, m, extra)) continue
            }

            if (typeof plugin !== 'function') continue

            // 8. Validación de comandos (RegExp, Array o String)
            const isAccept = plugin.command instanceof RegExp ? plugin.command.test(command) :
                             Array.isArray(plugin.command) ? plugin.command.some(cmd => cmd instanceof RegExp ? cmd.test(command) : cmd === command) :
                             typeof plugin.command === 'string' ? plugin.command === command : false

            if (!isAccept) continue

            // 9. Restricciones
            if (plugin.rowner && !isROwner) { global.dfail('rowner', m, conn); continue }
            if (plugin.owner && !isOwner) { global.dfail('owner', m, conn); continue }
            if (plugin.group && !m.isGroup) { global.dfail('group', m, conn); continue }
            if (plugin.admin && !isAdmin) { global.dfail('admin', m, conn); continue }
            if (plugin.botAdmin && !isBotAdmin) { global.dfail('botAdmin', m, conn); continue }

            m.isCommand = true
            try {
                await plugin.call(conn, m, extra)
            } catch (e) {
                console.error(e)
                let err = format(e)
                // Uso de global.design si el plugin falla
                if (global.design) await global.design(conn, m, err)
                else m.reply(err)
            }
        }
    } catch (e) { console.error(e) }
}

global.dfail = (type, m, conn) => {
    const msg = {
        rowner: `Solo Deylin.`,
        owner: `Solo Deylin.`,
        admin: `Solo admins.`,
        botAdmin: `Dame admin.`
    }[type]
    if (msg) m.reply(msg)
}
