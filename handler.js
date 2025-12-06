import { smsg } from './lib/simple.js'
import { format } from 'util'
import { fileURLToPath } from 'url'
import path, { join } from 'path'
import { unwatchFile, watchFile } from 'fs'
import ws from 'ws'

const isNumber = x => typeof x === 'number' && !isNaN(x)

async function getLidFromJid(id, connection) {
    if (id.endsWith('@lid')) return id
    const res = await connection.onWhatsApp(id).catch(() => [])
    return res[0]?.lid || id
}

export async function handler(chatUpdate) {
    this.uptime = this.uptime || Date.now()
    const conn = this
    if (!chatUpdate || !chatUpdate.messages || chatUpdate.messages.length === 0) return
    let m = chatUpdate.messages[chatUpdate.messages.length - 1]
    if (!m) return
    m = smsg(conn, m) || m
    if (!m) return
    if (global.db.data == null) await global.loadDatabase()

    conn.processedMessages = conn.processedMessages || new Map()
    const now = Date.now()
    const id = m.key.id
    if (conn.processedMessages.has(id)) return
    conn.processedMessages.set(id, now)
    for (const [msgId, time] of conn.processedMessages) {
        if (now - time > 9000) conn.processedMessages.delete(msgId)
    }

    try {
        m.exp = 0
        m.coin = false
        const senderJid = m.sender
        const chatJid = m.chat
        
        global.db.data.chats[chatJid] ||= {}
        global.db.data.users[senderJid] ||= { exp: 0, coin: 0, muto: false }
        global.db.data.settings[conn.user.jid] ||= {}

        const detectwhat = m.sender.includes('@lid') ? '@lid' : '@s.whatsapp.net'
        const isROwner = global.owner.map(([number]) => number.replace(/[^0-9]/g, '') + detectwhat).includes(senderJid)
        const isOwner = isROwner || m.fromMe

        if (typeof m.text !== 'string') m.text = ''

        let groupMetadata, participants, isRAdmin, isAdmin, isBotAdmin
        if (m.isGroup) {
            groupMetadata = (conn.chats[m.chat] || {}).metadata || await conn.groupMetadata(m.chat).catch(_ => null) || {}
            participants = groupMetadata.participants || []
            const botJid = conn.user.jid
            const user2Data = participants.find(p => p.id === m.sender || p.jid === m.sender) || {}
            const botData = participants.find(p => p.id === botJid || p.jid === botJid) || {}
            isRAdmin = user2Data?.admin === "superadmin"
            isAdmin = isRAdmin || user2Data?.admin === "admin"
            isBotAdmin = !!botData?.admin
        } else {
            groupMetadata = {}
            participants = []
            isRAdmin = false
            isAdmin = false
            isBotAdmin = false
        }

        const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), './plugins')
        
        for (const name in global.plugins) {
            const plugin = global.plugins[name]
            if (!plugin || plugin.disabled) continue
            
            const __filename = join(___dirname, name)
            if (typeof plugin.all === 'function') {
                try {
                    await plugin.all.call(conn, m, { chatUpdate, __dirname, __filename })
                } catch (e) {}
            }

            const str2Regex = str => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
            let _prefix = plugin.customPrefix ? plugin.customPrefix : conn.prefix ? conn.prefix : global.prefix
            const match = (_prefix instanceof RegExp ? [[_prefix.exec(m.text), _prefix]] : Array.isArray(_prefix) ? _prefix.map(p => { const re = p instanceof RegExp ? p : new RegExp(str2Regex(p)); return [re.exec(m.text), re] }) : typeof _prefix === 'string' ? [[new RegExp(str2Regex(_prefix)).exec(m.text), new RegExp(str2Regex(_prefix))]] : [[[], new RegExp()]]).find(p => p[0])

            if (typeof plugin.before === 'function') {
                if (await plugin.before.call(conn, m, { match, conn, participants, groupMetadata, user: global.db.data.users[m.sender], isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, chatUpdate, __dirname, __filename })) continue
            }

            if (typeof plugin !== 'function' || !match) continue
            
            const usedPrefix = match[0][0]
            const noPrefix = m.text.replace(usedPrefix, '')
            let [command, ...args] = noPrefix.trim().split(/\s+/).filter(v => v)
            let text = args.join(' ')
            command = (command || '').toLowerCase()

            const isAccept = plugin.command instanceof RegExp ? plugin.command.test(command) : Array.isArray(plugin.command) ? plugin.command.some(cmd => cmd instanceof RegExp ? cmd.test(command) : cmd === command) : typeof plugin.command === 'string' ? plugin.command === command : false
            if (!isAccept) continue

            m.plugin = name
            m.isCommand = true
            const xp = 'exp' in plugin ? parseInt(plugin.exp) : 10
            m.exp += xp

            try {
                await plugin.call(conn, m, { match, usedPrefix, noPrefix, args, command, text, conn, participants, groupMetadata, user: global.db.data.users[m.sender], isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, chatUpdate, __dirname, __filename })
            } catch (e) {
                console.error(e)
            } finally {
                if (typeof plugin.after === 'function') {
                    try { await plugin.after.call(conn, m, { match, conn }) } catch (e) {}
                }
            }
        }
    } catch (e) {
        console.error(e)
    } finally {
        if (m) {
            const finalUser = global.db.data.users[m.sender]
            if (finalUser) {
                finalUser.exp = (finalUser.exp || 0) + (m.exp || 0)
                finalUser.coin = (finalUser.coin || 0) - (m.coin ? m.coin * 1 : 0)
            }
        }
    }
}

global.dfail = () => {}

let file = global.__filename(import.meta.url, true)
watchFile(file, async () => {
    unwatchFile(file)
    if (global.conns && global.conns.length > 0) {
        const users = global.conns.filter((conn) => conn.user && conn.ws.socket && conn.ws.socket.readyState !== ws.CLOSED)
        for (const user of users) user.subreloadHandler(false)
    }
})
